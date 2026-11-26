import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import ProgressionIA from "./ProgressionIA";

function ImportCourses() {

    const navigate = useNavigate();

    // Je stocke mon fichier
    const [fichier, setFichier] = useState(null);
    const [message, setMessage] = useState("");
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState(false);
    const [coursImporte, setCoursImporte] = useState(null);

    const inputFichier = useRef(null);

    // Je vérifie mon PDF
    function handleFileChange(event) {
        const fichierSelectionne = event.target.files[0];

        setMessage("");
        setErreur(false);
        setFichier(null);

        if (!fichierSelectionne) {
            return;
        }

        if (fichierSelectionne.type !== "application/pdf") {
            setMessage("Veuillez sélectionner un PDF");
            setErreur(true);
            event.target.value = "";
            return;
        }

        if (fichierSelectionne.size > 100 * 1024 * 1024) {
            setMessage("Le fichier ne doit pas dépasser 100 Mo");
            setErreur(true);
            event.target.value = "";
            return;
        }

        setFichier(fichierSelectionne);
    }

    // J'importe mon cours et je lance sa génération
    async function handleAnalyse() {

        if (!fichier || chargement) {
            return;
        }

        const formData = new FormData();

        formData.append("pdf", fichier);

        setChargement(true);
        setMessage("");
        setErreur(false);

        try {
            const donnees = await api("/upload", {
                method: "POST",
                body: formData
            });

            setMessage(donnees.message);
            setCoursImporte(donnees.coursId);
            setFichier(null);

            if (inputFichier.current) {
                inputFichier.current.value = "";
            }

        } catch (err) {
            setMessage(err.message);
            setErreur(true);

        } finally {
            setChargement(false);
        }
    }

    return (
        <main>

            <div className="import-card">

                <img
                    src="/images/medical-book.png"
                    alt="Livre médical avec un stéthoscope"
                    className="import-illustration"
                />

                <h1>Importer les cours</h1>

                <p>
                    Importez votre cours PDF.
                    Votre fiche sera générée automatiquement.
                </p>

                <div className="upload-zone">

                    <h2>Déposez votre fichier PDF ici</h2>

                    <input
                        ref={inputFichier}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        disabled={chargement}
                    />

                    <p>Taille maximale : 100 Mo</p>

                </div>

                {fichier && (
                    <div className="selected-file">

                        <p>{fichier.name}</p>

                        <p>
                            {(fichier.size / (1024 * 1024))
                                .toFixed(2)} Mo
                        </p>

                    </div>
                )}

                <button
                    onClick={handleAnalyse}
                    disabled={chargement || !fichier}
                >
                    {chargement
                        ? "Importation en cours..."
                        : "Importer et générer ma fiche"}
                </button>

                {message && (
                    <p
                        className={
                            erreur
                                ? "med-message med-message-erreur"
                                : "med-message med-message-succes"
                        }
                        role={erreur ? "alert" : "status"}
                    >
                        {message}
                    </p>
                )}

                {coursImporte && (
                    <>
                        <ProgressionIA
                            key={coursImporte}
                            coursId={coursImporte}
                        />

                        <div className="generation-ia-navigation">

                            <button
                                onClick={() =>
                                    navigate("/cours")
                                }
                            >
                                Mes cours
                            </button>

                            <button
                                onClick={() =>
                                    navigate("/fiches")
                                }
                            >
                                Mes fiches de révision
                            </button>

                        </div>
                    </>
                )}

            </div>

        </main>
    );
}

export default ImportCourses;