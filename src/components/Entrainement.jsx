import { useSearchParams } from "react-router-dom";
import { Brain, Layers } from "lucide-react";

import QuizQCM from "./QuizQCM";
import Flashcards from "./Flashcards";

function Entrainement() {

    const [params, setParams] = useSearchParams();

    // Je récupère mon mode de révision
    const onglet = params.get("onglet") === "flashcards"
        ? "flashcards"
        : "qcm";

    // Je change mon mode de révision
    function changerOnglet(valeur) {

        setParams({
            onglet: valeur
        });
    }

    return (
        <div className="espace-fusion">

            <div
                className="navigation-onglets"
                aria-label="Modes de révision"
            >

                <button
                    className={onglet === "qcm" ? "actif" : ""}
                    aria-pressed={onglet === "qcm"}
                    onClick={() => changerOnglet("qcm")}
                >

                    <Brain size={18} />

                    Quiz / QCM

                </button>

                <button
                    className={
                        onglet === "flashcards" ? "actif" : ""
                    }
                    aria-pressed={onglet === "flashcards"}
                    onClick={() => changerOnglet("flashcards")}
                >

                    <Layers size={18} />

                    Flashcards

                </button>

            </div>

            <div className="espace-fusion-contenu">

                <div hidden={onglet !== "qcm"}>

                    <QuizQCM />

                </div>

                <div hidden={onglet !== "flashcards"}>

                    <Flashcards />

                </div>

            </div>

        </div>
    );
}

export default Entrainement;