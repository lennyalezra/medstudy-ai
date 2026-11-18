const express = require("express");
const cors = require ("cors")
const app = express();
app.use (cors());
//definir le port 3001
const PORT =  3001
app.get("/" , (req, res) =>{
    res.send("backend Medstudy AI operationnel")
});

app.get("/api/test", (req, res) =>{
    res.send("connexion react Express reussi ")
})

app.listen(PORT,() => {
    console.log("Serveur démarré");
});

