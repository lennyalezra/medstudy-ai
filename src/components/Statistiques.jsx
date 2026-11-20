
import { useState, useEffect } from "react";
import {
    BarChart3,
    Trophy,
    Target,
    ClipboardCheck,
    Activity
} from "lucide-react";

function Statistiques() {

    // Je stocke mes résultats
    const [resultats, setResultats] = useState([]);

    // Je récupère mes quiz enregistrés
    useEffect(() => {
        const historique = JSON.parse(
            localStorage.getItem("medstudy-quiz-resultats") || "[]"
        );

        setResultats(historique);
    }, []);

    // Je calcule mes statistiques
    const quizTermines = resultats.length;

    const totalQuestions = resultats.reduce(
        (total, resultat) => total + resultat.total,
        0
    );

    const bonnesReponses = resultats.reduce(
        (total, resultat) => total + resultat.score,
        0
    );

    const tauxReussite = totalQuestions > 0
        ? Math.round((bonnesReponses / totalQuestions) * 100)
        : 0;

    // Je récupère mes cinq derniers quiz
    const derniersResultats = [...resultats]
        .reverse()
        .slice(0, 5);

    return (
        <main className="med-page">

            <div className="med-page-header">
                <div className="med-page-icon">
                    <BarChart3 size={30} />
                </div>

                <div>
                    <h1>Ma progression</h1>
                    <p>
                        Suis ton activité, tes révisions
                        et tes résultats sur MedStudy AI.
                    </p>
                </div>
            </div>

            <div className="med-stats-grid">

                <div className="med-stat-card">
                    <div className="med-stat-icon">
                        <ClipboardCheck size={25} />
                    </div>
                    <p>Quiz terminés</p>
                    <h2>{quizTermines}</h2>
                </div>

                <div className="med-stat-card">
                    <div className="med-stat-icon">
                        <Target size={25} />
                    </div>
                    <p>Questions répondues</p>
                    <h2>{totalQuestions}</h2>
                </div>

                <div className="med-stat-card">
                    <div className="med-stat-icon">
                        <Trophy size={25} />
                    </div>
                    <p>Bonnes réponses</p>
                    <h2>{bonnesReponses}</h2>
                </div>

                <div className="med-stat-card">
                    <div className="med-stat-icon">
                        <Activity size={25} />
                    </div>
                    <p>Taux de réussite</p>
                    <h2>{tauxReussite}%</h2>
                </div>

            </div>

            <div className="med-stat-panels">

                <section className="med-panel">
                    <h2>Ma réussite aux quiz</h2>

                    <div className="med-donut-wrapper">
                        <div
                            className="med-donut"
                            style={{
                                background: `conic-gradient(
                                    #9565d0 ${tauxReussite}%,
                                    #eee6f7 ${tauxReussite}%
                                )`
                            }}
                        >
                            <div>
                                <strong>{tauxReussite}%</strong>
                                <span>de réussite</span>
                            </div>
                        </div>
                    </div>

                    <p className="med-panel-description">
                        Résultat calculé à partir des quiz terminés.
                    </p>
                </section>

                <section className="med-panel">
                    <h2>Mes derniers résultats</h2>

                    {derniersResultats.length === 0 ? (
                        <div className="med-panel-empty">
                            <ClipboardCheck size={38} />
                            <p>
                                Termine ton premier quiz pour
                                voir tes résultats ici.
                            </p>
                        </div>
                    ) : (
                        <div className="med-history">
                            {derniersResultats.map((resultat) => (
                                <div
                                    className="med-history-item"
                                    key={resultat.id}
                                >
                                    <div>
                                        <h3>{resultat.titre}</h3>
                                        <p>
                                            {new Date(
                                                resultat.date
                                            ).toLocaleDateString("fr-FR")}
                                        </p>
                                    </div>

                                    <strong>
                                        {resultat.score}/{resultat.total}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </div>

            <div className="med-empty med-stats-coming">
                <BarChart3 size={35} />
                <h3>Encore plus de statistiques bientôt</h3>
                <p>
                    Le temps de révision et la progression
                    par cours seront ajoutés lorsque ces
                    activités seront enregistrées.
                </p>
            </div>

        </main>
    );
}

export default Statistiques;
