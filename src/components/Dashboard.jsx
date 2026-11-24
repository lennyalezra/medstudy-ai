import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";

import { useAuth } from "../context/AuthContext";

import StatCards from "./StatCards";
import RecentCourses from "./RecentCourses";
import RevisionOverview from "./RevisionOverview";

function Dashboard() {

    const navigate = useNavigate();
    const { utilisateur } = useAuth();

    // Je mets une majuscule à mon prénom
    const prenom = utilisateur?.prenom
        ? utilisateur.prenom.charAt(0).toUpperCase() +
          utilisateur.prenom.slice(1)
        : "";

    return (
        <main className="dashboard">

            <h1>
                Bonjour{prenom ? ` ${prenom}` : ""}, bienvenue sur MedStudy AI
            </h1>

            <p>
                Prête pour une nouvelle session de révisions ?
            </p>

            {/* J'affiche ma bannière */}
            <section className="welcome-banner">

                <h2>
                    Révise plus intelligemment
                </h2>

                <p>
                    Transforme tes cours en fiches de révision,
                    QCM et flashcards grâce à l'intelligence artificielle.
                </p>

                <button onClick={() => navigate("/importer")}>

                    <Upload size={19} />

                    Importer un cours

                </button>

            </section>

            {/* J'affiche mes statistiques */}
            <StatCards />

            {/* J'affiche mes derniers cours */}
            <RecentCourses />

            {/* J'affiche ma progression */}
            <RevisionOverview />

        </main>
    );
}

export default Dashboard;