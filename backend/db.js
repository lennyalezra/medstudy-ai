require("dotenv").config();

const { Sequelize } = require("sequelize");

let sequelize;

// Je me connecte à Neon en production ou pendant mes tests
if (process.env.NODE_ENV === "production" || process.env.USE_NEON === "true") {

    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL est manquante");
    }

    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: true
            }
        }
    });

} else {

    // Je me connecte à ma base locale
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            dialect: "postgres",
            logging: false
        }
    );

}

module.exports = sequelize;