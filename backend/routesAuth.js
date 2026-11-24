const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sequelize = require("./db");
const auth = require("./middleware/auth");

const router = express.Router();

// Je crée un token pour mon utilisateur
function creerToken(utilisateur) {
    return jwt.sign(
        { id: utilisateur.id },
        process.env.JWT_SECRET,
        {
            algorithm: "HS256",
            expiresIn: "2h"
        }
    );
}

// Je crée un nouveau compte
router.post("/inscription", async (req, res) => {
    try {
        const { prenom, nom, email, motDePasse } = req.body;

        if (
            typeof prenom !== "string" ||
            typeof nom !== "string" ||
            typeof email !== "string" ||
            typeof motDePasse !== "string" ||
            !prenom.trim() ||
            !nom.trim()
        ) {
            return res.status(400).json({
                message: "Tous les champs sont obligatoires."
            });
        }

        const emailNormalise = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalise)) {
            return res.status(400).json({
                message: "Adresse email invalide."
            });
        }

        if (
            motDePasse.length < 12 ||
            Buffer.byteLength(motDePasse, "utf8") > 72
        ) {
            return res.status(400).json({
                message: "Choisis un mot de passe d'au moins 12 caractères et de 72 octets maximum."
            });
        }

        if (
            prenom.trim().length > 100 ||
            nom.trim().length > 100 ||
            emailNormalise.length > 255
        ) {
            return res.status(400).json({
                message: "Un champ est trop long."
            });
        }

        const motDePasseHash = await bcrypt.hash(motDePasse, 12);

        const [utilisateurs] = await sequelize.query(
            `INSERT INTO utilisateurs
            (prenom, nom, email, mot_de_passe)
            VALUES (:prenom, :nom, :email, :motDePasse)
            ON CONFLICT (email) DO NOTHING
            RETURNING id, prenom, nom, email, date_creation`,
            {
                replacements: {
                    prenom: prenom.trim(),
                    nom: nom.trim(),
                    email: emailNormalise,
                    motDePasse: motDePasseHash
                }
            }
        );

        if (utilisateurs.length === 0) {
            return res.status(409).json({
                message: "Impossible de créer ce compte."
            });
        }

        const utilisateur = utilisateurs[0];

        res.status(201).json({
            utilisateur,
            token: creerToken(utilisateur)
        });

    } catch (erreur) {
        console.error("Erreur inscription");

        res.status(500).json({
            message: "Erreur pendant l'inscription."
        });
    }
});

// Je connecte mon utilisateur
router.post("/connexion", async (req, res) => {
    try {
        const { email, motDePasse } = req.body;

        if (
            typeof email !== "string" ||
            typeof motDePasse !== "string" ||
            Buffer.byteLength(motDePasse, "utf8") > 72
        ) {
            return res.status(400).json({
                message: "Identifiants invalides."
            });
        }

        const [utilisateurs] = await sequelize.query(
            `SELECT * FROM utilisateurs
            WHERE email = :email`,
            {
                replacements: {
                    email: email.trim().toLowerCase()
                }
            }
        );

        const utilisateur = utilisateurs[0];

        if (!utilisateur) {
            return res.status(401).json({
                message: "Email ou mot de passe incorrect."
            });
        }

        const motDePasseValide = await bcrypt.compare(
            motDePasse,
            utilisateur.mot_de_passe
        );

        if (!motDePasseValide) {
            return res.status(401).json({
                message: "Email ou mot de passe incorrect."
            });
        }

        delete utilisateur.mot_de_passe;

        res.json({
            utilisateur,
            token: creerToken(utilisateur)
        });

    } catch (erreur) {
        console.error("Erreur connexion");

        res.status(500).json({
            message: "Erreur pendant la connexion."
        });
    }
});

// Je récupère mon profil
router.get("/profil", auth, async (req, res) => {
    try {
        const [utilisateurs] = await sequelize.query(
            `SELECT id, prenom, nom, email, date_creation
            FROM utilisateurs
            WHERE id = :id`,
            {
                replacements: {
                    id: req.utilisateur.id
                }
            }
        );

        if (utilisateurs.length === 0) {
            return res.status(404).json({
                message: "Utilisateur introuvable."
            });
        }

        res.json(utilisateurs[0]);

    } catch (erreur) {
        res.status(500).json({
            message: "Impossible de récupérer le profil."
        });
    }
});

module.exports = router;