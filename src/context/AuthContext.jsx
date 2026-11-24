import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [utilisateur, setUtilisateur] = useState(null);
    const [chargement, setChargement] = useState(true);

    // Je vérifie si ma session existe
    useEffect(() => {
        async function verifierSession() {
            const token = sessionStorage.getItem("medstudy-token");

            if (!token) {
                setChargement(false);
                return;
            }

            try {
                const profil = await api("/auth/profil");
                setUtilisateur(profil);

            } catch {
                sessionStorage.removeItem("medstudy-token");

            } finally {
                setChargement(false);
            }
        }

        verifierSession();
    }, []);

    // Je connecte mon utilisateur
    async function connexion(email, motDePasse) {
        const donnees = await api("/auth/connexion", {
            method: "POST",
            body: JSON.stringify({ email, motDePasse })
        });

        sessionStorage.setItem("medstudy-token", donnees.token);
        setUtilisateur(donnees.utilisateur);
    }

    // Je crée mon compte
    async function inscription(prenom, nom, email, motDePasse) {
        const donnees = await api("/auth/inscription", {
            method: "POST",
            body: JSON.stringify({
                prenom,
                nom,
                email,
                motDePasse
            })
        });

        sessionStorage.setItem("medstudy-token", donnees.token);
        setUtilisateur(donnees.utilisateur);
    }

    // Je ferme ma session
    function deconnexion() {
        sessionStorage.removeItem("medstudy-token");
        setUtilisateur(null);
    }

    return (
        <AuthContext.Provider
            value={{
                utilisateur,
                chargement,
                connexion,
                inscription,
                deconnexion
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}