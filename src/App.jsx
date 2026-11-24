import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ImportCourses from "./components/ImportCourses";
import MesCours from "./components/MesCours";
import FichesRevision from "./components/FichesRevision";
import QuizQCM from "./components/QuizQCM";
import Flashcards from "./components/Flashcards";
import Statistiques from "./components/Statistiques";
import Parametres from "./components/Parametres";
import Connexion from "./components/Connexion";
import Inscription from "./components/Inscription";
import ProtectedRoute from "./components/ProtectedRoute";

import { AuthProvider } from "./context/AuthContext";

import "./App.css";
import "./Revision.css";
import "./Auth.css";

// Je protège mon espace personnel
function EspacePersonnel() {
    return (
        <ProtectedRoute>

            <div className="app-container">

                <Sidebar />

                <div className="main-content">

                    <Routes>

                        <Route path="/" element={<Dashboard />} />

                        <Route path="/cours" element={<MesCours />} />

                        <Route path="/importer" element={<ImportCourses />} />

                        <Route path="/fiches" element={<FichesRevision />} />

                        <Route path="/quiz" element={<QuizQCM />} />

                        <Route path="/flashcards" element={<Flashcards />} />

                        <Route path="/statistiques" element={<Statistiques />} />

                        <Route path="/parametres" element={<Parametres />} />

                        <Route path="*" element={<Navigate to="/" replace />} />

                    </Routes>

                </div>

            </div>

        </ProtectedRoute>
    );
}

// Je relie mes pages à mon authentification
function App() {
    return (
        <AuthProvider>

            <Routes>

                <Route path="/connexion" element={<Connexion />} />

                <Route path="/inscription" element={<Inscription />} />

                <Route path="/*" element={<EspacePersonnel />} />

            </Routes>

        </AuthProvider>
    );
}

export default App;