import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TestAPI from "./components/TestAPI";
import ImportCourses from "./components/ImportCourses";
import MesCours from "./components/MesCours";
import FichesRevision from "./components/FichesRevision";
import QuizQCM from "./components/QuizQCM";
import Flashcards from "./components/Flashcards";
import Statistiques from "./components/Statistiques";
import Parametres from "./components/Parametres";

import { Routes, Route } from "react-router-dom";

import "./App.css";
import "./Revision.css";

function App() {

    return (
        <div className="app-container">

            {/* J'affiche ma barre de navigation */}
            <Sidebar />

            {/* Je relie mes pages à leurs adresses */}
            <Routes>

                <Route
                    path="/"
                    element={<Dashboard />}
                />

                <Route
                    path="/importer"
                    element={<ImportCourses />}
                />

                <Route
                    path="/cours"
                    element={<MesCours />}
                />

                <Route
                    path="/fiches"
                    element={<FichesRevision />}
                />

                <Route
                    path="/quiz"
                    element={<QuizQCM />}
                />

                <Route
                    path="/flashcards"
                    element={<Flashcards />}
                />

                <Route
                    path="/statistiques"
                    element={<Statistiques />}
                />

                <Route
                    path="/parametres"
                    element={<Parametres />}
                />

                <Route
                    path="/test"
                    element={<TestAPI />}
                />

            </Routes>

        </div>
    );
}

export default App;