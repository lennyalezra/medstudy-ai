import { useState, useEffect } from "react";
import { Layers, RotateCcw } from "lucide-react";
import { api } from "../api";

function Flashcards() {

    const [cours, setCours] = useState([]);
    const [cartes, setCartes] = useState([]);
    const [coursId, setCoursId] = useState("");
    const [nombre, setNombre] = useState(10);
    const [filtre, setFiltre] = useState("toutes");
    const [index, setIndex] = useState(0);
    const [retournee, setRetournee] = useState(false);
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState("");

    // Je récupère mes cours et mes cartes
    async function charger() {
        const [listeCours, listeCartes] = await Promise.all([
            api("/cours"),
            api("/flashcards")
        ]);

        setCours(listeCours);
        setCartes(listeCartes);
    }

    useEffect(() => {
        charger().catch(err => setErreur(err.message));
    }, []);

    // Je filtre mes cartes
    const cartesFiltrees = cartes.filter(carte => {

        const bonCours = !coursId ||
            carte.cours_id === Number(coursId);

        const bonFiltre =
            filtre === "toutes" ||
            (filtre === "maitrisees" && carte.maitrisee) ||
            (filtre === "revoir" && !carte.maitrisee);

        return bonCours && bonFiltre;
    });

    const carte = cartesFiltrees[index];

    const maitrisees = cartes.filter(
        carte => carte.maitrisee
    ).length;

    // Je génère mes nouvelles cartes
    async function generer(e) {

        e.preventDefault();
        setErreur("");
        setChargement(true);

        try {
            await api("/flashcards/generer", {
                method: "POST",
                body: JSON.stringify({
                    coursId: Number(coursId),
                    nombre: Number(nombre)
                })
            });

            await charger();

            setFiltre("toutes");
            setIndex(0);
            setRetournee(false);

        } catch (err) {
            setErreur(err.message);
        } finally {
            setChargement(false);
        }
    }

    // Je change de carte
    function changerCarte(direction) {

        if (!cartesFiltrees.length) return;

        setIndex(
            (index + direction + cartesFiltrees.length)
            % cartesFiltrees.length
        );

        setRetournee(false);
    }

    // J'enregistre ma mémorisation
    async function enregistrer(maitrisee) {

        if (!carte || chargement) return;

        setChargement(true);
        setErreur("");

        try {
            const resultat = await api(
                `/flashcards/${carte.id}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ maitrisee })
                }
            );

            setCartes(anciennes =>
                anciennes.map(c =>
                    c.id === carte.id
                        ? { ...c, ...resultat }
                        : c
                )
            );

            const quitteFiltre =
                (filtre === "revoir" && maitrisee) ||
                (filtre === "maitrisees" && !maitrisee);

            if (quitteFiltre) {
                setIndex(0);
            } else {
                changerCarte(1);
            }

            setRetournee(false);

        } catch (err) {
            setErreur(err.message);
        } finally {
            setChargement(false);
        }
    }

    // Je supprime une carte
    async function supprimer() {

        if (!carte || chargement) return;

        if (!window.confirm("Supprimer cette flashcard ?")) {
            return;
        }

        setChargement(true);
        setErreur("");

        try {
            await api(`/flashcards/${carte.id}`, {
                method: "DELETE"
            });

            setCartes(anciennes =>
                anciennes.filter(c => c.id !== carte.id)
            );

            setIndex(0);
            setRetournee(false);

        } catch (err) {
            setErreur(err.message);
        } finally {
            setChargement(false);
        }
    }

    return (
        <main className="med-page">

            <div className="med-page-header">
                <div className="med-page-icon">
                    <Layers size={30} />
                </div>

                <div>
                    <h1>Mes flashcards</h1>
                    <p>Mémorise les notions importantes de tes cours.</p>
                </div>
            </div>

            <div className="med-stats-grid">

                <div className="med-stat-card">
                    <p>Cartes créées</p>
                    <h2>{cartes.length}</h2>
                </div>

                <div className="med-stat-card">
                    <p>Cartes maîtrisées</p>
                    <h2>{maitrisees}</h2>
                </div>

                <div className="med-stat-card">
                    <p>Cartes à revoir</p>
                    <h2>{cartes.length - maitrisees}</h2>
                </div>

            </div>

            <form
                className="med-generation-form"
                onSubmit={generer}
            >

                <h2>Générer des flashcards avec l'IA</h2>

                <div className="med-field">
                    <label>Choisir un cours</label>

                    <select
                        value={coursId}
                        required
                        disabled={chargement}
                        onChange={e => {
                            setCoursId(e.target.value);
                            setIndex(0);
                            setRetournee(false);
                        }}
                    >
                        <option value="">
                            Sélectionner un cours
                        </option>

                        {cours.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.nom}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="med-field">
                    <label>Nombre de flashcards</label>

                    <select
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                    >
                        {[5, 10, 15, 20].map(n => (
                            <option key={n} value={n}>
                                {n} flashcards
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
                        : "Générer mes flashcards"}
                </button>

            </form>

            {erreur && (
                <p className="med-message med-message-erreur">
                    {erreur}
                </p>
            )}

            <h2 className="med-section-title">
                Réviser mes flashcards
            </h2>

            <div className="med-filters">

                {[
                    ["toutes", "Toutes"],
                    ["maitrisees", "Maîtrisées"],
                    ["revoir", "À revoir"]
                ].map(([valeur, texte]) => (
                    <button
                        key={valeur}
                        disabled={chargement}
                        className={
                            filtre === valeur
                                ? "med-primary-btn"
                                : "med-secondary-btn"
                        }
                        onClick={() => {
                            setFiltre(valeur);
                            setIndex(0);
                            setRetournee(false);
                        }}
                    >
                        {texte}
                    </button>
                ))}

            </div>

            {carte ? (
                <section className="flashcard-session">

                    <p>
                        Carte {index + 1} / {cartesFiltrees.length}
                    </p>

                    <button
                        className={`flashcard ${
                            retournee ? "flashcard-retournee" : ""
                        }`}
                        onClick={() => setRetournee(!retournee)}
                    >

                        <span>{carte.cours_nom}</span>

                        <h3>
                            {retournee ? "Réponse" : "Question"}
                        </h3>

                        <p>
                            {retournee
                                ? carte.reponse
                                : carte.question}
                        </p>

                        <small>
                            <RotateCcw size={16} />
                            Clique pour retourner la carte
                        </small>

                    </button>

                    <div className="flashcard-actions">

                        <button
                            className="med-secondary-btn"
                            disabled={!retournee || chargement}
                            onClick={() => enregistrer(false)}
                        >
                            À revoir
                        </button>

                        <button
                            className="med-primary-btn"
                            disabled={!retournee || chargement}
                            onClick={() => enregistrer(true)}
                        >
                            Je maîtrise
                        </button>

                    </div>

                    <div className="flashcard-actions">

                        <button
                            className="med-secondary-btn"
                            disabled={chargement}
                            onClick={() => changerCarte(-1)}
                        >
                            Précédente
                        </button>

                        <button
                            className="med-secondary-btn"
                            disabled={chargement}
                            onClick={() => changerCarte(1)}
                        >
                            Suivante
                        </button>

                        <button
                            className="med-secondary-btn"
                            disabled={chargement}
                            onClick={supprimer}
                        >
                            Supprimer
                        </button>

                    </div>

                </section>
            ) : (
                <div className="med-empty">
                    <Layers size={35} />
                    <h3>Aucune flashcard disponible</h3>
                    <p>Génère des cartes ou change ton filtre.</p>
                </div>
            )}

        </main>
    );
}

export default Flashcards;