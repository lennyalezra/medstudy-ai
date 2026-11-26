
const sequelize = require("./db");

const {
    preparerCours,
    genererFiche
} = require("./ia");

// Je garde mes analyses en cours
const analysesEnCours = new Map();

// Je prépare ma file d'attente
let fileAttente = Promise.resolve();

// Je récupère uniquement un cours qui m'appartient
async function recupererCours(coursId, utilisateurId) {
    const [cours] = await sequelize.query(
        `SELECT id, nom, matiere, texte_pdf,
                analyse_ia, statut_ia, progression_ia
         FROM cours
         WHERE id = :coursId
         AND utilisateur_id = :utilisateurId`,
        {
            replacements: {
                coursId,
                utilisateurId
            }
        }
    );

    return cours[0];
}

// Je mets à jour la progression
async function modifierStatut(
    coursId,
    utilisateurId,
    statut,
    progression,
    erreur = null
) {
    await sequelize.query(
        `UPDATE cours
         SET statut_ia = :statut,
             progression_ia = :progression,
             erreur_ia = :erreur
         WHERE id = :coursId
         AND utilisateur_id = :utilisateurId`,
        {
            replacements: {
                coursId,
                utilisateurId,
                statut,
                progression,
                erreur
            }
        }
    );
}

// Je récupère ou crée mon analyse
async function analyserCours(
    coursId,
    utilisateurId,
    suivreProgression = false
) {
    const cours = await recupererCours(
        coursId,
        utilisateurId
    );

    if (!cours) {
        throw new Error("Cours introuvable");
    }

    // Je réutilise mon analyse si elle existe
    if (cours.analyse_ia?.trim()) {
        return cours.analyse_ia;
    }

    if (!cours.texte_pdf?.trim()) {
        throw new Error(
            "Ce cours ne contient aucun texte exploitable"
        );
    }

    const cle = `${utilisateurId}:${coursId}`;

    // J'évite d'analyser deux fois le même cours
    if (analysesEnCours.has(cle)) {
        return analysesEnCours.get(cle);
    }

    const analyse = (async () => {
        const texte = await preparerCours(
            cours.texte_pdf,
            async progression => {
                if (suivreProgression) {
                    await modifierStatut(
                        coursId,
                        utilisateurId,
                        "analyse",
                        progression
                    );
                }
            }
        );

        // Je sauvegarde mon analyse
        await sequelize.query(
            `UPDATE cours
             SET analyse_ia = :texte,
                 date_analyse = CURRENT_TIMESTAMP
             WHERE id = :coursId
             AND utilisateur_id = :utilisateurId`,
            {
                replacements: {
                    coursId,
                    utilisateurId,
                    texte
                }
            }
        );

        return texte;
    })();

    analysesEnCours.set(cle, analyse);

    try {
        return await analyse;
    } finally {
        analysesEnCours.delete(cle);
    }
}

// Je crée automatiquement ma fiche
async function creerFicheAutomatique(
    coursId,
    utilisateurId
) {
    try {
        const cours = await recupererCours(
            coursId,
            utilisateurId
        );

        if (!cours) {
            return;
        }

        // Je vérifie si ma fiche existe déjà
        const [fiches] = await sequelize.query(
            `SELECT f.id
             FROM fiches f
             JOIN cours c ON c.id = f.cours_id
             WHERE f.cours_id = :coursId
             AND c.utilisateur_id = :utilisateurId
             AND f.automatique = TRUE`,
            {
                replacements: {
                    coursId,
                    utilisateurId
                }
            }
        );

        if (fiches.length > 0) {
            await modifierStatut(
                coursId,
                utilisateurId,
                "termine",
                100
            );

            return;
        }

        await modifierStatut(
            coursId,
            utilisateurId,
            "analyse",
            5
        );

        console.log(
            `Analyse automatique du cours ${coursId}`
        );

        const analyse = await analyserCours(
            coursId,
            utilisateurId,
            true
        );

        await modifierStatut(
            coursId,
            utilisateurId,
            "generation",
            90
        );

        // Je génère ma fiche avec le cache
        const contenu = await genererFiche(analyse);

        // J'enregistre ma fiche et son statut
        await sequelize.transaction(async transaction => {
            await sequelize.query(
                `INSERT INTO fiches
                 (
                    cours_id,
                    titre,
                    matiere,
                    contenu,
                    automatique
                 )
                 SELECT
                    id,
                    :titre,
                    matiere,
                    :contenu,
                    TRUE
                 FROM cours
                 WHERE id = :coursId
                 AND utilisateur_id = :utilisateurId
                 ON CONFLICT (cours_id)
                 WHERE automatique = TRUE
                 DO NOTHING`,
                {
                    replacements: {
                        coursId,
                        utilisateurId,
                        titre: (
                            "Fiche - " + cours.nom
                        ).slice(0, 255),
                        contenu
                    },
                    transaction
                }
            );

            await sequelize.query(
                `UPDATE cours
                 SET statut_ia = 'termine',
                     progression_ia = 100,
                     erreur_ia = NULL
                 WHERE id = :coursId
                 AND utilisateur_id = :utilisateurId`,
                {
                    replacements: {
                        coursId,
                        utilisateurId
                    },
                    transaction
                }
            );
        });

        console.log(
            `Fiche automatique terminée : cours ${coursId}`
        );

    } catch (erreur) {
        console.error(
            `Erreur de génération du cours ${coursId} :`,
            erreur.message
        );

        try {
            await modifierStatut(
                coursId,
                utilisateurId,
                "erreur",
                0,
                "La génération a échoué. Veuillez réessayer."
            );
        } catch (erreurStatut) {
            console.error(erreurStatut.message);
        }
    }
}

// J'ajoute mes cours à la file d'attente
async function lancerGeneration(
    coursId,
    utilisateurId
) {
    const [cours] = await sequelize.query(
        `UPDATE cours
         SET statut_ia = 'file_attente',
             progression_ia = 0,
             erreur_ia = NULL
         WHERE id = :coursId
         AND utilisateur_id = :utilisateurId
         AND statut_ia IN ('en_attente', 'erreur')
         RETURNING id`,
        {
            replacements: {
                coursId,
                utilisateurId
            }
        }
    );

    if (!cours.length) {
        return false;
    }

    fileAttente = fileAttente
        .catch(erreur => console.error(erreur.message))
        .then(() =>
            creerFicheAutomatique(
                coursId,
                utilisateurId
            )
        );

    return true;
}

// J'exporte mes fonctions
module.exports = {
    analyserCours,
    lancerGeneration
};
