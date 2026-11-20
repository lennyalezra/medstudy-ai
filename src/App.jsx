
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TestAPI from "./components/TestAPI";
import ImportCourses from "./components/ImportCourses";
import MesCours from "./components/MesCours";
import FichesRevision from "./components/FichesRevision";
import QuizQCM from "./components/QuizQCM";
import Statistiques from "./components/Statistiques";
import Parametres from "./components/Parametres";

import { Routes, Route } from "react-router-dom";

import "./App.css";

function App() {
    return (
        <div className="app-container">

            {/* J'affiche ma barre de navigation */}
            <Sidebar />

            {/* Je relie mes pages à leurs adresses */}
            <Routes>

                {/* Mon tableau de bord */}
                <Route
                    path="/"
                    element={<Dashboard />}
                />

                {/* Ma page d'importation */}
                <Route
                    path="/importer"
                    element={<ImportCourses />}
                />

                {/* Mes cours enregistrés */}
                <Route
                    path="/cours"
                    element={<MesCours />}
                />

                {/* Mes fiches de révision */}
                <Route
                    path="/fiches"
                    element={<FichesRevision />}
                />

                {/* Mes quiz et QCM */}
                <Route
                    path="/quiz"
                    element={<QuizQCM />}
                />

                {/* Mes statistiques */}
                <Route
                    path="/statistiques"
                    element={<Statistiques />}
                />

                {/* Mes paramètres */}
                <Route
                    path="/parametres"
                    element={<Parametres />}
                />

                {/* Ma page de test API */}
                <Route
                    path="/test"
                    element={<TestAPI />}
                />

            </Routes>

        </div>
    );
}

export default App;
