
const Groq = require("groq-sdk");

// Je prépare la connexion à mon IA
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Je crée ma fonction pour générer les fiches
async function genererFiche(texteCours) {

    // Je vérifie que mon cours contient du texte
    if (!texteCours || !texteCours.trim()) {
        throw new Error("Le cours est vide");
    }

    // Je demande à l'IA de créer une fiche
    const reponse = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",

        messages: [
            {
                role: "system",
                content: `
Tu es un assistant pédagogique spécialisé dans les études médicales.

Ta mission est de transformer un cours en fiche de révision.

Respecte ces règles :
- Écris uniquement en français.
- Donne un titre clair.
- Organise la fiche avec des titres et sous-titres.
- Résume les notions importantes.
- Explique les termes médicaux complexes.
- Ajoute les définitions essentielles.
- Utilise des listes pour faciliter la mémorisation.
- Termine par une section "À retenir".
- Reste fidèle au cours fourni.
- N'invente aucune information médicale.
- Si une information est absente ou incertaine, signale-le.
- Ne donne pas de conseils médicaux personnalisés.

Retourne la fiche au format Markdown.
`
            },
            {
                role: "user",
                content: `Génère une fiche de révision à partir de ce cours :\n\n${texteCours}`
            }
        ],

        temperature: 0.3,
        max_completion_tokens: 3000
    });

    // Je récupère le texte généré par l'IA
    const fiche = reponse.choices[0]?.message?.content;

    // Je vérifie que l'IA a bien répondu
    if (!fiche) {
        throw new Error("L'IA n'a pas généré de fiche");
    }

    // Je retourne ma fiche
    return fiche;
}

// J'exporte ma fonction
module.exports = { genererFiche };
