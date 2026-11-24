import { useState, useEffect } from "react";
import { Search, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, apiBlob } from "../api";

function MesCours() {

    const navigate = useNavigate();

    // Je stocke mes cours
    const [cours, setCours] = useState([]);

    // Je stocke ma recherche
    const [recherche, setRecherche] = useState("");

    // Je garde mon cours sélectionné
    const [coursSelectionne, setCoursSelectionne] = useState(null);

    // Je garde mon onglet actif
    const [ongletActif, setOngletActif] = useState("original");

    // Je gère l'affichage de mon PDF
    const [urlPDF, setUrlPDF] = useState("");
    const [chargementPDF, setChargementPDF] = useState(false);
    const [erreurPDF, setErreurPDF] = useState("");

    // Je gère le chargement de mes cours
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    // Je récupère les cours de mon compte
    useEffect(() => {
        const controller = new AbortController();

        async function chargerCours() {
            try {
                const donnees = await api("/cours", {
                    signal: controller.signal
                });

                if (!controller.signal.aborted) {
                    setCours(donnees);
                }

            } catch (erreur) {
                if (!controller.signal.aborted) {
                    setErreur(erreur.message);
                }

            } finally {
                if (!controller.signal.aborted) {
                    setChargement(false);
                }
            }
        }

        chargerCours();

        return () => controller.abort();

    }, []);

    // Je récupère mon PDF avec mon token
    useEffect(() => {

        setUrlPDF("");
        setErreurPDF("");

        if (!coursSelectionne || ongletActif !== "original") {
            setChargementPDF(false);
            return;
        }

        const controller = new AbortController();
        let urlTemporaire = "";

        async function chargerPDF() {
            setChargementPDF(true);

            try {
                const fichier = await apiBlob(
                    `/cours/${coursSelectionne}`,
                    {
                        signal: controller.signal
                    }
                );

                if (controller.signal.aborted) {
                    return;
                }

                urlTemporaire = URL.createObjectURL(fichier);

                setUrlPDF(urlTemporaire);

            } catch (erreur) {
                if (!controller.signal.aborted) {
                    setErreurPDF(erreur.message);
                }

            } finally {
                if (!controller.signal.aborted) {
                    setChargementPDF(false);
                }
            }
        }

        chargerPDF();

        // Je libère mon PDF quand je ferme le cours
        return () => {
            controller.abort();

            if (urlTemporaire) {
                URL.revokeObjectURL(urlTemporaire);
            }
        };

    }, [coursSelectionne, ongletActif]);

    // Je filtre mes cours
    const coursFiltres = cours.filter((coursItem) => {
        return coursItem.nom
            .toLowerCase()
            .includes(recherche.toLowerCase());
    });

    // Je sélectionne un cours
    function ouvrirCours(id) {
        setCoursSelectionne(id);
        setOngletActif("original");
    }

    return (
        <main className="mes-cours-page">

            <h1>Mes cours</h1>

            <p>
                Retrouvez ici vos cours enregistrés sur MedStudy AI
            </p>

            <div className="cours-recherche">

                <Search size={20} />

                <input
                    type="text"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Rechercher un cours..."
                />

            </div>

            {chargement && (
                <p>Chargement de vos cours...</p>
            )}

            {erreur && (
                <p
                    className="med-message med-message-erreur"
                    role="alert"
                >
                    {erreur}
                </p>
            )}

            {!chargement && !erreur && cours.length === 0 && (
                <p>Vous n'avez pas encore ajouté de cours.</p>
            )}

            {cours.length > 0 && coursFiltres.length === 0 && (
                <p>Aucun cours trouvé pour cette recherche.</p>
            )}

            <div className="cours-liste">

                {coursFiltres.map((coursItem) => (

                    <div
                        className="cours-element"
                        key={coursItem.id}
                    >

                        <div
                            className="cours-card"
                            role="button"
                            tabIndex={0}
                            onClick={() => ouvrirCours(coursItem.id)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    ouvrirCours(coursItem.id);
                                }
                            }}
                        >

                            <div className="cours-icon">
                                <FileText size={32} />
                            </div>

                            <div className="cours-info">
                                <h3>{coursItem.nom}</h3>
                                <p>{coursItem.matiere}</p>
                            </div>

                        </div>

                        {coursSelectionne === coursItem.id && (

                            <div className="cours-details">

                                <div className="cours-onglets">

                                    <button
                                        className={
                                            ongletActif === "original"
                                                ? "actif"
                                                : ""
                                        }
                                        onClick={() =>
                                            setOngletActif("original")
                                        }
                                    >
                                        Cours original
                                    </button>

                                    <button
                                        className={
                                            ongletActif === "fiche"
                                                ? "actif"
                                                : ""
                                        }
                                        onClick={() =>
                                            setOngletActif("fiche")
                                        }
                                    >
                                        Fiche IA
                                    </button>

                                    <button
                                        className="cours-fermer"
                                        onClick={() =>
                                            setCoursSelectionne(null)
                                        }
                                    >
                                        Fermer le cours
                                    </button>

                                </div>

                                {/* J'affiche mon PDF */}
                                {ongletActif === "original" && (

                                    <>

                                        {chargementPDF && (
                                            <p>Chargement du PDF...</p>
                                        )}

                                        {erreurPDF && (
                                            <p className="med-message med-message-erreur">
                                                {erreurPDF}
                                            </p>
                                        )}

                                        {urlPDF && !chargementPDF && (
                                            <iframe
                                                src={urlPDF}
                                                title="Cours original"
                                                className="cours-pdf"
                                            />
                                        )}

                                    </>

                                )}

                                {/* J'accède à mes fiches IA */}
                                {ongletActif === "fiche" && (

                                    <div className="cours-fiche-ia">

                                        <FileText size={36} />

                                        <h3>Fiche de révision IA</h3>

                                        <p>
                                            Génère ou consulte tes fiches
                                            de révision grâce à l'IA.
                                        </p>

                                        <button
                                            className="med-bouton-principal"
                                            onClick={() => navigate("/fiches")}
                                        >
                                            Accéder à mes fiches
                                        </button>

                                    </div>

                                )}

                            </div>

                        )}

                    </div>

                ))}

            </div>

            {coursSelectionne === null && cours.length > 0 && (

                <div className="cours-accueil">

                    <div className="cours-accueil-icon">
                        <FileText size={38} />
                    </div>

                    <h2>Prête à réviser ?</h2>

                    <p>
                        Sélectionne un cours pour consulter ton PDF
                        et accéder à tes fiches de révision
                        générées par l'IA.
                    </p>

                </div>

            )}

        </main>
    );
}

export default MesCours;