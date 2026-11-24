import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "../api";

import {
    FileText,
    Search,
    BookOpen,
    Pencil,
    Stethoscope,
    FolderOpen,
    ArrowLeft,
    Trash2,
    Plus,
    Save,
    X,
    RefreshCw
} from "lucide-react";

function FichesRevision() {

    // Je stocke mes fiches et mes cours
    const [fiches, setFiches] = useState([]);
    const [cours, setCours] = useState([]);

    // Je gère ma recherche
    const [recherche, setRecherche] = useState("");
    const [matiereActive, setMatiereActive] = useState("Toutes");

    // Je gère mes chargements et mes messages
    const [chargement, setChargement] = useState(true);
    const [actionEnCours, setActionEnCours] = useState(false);
    const [erreur, setErreur] = useState("");
    const [succes, setSucces] = useState("");

    // Je stocke ma fiche ouverte
    const [ficheOuverte, setFicheOuverte] = useState(null);

    // Je gère mon formulaire de modification
    const [modification, setModification] = useState(false);
    const [titre, setTitre] = useState("");
    const [matiere, setMatiere] = useState("");
    const [contenu, setContenu] = useState("");

    // Je gère la génération de mes fiches
    const [afficherGeneration, setAfficherGeneration] = useState(false);
    const [coursId, setCoursId] = useState("");

    // Je récupère mes données au démarrage
    useEffect(() => {
        chargerDonnees();
    }, []);

    // Je récupère les fiches et les cours de mon compte
    async function chargerDonnees() {
        setChargement(true);
        setErreur("");

        try {
            const [donneesFiches, donneesCours] = await Promise.all([
                api("/fiches"),
                api("/cours")
            ]);

            setFiches(donneesFiches);
            setCours(donneesCours);

        } catch (erreur) {
            setErreur(erreur.message);

        } finally {
            setChargement(false);
        }
    }

    // Je récupère une de mes fiches
    async function recupererFiche(id) {
        return await api(`/fiches/${id}`);
    }

    // J'ouvre une fiche
    async function ouvrirFiche(id) {
        setActionEnCours(true);
        setErreur("");
        setSucces("");

        try {
            const fiche = await recupererFiche(id);

            setFicheOuverte(fiche);
            setModification(false);

        } catch (erreur) {
            setErreur(erreur.message);

        } finally {
            setActionEnCours(false);
        }
    }

    // Je prépare mes champs de modification
    async function modifierFiche(id) {
        setActionEnCours(true);
        setErreur("");
        setSucces("");

        try {
            const fiche = await recupererFiche(id);

            setFicheOuverte(fiche);
            setTitre(fiche.titre);
            setMatiere(fiche.matiere || "");
            setContenu(fiche.contenu);
            setModification(true);

        } catch (erreur) {
            setErreur(erreur.message);

        } finally {
            setActionEnCours(false);
        }
    }

    // J'enregistre mes modifications
    async function enregistrerFiche(e) {
        e.preventDefault();

        if (!ficheOuverte || actionEnCours) {
            return;
        }

        if (!titre.trim() || !contenu.trim()) {
            setErreur("Le titre et le contenu sont obligatoires");
            return;
        }

        setActionEnCours(true);
        setErreur("");
        setSucces("");

        try {
            const donnees = await api(
                `/fiches/${ficheOuverte.id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        titre: titre.trim(),
                        matiere: matiere.trim(),
                        contenu: contenu.trim()
                    })
                }
            );

            // Je mets à jour ma fiche ouverte
            setFicheOuverte(donnees.fiche);
            setModification(false);

            // Je mets à jour ma liste
            setFiches((anciennesFiches) =>
                anciennesFiches.map((fiche) =>
                    fiche.id === donnees.fiche.id
                        ? donnees.fiche
                        : fiche
                )
            );

            setMatiereActive("Toutes");
            setSucces("Ta fiche a bien été modifiée");

        } catch (erreur) {
            setErreur(erreur.message);

        } finally {
            setActionEnCours(false);
        }
    }

    // Je supprime une de mes fiches
    async function supprimerFiche(id) {
        if (actionEnCours) {
            return;
        }

        const confirmation = window.confirm(
            "Voulez-vous vraiment supprimer cette fiche ?"
        );

        if (!confirmation) {
            return;
        }

        setActionEnCours(true);
        setErreur("");
        setSucces("");

        try {
            await api(`/fiches/${id}`, {
                method: "DELETE"
            });

            // Je retire ma fiche de la liste
            setFiches((anciennesFiches) =>
                anciennesFiches.filter((fiche) => fiche.id !== id)
            );

            // Je ferme ma fiche si elle est ouverte
            if (ficheOuverte?.id === id) {
                setFicheOuverte(null);
                setModification(false);
            }

            setMatiereActive("Toutes");
            setSucces("Ta fiche a bien été supprimée");

        } catch (erreur) {
            setErreur(erreur.message);

        } finally {
            setActionEnCours(false);
        }
    }

    // Je génère une nouvelle fiche avec Groq
    async function genererNouvelleFiche(e) {
        e.preventDefault();

        if (actionEnCours) {
            return;
        }

        if (!coursId) {
            setErreur("Sélectionne un cours");
            return;
        }

        setActionEnCours(true);
        setErreur("");
        setSucces("");

        try {
            const donnees = await api("/fiches/generer", {
                method: "POST",
                body: JSON.stringify({
                    coursId: Number(coursId)
                })
            });

            // J'ajoute ma nouvelle fiche à la liste
            setFiches((anciennesFiches) => [
                donnees.fiche,
                ...anciennesFiches
            ]);

            setFicheOuverte(donnees.fiche);
            setModification(false);
            setAfficherGeneration(false);
            setCoursId("");
            setMatiereActive("Toutes");

            setSucces("Ta nouvelle fiche a été générée");

        } catch (erreur) {
            setErreur(erreur.message);

        } finally {
            setActionEnCours(false);
        }
    }

    // Je formate mes dates
    function formaterDate(date) {
        return new Date(date).toLocaleDateString("fr-FR");
    }

    // Je prépare mes matières
    const matieres = [
        "Toutes",
        ...new Set(
            fiches.map((fiche) =>
                fiche.matiere || "Non renseignée"
            )
        )
    ];

    // Je filtre mes fiches
    const fichesFiltrees = fiches.filter((fiche) => {

        const correspondRecherche = fiche.titre
            .toLowerCase()
            .includes(recherche.toLowerCase());

        const correspondMatiere =
            matiereActive === "Toutes" ||
            (fiche.matiere || "Non renseignée") === matiereActive;

        return correspondRecherche && correspondMatiere;
    });

    // Je prépare mes messages
    const messages = (
        <>
            {erreur && (
                <p
                    className="med-message med-message-erreur"
                    role="alert"
                >
                    {erreur}
                </p>
            )}

            {succes && (
                <p
                    className="med-message med-message-succes"
                    role="status"
                >
                    {succes}
                </p>
            )}
        </>
    );

    // J'affiche mon formulaire de modification
    if (ficheOuverte && modification) {
        return (
            <main className="med-page">

                <button
                    className="med-retour-fiche"
                    disabled={actionEnCours}
                    onClick={() => setModification(false)}
                >
                    <ArrowLeft size={18} />
                    Annuler la modification
                </button>

                <div className="med-page-header">

                    <div className="med-page-icon">
                        <Pencil size={30} />
                    </div>

                    <div>
                        <h1>Modifier ma fiche</h1>
                        <p>Personnalise ta fiche de révision.</p>
                    </div>

                </div>

                {messages}

                <form
                    className="med-edition-form"
                    onSubmit={enregistrerFiche}
                >

                    <label htmlFor="fiche-titre">
                        Titre
                    </label>

                    <input
                        id="fiche-titre"
                        type="text"
                        maxLength={255}
                        value={titre}
                        onChange={(e) => setTitre(e.target.value)}
                        disabled={actionEnCours}
                        required
                    />

                    <label htmlFor="fiche-matiere">
                        Matière
                    </label>

                    <input
                        id="fiche-matiere"
                        type="text"
                        maxLength={255}
                        value={matiere}
                        onChange={(e) => setMatiere(e.target.value)}
                        disabled={actionEnCours}
                    />

                    <label htmlFor="fiche-contenu">
                        Contenu de la fiche (Markdown)
                    </label>

                    <textarea
                        id="fiche-contenu"
                        rows={16}
                        value={contenu}
                        onChange={(e) => setContenu(e.target.value)}
                        disabled={actionEnCours}
                        required
                    />

                    <h2>Aperçu de ma fiche</h2>

                    <div className="med-fiche-contenu med-apercu">

                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {contenu}
                        </ReactMarkdown>

                    </div>

                    <div className="med-edition-actions">

                        <button
                            type="button"
                            className="med-retour-fiche"
                            disabled={actionEnCours}
                            onClick={() => setModification(false)}
                        >
                            <X size={18} />
                            Annuler
                        </button>

                        <button
                            type="submit"
                            className="med-bouton-principal"
                            disabled={actionEnCours}
                        >
                            <Save size={18} />

                            {actionEnCours
                                ? "Enregistrement..."
                                : "Enregistrer"}
                        </button>

                    </div>

                </form>

            </main>
        );
    }

    // J'affiche ma fiche ouverte
    if (ficheOuverte) {
        return (
            <main className="med-page">

                <button
                    className="med-retour-fiche"
                    disabled={actionEnCours}
                    onClick={() => {
                        setFicheOuverte(null);
                        setErreur("");
                        setSucces("");
                    }}
                >
                    <ArrowLeft size={18} />
                    Retour à mes fiches
                </button>

                <div className="med-page-header">

                    <div className="med-page-icon">
                        <BookOpen size={30} />
                    </div>

                    <div>

                        <h1>{ficheOuverte.titre}</h1>

                        <p>
                            {ficheOuverte.matiere || "Non renseignée"}
                            {" • "}
                            {formaterDate(ficheOuverte.date_creation)}
                        </p>

                    </div>

                </div>

                {messages}

                <div className="med-fiche-outils">

                    <button
                        className="med-bouton-principal"
                        disabled={actionEnCours}
                        onClick={() => modifierFiche(ficheOuverte.id)}
                    >
                        <Pencil size={17} />
                        Modifier
                    </button>

                    <button
                        className="med-bouton-danger"
                        disabled={actionEnCours}
                        onClick={() => supprimerFiche(ficheOuverte.id)}
                    >
                        <Trash2 size={17} />
                        Supprimer
                    </button>

                </div>

                <article className="med-fiche-card med-fiche-lecture">

                    <div className="med-fiche-contenu">

                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {ficheOuverte.contenu}
                        </ReactMarkdown>

                    </div>

                </article>

            </main>
        );
    }

    // J'affiche toutes mes fiches
    return (
        <main className="med-page">

            <div className="med-page-header">

                <div className="med-page-icon">
                    <FileText size={30} />
                </div>

                <div>

                    <h1>Mes fiches de révision</h1>

                    <p>
                        Retrouve toutes tes fiches de révision,
                        organisées par matière.
                    </p>

                </div>

            </div>

            {messages}

            <div className="med-fiche-outils">

                <button
                    className="med-bouton-principal"
                    disabled={actionEnCours}
                    onClick={() => {
                        setAfficherGeneration(!afficherGeneration);
                        setErreur("");
                        setSucces("");
                    }}
                >
                    <Plus size={18} />
                    Générer une fiche
                </button>

                <button
                    className="med-retour-fiche"
                    disabled={chargement || actionEnCours}
                    onClick={chargerDonnees}
                >
                    <RefreshCw size={17} />
                    Actualiser
                </button>

            </div>

            {afficherGeneration && (

                <form
                    className="med-generation-form"
                    onSubmit={genererNouvelleFiche}
                >

                    <h2>Créer une fiche avec l'IA</h2>

                    <p>
                        Choisis un cours PDF déjà importé.
                    </p>

                    <label htmlFor="cours-selection">
                        Sélectionner un cours
                    </label>

                    <select
                        id="cours-selection"
                        value={coursId}
                        onChange={(e) => setCoursId(e.target.value)}
                        disabled={actionEnCours || chargement}
                        required
                    >

                        <option value="">
                            Choisir un cours
                        </option>

                        {cours.map((unCours) => (

                            <option
                                key={unCours.id}
                                value={unCours.id}
                            >
                                {unCours.nom}
                            </option>

                        ))}

                    </select>

                    {cours.length === 0 && !chargement && (
                        <p>
                            Importe d'abord un cours pour générer une fiche.
                        </p>
                    )}

                    <button
                        type="submit"
                        className="med-bouton-principal"
                        disabled={actionEnCours || !coursId}
                    >
                        <Plus size={18} />

                        {actionEnCours
                            ? "Génération en cours..."
                            : "Générer avec l'IA"}
                    </button>

                </form>

            )}

            <div className="med-search">

                <Search size={20} />

                <input
                    type="text"
                    placeholder="Rechercher une fiche..."
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                />

            </div>

            <div className="med-filters">

                {matieres.map((uneMatiere) => (

                    <button
                        key={uneMatiere}
                        className={
                            matiereActive === uneMatiere
                                ? "active"
                                : ""
                        }
                        onClick={() => setMatiereActive(uneMatiere)}
                    >
                        {uneMatiere}
                    </button>

                ))}

            </div>

            {chargement ? (

                <div className="med-empty">
                    <h2>Chargement des fiches...</h2>
                </div>

            ) : fichesFiltrees.length === 0 ? (

                <div className="med-empty">

                    <div className="med-empty-icon">

                        {fiches.length === 0 ? (
                            <Stethoscope size={40} />
                        ) : (
                            <FolderOpen size={40} />
                        )}

                    </div>

                    <h2>
                        {erreur
                            ? "Impossible de charger les fiches"
                            : fiches.length === 0
                                ? "Tes futures fiches t'attendent !"
                                : "Aucune fiche trouvée"}
                    </h2>

                    <p>
                        {erreur
                            ? "Réessaie en actualisant la page."
                            : fiches.length === 0
                                ? "Génère ta première fiche à partir d'un cours."
                                : "Essaie une autre recherche ou une autre matière."}
                    </p>

                </div>

            ) : (

                <div className="med-fiches-grid">

                    {fichesFiltrees.map((fiche) => (

                        <article
                            className="med-fiche-card"
                            key={fiche.id}
                        >

                            <div className="med-fiche-top">

                                <div className="med-fiche-icon">
                                    <BookOpen size={27} />
                                </div>

                                <div>

                                    <h3>{fiche.titre}</h3>

                                    <p>
                                        {fiche.matiere || "Non renseignée"}
                                    </p>

                                </div>

                            </div>

                            <p className="med-fiche-date">
                                {formaterDate(fiche.date_creation)}
                            </p>

                            <div className="med-fiche-actions">

                                <button
                                    disabled={actionEnCours}
                                    onClick={() => ouvrirFiche(fiche.id)}
                                >
                                    <BookOpen size={17} />
                                    Ouvrir
                                </button>

                                <button
                                    disabled={actionEnCours}
                                    onClick={() => modifierFiche(fiche.id)}
                                >
                                    <Pencil size={17} />
                                    Modifier
                                </button>

                                <button
                                    disabled={actionEnCours}
                                    onClick={() => supprimerFiche(fiche.id)}
                                >
                                    <Trash2 size={17} />
                                    Supprimer
                                </button>

                            </div>

                        </article>

                    ))}

                </div>

            )}

        </main>
    );
}

export default FichesRevision;