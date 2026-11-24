const jwt = require("jsonwebtoken");
const sequelize = require("../db");

// Je vérifie la session de mon utilisateur
async function auth(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Connexion nécessaire."
        });
    }

    try {
        const token = authorization.slice(7);

        const session = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        if (!Number.isInteger(session.id)) {
            return res.status(401).json({
                message: "Session invalide."
            });
        }

        // Je vérifie que mon utilisateur existe
        const [utilisateurs] = await sequelize.query(
            `SELECT id, prenom, nom, email
             FROM utilisateurs
             WHERE id = :id`,
            {
                replacements: {
                    id: session.id
                }
            }
        );

        if (utilisateurs.length === 0) {
            return res.status(401).json({
                message: "Utilisateur introuvable."
            });
        }

        req.utilisateur = utilisateurs[0];

        next();

    } catch (erreur) {
        return res.status(401).json({
            message: "Session invalide ou expirée."
        });
    }
}

module.exports = auth;