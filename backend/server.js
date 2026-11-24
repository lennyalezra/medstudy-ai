
require("dotenv").config();

const express = require("express");
const sequelize = require("./db");
const { genererFiche } = require("./ia");
const cors = require("cors");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");

const app = express();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// je configure mon serveur
app.use(cors());
app.use(express.json());
// Je relie mes nouvelles routes
app.use("/api", require("./routesRevision"));

const PORT = 3001;

// je vérifie que mon backend fonctionne
app.get("/", (req, res) => {
    res.send("backend Medstudy AI operationnel");
});

// je teste la connexion avec react
app.get("/api/test", (req, res) => {
    res.send("connexion react Express reussi");
});

// je garde ma route de test
app.get("/api/fiche/test", (req, res) => {
    res.send("Test de generation de fiche");
});

// je récupère un pdf enregistré
app.get("/api/cours/:id", async (req, res) => {
    try {
        const resultat = await sequelize.query(
            `SELECT * FROM cours WHERE id = :id`,
            {
                replacements: {
                    id: req.params.id
                }
            }
        );

        const cours = resultat[0][0];

        if (!cours) {
            return res.status(404).send("Le cours n'existe pas");
        }

        // j'affiche le pdf
        res.setHeader("Content-Type", "application/pdf");
        res.send(cours.contenu_pdf);

    } catch (erreur) {
        console.log(erreur);

        res.status(500).send(
            "Erreur lors de la recuperation du PDF"
        );
    }
});

// j'importe un pdf depuis react
app.post("/api/upload", upload.single("pdf"), async (req, res) => {

    if (!req.file) {
        return res.status(400).send("Aucun fichier recu");
    }

    if (req.file.mimetype !== "application/pdf") {
        return res.status(400).send(
            "Seuls les fichiers PDF sont autorises"
        );
    }

    let parser;

    try {
        // je récupère le texte du pdf
        parser = new PDFParse({
            data: req.file.buffer
        });

        const resultat = await parser.getText();

        // j'enregistre mon cours
        await sequelize.query(
            `INSERT INTO cours
            (nom, matiere, texte_pdf, fichier_pdf, contenu_pdf)
            VALUES (:nom, :matiere, :texte, :fichier, :contenu)`,
            {
                replacements: {
                    nom: req.file.originalname,
                    matiere: "Non renseignée",
                    texte: resultat.text,
                    fichier: req.file.originalname,
                    contenu: req.file.buffer
                }
            }
        );

        res.json({
            message: "Votre cours a bien ete enregistre"
        });

    } catch (erreur) {
        console.log(erreur);

        res.status(500).send(
            "Erreur pendant l'importation du PDF"
        );

    } finally {
        // je libère le lecteur pdf
        if (parser) {
            await parser.destroy();
        }
    }
});

// je récupère tous mes cours
app.get("/api/cours", async (req, res) => {
    try {
        const resultat = await sequelize.query(
            `SELECT id, nom, matiere
             FROM cours
             ORDER BY id DESC`
        );

        res.json(resultat[0]);

    } catch (erreur) {
        console.log(erreur);

        res.status(500).send(
            "Erreur lors de la recuperation des cours"
        );
    }
});

// je génère une fiche avec groq
app.post("/api/fiches/generer", async (req, res) => {
    try {
        const { coursId } = req.body || {};

        if (!Number.isInteger(Number(coursId)) ||
            Number(coursId) <= 0) {
            return res.status(400).json({
                message: "Veuillez selectionner un cours valide"
            });
        }

        // je récupère le cours
        const resultat = await sequelize.query(
            `SELECT id, nom, matiere, texte_pdf
             FROM cours
             WHERE id = :id`,
            {
                replacements: {
                    id: Number(coursId)
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

        // je demande à groq de créer ma fiche
        const contenu = await genererFiche(cours.texte_pdf);
        const titre = "Fiche - " + cours.nom;

        // j'enregistre ma fiche
        const enregistrement = await sequelize.query(
            `INSERT INTO fiches
            (cours_id, titre, matiere, contenu)
            VALUES (:coursId, :titre, :matiere, :contenu)
            RETURNING
                id, cours_id, titre, matiere,
                contenu, date_creation`,
            {
                replacements: {
                    coursId: cours.id,
                    titre: titre,
                    matiere: cours.matiere,
                    contenu: contenu
                }
            }
        );

        res.status(201).json({
            message: "Fiche generee et enregistree avec succes",
            fiche: enregistrement[0][0]
        });

    } catch (erreur) {
        console.error("Erreur IA :", erreur);

        res.status(500).json({
            message: "Erreur pendant la generation de la fiche"
        });
    }
});

// je récupère toutes mes fiches
app.get("/api/fiches", async (req, res) => {
    try {
        const resultat = await sequelize.query(
            `SELECT id, cours_id, titre, matiere, date_creation
             FROM fiches
             ORDER BY date_creation DESC, id DESC`
        );

        res.json(resultat[0]);

    } catch (erreur) {
        console.log(erreur);

        res.status(500).json({
            message: "Erreur lors de la recuperation des fiches"
        });
    }
});

// je récupère une fiche précise
app.get("/api/fiches/:id", async (req, res) => {
    try {
        const resultat = await sequelize.query(
            `SELECT * FROM fiches WHERE id = :id`,
            {
                replacements: {
                    id: req.params.id
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
        console.log(erreur);

        res.status(500).json({
            message: "Erreur lors de la recuperation de la fiche"
        });
    }
});

// je modifie une fiche
app.put("/api/fiches/:id", async (req, res) => {
    try {
        const ficheId = Number(req.params.id);
        const { titre, matiere, contenu } = req.body || {};

        // je vérifie les informations
        if (!Number.isInteger(ficheId) || ficheId <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        if (
            typeof titre !== "string" ||
            !titre.trim() ||
            titre.trim().length > 255 ||
            typeof matiere !== "string" ||
            matiere.length > 255 ||
            typeof contenu !== "string" ||
            !contenu.trim()
        ) {
            return res.status(400).json({
                message: "Informations invalides"
            });
        }

        // j'enregistre les modifications
        const resultat = await sequelize.query(
            `UPDATE fiches
             SET titre = :titre,
                 matiere = :matiere,
                 contenu = :contenu
             WHERE id = :id
             RETURNING
                id, cours_id, titre, matiere,
                contenu, date_creation`,
            {
                replacements: {
                    id: ficheId,
                    titre: titre.trim(),
                    matiere: matiere.trim() || "Non renseignée",
                    contenu: contenu.trim()
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
            message: "Fiche modifiee avec succes",
            fiche: fiche
        });

    } catch (erreur) {
        console.log(erreur);

        res.status(500).json({
            message: "Erreur lors de la modification de la fiche"
        });
    }
});

// je supprime une fiche
app.delete("/api/fiches/:id", async (req, res) => {
    try {
        const ficheId = Number(req.params.id);

        if (!Number.isInteger(ficheId) || ficheId <= 0) {
            return res.status(400).json({
                message: "Identifiant invalide"
            });
        }

        // je supprime la fiche dans postgresql
        const resultat = await sequelize.query(
            `DELETE FROM fiches
             WHERE id = :id
             RETURNING id`,
            {
                replacements: {
                    id: ficheId
                }
            }
        );

        if (resultat[0].length === 0) {
            return res.status(404).json({
                message: "Fiche introuvable"
            });
        }

        res.json({
            message: "Fiche supprimee avec succes"
        });

    } catch (erreur) {
        console.log(erreur);

        res.status(500).json({
            message: "Erreur lors de la suppression de la fiche"
        });
    }
});

// je gère les pdf trop volumineux
app.use((err, req, res, next) => {
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).send(
            "Le fichier a depasse la limite de 10 Mo"
        );
    }

    next(err);
});

// je vérifie la connexion à postgresql
sequelize.authenticate()
    .then(() => {
        console.log("Connexion PostgreSQL réussie !");
    })
    .catch((erreur) => {
        console.error(
            "Erreur de connexion PostgreSQL :",
            erreur
        );
    });

// je démarre mon serveur
app.listen(PORT, () => {
    console.log("Serveur démarré");
});
