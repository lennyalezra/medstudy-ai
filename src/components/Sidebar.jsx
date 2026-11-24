import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
    BookOpen,
    LayoutDashboard,
    FolderOpen,
    Upload,
    FileText,
    Brain,
    Layers,
    BarChart3,
    Settings,
    LogOut
} from "lucide-react";

function Sidebar() {

    const navigate = useNavigate();
    const { utilisateur, deconnexion } = useAuth();

    // Je prépare mes liens de navigation
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
            adresse: "/importer",
            titre: "Importer un cours",
            Icone: Upload
        },
        {
            adresse: "/fiches",
            titre: "Fiches de révision",
            Icone: FileText
        },
        {
            adresse: "/quiz",
            titre: "Quiz / QCM",
            Icone: Brain
        },
        {
            adresse: "/flashcards",
            titre: "Mes flashcards",
            Icone: Layers
        },
        {
            adresse: "/statistiques",
            titre: "Statistiques",
            Icone: BarChart3
        },
        {
            adresse: "/parametres",
            titre: "Paramètres",
            Icone: Settings
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
        navigate("/connexion", { replace: true });
    }

    return (
        <aside className="sidebar">

            <div className="sidebar-logo">

                <BookOpen size={30} />

                <h2>MedStudy AI</h2>

            </div>

            {/* J'affiche mes liens */}
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

            {/* J'affiche mon compte */}
            <div className="sidebar-footer">

                <div className="sidebar-profile">

                    <div className="sidebar-avatar">
                        {initiales || "U"}
                    </div>

                    <div className="sidebar-profile-info">

                        <strong>
                            {utilisateur?.prenom} {utilisateur?.nom}
                        </strong>

                        <p>{utilisateur?.email}</p>

                    </div>

                </div>

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