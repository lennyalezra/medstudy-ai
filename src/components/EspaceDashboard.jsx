import { useSearchParams } from "react-router-dom";
import { LayoutDashboard, BarChart3 } from "lucide-react";

import Dashboard from "./Dashboard";
import Statistiques from "./Statistiques";

function EspaceDashboard() {

    const [params, setParams] = useSearchParams();

    // Je récupère mon onglet actif
    const onglet = params.get("onglet") === "statistiques"
        ? "statistiques"
        : "accueil";

    // Je change ma vue
    function changerOnglet(valeur) {

        setParams(
            valeur === "accueil"
                ? {}
                : { onglet: valeur }
        );
    }

    return (
        <div className="espace-fusion">

            <div
                className="navigation-onglets"
                aria-label="Tableau de bord"
            >

                <button
                    className={onglet === "accueil" ? "actif" : ""}
                    aria-pressed={onglet === "accueil"}
                    onClick={() => changerOnglet("accueil")}
                >

                    <LayoutDashboard size={18} />

                    Vue d'ensemble

                </button>

                <button
                    className={
                        onglet === "statistiques" ? "actif" : ""
                    }
                    aria-pressed={onglet === "statistiques"}
                    onClick={() => changerOnglet("statistiques")}
                >

                    <BarChart3 size={18} />

                    Ma progression

                </button>

            </div>

            <div className="espace-fusion-contenu">

                {onglet === "accueil" && <Dashboard />}

                {onglet === "statistiques" && <Statistiques />}

            </div>

        </div>
    );
}

export default EspaceDashboard;