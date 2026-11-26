// Je récupère l'adresse de mon backend
const API = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:3001/api"
).replace(/\/+$/, "");

// Je prépare mes requêtes avec mon token
async function envoyerRequete(route, options = {}) {
    const token = sessionStorage.getItem("medstudy-token");
    const headers = new Headers(options.headers);

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const reponse = await fetch(`${API}${route}`, {
        ...options,
        headers
    });

    // Je récupère les erreurs de mon serveur
    if (!reponse.ok) {
        const texte = await reponse.text();

        let message = texte || "Erreur API";

        try {
            const donnees = JSON.parse(texte);
            message = donnees.message || message;
        } catch {
            // Je conserve le message original
        }

        throw new Error(message);
    }

    return reponse;
}

// Je récupère mes données
export async function api(route, options = {}) {
    const reponse = await envoyerRequete(route, options);
    const texte = await reponse.text();

    if (!texte) {
        return null;
    }

    try {
        return JSON.parse(texte);
    } catch {
        return texte;
    }
}

// Je récupère mes fichiers PDF
export async function apiBlob(route, options = {}) {
    const reponse = await envoyerRequete(route, options);

    return await reponse.blob();
}