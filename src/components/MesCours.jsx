
import { useState, useEffect } from "react";
import { Search, FileText } from "lucide-react";

function MesCours() {

    // Je stocke mes cours
    const [cours, setCours] = useState([]);

    // Je stocke ma recherche
    const [recherche, setRecherche] = useState("");

    // Je garde le cours sélectionné
    const [coursSelectionne, setCoursSelectionne] = useState(null);

    // Je garde l'onglet actif
    const [ongletActif, setOngletActif] = useState("original");

    // Je récupère mes cours depuis le backend
    useEffect(() => {
        fetch("http://localhost:3001/api/cours")
            .then((reponse) => reponse.json())
            .then((donnees) => setCours(donnees));
    }, []);

    // Je filtre les cours selon ma recherche
    const coursFiltres = cours.filter((coursItem) => {
        return coursItem.nom
            .toLowerCase()
            .includes(recherche.toLowerCase());
    });

    return (
        <main className="mes-cours-page">

            <h1>Mes cours</h1>
            <p>Retrouvez ici vos cours enregistrés sur MedStudy AI</p>

            {/* Je crée ma barre de recherche */}
            <div className="cours-recherche">
                <Search size={20} />

                <input
                    type="text"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Rechercher un cours..."
                />
            </div>

            {/* Je vérifie si j'ai des cours */}
            {cours.length === 0 && (
                <p>Vous n'avez pas encore ajouté de cours.</p>
            )}

            {/* Je vérifie si ma recherche donne un résultat */}
            {cours.length > 0 && coursFiltres.length === 0 && (
                <p>Aucun cours trouvé pour cette recherche.</p>
            )}

            {/* J'affiche mes cours */}
            <div className="cours-liste">
                {coursFiltres.map((coursItem) => (

                    <div className="cours-element" key={coursItem.id}>

                        {/* Je sélectionne mon cours */}
                        <div
                            className="cours-card"
                            onClick={() => {
                                setCoursSelectionne(coursItem.id);
                                setOngletActif("original");
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

                        {/* J'affiche les onglets sous le cours sélectionné */}
                        {coursSelectionne === coursItem.id && (

                            <div className="cours-details">

                                <div className="cours-onglets">

                                    <button
                                        className={ongletActif === "original" ? "actif" : ""}
                                        onClick={() => setOngletActif("original")}
                                    >
                                        Cours original
                                    </button>

                                    <button
                                        className={ongletActif === "fiche" ? "actif" : ""}
                                        onClick={() => setOngletActif("fiche")}
                                    >
                                        Fiche IA
                                    </button>

                                    <button
                                        className="cours-fermer"
                                        onClick={() => setCoursSelectionne(null)}
                                    >
                                        Fermer le cours
                                    </button>

                                </div>

                                {/* J'affiche le PDF */}
                                {ongletActif === "original" && (
                                    <iframe
                                        src={`http://localhost:3001/api/cours/${coursSelectionne}`}
                                        title="Cours original"
                                        className="cours-pdf"
                                    />
                                )}

                                {/* Je prépare la future fiche IA */}
                                {ongletActif === "fiche" && (
                                    <div className="cours-fiche-ia">
                                        <FileText size={36} />
                                        <h3>Fiche de révision IA</h3>
                                        <p>
                                            La génération des fiches IA sera
                                            bientôt disponible.
                                        </p>
                                    </div>
                                )}

                            </div>
                        )}

                    </div>
                ))}
            </div>

            {/* J'affiche un message quand aucun cours n'est ouvert */}
{coursSelectionne === null && cours.length > 0 && (
    <div className="cours-accueil">

        <div className="cours-accueil-icon">
            <FileText size={38} />
        </div>

        <h2>Prête à réviser ?</h2>

        <p>
            Sélectionne un cours pour consulter ton PDF
            et accéder prochainement à tes fiches
            de révision générées par l'IA.
        </p>

    </div>
)}

        </main>
    );
}

export default MesCours;
