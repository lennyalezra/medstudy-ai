const express = require("express");
const sequelize = require("./db");
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

app.get("/api/cours/:id", async (req, res)=>{

    try{

    
    const coursId = req.params.id;
    const resultat = await sequelize.query(
        `SELECT * FROM cours WHERE id = :id`,
    {
    replacements: {
        id: coursId
    }});

    const cours = resultat[0][0];

    if(!cours){
        res.status(404).send("le cours n existe pas");
        return;
    }

    res.setHeader("Content-type", "application/pdf");

    res.send(cours.contenu_pdf);
    }catch (erreur){
        console.log(erreur);
        res.status(500).send("Erreur lors de la recuperation du PDF");
    }
});

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

            await sequelize.query(
    `INSERT INTO cours (nom, matiere, texte_pdf, fichier_pdf, contenu_pdf)
     VALUES (:nom, :matiere, :texte, :fichier, :contenu)`,
    {
        replacements: {
            nom: req.file.originalname,
            matiere: "Non renseignée",
            texte: resultat.text,
            fichier: req.file.originalname,
            contenu: req.file.buffer
        }
    }
);
        res.json({
            message:"Votre cours a bien ete enregistrer  "
            
});
}        catch (erreur){
            console.log(erreur);
            res.status(500).send("Erreur pendant l'importation du PDF")
}        finally {
            await parser.destroy();
}
});

app.get("/api/cours", async(req, res) => {
    try{
        const resultat = await sequelize.query(
    `SELECT id, nom, matiere FROM cours`
    );
    res.json(resultat[0])}
    catch(erreur){
        console.log(erreur);
        res.status(500).send("Erreur lors de la recuperation des cours")
    }
});


app.use((err, req, res, next) => {
    if (err.code === "LIMIT_FILE_SIZE"){
        res.status(413).send("le fichier a depasser la limite de 10 Mo")
    return
    }
    next(err);

})

sequelize.authenticate()
    .then(() => {
        console.log("Connexion PostgreSQL réussie !");
    })
    .catch((erreur) => {
        console.error("Erreur de connexion PostgreSQL :", erreur);
    });

app.listen(PORT,() => {
    console.log("Serveur démarré");
});

