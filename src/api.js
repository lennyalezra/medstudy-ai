const API = "http://localhost:3001/api";

// Je communique avec mon backend
export async function api(route, options = {}) {

    const reponse = await fetch(`${API}${route}`, {
        ...options,

        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const texte = await reponse.text();

    let donnees;

    try {
        donnees = JSON.parse(texte);
    } catch {
        donnees = texte;
    }

    if (!reponse.ok) {
        throw new Error(
            donnees?.message ||
            (typeof donnees === "string" ? donnees : "Erreur API")
        );
    }

    return donnees;
}