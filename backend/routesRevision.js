const express = require("express");
const sequelize = require("./db");
const auth = require("./middleware/auth");
const { analyserCours } = require("./serviceIA");

const {
    genererQCM,
    genererFlashcards
} = require("./ia");

const router = express.Router();

// Je protège mes routes
router.use(auth);

// Je simplifie mes requêtes SQL
async function requete(sql, replacements = {}, transaction) {
    const [resultat] = await sequelize.query(sql, {
        replacements,
        transaction
    });

    return resultat;
}

// Je récupère un cours qui m'appartient
async function recupererCours(id, utilisateurId) {
    const cours = await requete(
        `SELECT id, nom, matiere,
                (NULLIF(BTRIM(texte_pdf), '') IS NOT NULL)
                AS texte_disponible
         FROM cours
         WHERE id = :id
         AND utilisateur_id = :utilisateurId`,
        { id, utilisateurId }
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
        const { coursId, niveau, nombre } = req.body || {};
        const utilisateurId = req.utilisateur.id;

        if (
            !idValide(coursId) ||
            !["facile", "moyen", "difficile"].includes(niveau) ||
            ![5, 10, 15, 20].includes(Number(nombre))
        ) {
            return res.status(400).json({
                message: "Informations invalides"
            });
        }

        // Je vérifie que le cours m'appartient
        const cours = await recupererCours(
            coursId,
            utilisateurId
        );

        if (!cours) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        if (!cours.texte_disponible) {
            return res.status(400).json({
                message: "Ce cours ne contient aucun texte exploitable"
            });
        }

        // Je réutilise mon analyse sauvegardée
        const analyse = await analyserCours(
            cours.id,
            utilisateurId
        );

        const questions = await genererQCM(
            analyse,
            niveau,
            Number(nombre)
        );

        // J'enregistre mon QCM
        const resultat = await requete(
            `INSERT INTO qcm
             (cours_id, titre, niveau, questions)
             SELECT id, :titre, :niveau,
                    CAST(:questions AS JSONB)
             FROM cours
             WHERE id = :coursId
             AND utilisateur_id = :utilisateurId
             RETURNING *`,
            {
                coursId,
                utilisateurId,
                titre: ("QCM - " + cours.nom).slice(0, 255),
                niveau,
                questions: JSON.stringify(questions)
            }
        );

        if (!resultat.length) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        res.status(201).json(resultat[0]);

    } catch (erreur) {
        console.error("Erreur QCM :", erreur.message);

        res.status(500).json({
            message: "Erreur pendant la génération du QCM"
        });
    }
});

// Je récupère uniquement mes QCM
router.get("/qcm", async (req, res) => {
    try {
        const resultat = await requete(
            `SELECT q.*
             FROM qcm q
             JOIN cours c ON c.id = q.cours_id
             WHERE c.utilisateur_id = :utilisateurId
             ORDER BY q.id DESC`,
            {
                utilisateurId: req.utilisateur.id
            }
        );

        res.json(resultat);

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Impossible de récupérer les QCM"
        });
    }
});

// Je récupère un de mes QCM
router.get("/qcm/:id", async (req, res) => {
    try {
        if (!idValide(req.params.id)) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        const resultat = await requete(
            `SELECT q.*
             FROM qcm q
             JOIN cours c ON c.id = q.cours_id
             WHERE q.id = :id
             AND c.utilisateur_id = :utilisateurId`,
            {
                id: req.params.id,
                utilisateurId: req.utilisateur.id
            }
        );

        if (!resultat.length) {
            return res.status(404).json({
                message: "QCM introuvable"
            });
        }

        res.json(resultat[0]);

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur de récupération"
        });
    }
});

// Je calcule et enregistre mon résultat
router.post("/qcm/:id/terminer", async (req, res) => {
    try {
        const { reponses } = req.body || {};
        const utilisateurId = req.utilisateur.id;

        if (!idValide(req.params.id)) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        const resultat = await requete(
            `SELECT q.*
             FROM qcm q
             JOIN cours c ON c.id = q.cours_id
             WHERE q.id = :id
             AND c.utilisateur_id = :utilisateurId`,
            {
                id: req.params.id,
                utilisateurId
            }
        );

        const qcm = resultat[0];

        if (!qcm) {
            return res.status(404).json({
                message: "QCM introuvable"
            });
        }

        // Je vérifie mes réponses
        if (
            !Array.isArray(qcm.questions) ||
            qcm.questions.length === 0 ||
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

        // Je calcule mon score
        const score = qcm.questions.reduce(
            (total, question, index) =>
                total + (
                    question.bonneReponse === reponses[index] ? 1 : 0
                ),
            0
        );

        const total = qcm.questions.length;
        const pourcentage = Math.round(score / total * 100);

        // J'enregistre mon résultat et ma révision
        const enregistrement = await sequelize.transaction(
            async transaction => {
                const donnees = await requete(
                    `INSERT INTO resultats_qcm
                     (qcm_id, score, total, pourcentage, reponses)
                     SELECT q.id, :score, :total, :pourcentage,
                            CAST(:reponses AS JSONB)
                     FROM qcm q
                     JOIN cours c ON c.id = q.cours_id
                     WHERE q.id = :id
                     AND c.utilisateur_id = :utilisateurId
                     RETURNING *`,
                    {
                        id: qcm.id,
                        utilisateurId,
                        score,
                        total,
                        pourcentage,
                        reponses: JSON.stringify(reponses)
                    },
                    transaction
                );

                if (!donnees.length) {
                    return null;
                }

                await requete(
                    `INSERT INTO revisions
                     (cours_id, type_revision)
                     VALUES (:coursId, 'qcm')`,
                    {
                        coursId: qcm.cours_id
                    },
                    transaction
                );

                return donnees[0];
            }
        );

        if (!enregistrement) {
            return res.status(404).json({
                message: "QCM introuvable"
            });
        }

        res.json(enregistrement);

    } catch (erreur) {
        console.error(erreur.message);

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
             JOIN cours c ON c.id = q.cours_id
             WHERE c.utilisateur_id = :utilisateurId
             ORDER BY r.date_creation DESC`,
            {
                utilisateurId: req.utilisateur.id
            }
        );

        res.json(resultat);

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur de récupération des résultats"
        });
    }
});

// Je supprime un de mes QCM
router.delete("/qcm/:id", async (req, res) => {
    try {
        if (!idValide(req.params.id)) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        const resultat = await requete(
            `DELETE FROM qcm
             WHERE id = :id
             AND cours_id IN (
                 SELECT id
                 FROM cours
                 WHERE utilisateur_id = :utilisateurId
             )
             RETURNING id`,
            {
                id: req.params.id,
                utilisateurId: req.utilisateur.id
            }
        );

        if (!resultat.length) {
            return res.status(404).json({
                message: "QCM introuvable"
            });
        }

        res.json({
            message: "QCM supprimé"
        });

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur de suppression du QCM"
        });
    }
});

// Je génère mes flashcards
router.post("/flashcards/generer", async (req, res) => {
    try {
        const { coursId, nombre } = req.body || {};
        const utilisateurId = req.utilisateur.id;

        if (
            !idValide(coursId) ||
            ![5, 10, 15, 20].includes(Number(nombre))
        ) {
            return res.status(400).json({
                message: "Informations invalides"
            });
        }

        // Je vérifie que le cours m'appartient
        const cours = await recupererCours(
            coursId,
            utilisateurId
        );

        if (!cours) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        if (!cours.texte_disponible) {
            return res.status(400).json({
                message: "Ce cours ne contient aucun texte exploitable"
            });
        }

        // Je réutilise mon analyse sauvegardée
        const analyse = await analyserCours(
            cours.id,
            utilisateurId
        );

        const cartes = await genererFlashcards(
            analyse,
            Number(nombre)
        );

        // J'enregistre mes nouvelles cartes
        const flashcards = await sequelize.transaction(
            async transaction => {
                const nouvellesCartes = [];

                for (const carte of cartes) {
                    const resultat = await requete(
                        `INSERT INTO flashcards
                         (cours_id, question, reponse)
                         SELECT id, :question, :reponse
                         FROM cours
                         WHERE id = :coursId
                         AND utilisateur_id = :utilisateurId
                         RETURNING *`,
                        {
                            coursId,
                            utilisateurId,
                            question: carte.question,
                            reponse: carte.reponse
                        },
                        transaction
                    );

                    if (!resultat.length) {
                        throw new Error("Cours introuvable");
                    }

                    nouvellesCartes.push(resultat[0]);
                }

                return nouvellesCartes;
            }
        );

        res.status(201).json(flashcards);

    } catch (erreur) {
        console.error("Erreur flashcards :", erreur.message);

        res.status(500).json({
            message: "Erreur pendant la génération des flashcards"
        });
    }
});

// Je récupère uniquement mes flashcards
router.get("/flashcards", async (req, res) => {
    try {
        const resultat = await requete(
            `SELECT f.*, c.nom AS cours_nom
             FROM flashcards f
             JOIN cours c ON c.id = f.cours_id
             WHERE c.utilisateur_id = :utilisateurId
             ORDER BY f.id DESC`,
            {
                utilisateurId: req.utilisateur.id
            }
        );

        res.json(resultat);

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur de récupération des flashcards"
        });
    }
});

// Je mets à jour ma mémorisation
router.patch("/flashcards/:id", async (req, res) => {
    try {
        const { maitrisee } = req.body || {};
        const utilisateurId = req.utilisateur.id;

        if (
            !idValide(req.params.id) ||
            typeof maitrisee !== "boolean"
        ) {
            return res.status(400).json({
                message: "Valeur invalide"
            });
        }

        const carte = await sequelize.transaction(
            async transaction => {

                // Je modifie uniquement une de mes cartes
                const resultat = await requete(
                    `UPDATE flashcards
                     SET maitrisee = :maitrisee,
                         derniere_revision = NOW()
                     WHERE id = :id
                     AND cours_id IN (
                         SELECT id
                         FROM cours
                         WHERE utilisateur_id = :utilisateurId
                     )
                     RETURNING *`,
                    {
                        id: req.params.id,
                        utilisateurId,
                        maitrisee
                    },
                    transaction
                );

                if (!resultat.length) {
                    return null;
                }

                // J'enregistre mon activité
                await requete(
                    `INSERT INTO revisions
                     (cours_id, type_revision)
                     VALUES (:coursId, 'flashcard')`,
                    {
                        coursId: resultat[0].cours_id
                    },
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
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur de modification"
        });
    }
});

// Je supprime une de mes flashcards
router.delete("/flashcards/:id", async (req, res) => {
    try {
        if (!idValide(req.params.id)) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        const resultat = await requete(
            `DELETE FROM flashcards
             WHERE id = :id
             AND cours_id IN (
                 SELECT id
                 FROM cours
                 WHERE utilisateur_id = :utilisateurId
             )
             RETURNING id`,
            {
                id: req.params.id,
                utilisateurId: req.utilisateur.id
            }
        );

        if (!resultat.length) {
            return res.status(404).json({
                message: "Flashcard introuvable"
            });
        }

        res.json({
            message: "Flashcard supprimée"
        });

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur de suppression"
        });
    }
});

// Je récupère mes statistiques personnelles
router.get("/statistiques", async (req, res) => {
    try {
        const resultat = await requete(
            `WITH mes_cours AS (
                SELECT id
                FROM cours
                WHERE utilisateur_id = :utilisateurId
             ),

             mes_fiches AS (
                SELECT f.*
                FROM fiches f
                JOIN mes_cours c ON c.id = f.cours_id
             ),

             mes_qcm AS (
                SELECT q.*
                FROM qcm q
                JOIN mes_cours c ON c.id = q.cours_id
             ),

             mes_resultats AS (
                SELECT r.*
                FROM resultats_qcm r
                JOIN mes_qcm q ON q.id = r.qcm_id
             ),

             mes_flashcards AS (
                SELECT f.*
                FROM flashcards f
                JOIN mes_cours c ON c.id = f.cours_id
             ),

             mes_revisions AS (
                SELECT r.*
                FROM revisions r
                JOIN mes_cours c ON c.id = r.cours_id
             )

             SELECT
                (SELECT COUNT(*)
                 FROM mes_cours)::int AS cours,

                (SELECT COUNT(*)
                 FROM mes_fiches)::int AS fiches,

                (SELECT COUNT(*)
                 FROM mes_qcm)::int AS qcm,

                (SELECT COUNT(*)
                 FROM mes_resultats)::int AS quiz_termines,

                (SELECT COUNT(*)
                 FROM mes_flashcards)::int AS flashcards,

                (SELECT COUNT(*)
                 FROM mes_flashcards
                 WHERE maitrisee = TRUE)::int AS cartes_maitrisees,

                (SELECT COALESCE(SUM(score), 0)
                 FROM mes_resultats)::int AS bonnes_reponses,

                (SELECT COALESCE(SUM(total), 0)
                 FROM mes_resultats)::int AS questions,

                (SELECT COALESCE(ROUND(AVG(pourcentage)), 0)
                 FROM mes_resultats)::int AS moyenne,

                (SELECT COUNT(DISTINCT cours_id)
                 FROM mes_revisions)::int AS cours_revises`,
            {
                utilisateurId: req.utilisateur.id
            }
        );

        res.json(resultat[0]);

    } catch (erreur) {
        console.error(erreur.message);

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

             (SELECT COUNT(*)
              FROM fiches f
              WHERE f.cours_id = c.id)::int AS fiches,

             (SELECT COUNT(*)
              FROM flashcards f
              WHERE f.cours_id = c.id)::int AS flashcards,

             (SELECT COUNT(*)
              FROM flashcards f
              WHERE f.cours_id = c.id
              AND f.maitrisee = TRUE)::int AS maitrisees,

             (SELECT COUNT(*)
              FROM resultats_qcm r
              JOIN qcm q ON q.id = r.qcm_id
              WHERE q.cours_id = c.id)::int AS quiz_termines,

             (SELECT ROUND(AVG(r.pourcentage))::int
              FROM resultats_qcm r
              JOIN qcm q ON q.id = r.qcm_id
              WHERE q.cours_id = c.id) AS moyenne

             FROM cours c
             WHERE c.utilisateur_id = :utilisateurId
             ORDER BY c.id DESC`,
            {
                utilisateurId: req.utilisateur.id
            }
        );

        res.json(resultat);

    } catch (erreur) {
        console.error(erreur.message);

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
             WHERE c.utilisateur_id = :utilisateurId
             ORDER BY r.date_revision DESC, r.id DESC
             LIMIT 30`,
            {
                utilisateurId: req.utilisateur.id
            }
        );

        res.json(resultat);

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur de récupération des révisions"
        });
    }
});

module.exports = router;