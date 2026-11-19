const express = require("express");
const cors = require ("cors");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const app = express();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize:10*1024*1024},
});

app.use (cors());
//definir le port 3001
const PORT =  3001
app.get("/" , (req, res) =>{
    res.send("backend Medstudy AI operationnel")
});

app.get("/api/test", (req, res) =>{
    res.send("connexion react Express reussi ")
})

app.post("/api/upload" , upload.single("pdf"),  async(req, res) =>{
    if (!req.file){
      res.status(400).send("Aucun fichier recu")
       return;

    }

     if (req.file.mimetype !== "application/pdf"){
        res.status(400).send("Seuls les fichiers en PDF sont autorisé")
        return; 
    }
           const parser = new PDFParse({ data: req.file.buffer });

           try { 
            const resultat = await parser.getText();
            console.log(resultat.text);
        res.json({
            message:"le texte du PDF a bien été extrait ",
            texte: resultat.text});
}         catch (erreur){
            console.log(erreur);
            res.status(500).send("Erreur pendant la lecture du PDF")
}        finally {
            await parser.destroy();
}
});
app.use((err, req, res, next) => {
    if (err.code === "LIMIT_FILE_SIZE"){
        res.status(413).send("le fichier a depasser la limite de 10 Mo")
    return
    }
    next(err);

})

app.listen(PORT,() => {
    console.log("Serveur démarré");
});

