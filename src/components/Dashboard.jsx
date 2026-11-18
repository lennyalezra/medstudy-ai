import StatCards from "./StatCards";
import RecentCourses from "./RecentCourses";

function Dashboard(){
    return(
        <main>
            <h1>Bonjour, bienvenue sur MedStudy AI</h1>
            <p> Prête pour une nouvelle session de révisions ?</p>
            <section className="welcome-banner">

                <h2>Tous les cours, organisés intelligemment</h2> 
                <p>importe tes cours de médecine et laisse l'IA créer tes fiches de révisions.</p>
                <button> importer un cours </button>
            </section>
            <StatCards/>
            <RecentCourses/>
        </main>
    )
}
export default Dashboard; 