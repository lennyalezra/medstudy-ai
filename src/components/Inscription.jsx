import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BookOpen, User, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Inscription() {
    const { inscription, utilisateur } = useAuth();
    const navigate = useNavigate();

    const [prenom, setPrenom] = useState("");
    const [nom, setNom] = useState("");
    const [email, setEmail] = useState("");
    const [motDePasse, setMotDePasse] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [erreur, setErreur] = useState("");
    const [chargement, setChargement] = useState(false);

    // Je crée mon compte
    async function handleSubmit(e) {
        e.preventDefault();

        setErreur("");

        if (motDePasse.length < 12) {
            setErreur("Le mot de passe doit contenir au moins 12 caractères.");
            return;
        }

        if (motDePasse !== confirmation) {
            setErreur("Les mots de passe ne correspondent pas.");
            return;
        }

        setChargement(true);

        try {
            await inscription(prenom, nom, email, motDePasse);
            navigate("/", { replace: true });

        } catch (erreur) {
            setErreur(erreur.message);

        } finally {
            setChargement(false);
        }
    }

    if (utilisateur) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="auth-page">

            <div className="auth-presentation">
                <div className="auth-logo">
                    <BookOpen size={38} />
                    <h1>MedStudy AI</h1>
                </div>

                <h2>Ton nouvel espace de révision.</h2>

                <p>
                    Organise tes cours, mémorise les notions importantes
                    et suis ta progression.
                </p>

                <img
                    src="/images/medical-book.png"
                    alt="Livre de médecine"
                />
            </div>

            <div className="auth-form-container">
                <form className="auth-form" onSubmit={handleSubmit}>

                    <h2>Créer un compte</h2>
                    <p>Commence ton aventure avec MedStudy AI.</p>

                    {erreur && (
                        <div className="auth-erreur">{erreur}</div>
                    )}

                    <label htmlFor="prenom">Prénom</label>

                    <div className="auth-input">
                        <User size={20} />

                        <input
                            id="prenom"
                            placeholder="Ton prénom"
                            autoComplete="given-name"
                            value={prenom}
                            onChange={e => setPrenom(e.target.value)}
                            required
                        />
                    </div>

                    <label htmlFor="nom">Nom</label>

                    <div className="auth-input">
                        <User size={20} />

                        <input
                            id="nom"
                            placeholder="Ton nom"
                            autoComplete="family-name"
                            value={nom}
                            onChange={e => setNom(e.target.value)}
                            required
                        />
                    </div>

                    <label htmlFor="email">Adresse email</label>

                    <div className="auth-input">
                        <Mail size={20} />

                        <input
                            id="email"
                            type="email"
                            placeholder="Ton adresse email"
                            autoComplete="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <label htmlFor="motDePasse">Mot de passe</label>

                    <div className="auth-input">
                        <Lock size={20} />

                        <input
                            id="motDePasse"
                            type="password"
                            placeholder="12 caractères minimum"
                            autoComplete="new-password"
                            value={motDePasse}
                            onChange={e => setMotDePasse(e.target.value)}
                            minLength={12}
                            required
                        />
                    </div>

                    <label htmlFor="confirmation">
                        Confirmer le mot de passe
                    </label>

                    <div className="auth-input">
                        <Lock size={20} />

                        <input
                            id="confirmation"
                            type="password"
                            placeholder="Confirme ton mot de passe"
                            autoComplete="new-password"
                            value={confirmation}
                            onChange={e => setConfirmation(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        className="auth-button"
                        disabled={chargement}
                    >
                        {chargement ? "Création..." : "Créer mon compte"}
                    </button>

                    <p className="auth-switch">
                        Déjà un compte ?{" "}
                        <Link to="/connexion">Se connecter</Link>
                    </p>

                </form>
            </div>

        </div>
    );
}