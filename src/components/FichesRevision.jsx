
import { useState } from "react";
import {
    FileText,
    Search,
    BookOpen,
    Pencil,
    Stethoscope,
    FolderOpen
} from "lucide-react";

function FichesRevision() {

    // Je stocke mes futures fiches
    const [fiches, setFiches] = useState([]);

    // Je stocke ma recherche et mon filtre
    const [recherche, setRecherche] = useState("");
    const [matiereActive, setMatiereActive] = useState("Toutes");

    // Je prépare la liste des matières
    const matieres = [
        "Toutes",
        ...new Set(fiches.map((fiche) => fiche.matiere))
    ];

    // Je filtre mes fiches
    const fichesFiltrees = fiches.filter((fiche) => {
        const correspondRecherche = fiche.titre
            .toLowerCase()
            .includes(recherche.toLowerCase());

        const correspondMatiere =
            matiereActive === "Toutes" ||
            fiche.matiere === matiereActive;

        return correspondRecherche && correspondMatiere;
    });

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
                {matieres.map((matiere) => (
                    <button
                        key={matiere}
                        className={
                            matiereActive === matiere ? "active" : ""
                        }
                        onClick={() => setMatiereActive(matiere)}
                    >
                        {matiere}
                    </button>
                ))}
            </div>

            {fichesFiltrees.length === 0 ? (
                <div className="med-empty">
                    <div className="med-empty-icon">
                        {fiches.length === 0 ? (
                            <Stethoscope size={40} />
                        ) : (
                            <FolderOpen size={40} />
                        )}
                    </div>

                    <h2>
                        {fiches.length === 0
                            ? "Tes futures fiches t'attendent !"
                            : "Aucune fiche trouvée"}
                    </h2>

                    <p>
                        {fiches.length === 0
                            ? "Tes fiches de révision apparaîtront ici lorsqu'elles auront été générées à partir de tes cours."
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
                                    <p>{fiche.matiere}</p>
                                </div>
                            </div>

                            <p className="med-fiche-date">
                                {fiche.date}
                            </p>

                            <div className="med-fiche-actions">
                                <button
                                    onClick={() => {
                                        window.alert(
                                            "L'ouverture des fiches sera reliée au backend."
                                        );
                                    }}
                                >
                                    <BookOpen size={17} />
                                    Ouvrir
                                </button>

                                <button
                                    onClick={() => {
                                        window.alert(
                                            "La modification des fiches sera disponible après leur enregistrement."
                                        );
                                    }}
                                >
                                    <Pencil size={17} />
                                    Modifier
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
