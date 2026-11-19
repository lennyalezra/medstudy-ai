import {useState} from "react";

function ImportCourses(){
    const [fichier, setFichier] = useState(null);
    const [message, setMessage] = useState("");
    const [chargement, setChargement] = useState(false);


    function handleFileChange(event){
    const fichierSelectionne = event.target.files[0];
    setMessage("")
        if (!fichierSelectionne){
            setFichier(null);
        return;
        }
        if (fichierSelectionne.type !=="application/pdf"){
            alert ("veuillez sélectionner un PDF");
            setFichier(null);
            return;
    
        }
    

        setFichier(fichierSelectionne);

    }

   
    function handleAnalyse(){
        if(!fichier){
            alert("Veuillez selectionner un PDF")
            return; 
        }

        const formData = new FormData();
        formData.append("pdf", fichier)

        setChargement(true);
        console.log("Début de l'envoi");

        fetch("http://localhost:3001/api/upload",{
            method: "POST",
            body: formData
        })
        .then(reponse => {
        if(!reponse.ok) {
            throw new Error("Erreur de serveur");
        }
        return reponse.text()

        })
        .then(text => setMessage(text))
        .catch(erreur =>{
            setMessage(erreur.message)
        })
        .finally(() => {
            console.log("fin de l envoi")
            setChargement(false)
        });
    }

    return (
        <main>
            <div className="import-card">
                <img
                  src="/images/medical-book.png" alt="Livre médical avec un stéthoscope" className="import-illustration"/>
        <h1> Importer les cours</h1>
        <p> Vous pouvez importer vos cours au format PDF</p>
        <div className="upload-zone">
            <h2>Déposez votre fichier PDF ici</h2>
        <input type="file" accept=".pdf" onChange={handleFileChange}/>
        </div>
         {fichier && (
            <div className="selected-file">
            <p> {fichier.name} </p>
            <p> {(fichier.size / (1024 * 1024)).toFixed(2)} Mo </p>
            </div>
                  )
}
        <button onClick={handleAnalyse} disabled={chargement}>
            {chargement ? "envoi en cours ..." :  "analyser mon cours" }</button>
        {message && (
            <p> {message}</p>            
        )}
        
  </div>
        </main>
    );
}
    
export default ImportCourses