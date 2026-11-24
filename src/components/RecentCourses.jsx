import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

function RecentCourses() {

    const [cours, setCours] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    const navigate = useNavigate();

    // Je récupère mes trois derniers cours
    useEffect(() => {

        api("/cours")
            .then(donnees => {
                setCours(donnees.slice(0, 3));
            })
            .catch(err => setErreur(err.message))
            .finally(() => setChargement(false));

    }, []);

    return (
        <section className="recent-courses">

            <h2>Mes cours récents</h2>

            {chargement && (
                <p>Chargement des cours...</p>
            )}

            {erreur && (
                <p>{erreur}</p>
            )}

            {!chargement && !erreur && cours.length === 0 && (
                <div className="med-empty">
                    <p>Aucun cours importé pour le moment.</p>

                    <button
                        className="med-primary-btn"
                        onClick={() => navigate("/importer")}
                    >
                        Importer un cours
                    </button>
                </div>
            )}

            {/* J'affiche mes derniers cours */}
            {cours.map(cour => (
                <button
                    key={cour.id}
                    className="course-card"
                    onClick={() => navigate("/cours")}
                >
                    <h3>{cour.nom}</h3>
                    <p>{cour.matiere}</p>
                </button>
            ))}

        </section>
    );
}

export default RecentCourses;