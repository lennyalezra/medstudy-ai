import { useState, useEffect } from "react";
import {
    BarChart3,
    Trophy,
    Target,
    ClipboardCheck,
    Activity,
    Layers,
    CheckCircle2
} from "lucide-react";
import { api } from "../api";

function Statistiques() {

    const [stats, setStats] = useState(null);
    const [resultats, setResultats] = useState([]);
    const [progression, setProgression] = useState([]);
    const [revisions, setRevisions] = useState([]);
    const [erreur, setErreur] = useState("");

    // Je récupère toutes mes statistiques
    useEffect(() => {

        Promise.all([
            api("/statistiques"),
            api("/resultats-qcm"),
            api("/progression"),
            api("/revisions")
        ])
            .then(([s, r, p, h]) => {

                setStats(s);
                setResultats(r);
                setProgression(p);
                setRevisions(h);

            })
            .catch(err => setErreur(err.message));

    }, []);

    if (erreur) {
        return (
            <main className="med-page">
                <p className="med-message med-message-erreur">
                    {erreur}
                </p>
            </main>
        );
    }

    if (!stats) {
        return (
            <main className="med-page">
                <p>Chargement des statistiques...</p>
            </main>
        );
    }

    // Je calcule mon taux de réussite
    const tauxReussite = stats.questions > 0
        ? Math.round(
            stats.bonnes_reponses / stats.questions * 100
        )
        : 0;

    const derniersResultats = resultats.slice(0, 10);

    const evolution = resultats.slice(0, 7).reverse();

    return (
        <main className="med-page">

            <div className="med-page-header">

                <div className="med-page-icon">
                    <BarChart3 size={30} />
                </div>

                <div>
                    <h1>Ma progression</h1>
                    <p>
                        Suis ton activité et tes résultats
                        sur MedStudy AI.
                    </p>
                </div>

            </div>

            <div className="med-stats-grid">

                <div className="med-stat-card">

                    <div className="med-stat-icon">
                        <ClipboardCheck size={25} />
                    </div>

                    <p>Quiz terminés</p>
                    <h2>{stats.quiz_termines}</h2>

                </div>

                <div className="med-stat-card">

                    <div className="med-stat-icon">
                        <Target size={25} />
                    </div>

                    <p>Questions répondues</p>
                    <h2>{stats.questions}</h2>

                </div>

                <div className="med-stat-card">

                    <div className="med-stat-icon">
                        <Trophy size={25} />
                    </div>

                    <p>Bonnes réponses</p>
                    <h2>{stats.bonnes_reponses}</h2>

                </div>

                <div className="med-stat-card">

                    <div className="med-stat-icon">
                        <Activity size={25} />
                    </div>

                    <p>Taux de réussite</p>
                    <h2>{tauxReussite}%</h2>

                </div>

                <div className="med-stat-card">

                    <div className="med-stat-icon">
                        <Layers size={25} />
                    </div>

                    <p>Flashcards créées</p>
                    <h2>{stats.flashcards}</h2>

                </div>

                <div className="med-stat-card">

                    <div className="med-stat-icon">
                        <CheckCircle2 size={25} />
                    </div>

                    <p>Cartes maîtrisées</p>
                    <h2>{stats.cartes_maitrisees}</h2>

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

                    <h2>Évolution de mes résultats</h2>

                    {evolution.length === 0 ? (

                        <div className="med-panel-empty">
                            <Activity size={35} />
                            <p>Aucun résultat pour le moment.</p>
                        </div>

                    ) : (

                        <div className="revision-graph">

                            {evolution.map(r => (

                                <div
                                    className="revision-graph-row"
                                    key={r.id}
                                >

                                    <span>
                                        {new Date(
                                            r.date_creation
                                        ).toLocaleDateString("fr-FR")}
                                    </span>

                                    <div className="med-progress-track">

                                        <div
                                            className="med-progress-fill"
                                            style={{
                                                width: `${r.pourcentage}%`
                                            }}
                                        />

                                    </div>

                                    <strong>{r.pourcentage}%</strong>

                                </div>

                            ))}

                        </div>

                    )}

                </section>

            </div>

            <h2 className="med-section-title">
                Ma progression par cours
            </h2>

            {progression.length === 0 && (
                <div className="med-empty">
                    <p>Aucun cours importé.</p>
                </div>
            )}

            <div className="revision-list">

                {progression.map(c => {

                    const taux = c.flashcards > 0
                        ? Math.round(
                            c.maitrisees / c.flashcards * 100
                        )
                        : 0;

                    return (

                        <div
                            className="progression-card"
                            key={c.id}
                        >

                            <h3>{c.nom}</h3>
                            <p>{c.matiere}</p>

                            <p>Fiches générées : {c.fiches}</p>
                            <p>Quiz terminés : {c.quiz_termines}</p>

                            <p>
                                Score moyen : {
                                    c.moyenne === null
                                        ? "Aucun quiz"
                                        : `${c.moyenne}%`
                                }
                            </p>

                            <p>
                                Flashcards maîtrisées :
                                {" "}{c.maitrisees}/{c.flashcards}
                            </p>

                            <div className="med-progress-track">

                                <div
                                    className="med-progress-fill"
                                    style={{ width: `${taux}%` }}
                                />

                            </div>

                            <strong>{taux}% des cartes maîtrisées</strong>

                        </div>

                    );
                })}

            </div>

            <section className="med-panel">

                <h2>Mes derniers résultats</h2>

                {derniersResultats.length === 0 ? (

                    <div className="med-panel-empty">
                        <ClipboardCheck size={38} />
                        <p>Termine ton premier quiz.</p>
                    </div>

                ) : (

                    <div className="med-history">

                        {derniersResultats.map(r => (

                            <div
                                className="med-history-item"
                                key={r.id}
                            >

                                <div>

                                    <h3>{r.titre}</h3>

                                    <p>
                                        Niveau {r.niveau} • {
                                            new Date(
                                                r.date_creation
                                            ).toLocaleDateString("fr-FR")
                                        }
                                    </p>

                                </div>

                                <strong>
                                    {r.score}/{r.total}
                                    {" "}({r.pourcentage}%)
                                </strong>

                            </div>

                        ))}

                    </div>

                )}

            </section>

            <section className="med-panel">

                <h2>Mon historique de révision</h2>

                {revisions.length === 0 ? (

                    <div className="med-panel-empty">
                        <Activity size={35} />
                        <p>Aucune activité enregistrée.</p>
                    </div>

                ) : (

                    <div className="med-history">

                        {revisions.map(r => (

                            <div
                                className="med-history-item"
                                key={r.id}
                            >

                                <div>

                                    <h3>{r.cours_nom}</h3>

                                    <p>
                                        {r.type_revision === "qcm"
                                            ? "QCM terminé"
                                            : "Flashcard révisée"}
                                    </p>

                                </div>

                                <span>
                                    {new Date(
                                        r.date_revision
                                    ).toLocaleString("fr-FR")}
                                </span>

                            </div>

                        ))}

                    </div>

                )}

            </section>

        </main>
    );
}

export default Statistiques;