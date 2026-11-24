import { useState, useEffect } from "react";
import { api } from "../api";

function StatCards() {

    const [stats, setStats] = useState(null);
    const [erreur, setErreur] = useState("");

    // Je récupère mes statistiques
    useEffect(() => {

        api("/statistiques")
            .then(setStats)
            .catch(err => setErreur(err.message));

    }, []);

    if (erreur) {
        return <p>{erreur}</p>;
    }

    if (!stats) {
        return <p>Chargement des statistiques...</p>;
    }

    return (
        <section className="stats-container">

            <div className="stat-card">
                <h3>Cours importés</h3>
                <p>{stats.cours}</p>
            </div>

            <div className="stat-card">
                <h3>Fiches générées</h3>
                <p>{stats.fiches}</p>
            </div>

            <div className="stat-card">
                <h3>Quiz réalisés</h3>
                <p>{stats.quiz_termines}</p>
            </div>

            <div className="stat-card">
                <h3>Flashcards créées</h3>
                <p>{stats.flashcards}</p>
            </div>

            <div className="stat-card">
                <h3>Cartes maîtrisées</h3>
                <p>{stats.cartes_maitrisees}</p>
            </div>

            <div className="stat-card">
                <h3>Score moyen</h3>
                <p>{stats.moyenne}%</p>
            </div>

        </section>
    );
}

export default StatCards;