import { useState, useRef } from "react";
import { api } from "../api";

function ImportCourses() {

    // Je stocke mon fichier
    const [fichier, setFichier] = useState(null);
    const [message, setMessage] = useState("");
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState(false);

    const inputFichier = useRef(null);

    // Je vérifie mon fichier
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

        if (fichierSelectionne.size > 10 * 1024 * 1024) {
            setMessage("Le fichier ne doit pas dépasser 10 Mo");
            setErreur(true);
            event.target.value = "";
            return;
        }

        setFichier(fichierSelectionne);
    }

    // J'envoie mon PDF dans mon compte
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
            setFichier(null);

            if (inputFichier.current) {
                inputFichier.current.value = "";
            }

        } catch (erreur) {
            setMessage(erreur.message);
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
                    Vous pouvez importer vos cours au format PDF
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

                    <p>Taille maximale : 10 Mo</p>

                </div>

                {fichier && (
                    <div className="selected-file">

                        <p>{fichier.name}</p>

                        <p>
                            {(fichier.size / (1024 * 1024)).toFixed(2)} Mo
                        </p>

                    </div>
                )}

                <button
                    onClick={handleAnalyse}
                    disabled={chargement || !fichier}
                >
                    {chargement
                        ? "Envoi en cours..."
                        : "Analyser mon cours"}
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

            </div>
        </main>
    );
}

export default ImportCourses;