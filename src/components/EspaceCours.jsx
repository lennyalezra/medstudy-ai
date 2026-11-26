import { useSearchParams } from "react-router-dom";
import { FolderOpen, Upload } from "lucide-react";

import MesCours from "./MesCours";
import ImportCourses from "./ImportCourses";

function EspaceCours() {

    const [params, setParams] = useSearchParams();

    // Je récupère mon onglet actif
    const onglet = params.get("onglet") === "importer"
        ? "importer"
        : "cours";

    // Je change mon onglet
    function changerOnglet(valeur) {

        setParams(
            valeur === "cours"
                ? {}
                : { onglet: valeur }
        );
    }

    return (
        <div className="espace-fusion">

            <div
                className="navigation-onglets"
                aria-label="Gestion des cours"
            >

                <button
                    className={onglet === "cours" ? "actif" : ""}
                    aria-pressed={onglet === "cours"}
                    onClick={() => changerOnglet("cours")}
                >

                    <FolderOpen size={18} />

                    Mes cours

                </button>

                <button
                    className={onglet === "importer" ? "actif" : ""}
                    aria-pressed={onglet === "importer"}
                    onClick={() => changerOnglet("importer")}
                >

                    <Upload size={18} />

                    Importer un PDF

                </button>

            </div>

            <div className="espace-fusion-contenu">

                {onglet === "cours" && <MesCours />}

                {onglet === "importer" && <ImportCourses />}

            </div>

        </div>
    );
}

export default EspaceCours;