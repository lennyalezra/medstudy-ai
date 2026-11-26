import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import "../GenerationIA.css";

function ProgressionIA({ coursId }) {

    const navigate = useNavigate();

    const [statut, setStatut] = useState(null);
    const [erreur, setErreur] = useState("");
    const [relance, setRelance] = useState(false);

    // Je récupère la progression de mon cours
    useEffect(() => {
        if (!coursId) return;

        let actif = true;
        let minuterie;

        const controller = new AbortController();

        setStatut(null);
        setErreur("");

        async function chargerStatut() {
            try {
                const donnees = await api(
                    `/cours/${coursId}/statut-ia`,
                    { signal: controller.signal }
                );

                if (!actif) return;

                setStatut(donnees);
                setErreur("");

            } catch (err) {
                if (actif) {
                    setErreur(err.message);
                }
            } finally {
                if (actif) {
                    minuterie = setTimeout(
                        chargerStatut,
                        3000
                    );
                }
            }
        }

        chargerStatut();

        return () => {
            actif = false;
            clearTimeout(minuterie);
            controller.abort();
        };

    }, [coursId]);

    // Je relance ma génération
    async function relancerGeneration() {
        setRelance(true);
        setErreur("");

        try {
            await api(
                `/cours/${coursId}/generer-fiche`,
                { method: "POST" }
            );

            const donnees = await api(
                `/cours/${coursId}/statut-ia`
            );

            setStatut(donnees);

        } catch (err) {
            setErreur(err.message);

        } finally {
            setRelance(false);
        }
    }

    if (!statut) {
        return (
            <div className="generation-ia">
                {erreur || "Récupération de la progression..."}
            </div>
        );
    }

    const progression = Math.min(
        100,
        Math.max(0, Number(statut.progression_ia) || 0)
    );

    const messages = {
        en_attente: "Fiche non générée",
        file_attente: "En attente de traitement",
        analyse: "Analyse de votre cours",
        generation: "Création de votre fiche",
        termine: "Votre fiche est disponible",
        erreur: "La génération a échoué"
    };

    const enCours = [
        "file_attente",
        "analyse",
        "generation"
    ].includes(statut.statut_ia);

    return (
        <section className="generation-ia">

            <div className="generation-ia-header">
                <h3>
                    {messages[statut.statut_ia]
                        || "Préparation de votre fiche"}
                </h3>

                {enCours && (
                    <strong>{progression} %</strong>
                )}
            </div>

            {enCours && (
                <>
                    <div
                        className="generation-ia-track"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progression}
                        aria-label="Progression de la génération"
                    >
                        <div
                            className="generation-ia-fill"
                            style={{
                                width: `${progression}%`
                            }}
                        />
                    </div>

                    <p>
                        Vous pouvez continuer à utiliser
                        MedStudy AI pendant la génération.
                    </p>
                </>
            )}

            {statut.statut_ia === "termine" &&
                statut.fiche_id && (
                    <button
                        className="generation-ia-button"
                        onClick={() =>
                            navigate(
                                `/fiches?fiche=${statut.fiche_id}`
                            )
                        }
                    >
                        Consulter ma fiche
                    </button>
                )}

            {statut.statut_ia === "erreur" && (
                <p className="generation-ia-error">
                    {statut.erreur_ia}
                </p>
            )}

            {(
                statut.statut_ia === "erreur" ||
                statut.statut_ia === "en_attente" ||
                (
                    statut.statut_ia === "termine" &&
                    !statut.fiche_id
                )
            ) && (
                <button
                    className="generation-ia-button"
                    disabled={relance}
                    onClick={relancerGeneration}
                >
                    {relance
                        ? "Lancement..."
                        : "Générer ma fiche"}
                </button>
            )}

            {erreur && (
                <p className="generation-ia-error">
                    {erreur}
                </p>
            )}

        </section>
    );
}

export default ProgressionIA;