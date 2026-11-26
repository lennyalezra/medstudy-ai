import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
    BookOpen,
    LayoutDashboard,
    FolderOpen,
    FileText,
    Brain,
    MessageCircle,
    Settings,
    LogOut
} from "lucide-react";

function Sidebar() {

    const navigate = useNavigate();
    const { utilisateur, deconnexion } = useAuth();

    // Je prépare mes cinq pages
    const liens = [
        {
            adresse: "/",
            titre: "Tableau de bord",
            Icone: LayoutDashboard
        },
        {
            adresse: "/cours",
            titre: "Mes cours",
            Icone: FolderOpen
        },
        {
            adresse: "/fiches",
            titre: "Fiches de révision",
            Icone: FileText
        },
        {
            adresse: "/entrainement",
            titre: "S'entraîner",
            Icone: Brain
        },
        {
            adresse: "/assistant",
            titre: "Assistant IA",
            Icone: MessageCircle
        }
    ];

    // Je récupère mes initiales
    const initiales = (
        (utilisateur?.prenom?.charAt(0) || "") +
        (utilisateur?.nom?.charAt(0) || "")
    ).toUpperCase();

    // Je ferme ma session
    function handleDeconnexion() {

        deconnexion();

        navigate("/connexion", {
            replace: true
        });
    }

    return (
        <aside className="sidebar">

            <div className="sidebar-logo">

                <BookOpen size={30} />

                <h2>MedStudy AI</h2>

            </div>

            <nav className="sidebar-nav">

                {liens.map(({ adresse, titre, Icone }) => (

                    <NavLink
                        key={adresse}
                        to={adresse}
                        end={adresse === "/"}
                        className={({ isActive }) =>
                            isActive
                                ? "sidebar-link active"
                                : "sidebar-link"
                        }
                    >

                        <Icone size={20} />

                        <span>{titre}</span>

                    </NavLink>

                ))}

            </nav>

            <div className="sidebar-footer">

                <NavLink
                    to="/parametres"
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar-profile profil-cliquable actif"
                            : "sidebar-profile profil-cliquable"
                    }
                    title="Paramètres du compte"
                >

                    <div className="sidebar-avatar">
                        {initiales || "U"}
                    </div>

                    <div className="sidebar-profile-info">

                        <strong>
                            {utilisateur?.prenom} {utilisateur?.nom}
                        </strong>

                        <p>Mon compte</p>

                    </div>

                    <Settings
                        size={18}
                        className="profil-settings"
                    />

                </NavLink>

                <button
                    className="sidebar-logout"
                    onClick={handleDeconnexion}
                >

                    <LogOut size={18} />

                    Déconnexion

                </button>

            </div>

        </aside>
    );
}

export default Sidebar;