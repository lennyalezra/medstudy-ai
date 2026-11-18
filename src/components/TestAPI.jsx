function TestAPI(){ 
function testerConnexion(){
    fetch("http://localhost:3001/api/test")
    .then((reponse) => {
        return(
    reponse.text())
})

    .then((text) => {
        console.log(text)
    })

}
    return(
<button onClick={testerConnexion}> Tester la connexion </button>
)}

export default TestAPI ; 