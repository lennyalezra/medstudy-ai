import { useState, useEffect } from "react";
import {
    GraduationCap,
    ClipboardList,
    Trophy,
    RotateCcw,
    ArrowRight,
    BookOpen
} from "lucide-react";
import { api } from "../api";

function QuizQCM() {

    const [cours, setCours] = useState([]);
    const [qcm, setQcm] = useState([]);
    const [coursId, setCoursId] = useState("");
    const [niveau, setNiveau] = useState("facile");
    const [nombre, setNombre] = useState(10);

    const [qcmActif, setQcmActif] = useState(null);
    const [index, setIndex] = useState(0);
    const [choix, setChoix] = useState(null);
    const [reponses, setReponses] = useState([]);
    const [resultat, setResultat] = useState(null);

    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState("");

    // Je récupère mes cours et mes QCM
    async function charger() {

        const [listeCours, listeQcm] = await Promise.all([
            api("/cours"),
            api("/qcm")
        ]);

        setCours(listeCours);
        setQcm(listeQcm);
    }

    useEffect(() => {
        charger().catch(err => setErreur(err.message));
    }, []);

    // Je génère un QCM avec l'IA
    async function generer(e) {

        e.preventDefault();
        setChargement(true);
        setErreur("");

        try {
            const nouveauQcm = await api("/qcm/generer", {
                method: "POST",
                body: JSON.stringify({
                    coursId: Number(coursId),
                    niveau,
                    nombre: Number(nombre)
                })
            });

            setQcm(anciens => [nouveauQcm, ...anciens]);

        } catch (err) {
            setErreur(err.message);
        } finally {
            setChargement(false);
        }
    }

    // Je commence mon quiz
    function commencer(quiz) {

        setQcmActif(quiz);
        setIndex(0);
        setChoix(null);
        setReponses([]);
        setResultat(null);
        setErreur("");
    }

    // Je valide ma réponse
    async function questionSuivante() {

        if (choix === null || chargement) return;

        const nouvellesReponses = [...reponses, choix];

        if (index < qcmActif.questions.length - 1) {

            setReponses(nouvellesReponses);
            setIndex(index + 1);
            setChoix(null);

        } else {

            setChargement(true);
            setErreur("");

            try {
                const donnees = await api(
                    `/qcm/${qcmActif.id}/terminer`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            reponses: nouvellesReponses
                        })
                    }
                );

                setReponses(nouvellesReponses);
                setResultat(donnees);

            } catch (err) {
                setErreur(err.message);
            } finally {
                setChargement(false);
            }
        }
    }

    // Je quitte mon quiz
    function quitter() {
        setQcmActif(null);
        setResultat(null);
        setErreur("");
    }

    // Je supprime un QCM
    async function supprimer(id) {

        if (!window.confirm(
            "Supprimer ce QCM et ses résultats ?"
        )) return;

        setChargement(true);
        setErreur("");

        try {
            await api(`/qcm/${id}`, {
                method: "DELETE"
            });

            setQcm(anciens =>
                anciens.filter(quiz => quiz.id !== id)
            );

        } catch (err) {
            setErreur(err.message);
        } finally {
            setChargement(false);
        }
    }

    const question = qcmActif?.questions[index];

    return (
        <main className="med-page">

            <div className="med-page-header">

                <div className="med-page-icon">
                    <GraduationCap size={30} />
                </div>

                <div>
                    <h1>Quiz / QCM</h1>
                    <p>Teste tes connaissances grâce à tes cours.</p>
                </div>

            </div>

            {erreur && (
                <p className="med-message med-message-erreur">
                    {erreur}
                </p>
            )}

            {!qcmActif && (
                <>

                    <div className="med-hero">

                        <div>
                            <h2>Entraîne-toi avec MedStudy AI !</h2>
                            <p>
                                Génère des QCM personnalisés
                                à partir de tes cours.
                            </p>
                        </div>

                        <ClipboardList size={65} />

                    </div>

                    <form
                        className="med-generation-form"
                        onSubmit={generer}
                    >

                        <h2>Générer un QCM avec l'IA</h2>

                        <div className="med-field">

                            <label>Choisir un cours</label>

                            <select
                                value={coursId}
                                required
                                onChange={e =>
                                    setCoursId(e.target.value)
                                }
                            >

                                <option value="">
                                    Sélectionner un cours
                                </option>

                                {cours.map(c => (
                                    <option
                                        key={c.id}
                                        value={c.id}
                                    >
                                        {c.nom}
                                    </option>
                                ))}

                            </select>

                        </div>

                        <div className="med-field">

                            <label>Niveau de difficulté</label>

                            <select
                                value={niveau}
                                onChange={e =>
                                    setNiveau(e.target.value)
                                }
                            >
                                <option value="facile">Facile</option>
                                <option value="moyen">Moyen</option>
                                <option value="difficile">Difficile</option>
                            </select>

                        </div>

                        <div className="med-field">

                            <label>Nombre de questions</label>

                            <select
                                value={nombre}
                                onChange={e =>
                                    setNombre(e.target.value)
                                }
                            >
                                {[5, 10, 15, 20].map(n => (
                                    <option key={n} value={n}>
                                        {n} questions
                                    </option>
                                ))}
                            </select>

                        </div>

                        <button
                            className="med-primary-btn"
                            disabled={chargement || !coursId}
                        >
                            {chargement
                                ? "Chargement..."
                                : "Générer mon QCM"}
                        </button>

                    </form>

                    <h2 className="med-section-title">
                        Bibliothèque de quiz
                    </h2>

                    {qcm.length === 0 && (
                        <div className="med-empty">
                            <h3>Aucun QCM disponible</h3>
                            <p>Génère ton premier QCM.</p>
                        </div>
                    )}

                    {qcm.map(quiz => (

                        <div
                            className="med-quiz-card"
                            key={quiz.id}
                        >

                            <div className="med-quiz-icon">
                                <BookOpen size={35} />
                            </div>

                            <div className="med-quiz-info">

                                <h3>{quiz.titre}</h3>

                                <p>
                                    {quiz.questions.length} questions
                                    • Niveau {quiz.niveau}
                                </p>

                            </div>

                            <button
                                className="med-primary-btn"
                                disabled={chargement}
                                onClick={() => commencer(quiz)}
                            >
                                Commencer
                                <ArrowRight size={17} />
                            </button>

                            <button
                                className="med-secondary-btn"
                                disabled={chargement}
                                onClick={() => supprimer(quiz.id)}
                            >
                                Supprimer
                            </button>

                        </div>

                    ))}

                </>
            )}

            {qcmActif && !resultat && question && (

                <div className="med-question-card">

                    <div className="med-question-top">

                        <span>{qcmActif.titre}</span>

                        <span>
                            Question {index + 1}
                            / {qcmActif.questions.length}
                        </span>

                    </div>

                    <div className="med-progress-track">

                        <div
                            className="med-progress-fill"
                            style={{
                                width: `${
                                    (index + 1) /
                                    qcmActif.questions.length * 100
                                }%`
                            }}
                        />

                    </div>

                    <h2>{question.question}</h2>

                    <div className="med-reponses">

                        {question.reponses.map((reponse, i) => (

                            <button
                                key={i}
                                disabled={chargement}
                                className={
                                    choix === i ? "selected" : ""
                                }
                                onClick={() => setChoix(i)}
                            >
                                <span>
                                    {String.fromCharCode(65 + i)}
                                </span>

                                {reponse}

                            </button>

                        ))}

                    </div>

                    <div className="med-question-footer">

                        <button
                            className="med-secondary-btn"
                            disabled={chargement}
                            onClick={quitter}
                        >
                            Quitter le quiz
                        </button>

                        <button
                            className="med-primary-btn"
                            disabled={choix === null || chargement}
                            onClick={questionSuivante}
                        >
                            {chargement
                                ? "Enregistrement..."
                                : index === qcmActif.questions.length - 1
                                    ? "Terminer"
                                    : "Question suivante"}

                            <ArrowRight size={17} />

                        </button>

                    </div>

                </div>

            )}

            {qcmActif && resultat && (

                <>

                    <div className="med-result-card">

                        <div className="med-result-icon">
                            <Trophy size={45} />
                        </div>

                        <h2>Quiz terminé !</h2>

                        <div className="med-result-score">
                            {resultat.score} / {resultat.total}
                        </div>

                        <p>
                            {resultat.pourcentage}% de bonnes réponses
                        </p>

                        <div className="med-result-actions">

                            <button
                                className="med-primary-btn"
                                onClick={() => commencer(qcmActif)}
                            >
                                <RotateCcw size={18} />
                                Recommencer
                            </button>

                            <button
                                className="med-secondary-btn"
                                onClick={quitter}
                            >
                                Retour aux quiz
                            </button>

                        </div>

                    </div>

                    <h2 className="med-section-title">
                        Correction détaillée
                    </h2>

                    {qcmActif.questions.map((q, i) => (

                        <div
                            key={i}
                            className={`correction-card ${
                                reponses[i] === q.bonneReponse
                                    ? "correction-correcte"
                                    : "correction-incorrecte"
                            }`}
                        >

                            <h3>{i + 1}. {q.question}</h3>

                            <p>
                                Ta réponse : {q.reponses[reponses[i]]}
                            </p>

                            <p>
                                Bonne réponse : {q.reponses[q.bonneReponse]}
                            </p>

                            <strong>Explication :</strong>

                            <p>{q.explication}</p>

                        </div>

                    ))}

                </>

            )}

        </main>
    );
}

export default QuizQCM;