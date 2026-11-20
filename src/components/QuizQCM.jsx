
import { useState } from "react";
import {
    GraduationCap,
    ClipboardList,
    CheckCircle2,
    Trophy,
    RotateCcw,
    ArrowRight,
    BookOpen
} from "lucide-react";

// Je prépare des questions pour tester mon quiz
const questionsDemo = [
    {
        id: 1,
        question: "Quel organe permet de faire circuler le sang ?",
        reponses: [
            "Les poumons",
            "Le cœur",
            "Le foie",
            "Les reins"
        ],
        bonneReponse: 1
    },
    {
        id: 2,
        question: "Quel organe permet les échanges gazeux ?",
        reponses: [
            "L'estomac",
            "Le cerveau",
            "Les poumons",
            "Le pancréas"
        ],
        bonneReponse: 2
    },
    {
        id: 3,
        question: "Quel système comprend le cerveau et la moelle épinière ?",
        reponses: [
            "Le système digestif",
            "Le système nerveux",
            "Le système respiratoire",
            "Le système musculaire"
        ],
        bonneReponse: 1
    },
    {
        id: 4,
        question: "Quel organe filtre le sang pour produire l'urine ?",
        reponses: [
            "Le rein",
            "Le cœur",
            "Le poumon",
            "L'intestin"
        ],
        bonneReponse: 0
    },
    {
        id: 5,
        question: "Quelle partie du sang transporte principalement l'oxygène ?",
        reponses: [
            "Les plaquettes",
            "Le plasma uniquement",
            "Les globules rouges",
            "Les globules blancs"
        ],
        bonneReponse: 2
    }
];

function QuizQCM() {

    // Je gère les étapes du quiz
    const [quizCommence, setQuizCommence] = useState(false);
    const [quizTermine, setQuizTermine] = useState(false);

    // Je garde la question et la réponse choisie
    const [questionActuelle, setQuestionActuelle] = useState(0);
    const [reponseChoisie, setReponseChoisie] = useState(null);

    // Je garde mon score
    const [score, setScore] = useState(0);

    const question = questionsDemo[questionActuelle];

    // Je commence un nouveau quiz
    function commencerQuiz() {
        setQuizCommence(true);
        setQuizTermine(false);
        setQuestionActuelle(0);
        setReponseChoisie(null);
        setScore(0);
    }

    // Je valide ma réponse et passe à la suite
    function questionSuivante() {

        if (reponseChoisie === null) {
            return;
        }

        const bonneReponse =
            reponseChoisie === question.bonneReponse;

        const nouveauScore = score + (bonneReponse ? 1 : 0);

        setScore(nouveauScore);

        if (questionActuelle < questionsDemo.length - 1) {
            setQuestionActuelle(questionActuelle + 1);
            setReponseChoisie(null);
        } else {

            // J'enregistre mon résultat dans le navigateur
            const historique = JSON.parse(
                localStorage.getItem("medstudy-quiz-resultats") || "[]"
            );

            historique.push({
                id: Date.now(),
                titre: "Quiz de démonstration",
                score: nouveauScore,
                total: questionsDemo.length,
                date: new Date().toISOString()
            });

            localStorage.setItem(
                "medstudy-quiz-resultats",
                JSON.stringify(historique)
            );

            setQuizTermine(true);
        }
    }

    return (
        <main className="med-page">

            <div className="med-page-header">
                <div className="med-page-icon">
                    <GraduationCap size={30} />
                </div>

                <div>
                    <h1>Quiz / QCM</h1>
                    <p>
                        Teste tes connaissances, entraîne-toi
                        et suis ta progression.
                    </p>
                </div>
            </div>

            {!quizCommence && (
                <>
                    <div className="med-hero">
                        <div>
                            <h2>Entraîne-toi avec MedStudy AI !</h2>
                            <p>
                                Révise à ton rythme et teste tes
                                connaissances grâce aux quiz.
                            </p>
                        </div>

                        <ClipboardList size={65} />
                    </div>

                    <h2 className="med-section-title">
                        Bibliothèque de quiz
                    </h2>

                    <div className="med-quiz-card">
                        <div className="med-quiz-icon">
                            <BookOpen size={35} />
                        </div>

                        <div className="med-quiz-info">
                            <h3>Quiz de démonstration</h3>
                            <p>
                                5 questions • Niveau débutant
                            </p>
                            <span>
                                Pour découvrir le fonctionnement des QCM
                            </span>
                        </div>

                        <button
                            className="med-primary-btn"
                            onClick={commencerQuiz}
                        >
                            Commencer
                            <ArrowRight size={17} />
                        </button>
                    </div>

                    <div className="med-empty med-quiz-coming">
                        <GraduationCap size={36} />

                        <h3>Les quiz de tes cours arrivent bientôt</h3>

                        <p>
                            Les prochains quiz seront créés à partir
                            des documents que tu importes.
                        </p>
                    </div>
                </>
            )}

            {quizCommence && !quizTermine && (
                <div className="med-question-card">

                    <div className="med-question-top">
                        <span>Quiz de démonstration</span>

                        <span>
                            Question {questionActuelle + 1}
                            / {questionsDemo.length}
                        </span>
                    </div>

                    <div className="med-progress-track">
                        <div
                            className="med-progress-fill"
                            style={{
                                width: `${
                                    ((questionActuelle + 1) /
                                        questionsDemo.length) * 100
                                }%`
                            }}
                        />
                    </div>

                    <h2>{question.question}</h2>

                    <div className="med-reponses">
                        {question.reponses.map((reponse, index) => (
                            <button
                                key={index}
                                className={
                                    reponseChoisie === index
                                        ? "selected"
                                        : ""
                                }
                                onClick={() => setReponseChoisie(index)}
                            >
                                <span>{String.fromCharCode(65 + index)}</span>
                                {reponse}
                            </button>
                        ))}
                    </div>

                    <div className="med-question-footer">
                        <button
                            className="med-secondary-btn"
                            onClick={() => {
                                setQuizCommence(false);
                            }}
                        >
                            Quitter le quiz
                        </button>

                        <button
                            className="med-primary-btn"
                            disabled={reponseChoisie === null}
                            onClick={questionSuivante}
                        >
                            {questionActuelle === questionsDemo.length - 1
                                ? "Terminer"
                                : "Question suivante"}
                            <ArrowRight size={17} />
                        </button>
                    </div>

                </div>
            )}

            {quizCommence && quizTermine && (
                <div className="med-result-card">

                    <div className="med-result-icon">
                        <Trophy size={45} />
                    </div>

                    <h2>Quiz terminé !</h2>

                    <p>Voici ton résultat :</p>

                    <div className="med-result-score">
                        {score} / {questionsDemo.length}
                    </div>

                    <p>
                        {Math.round(
                            (score / questionsDemo.length) * 100
                        )}% de bonnes réponses
                    </p>

                    <div className="med-result-actions">
                        <button
                            className="med-primary-btn"
                            onClick={commencerQuiz}
                        >
                            <RotateCcw size={18} />
                            Recommencer
                        </button>

                        <button
                            className="med-secondary-btn"
                            onClick={() => {
                                setQuizCommence(false);
                                setQuizTermine(false);
                            }}
                        >
                            <CheckCircle2 size={18} />
                            Retour aux quiz
                        </button>
                    </div>

                </div>
            )}

        </main>
    );
}

export default QuizQCM;
