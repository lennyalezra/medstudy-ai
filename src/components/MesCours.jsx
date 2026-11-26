import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    FileText,
    Folder,
    Star,
    Plus,
    Pencil,
    Trash2,
    X
} from "lucide-react";

import { api, apiBlob } from "../api";
import ProgressionIA from "./ProgressionIA";
import "../MesCours.css";

function MesCours() {

    const navigate = useNavigate();

    const [cours, setCours] = useState([]);
    const [recherche, setRecherche] = useState("");
    const [filtre, setFiltre] = useState("tous");

    const [coursSelectionne, setCoursSelectionne] = useState(null);
    const [onglet, setOnglet] = useState("pdf");
    const [urlPDF, setUrlPDF] = useState("");

    const [chargement, setChargement] = useState(true);
    const [chargementPDF, setChargementPDF] = useState(false);
    const [actionEnCours, setActionEnCours] = useState(false);
    const [erreur, setErreur] = useState("");

    const [coursModifie, setCoursModifie] = useState(null);
    const [nom, setNom] = useState("");
    const [dossier, setDossier] = useState("");

    // Je récupère mes cours et leur organisation
    async function chargerCours(signal) {

        const [liste, organisation] = await Promise.all([
            api("/cours", { signal }),
            api("/plus", { signal })
        ]);

        if (signal?.aborted) return;

        const informations = new Map(
            organisation.cours.map(c => [String(c.id), c])
        );

        setCours(liste.map(c => {

            const info = informations.get(String(c.id));

            return {
                ...c,
                dossier: info?.dossier || "",
                favori: !!info?.favori
            };
        }));
    }

    // J'actualise mes cours
    useEffect(() => {

        const controller = new AbortController();
        let minuterie;

        async function actualiser() {

            try {
                await chargerCours(controller.signal);

            } catch (err) {
                if (!controller.signal.aborted) {
                    setErreur(err.message);
                }

            } finally {
                if (!controller.signal.aborted) {
                    setChargement(false);

                    minuterie = setTimeout(
                        actualiser,
                        5000
                    );
                }
            }
        }

        actualiser();

        return () => {
            controller.abort();
            clearTimeout(minuterie);
        };

    }, []);

    // Je récupère mon PDF
    useEffect(() => {

        setUrlPDF("");

        if (!coursSelectionne || onglet !== "pdf") {
            setChargementPDF(false);
            return;
        }

        const controller = new AbortController();
        let url = "";

        async function chargerPDF() {

            setChargementPDF(true);

            try {

                const fichier = await apiBlob(
                    `/cours/${coursSelectionne}`,
                    { signal: controller.signal }
                );

                if (controller.signal.aborted) return;

                url = URL.createObjectURL(fichier);

                setUrlPDF(url);

            } catch (err) {

                if (!controller.signal.aborted) {
                    setErreur(err.message);
                }

            } finally {

                if (!controller.signal.aborted) {
                    setChargementPDF(false);
                }
            }
        }

        chargerPDF();

        return () => {

            controller.abort();

            if (url) {
                URL.revokeObjectURL(url);
            }
        };

    }, [coursSelectionne, onglet]);

    // Je modifie les informations de mon cours
    async function modifierCours(c, modifications) {

        if (actionEnCours) return false;

        setActionEnCours(true);
        setErreur("");

        try {

            await api(`/plus/cours/${c.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    nom: c.nom,
                    dossier: c.dossier || "",
                    favori: !!c.favori,
                    ...modifications
                })
            });

            await chargerCours();

            return true;

        } catch (err) {

            setErreur(err.message);
            return false;

        } finally {

            setActionEnCours(false);
        }
    }

    // Je prépare mon formulaire
    function ouvrirModification(c) {

        setCoursModifie(c);
        setNom(c.nom);
        setDossier(c.dossier || "");
        setErreur("");
    }

    // J'enregistre mes modifications
    async function enregistrerModification(e) {

        e.preventDefault();

        if (!coursModifie || !nom.trim()) return;

        const resultat = await modifierCours(
            coursModifie,
            {
                nom: nom.trim(),
                dossier: dossier.trim()
            }
        );

        if (resultat) {
            setCoursModifie(null);
        }
    }

    // J'ajoute ou retire un favori
    async function modifierFavori(c) {

        await modifierCours(c, {
            favori: !c.favori
        });
    }

    // Je supprime mon cours
    async function supprimerCours(c) {

        if (actionEnCours) return;

        const confirmation = window.confirm(
            "Supprimer ce cours, sa fiche et ses révisions ?"
        );

        if (!confirmation) return;

        setActionEnCours(true);
        setErreur("");

        try {

            await api(`/plus/cours/${c.id}`, {
                method: "DELETE"
            });

            if (coursSelectionne === c.id) {
                setCoursSelectionne(null);
            }

            await chargerCours();

        } catch (err) {

            setErreur(err.message);

        } finally {

            setActionEnCours(false);
        }
    }

    // J'ouvre mon cours
    function ouvrirCours(c, nouvelOnglet) {

        setErreur("");
        setCoursSelectionne(c.id);
        setOnglet(nouvelOnglet);
    }

    // Je récupère mes dossiers
    const dossiers = [
        ...new Set(
            cours.map(c => c.dossier).filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b, "fr"));

    const favoris = cours.filter(c => c.favori);

    const fichesDisponibles = cours.filter(
        c => c.statut_ia === "termine" && c.fiche_id
    );

    // Je filtre mes cours
    const coursFiltres = cours.filter(c => {

        const texte = `${c.nom} ${c.matiere || ""} ${c.dossier}`;

        const correspondRecherche = texte
            .toLowerCase()
            .includes(recherche.toLowerCase());

        const correspondFiltre =
            filtre === "tous" ||
            (filtre === "favoris" && c.favori) ||
            (filtre === "sans-dossier" && !c.dossier) ||
            filtre === `dossier:${c.dossier}`;

        return correspondRecherche && correspondFiltre;
    });

    // Je regroupe mes cours par dossier
    const groupes = [
        ...dossiers,
        ""
    ].map(nomDossier => ({
        nom: nomDossier,
        cours: coursFiltres.filter(
            c => c.dossier === nomDossier
        )
    })).filter(groupe => groupe.cours.length > 0);

    const coursActif = cours.find(
        c => c.id === coursSelectionne
    );

    // J'affiche le statut de ma fiche
    function statutFiche(c) {

        const statuts = {
            en_attente: "Fiche non générée",
            file_attente: "En attente",
            analyse: `Analyse : ${c.progression_ia}%`,
            generation: "Création de la fiche...",
            termine: "Fiche disponible",
            erreur: "Génération à relancer"
        };

        return statuts[c.statut_ia] || "Fiche non générée";
    }

    return (
        <main className="bibliotheque">

            <header className="bibliotheque-header">

                <div>
                    <h1>Mes cours</h1>
                    <p>
                        Retrouvez et organisez vos cours
                        au même endroit.
                    </p>
                </div>

                <button
                    className="bibliotheque-primary"
                    onClick={() => navigate("/importer")}
                >
                    <Plus size={18} />
                    Importer un cours
                </button>

            </header>

            <div className="bibliotheque-stats">

                <div>
                    <FileText size={22} />
                    <p>Mes cours</p>
                    <h2>{cours.length}</h2>
                </div>

                <div>
                    <Folder size={22} />
                    <p>Mes dossiers</p>
                    <h2>{dossiers.length}</h2>
                </div>

                <div>
                    <Star size={22} />
                    <p>Mes favoris</p>
                    <h2>{favoris.length}</h2>
                </div>

                <div>
                    <FileText size={22} />
                    <p>Fiches prêtes</p>
                    <h2>{fichesDisponibles.length}</h2>
                </div>

            </div>

            <div className="bibliotheque-recherche">

                <Search size={20} />

                <input
                    value={recherche}
                    onChange={e => setRecherche(e.target.value)}
                    placeholder="Rechercher un cours..."
                />

            </div>

            <div className="bibliotheque-filtres">

                {[
                    ["tous", "Tous les cours"],
                    ["favoris", "Favoris"],
                    ["sans-dossier", "Sans dossier"]
                ].map(([valeur, label]) => (

                    <button
                        key={valeur}
                        className={filtre === valeur ? "actif" : ""}
                        onClick={() => setFiltre(valeur)}
                    >
                        {label}
                    </button>

                ))}

                {dossiers.map(d => (

                    <button
                        key={d}
                        className={
                            filtre === `dossier:${d}` ? "actif" : ""
                        }
                        onClick={() => setFiltre(`dossier:${d}`)}
                    >
                        <Folder size={15} />
                        {d}
                    </button>

                ))}

            </div>

            {erreur && (
                <p className="bibliotheque-erreur" role="alert">
                    {erreur}
                </p>
            )}

            <div className="bibliotheque-contenu">

                {chargement && (
                    <p>Chargement de vos cours...</p>
                )}

                {!chargement && groupes.length === 0 && (

                    <div className="bibliotheque-vide">

                        <Folder size={45} />

                        <h2>
                            {cours.length === 0
                                ? "Votre bibliothèque est vide"
                                : "Aucun cours trouvé"}
                        </h2>

                        <p>
                            {cours.length === 0
                                ? "Importez votre premier cours PDF."
                                : "Essayez une autre recherche."}
                        </p>

                        {cours.length === 0 && (
                            <button
                                className="bibliotheque-primary"
                                onClick={() => navigate("/importer")}
                            >
                                Importer un cours
                            </button>
                        )}

                    </div>

                )}

                {groupes.map(groupe => (

                    <section
                        className="bibliotheque-dossier"
                        key={groupe.nom || "sans-dossier"}
                    >

                        <div className="bibliotheque-dossier-header">

                            <Folder size={22} />

                            <h2>
                                {groupe.nom || "Sans dossier"}
                            </h2>

                            <span>
                                {groupe.cours.length} cours
                            </span>

                        </div>

                        <div className="bibliotheque-grille">

                            {groupe.cours.map(c => (

                                <article
                                    className="bibliotheque-carte"
                                    key={c.id}
                                >

                                    <div className="bibliotheque-carte-header">

                                        <div className="bibliotheque-pdf-icon">
                                            <FileText size={26} />
                                        </div>

                                        <div className="bibliotheque-info">

                                            <h3>{c.nom}</h3>

                                            <p>
                                                {c.matiere || "Cours PDF"}
                                            </p>

                                        </div>

                                        <button
                                            className={
                                                c.favori
                                                    ? "bibliotheque-star favori"
                                                    : "bibliotheque-star"
                                            }
                                            disabled={actionEnCours}
                                            onClick={() => modifierFavori(c)}
                                            aria-label={
                                                c.favori
                                                    ? "Retirer des favoris"
                                                    : "Ajouter aux favoris"
                                            }
                                        >
                                            <Star
                                                size={21}
                                                fill={c.favori
                                                    ? "currentColor"
                                                    : "none"}
                                            />
                                        </button>

                                    </div>

                                    <span
                                        className={
                                            `bibliotheque-statut ${c.statut_ia}`
                                        }
                                    >
                                        {statutFiche(c)}
                                    </span>

                                    <div className="bibliotheque-actions">

                                        <button
                                            onClick={() => ouvrirCours(c, "pdf")}
                                        >
                                            <FileText size={15} />
                                            PDF
                                        </button>

                                        <button
                                            onClick={() => {

                                                if (
                                                    c.statut_ia === "termine" &&
                                                    c.fiche_id
                                                ) {
                                                    navigate(
                                                        `/fiches?fiche=${c.fiche_id}`
                                                    );

                                                } else {
                                                    ouvrirCours(c, "fiche");
                                                }
                                            }}
                                        >
                                            Fiche IA
                                        </button>

                                        <button
                                            disabled={actionEnCours}
                                            onClick={() => ouvrirModification(c)}
                                            aria-label="Modifier le cours"
                                            title="Modifier"
                                        >
                                            <Pencil size={15} />
                                        </button>

                                        <button
                                            className="bibliotheque-danger"
                                            disabled={actionEnCours}
                                            onClick={() => supprimerCours(c)}
                                            aria-label="Supprimer le cours"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={15} />
                                        </button>

                                    </div>

                                </article>

                            ))}

                        </div>

                    </section>

                ))}

            </div>

            {coursModifie && (

                <div className="bibliotheque-overlay">

                    <form
                        className="bibliotheque-modal"
                        onSubmit={enregistrerModification}
                    >

                        <div className="bibliotheque-modal-header">

                            <h2>Modifier mon cours</h2>

                            <button
                                type="button"
                                disabled={actionEnCours}
                                onClick={() => setCoursModifie(null)}
                                aria-label="Fermer"
                            >
                                <X size={22} />
                            </button>

                        </div>

                        <label htmlFor="nom-cours">
                            Nom du cours
                        </label>

                        <input
                            id="nom-cours"
                            value={nom}
                            maxLength={255}
                            required
                            onChange={e => setNom(e.target.value)}
                        />

                        <label htmlFor="dossier-cours">
                            Dossier
                        </label>

                        <input
                            id="dossier-cours"
                            list="dossiers-existants"
                            value={dossier}
                            maxLength={100}
                            placeholder="Choisir ou créer un dossier"
                            onChange={e => setDossier(e.target.value)}
                        />

                        <datalist id="dossiers-existants">

                            {dossiers.map(d => (
                                <option key={d} value={d} />
                            ))}

                        </datalist>

                        <small>
                            Laissez ce champ vide pour retirer
                            le cours de son dossier.
                        </small>

                        {erreur && (
                            <p className="bibliotheque-erreur">
                                {erreur}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="bibliotheque-primary"
                            disabled={actionEnCours}
                        >
                            {actionEnCours
                                ? "Enregistrement..."
                                : "Enregistrer"}
                        </button>

                    </form>

                </div>

            )}

            {coursActif && (

                <div className="bibliotheque-overlay">

                    <section className="bibliotheque-lecteur">

                        <div className="bibliotheque-modal-header">

                            <h2>{coursActif.nom}</h2>

                            <button
                                onClick={() => setCoursSelectionne(null)}
                                aria-label="Fermer le cours"
                            >
                                <X size={24} />
                            </button>

                        </div>

                        <div className="bibliotheque-filtres">

                            <button
                                className={onglet === "pdf" ? "actif" : ""}
                                onClick={() => setOnglet("pdf")}
                            >
                                Cours original
                            </button>

                            <button
                                className={onglet === "fiche" ? "actif" : ""}
                                onClick={() => setOnglet("fiche")}
                            >
                                Fiche IA
                            </button>

                        </div>

                        {erreur && (
                            <p className="bibliotheque-erreur">
                                {erreur}
                            </p>
                        )}

                        {onglet === "pdf" && (
                            <>

                                {chargementPDF && (
                                    <p>Chargement du PDF...</p>
                                )}

                                {urlPDF && (
                                    <iframe
                                        src={urlPDF}
                                        title={coursActif.nom}
                                        className="bibliotheque-iframe"
                                    />
                                )}

                            </>
                        )}

                        {onglet === "fiche" && (

                            <ProgressionIA
                                key={coursActif.id}
                                coursId={coursActif.id}
                            />

                        )}

                    </section>

                </div>

            )}

        </main>
    );
}

export default MesCours;