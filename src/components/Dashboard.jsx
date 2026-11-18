import StatCards from "./StatCards";
import RecentCourses from "./RecentCourses";
import { useNavigate } from "react-router-dom";
import RevisionOverview from "./RevisionOverview";


function Dashboard(){
    const navigate = useNavigate();
    return(
        <main>
            <h1>Bonjour, bienvenue sur MedStudy AI</h1>
            <p> Prête pour une nouvelle session de révisions ?</p>
            <section className="welcome-banner">

                <h2>Tous les cours, organisés intelligemment</h2> 
                <p>importe tes cours de médecine et laisse l'IA créer tes fiches de révisions.</p>
                <button  onClick= {() => navigate("/importer")}> importer un cours </button>
            </section>
            <StatCards/>
            <RecentCourses/>
            <RevisionOverview/>

        </main>
    )
}
export default Dashboard; 