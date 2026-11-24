const express = require("express");
const sequelize = require("./db");
const {
    genererQCM,
    genererFlashcards
} = require("./ia");

const router = express.Router();

// Je simplifie mes requêtes SQL
async function requete(sql, replacements = {}, transaction) {
    const [resultat] = await sequelize.query(sql, {
        replacements,
        transaction
    });

    return resultat;
}

// Je récupère un cours
async function recupererCours(id) {
    const cours = await requete(
        "SELECT * FROM cours WHERE id = :id",
        { id }
    );

    return cours[0];
}

// Je vérifie mes identifiants
function idValide(id) {
    return Number.isInteger(Number(id)) && Number(id) > 0;
}

// Je génère un QCM
router.post("/qcm/generer", async (req, res) => {
    try {
        const { coursId, niveau, nombre } = req.body;

        if (
            !idValide(coursId) ||
            !["facile", "moyen", "difficile"].includes(niveau) ||
            ![5, 10, 15, 20].includes(Number(nombre))
        ) {
            return res.status(400).json({
                message: "Informations invalides"
            });
        }

        const cours = await recupererCours(coursId);

        if (!cours) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        const questions = await genererQCM(
            cours.texte_pdf,
            niveau,
            Number(nombre)
        );

        const resultat = await requete(
            `INSERT INTO qcm
            (cours_id, titre, niveau, questions)
            VALUES (:coursId, :titre, :niveau, CAST(:questions AS JSONB))
            RETURNING *`,
            {
                coursId,
                titre: ("QCM - " + cours.nom).slice(0, 255),
                niveau,
                questions: JSON.stringify(questions)
            }
        );

        res.status(201).json(resultat[0]);

    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({
            message: "Erreur pendant la génération du QCM"
        });
    }
});

// Je récupère tous mes QCM
router.get("/qcm", async (req, res) => {
    try {
        const resultat = await requete(
            "SELECT * FROM qcm ORDER BY id DESC"
        );

        res.json(resultat);

    } catch (erreur) {
        res.status(500).json({
            message: "Impossible de récupérer les QCM"
        });
    }
});

// Je récupère un QCM
router.get("/qcm/:id", async (req, res) => {
    try {
        const resultat = await requete(
            "SELECT * FROM qcm WHERE id = :id",
            { id: req.params.id }
        );

        if (!resultat.length) {
            return res.status(404).json({
                message: "QCM introuvable"
            });
        }

        res.json(resultat[0]);

    } catch (erreur) {
        res.status(500).json({
            message: "Erreur de récupération"
        });
    }
});

// Je calcule et enregistre mon résultat
router.post("/qcm/:id/terminer", async (req, res) => {
    try {
        const { reponses } = req.body;

        const resultat = await requete(
            "SELECT * FROM qcm WHERE id = :id",
            { id: req.params.id }
        );

        const qcm = resultat[0];

        if (!qcm) {
            return res.status(404).json({
                message: "QCM introuvable"
            });
        }

        if (
            !Array.isArray(reponses) ||
            reponses.length !== qcm.questions.length ||
            !reponses.every(r =>
                Number.isInteger(r) && r >= 0 && r <= 3
            )
        ) {
            return res.status(400).json({
                message: "Réponses invalides"
            });
        }

        const score = qcm.questions.reduce(
            (total, question, index) =>
                total + (
                    question.bonneReponse === reponses[index] ? 1 : 0
                ),
            0
        );

        const total = qcm.questions.length;
        const pourcentage = Math.round(score / total * 100);

        const enregistrement = await sequelize.transaction(
            async transaction => {

                const donnees = await requete(
                    `INSERT INTO resultats_qcm
                    (qcm_id, score, total, pourcentage, reponses)
                    VALUES
                    (:id, :score, :total, :pourcentage,
                    CAST(:reponses AS JSONB))
                    RETURNING *`,
                    {
                        id: qcm.id,
                        score,
                        total,
                        pourcentage,
                        reponses: JSON.stringify(reponses)
                    },
                    transaction
                );

                await requete(
                    `INSERT INTO revisions
                    (cours_id, type_revision)
                    VALUES (:coursId, 'qcm')`,
                    { coursId: qcm.cours_id },
                    transaction
                );

                return donnees[0];
            }
        );

        res.json(enregistrement);

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur pendant la sauvegarde du résultat"
        });
    }
});

// Je récupère mon historique de QCM
router.get("/resultats-qcm", async (req, res) => {
    try {
        const resultat = await requete(
            `SELECT r.*, q.titre, q.niveau, q.cours_id
             FROM resultats_qcm r
             JOIN qcm q ON q.id = r.qcm_id
             ORDER BY r.date_creation DESC`
        );

        res.json(resultat);

    } catch (erreur) {
        res.status(500).json({
            message: "Erreur de récupération des résultats"
        });
    }
});

// Je supprime un QCM
router.delete("/qcm/:id", async (req, res) => {
    try {
        const resultat = await requete(
            "DELETE FROM qcm WHERE id = :id RETURNING id",
            { id: req.params.id }
        );

        if (!resultat.length) {
            return res.status(404).json({
                message: "QCM introuvable"
            });
        }

        res.json({ message: "QCM supprimé" });

    } catch (erreur) {
        res.status(500).json({
            message: "Erreur de suppression"
        });
    }
});

// Je génère mes flashcards
router.post("/flashcards/generer", async (req, res) => {
    try {
        const { coursId, nombre } = req.body;

        if (
            !idValide(coursId) ||
            ![5, 10, 15, 20].includes(Number(nombre))
        ) {
            return res.status(400).json({
                message: "Informations invalides"
            });
        }

        const cours = await recupererCours(coursId);

        if (!cours) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        const cartes = await genererFlashcards(
            cours.texte_pdf,
            Number(nombre)
        );

        const flashcards = await sequelize.transaction(
            async transaction => {
                const nouvellesCartes = [];

                for (const carte of cartes) {
                    const resultat = await requete(
                        `INSERT INTO flashcards
                        (cours_id, question, reponse)
                        VALUES (:coursId, :question, :reponse)
                        RETURNING *`,
                        {
                            coursId,
                            question: carte.question,
                            reponse: carte.reponse
                        },
                        transaction
                    );

                    nouvellesCartes.push(resultat[0]);
                }

                return nouvellesCartes;
            }
        );

        res.status(201).json(flashcards);

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur pendant la génération des flashcards"
        });
    }
});

// Je récupère mes flashcards
router.get("/flashcards", async (req, res) => {
    try {
        const resultat = await requete(
            `SELECT f.*, c.nom AS cours_nom
             FROM flashcards f
             JOIN cours c ON c.id = f.cours_id
             ORDER BY f.id DESC`
        );

        res.json(resultat);

    } catch (erreur) {
        res.status(500).json({
            message: "Erreur de récupération des flashcards"
        });
    }
});

// Je mets à jour ma mémorisation
router.patch("/flashcards/:id", async (req, res) => {
    try {
        const { maitrisee } = req.body;

        if (typeof maitrisee !== "boolean") {
            return res.status(400).json({
                message: "Valeur invalide"
            });
        }

        const carte = await sequelize.transaction(
            async transaction => {

                const resultat = await requete(
                    `UPDATE flashcards
                     SET maitrisee = :maitrisee,
                         derniere_revision = NOW()
                     WHERE id = :id
                     RETURNING *`,
                    {
                        id: req.params.id,
                        maitrisee
                    },
                    transaction
                );

                if (!resultat.length) {
                    return null;
                }

                await requete(
                    `INSERT INTO revisions
                    (cours_id, type_revision)
                    VALUES (:coursId, 'flashcard')`,
                    { coursId: resultat[0].cours_id },
                    transaction
                );

                return resultat[0];
            }
        );

        if (!carte) {
            return res.status(404).json({
                message: "Flashcard introuvable"
            });
        }

        res.json(carte);

    } catch (erreur) {
        res.status(500).json({
            message: "Erreur de modification"
        });
    }
});

// Je supprime une flashcard
router.delete("/flashcards/:id", async (req, res) => {
    try {
        const resultat = await requete(
            "DELETE FROM flashcards WHERE id = :id RETURNING id",
            { id: req.params.id }
        );

        if (!resultat.length) {
            return res.status(404).json({
                message: "Flashcard introuvable"
            });
        }

        res.json({ message: "Flashcard supprimée" });

    } catch (erreur) {
        res.status(500).json({
            message: "Erreur de suppression"
        });
    }
});

// Je récupère mes statistiques générales
router.get("/statistiques", async (req, res) => {
    try {
        const resultat = await requete(
            `SELECT
                (SELECT COUNT(*) FROM cours)::int AS cours,
                (SELECT COUNT(*) FROM fiches)::int AS fiches,
                (SELECT COUNT(*) FROM qcm)::int AS qcm,
                (SELECT COUNT(*) FROM resultats_qcm)::int AS quiz_termines,
                (SELECT COUNT(*) FROM flashcards)::int AS flashcards,
                (SELECT COUNT(*) FROM flashcards
                 WHERE maitrisee = TRUE)::int AS cartes_maitrisees,
                (SELECT COALESCE(SUM(score), 0)
                 FROM resultats_qcm)::int AS bonnes_reponses,
                (SELECT COALESCE(SUM(total), 0)
                 FROM resultats_qcm)::int AS questions,
                (SELECT COALESCE(ROUND(AVG(pourcentage)), 0)
                 FROM resultats_qcm)::int AS moyenne,
                (SELECT COUNT(DISTINCT cours_id)
                 FROM revisions)::int AS cours_revises`
        );

        res.json(resultat[0]);

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur de récupération des statistiques"
        });
    }
});

// Je récupère ma progression par cours
router.get("/progression", async (req, res) => {
    try {
        const resultat = await requete(
            `SELECT c.id, c.nom, c.matiere,

            (SELECT COUNT(*) FROM fiches f
             WHERE f.cours_id = c.id)::int AS fiches,

            (SELECT COUNT(*) FROM flashcards f
             WHERE f.cours_id = c.id)::int AS flashcards,

            (SELECT COUNT(*) FROM flashcards f
             WHERE f.cours_id = c.id
             AND f.maitrisee = TRUE)::int AS maitrisees,

            (SELECT COUNT(*) FROM resultats_qcm r
             JOIN qcm q ON q.id = r.qcm_id
             WHERE q.cours_id = c.id)::int AS quiz_termines,

            (SELECT ROUND(AVG(r.pourcentage))::int
             FROM resultats_qcm r
             JOIN qcm q ON q.id = r.qcm_id
             WHERE q.cours_id = c.id) AS moyenne

            FROM cours c
            ORDER BY c.id DESC`
        );

        res.json(resultat);

    } catch (erreur) {
        res.status(500).json({
            message: "Erreur de récupération de la progression"
        });
    }
});

// Je récupère mes dernières activités
router.get("/revisions", async (req, res) => {
    try {
        const resultat = await requete(
            `SELECT r.*, c.nom AS cours_nom
             FROM revisions r
             JOIN cours c ON c.id = r.cours_id
             ORDER BY r.date_revision DESC, r.id DESC
             LIMIT 30`
        );

        res.json(resultat);

    } catch (erreur) {
        res.status(500).json({
            message: "Erreur de récupération des révisions"
        });
    }
});

module.exports = router;