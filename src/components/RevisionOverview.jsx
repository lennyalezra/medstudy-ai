import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

function RevisionOverview() {

    const [stats, setStats] = useState(null);
    const [revisions, setRevisions] = useState([]);
    const [erreur, setErreur] = useState("");

    const navigate = useNavigate();

    // Je récupère ma progression et mes révisions
    useEffect(() => {

        Promise.all([
            api("/statistiques"),
            api("/revisions")
        ])
            .then(([statistiques, historique]) => {
                setStats(statistiques);
                setRevisions(historique);
            })
            .catch(err => setErreur(err.message));

    }, []);

    if (erreur) {
        return <p>{erreur}</p>;
    }

    if (!stats) {
        return <p>Chargement de la progression...</p>;
    }

    // Je calcule ma progression
    const progression = stats.cours > 0
        ? Math.round(
            stats.cours_revises / stats.cours * 100
        )
        : 0;

    // Je récupère ma dernière révision
    const derniereRevision = revisions[0];

    return (
        <section className="revision-overview">

            <div className="revision-card">

                <h2>Reprendre mes révisions</h2>

                <p>Retrouve ta dernière activité.</p>

                {derniereRevision ? (
                    <>
                        <h3>
                            {derniereRevision.cours_nom}
                        </h3>

                        <p>
                            {derniereRevision.type_revision === "qcm"
                                ? "Dernier QCM réalisé"
                                : "Dernière flashcard révisée"}
                        </p>

                        <button
                            className="med-primary-btn"
                            onClick={() => navigate(
                                derniereRevision.type_revision === "qcm"
                                    ? "/quiz"
                                    : "/flashcards"
                            )}
                        >
                            Continuer mes révisions
                        </button>
                    </>
                ) : (
                    <p>Aucune révision pour le moment.</p>
                )}

            </div>

            <div className="revision-card">

                <h2>Ma progression</h2>

                <p>Suis ton avancement dans tes révisions.</p>

                <h3>{progression}%</h3>

                <div className="med-progress-track">

                    <div
                        className="med-progress-fill"
                        style={{
                            width: `${progression}%`
                        }}
                    />

                </div>

                <p>
                    {stats.cours_revises} cours révisés
                    sur {stats.cours}
                </p>

                <button
                    className="med-secondary-btn"
                    onClick={() => navigate("/statistiques")}
                >
                    Voir mes statistiques
                </button>

            </div>

        </section>
    );
}

export default RevisionOverview;