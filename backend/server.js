require("dotenv").config();

const express = require("express");
const sequelize = require("./db");
const { genererFiche } = require("./ia");
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
        fileSize: 10 * 1024 * 1024
    }
});

// Je configure mon serveur
app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

// Je relie mes routes d'authentification
app.use("/api/auth", require("./routesAuth"));

// Je vérifie que mon backend fonctionne
app.get("/", (req, res) => {
    res.send("Backend MedStudy AI opérationnel");
});

// Je teste la connexion avec React
app.get("/api/test", (req, res) => {
    res.send("Connexion React Express réussie");
});

// Je relie mes routes de révision
app.use("/api", require("./routesRevision"));

// Je protège mes autres routes privées
app.use("/api", auth);

// Je garde ma route de test
app.get("/api/fiche/test", (req, res) => {
    res.send("Test de génération de fiche");
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

        const resultat = await sequelize.query(
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

        const cours = resultat[0][0];

        if (!cours) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        // J'affiche mon PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Cache-Control", "private, no-store");

        res.send(cours.contenu_pdf);

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur lors de la récupération du PDF"
        });
    }
});

// J'importe un PDF depuis React
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

        // J'enregistre mon cours dans mon compte
        await sequelize.query(
            `INSERT INTO cours
             (
                nom,
                matiere,
                texte_pdf,
                fichier_pdf,
                contenu_pdf,
                utilisateur_id
             )
             VALUES
             (
                :nom,
                :matiere,
                :texte,
                :fichier,
                :contenu,
                :utilisateurId
             )`,
            {
                replacements: {
                    nom: req.file.originalname.slice(0, 255),
                    matiere: "Non renseignée",
                    texte: resultat.text,
                    fichier: req.file.originalname.slice(0, 255),
                    contenu: req.file.buffer,
                    utilisateurId: req.utilisateur.id
                }
            }
        );

        res.status(201).json({
            message: "Votre cours a bien été enregistré"
        });

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur pendant l'importation du PDF"
        });

    } finally {
        // Je libère mon lecteur PDF
        if (parser) {
            try {
                await parser.destroy();
            } catch (erreur) {
                console.error(erreur);
            }
        }
    }
});

// Je récupère uniquement mes cours
app.get("/api/cours", async (req, res) => {
    try {
        const resultat = await sequelize.query(
            `SELECT id, nom, matiere
             FROM cours
             WHERE utilisateur_id = :utilisateurId
             ORDER BY id DESC`,
            {
                replacements: {
                    utilisateurId: req.utilisateur.id
                }
            }
        );

        res.json(resultat[0]);

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur lors de la récupération des cours"
        });
    }
});

// Je génère une fiche avec Groq
app.post("/api/fiches/generer", async (req, res) => {
    try {
        const { coursId } = req.body || {};

        if (
            !Number.isInteger(Number(coursId)) ||
            Number(coursId) <= 0
        ) {
            return res.status(400).json({
                message: "Veuillez sélectionner un cours valide"
            });
        }

        // Je vérifie que le cours m'appartient
        const resultat = await sequelize.query(
            `SELECT id, nom, matiere, texte_pdf
             FROM cours
             WHERE id = :id
             AND utilisateur_id = :utilisateurId`,
            {
                replacements: {
                    id: Number(coursId),
                    utilisateurId: req.utilisateur.id
                }
            }
        );

        const cours = resultat[0][0];

        if (!cours) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        if (!cours.texte_pdf || !cours.texte_pdf.trim()) {
            return res.status(400).json({
                message: "Ce cours ne contient aucun texte exploitable"
            });
        }

        // Je demande à Groq de créer ma fiche
        const contenu = await genererFiche(cours.texte_pdf);

        const titre = ("Fiche - " + cours.nom).slice(0, 255);

        // J'enregistre ma fiche
        const enregistrement = await sequelize.query(
            `INSERT INTO fiches
             (cours_id, titre, matiere, contenu)
             SELECT id, :titre, matiere, :contenu
             FROM cours
             WHERE id = :coursId
             AND utilisateur_id = :utilisateurId
             RETURNING
                id,
                cours_id,
                titre,
                matiere,
                contenu,
                date_creation`,
            {
                replacements: {
                    coursId: cours.id,
                    titre,
                    contenu,
                    utilisateurId: req.utilisateur.id
                }
            }
        );

        const fiche = enregistrement[0][0];

        if (!fiche) {
            return res.status(404).json({
                message: "Cours introuvable"
            });
        }

        res.status(201).json({
            message: "Fiche générée et enregistrée avec succès",
            fiche
        });

    } catch (erreur) {
        console.error("Erreur IA :", erreur);

        res.status(500).json({
            message: "Erreur pendant la génération de la fiche"
        });
    }
});

// Je récupère toutes mes fiches
app.get("/api/fiches", async (req, res) => {
    try {
        const resultat = await sequelize.query(
            `SELECT
                f.id,
                f.cours_id,
                f.titre,
                f.matiere,
                f.date_creation
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

        res.json(resultat[0]);

    } catch (erreur) {
        console.error(erreur);

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

        const resultat = await sequelize.query(
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

        const fiche = resultat[0][0];

        if (!fiche) {
            return res.status(404).json({
                message: "Fiche introuvable"
            });
        }

        res.json(fiche);

    } catch (erreur) {
        console.error(erreur);

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

        // Je vérifie mon identifiant
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

        // Je modifie uniquement une fiche qui m'appartient
        const resultat = await sequelize.query(
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
                date_creation`,
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

        const fiche = resultat[0][0];

        if (!fiche) {
            return res.status(404).json({
                message: "Fiche introuvable"
            });
        }

        res.json({
            message: "Fiche modifiée avec succès",
            fiche
        });

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur lors de la modification de la fiche"
        });
    }
});

// Je supprime une de mes fiches
app.delete("/api/fiches/:id", async (req, res) => {
    try {
        const ficheId = Number(req.params.id);

        if (!Number.isInteger(ficheId) || ficheId <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        // Je vérifie que la fiche m'appartient
        const resultat = await sequelize.query(
            `DELETE FROM fiches
             WHERE id = :id
             AND cours_id IN (
                 SELECT id
                 FROM cours
                 WHERE utilisateur_id = :utilisateurId
             )
             RETURNING id`,
            {
                replacements: {
                    id: ficheId,
                    utilisateurId: req.utilisateur.id
                }
            }
        );

        if (resultat[0].length === 0) {
            return res.status(404).json({
                message: "Fiche introuvable"
            });
        }

        res.json({
            message: "Fiche supprimée avec succès"
        });

    } catch (erreur) {
        console.error(erreur);

        res.status(500).json({
            message: "Erreur lors de la suppression de la fiche"
        });
    }
});

// Je gère les routes inexistantes
app.use((req, res) => {
    res.status(404).json({
        message: "Route introuvable"
    });
});

// Je gère les erreurs de mon serveur
app.use((err, req, res, next) => {

    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            message: "Le fichier a dépassé la limite de 10 Mo"
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

    console.error(err);

    res.status(500).json({
        message: "Une erreur est survenue"
    });
});

// Je vérifie ma connexion à PostgreSQL
async function demarrerServeur() {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error(
                "JWT_SECRET manquant dans le fichier .env"
            );
        }

        await sequelize.authenticate();

        console.log("Connexion PostgreSQL réussie !");

        // Je démarre mon serveur
        app.listen(PORT, () => {
            console.log(
                `Serveur démarré sur http://localhost:${PORT}`
            );
        });

    } catch (erreur) {
        console.error("Erreur de démarrage :", erreur);

        process.exit(1);
    }
}

demarrerServeur();