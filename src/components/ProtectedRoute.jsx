import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
    const { utilisateur, chargement } = useAuth();

    // J'attends la vérification de ma session
    if (chargement) {
        return (
            <div className="auth-loading">
                Chargement...
            </div>
        );
    }

    // Je redirige si je ne suis pas connecté
    if (!utilisateur) {
        return <Navigate to="/connexion" replace />;
    }

    return children;
}