
require("dotenv").config();

const express = require("express");
const sequelize = require("./db");
const { genererFiche } = require("./ia");
const {
    analyserCours,
    lancerGeneration
} = require("./serviceIA");

const cors = require("cors");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const auth = require("./middleware/auth");

const app = express();
const PORT = 3001;

// Je configure l'importation de mes PDF
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024
    }
});

// Je configure mon serveur
app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

// Je relie mes routes d'authentification
app.use("/api/auth", require("./routesAuth"));

// Je vérifie mon backend
app.get("/", (req, res) => {
    res.send("Backend MedStudy AI opérationnel");
});

// Je teste ma connexion avec React
app.get("/api/test", (req, res) => {
    res.send("Connexion React Express réussie");
});

// Je relie mes routes de révision
app.use("/api", require("./routesRevision"));

// Je protège mes routes privées
app.use("/api", auth);
app.use("/api", require("./routesPlus"));

// Je garde ma route de test
app.get("/api/fiche/test", (req, res) => {
    res.send("Test de génération de fiche");
});

// Je récupère la progression de mon cours
app.get("/api/cours/:id/statut-ia", async (req, res) => {
    try {
        const coursId = Number(req.params.id);

        if (!Number.isInteger(coursId) || coursId <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        const [cours] = await sequelize.query(
            `SELECT
                c.id,
                c.nom,
                c.statut_ia,
                c.progression_ia,
                c.erreur_ia,
                (
                    SELECT f.id
                    FROM fiches f
                    WHERE f.cours_id = c.id
                    AND f.automatique = TRUE
                    LIMIT 1
                ) AS fiche_id
             FROM cours c
             WHERE c.id = :id
             AND c.utilisateur_id = :utilisateurId`,
            {
                replacements: {
                    id: coursId,
                    utilisateurId: req.utilisateur.id
                }
            }
        );

        if (!cours.length) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        res.json(cours[0]);

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Impossible de récupérer la progression"
        });
    }
});

// Je relance une génération automatique
app.post("/api/cours/:id/generer-fiche", async (req, res) => {
    try {
        const coursId = Number(req.params.id);
        const utilisateurId = req.utilisateur.id;

        if (!Number.isInteger(coursId) || coursId <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        const [cours] = await sequelize.query(
            `SELECT id, statut_ia, texte_pdf
             FROM cours
             WHERE id = :id
             AND utilisateur_id = :utilisateurId`,
            {
                replacements: {
                    id: coursId,
                    utilisateurId
                }
            }
        );

        if (!cours.length) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        if (!cours[0].texte_pdf?.trim()) {
            return res.status(400).json({
                message: "Ce cours ne contient aucun texte exploitable"
            });
        }

        // Je vérifie si ma fiche automatique existe
        const [fiches] = await sequelize.query(
            `SELECT id
             FROM fiches
             WHERE cours_id = :coursId
             AND automatique = TRUE`,
            {
                replacements: {
                    coursId
                }
            }
        );

        if (fiches.length) {
            return res.json({
                message: "Votre fiche est déjà disponible",
                fiche_id: fiches[0].id,
                statut_ia: "termine"
            });
        }

        // Je permets de recréer une fiche supprimée
        await sequelize.query(
            `UPDATE cours
             SET statut_ia = 'en_attente',
                 progression_ia = 0
             WHERE id = :coursId
             AND utilisateur_id = :utilisateurId
             AND statut_ia = 'termine'
             AND NOT EXISTS (
                 SELECT 1
                 FROM fiches
                 WHERE cours_id = :coursId
                 AND automatique = TRUE
             )`,
            {
                replacements: {
                    coursId,
                    utilisateurId
                }
            }
        );

        const lancement = await lancerGeneration(
            coursId,
            utilisateurId
        );

        res.status(202).json({
            message: lancement
                ? "Génération automatique lancée"
                : "Une génération est déjà en cours"
        });

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Impossible de lancer la génération"
        });
    }
});

// Je récupère un de mes PDF
app.get("/api/cours/:id", async (req, res) => {
    try {
        const coursId = Number(req.params.id);

        if (!Number.isInteger(coursId) || coursId <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        const [cours] = await sequelize.query(
            `SELECT contenu_pdf
             FROM cours
             WHERE id = :id
             AND utilisateur_id = :utilisateurId`,
            {
                replacements: {
                    id: coursId,
                    utilisateurId: req.utilisateur.id
                }
            }
        );

        if (!cours.length) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Cache-Control", "private, no-store");

        res.send(cours[0].contenu_pdf);

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur lors de la récupération du PDF"
        });
    }
});

// J'importe mon PDF
app.post("/api/upload", upload.single("pdf"), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            message: "Aucun fichier reçu"
        });
    }

    if (
        req.file.mimetype !== "application/pdf" ||
        req.file.buffer.subarray(0, 5).toString() !== "%PDF-"
    ) {
        return res.status(400).json({
            message: "Seuls les fichiers PDF sont autorisés"
        });
    }

    let parser;

    try {
        // Je récupère le texte de mon PDF
        parser = new PDFParse({
            data: req.file.buffer
        });

        const resultat = await parser.getText();

        const texte = resultat.text || "";
        const utilisateurId = req.utilisateur.id;

        // J'enregistre mon cours
        const [cours] = await sequelize.query(
            `INSERT INTO cours
             (
                nom,
                matiere,
                texte_pdf,
                fichier_pdf,
                contenu_pdf,
                utilisateur_id,
                statut_ia,
                progression_ia
             )
             VALUES
             (
                :nom,
                :matiere,
                :texte,
                :fichier,
                :contenu,
                :utilisateurId,
                'en_attente',
                0
             )
             RETURNING id, nom, matiere`,
            {
                replacements: {
                    nom: req.file.originalname.slice(0, 255),
                    matiere: "Non renseignée",
                    texte,
                    fichier: req.file.originalname.slice(0, 255),
                    contenu: req.file.buffer,
                    utilisateurId
                }
            }
        );

        const nouveauCours = cours[0];

        let statutIA = "en_attente";
        let message = "Votre cours a bien été enregistré";

        // Je lance automatiquement ma fiche
        try {
            if (texte.trim()) {
                const lancement = await lancerGeneration(
                    nouveauCours.id,
                    utilisateurId
                );

                if (lancement) {
                    statutIA = "file_attente";

                    message =
                        "Cours importé ! Votre fiche est en cours de préparation.";
                }

            } else {
                statutIA = "erreur";

                message =
                    "Cours importé, mais aucun texte exploitable n'a été trouvé.";

                await sequelize.query(
                    `UPDATE cours
                     SET statut_ia = 'erreur',
                         erreur_ia = :erreur
                     WHERE id = :id
                     AND utilisateur_id = :utilisateurId`,
                    {
                        replacements: {
                            id: nouveauCours.id,
                            utilisateurId,
                            erreur: "Aucun texte exploitable dans ce PDF"
                        }
                    }
                );
            }

        } catch (erreurIA) {
            console.error(
                "Erreur de lancement IA :",
                erreurIA.message
            );

            message =
                "Cours importé. La génération pourra être relancée.";
        }

        // Je réponds sans attendre la génération
        res.status(201).json({
            message,
            cours: nouveauCours,
            coursId: nouveauCours.id,
            statut_ia: statutIA
        });

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur pendant l'importation du PDF"
        });

    } finally {
        // Je libère mon lecteur PDF
        if (parser) {
            try {
                await parser.destroy();
            } catch (erreur) {
                console.error(erreur.message);
            }
        }
    }
});

// Je récupère mes cours et leur progression
app.get("/api/cours", async (req, res) => {
    try {
        const [cours] = await sequelize.query(
            `SELECT
                c.id,
                c.nom,
                c.matiere,
                c.statut_ia,
                c.progression_ia,
                c.erreur_ia,
                (
                    SELECT f.id
                    FROM fiches f
                    WHERE f.cours_id = c.id
                    AND f.automatique = TRUE
                    LIMIT 1
                ) AS fiche_id
             FROM cours c
             WHERE c.utilisateur_id = :utilisateurId
             ORDER BY c.id DESC`,
            {
                replacements: {
                    utilisateurId: req.utilisateur.id
                }
            }
        );

        res.json(cours);

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur lors de la récupération des cours"
        });
    }
});

// Je génère une fiche manuellement
app.post("/api/fiches/generer", async (req, res) => {
    try {
        const { coursId } = req.body || {};
        const utilisateurId = req.utilisateur.id;

        if (
            !Number.isInteger(Number(coursId)) ||
            Number(coursId) <= 0
        ) {
            return res.status(400).json({
                message: "Veuillez sélectionner un cours valide"
            });
        }

        // Je vérifie que le cours m'appartient
        const [cours] = await sequelize.query(
            `SELECT id, nom, matiere, texte_pdf
             FROM cours
             WHERE id = :id
             AND utilisateur_id = :utilisateurId`,
            {
                replacements: {
                    id: Number(coursId),
                    utilisateurId
                }
            }
        );

        if (!cours.length) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        const monCours = cours[0];

        if (!monCours.texte_pdf?.trim()) {
            return res.status(400).json({
                message: "Ce cours ne contient aucun texte exploitable"
            });
        }

        // Je réutilise mon analyse sauvegardée
        const analyse = await analyserCours(
            monCours.id,
            utilisateurId
        );

        const contenu = await genererFiche(analyse);

        const titre = (
            "Fiche - " + monCours.nom
        ).slice(0, 255);

        // J'enregistre ma fiche manuelle
        const [fiches] = await sequelize.query(
            `INSERT INTO fiches
             (
                cours_id,
                titre,
                matiere,
                contenu,
                automatique
             )
             SELECT id, :titre, matiere, :contenu, FALSE
             FROM cours
             WHERE id = :coursId
             AND utilisateur_id = :utilisateurId
             RETURNING
                id,
                cours_id,
                titre,
                matiere,
                contenu,
                date_creation,
                automatique`,
            {
                replacements: {
                    coursId: monCours.id,
                    titre,
                    contenu,
                    utilisateurId
                }
            }
        );

        if (!fiches.length) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        res.status(201).json({
            message: "Fiche générée et enregistrée avec succès",
            fiche: fiches[0]
        });

    } catch (erreur) {
        console.error("Erreur IA :", erreur.message);

        res.status(500).json({
            message: "Erreur pendant la génération de la fiche"
        });
    }
});

// Je récupère toutes mes fiches
app.get("/api/fiches", async (req, res) => {
    try {
        const [fiches] = await sequelize.query(
            `SELECT
                f.id,
                f.cours_id,
                f.titre,
                f.matiere,
                f.date_creation,
                f.automatique
             FROM fiches f
             JOIN cours c ON c.id = f.cours_id
             WHERE c.utilisateur_id = :utilisateurId
             ORDER BY f.date_creation DESC, f.id DESC`,
            {
                replacements: {
                    utilisateurId: req.utilisateur.id
                }
            }
        );

        res.json(fiches);

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur lors de la récupération des fiches"
        });
    }
});

// Je récupère une de mes fiches
app.get("/api/fiches/:id", async (req, res) => {
    try {
        const ficheId = Number(req.params.id);

        if (!Number.isInteger(ficheId) || ficheId <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        const [fiches] = await sequelize.query(
            `SELECT f.*
             FROM fiches f
             JOIN cours c ON c.id = f.cours_id
             WHERE f.id = :id
             AND c.utilisateur_id = :utilisateurId`,
            {
                replacements: {
                    id: ficheId,
                    utilisateurId: req.utilisateur.id
                }
            }
        );

        if (!fiches.length) {
            return res.status(404).json({
                message: "Fiche introuvable"
            });
        }

        res.json(fiches[0]);

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur lors de la récupération de la fiche"
        });
    }
});

// Je modifie une de mes fiches
app.put("/api/fiches/:id", async (req, res) => {
    try {
        const ficheId = Number(req.params.id);

        const {
            titre,
            matiere,
            contenu
        } = req.body || {};

        if (!Number.isInteger(ficheId) || ficheId <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        // Je vérifie mes informations
        if (
            typeof titre !== "string" ||
            !titre.trim() ||
            titre.trim().length > 255 ||
            typeof matiere !== "string" ||
            matiere.trim().length > 255 ||
            typeof contenu !== "string" ||
            !contenu.trim()
        ) {
            return res.status(400).json({
                message: "Informations invalides"
            });
        }

        const [fiches] = await sequelize.query(
            `UPDATE fiches
             SET titre = :titre,
                 matiere = :matiere,
                 contenu = :contenu
             WHERE id = :id
             AND cours_id IN (
                 SELECT id
                 FROM cours
                 WHERE utilisateur_id = :utilisateurId
             )
             RETURNING
                id,
                cours_id,
                titre,
                matiere,
                contenu,
                date_creation,
                automatique`,
            {
                replacements: {
                    id: ficheId,
                    titre: titre.trim(),
                    matiere: matiere.trim() || "Non renseignée",
                    contenu: contenu.trim(),
                    utilisateurId: req.utilisateur.id
                }
            }
        );

        if (!fiches.length) {
            return res.status(404).json({
                message: "Fiche introuvable"
            });
        }

        res.json({
            message: "Fiche modifiée avec succès",
            fiche: fiches[0]
        });

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur lors de la modification de la fiche"
        });
    }
});

// Je supprime une de mes fiches
app.delete("/api/fiches/:id", async (req, res) => {
    try {
        const ficheId = Number(req.params.id);
        const utilisateurId = req.utilisateur.id;

        if (!Number.isInteger(ficheId) || ficheId <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        const suppression = await sequelize.transaction(
            async transaction => {
                const [fiches] = await sequelize.query(
                    `DELETE FROM fiches
                     WHERE id = :id
                     AND cours_id IN (
                         SELECT id
                         FROM cours
                         WHERE utilisateur_id = :utilisateurId
                     )
                     RETURNING id, cours_id, automatique`,
                    {
                        replacements: {
                            id: ficheId,
                            utilisateurId
                        },
                        transaction
                    }
                );

                if (!fiches.length) {
                    return false;
                }

                const fiche = fiches[0];

                // Je garde mon cache si je supprime ma fiche
                if (fiche.automatique) {
                    await sequelize.query(
                        `UPDATE cours
                         SET statut_ia = 'en_attente',
                             progression_ia = 0,
                             erreur_ia = NULL
                         WHERE id = :coursId
                         AND utilisateur_id = :utilisateurId
                         AND statut_ia = 'termine'`,
                        {
                            replacements: {
                                coursId: fiche.cours_id,
                                utilisateurId
                            },
                            transaction
                        }
                    );
                }

                return true;
            }
        );

        if (!suppression) {
            return res.status(404).json({
                message: "Fiche introuvable"
            });
        }

        res.json({
            message: "Fiche supprimée avec succès"
        });

    } catch (erreur) {
        console.error(erreur.message);

        res.status(500).json({
            message: "Erreur lors de la suppression de la fiche"
        });
    }
});

// Je récupère les générations interrompues
async function reprendreGenerations() {
    const [cours] = await sequelize.query(
        `UPDATE cours
         SET statut_ia = 'en_attente',
             progression_ia = 0,
             erreur_ia = NULL
         WHERE statut_ia IN (
             'file_attente',
             'analyse',
             'generation'
         )
         AND utilisateur_id IS NOT NULL
         RETURNING id, utilisateur_id`
    );

    for (const monCours of cours) {
        await lancerGeneration(
            monCours.id,
            monCours.utilisateur_id
        );
    }

    if (cours.length) {
        console.log(
            `${cours.length} génération(s) reprise(s)`
        );
    }
}

// Je gère mes routes inexistantes
app.use((req, res) => {
    res.status(404).json({
        message: "Route introuvable"
    });
});

// Je gère les erreurs de mon serveur
app.use((err, req, res, next) => {

    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            message: "Le fichier a dépassé la limite de 100 Mo"
        });
    }

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            message: "Erreur pendant l'importation du fichier"
        });
    }

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            message: "Données JSON invalides"
        });
    }

    console.error(err.message);

    res.status(500).json({
        message: "Une erreur est survenue"
    });
});

// Je démarre mon serveur
async function demarrerServeur() {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error(
                "JWT_SECRET manquant dans le fichier .env"
            );
        }

        await sequelize.authenticate();

        console.log("Connexion PostgreSQL réussie !");

        // Je reprends mes générations interrompues
        await reprendreGenerations();

        app.listen(PORT, () => {
            console.log(
                `Serveur démarré sur http://localhost:${PORT}`
            );
        });

    } catch (erreur) {
        console.error(
            "Erreur de démarrage :",
            erreur.message
        );

        process.exit(1);
    }
}

demarrerServeur();
