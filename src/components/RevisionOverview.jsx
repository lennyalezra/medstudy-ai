function RevisionOverview(){
    return (
        <section className="revision-overview">
            <div className="revision-card">
                <h2>Reprendre mes révisons</h2>
                <p> Retrouve ta dernière fiche ou ton dernier qcm </p>
                <p> Aucune révision en cours</p>
            </div>
            <div className="revision-card">
                <h2>Ma progression</h2>
                <p>Suis ton avancement dans tes révisions </p>
                <p>0%</p>                
            </div>
        </section>
    )
}
export default RevisionOverview;