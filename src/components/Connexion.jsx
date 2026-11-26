import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BookOpen, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Connexion() {
    const { connexion, utilisateur } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [motDePasse, setMotDePasse] = useState("");
    const [erreur, setErreur] = useState("");
    const [chargement, setChargement] = useState(false);

    // Je me connecte à mon compte
    async function handleSubmit(e) {
        e.preventDefault();

        setErreur("");
        setChargement(true);

        try {
            await connexion(email, motDePasse);
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

                <h2>Révise autrement.</h2>

                <p>
                    Transforme tes cours en fiches, quiz et flashcards
                    grâce à l'intelligence artificielle.
                </p>

                <img
                    src="/images/medical-book.png"
                    alt="Livre de médecine"
                />
            </div>

            <div className="auth-form-container">
                <form className="auth-form" onSubmit={handleSubmit}>

                    <h2>Bon retour !</h2>
                    <p>Connecte-toi à ton espace de révision.</p>

                    {erreur && (
                        <div className="auth-erreur">{erreur}</div>
                    )}

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
                            placeholder="Ton mot de passe"
                            autoComplete="current-password"
                            value={motDePasse}
                            onChange={e => setMotDePasse(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        className="auth-button"
                        disabled={chargement}
                    >
                        {chargement ? "Connexion..." : "Se connecter"}
                    </button>

                    <p className="auth-switch">
                        Pas encore de compte ?{" "}
                        <Link to="/inscription">Créer un compte</Link>
                    </p>

                </form>
            </div>

        </div>
    );
}