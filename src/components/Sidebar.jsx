
import { NavLink } from "react-router-dom";

function Sidebar() {
    return (
        <aside className="sidebar">

            {/* J'affiche le nom de mon application */}
            <h2 className="sidebar-logo">MedStudy AI</h2>

            {/* Je relie mes boutons aux différentes pages */}
            <nav className="sidebar-nav">

                <NavLink to="/" end>
                    Mon tableau de bord
                </NavLink>

                <NavLink to="/cours">
                    Mes cours
                </NavLink>

                <NavLink to="/importer">
                    Importer mes cours
                </NavLink>

                <NavLink to="/fiches">
                    Fiches de révision
                </NavLink>

                <NavLink to="/quiz">
                    Quiz / QCM
                </NavLink>

                <NavLink to="/statistiques">
                    Statistiques
                </NavLink>

                <NavLink to="/parametres">
                    Paramètres
                </NavLink>

            </nav>
        </aside>
    );
}

export default Sidebar;
