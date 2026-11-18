import {useState} from "react";

function ImportCourses(){
    const [fichier, setFichier] = useState(null);
    function handleFileChange(event){
    const fichierSelectionne = event.target.files[0];
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
        alert("le fichier est pret a etre analyser")
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
            <p> {(fichier.size / (1024 * 1024)).toFixed(2)} </p>
            </div>
                  )
}
        <button onClick={handleAnalyse}>analyser mon cours</button>
        
  </div>
        </main>
    );
}
    
export default ImportCourses