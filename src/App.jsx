import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import EspaceDashboard from "./components/EspaceDashboard";
import EspaceCours from "./components/EspaceCours";
import Entrainement from "./components/Entrainement";
import FichesRevision from "./components/FichesRevision";
import Connexion from "./components/Connexion";
import Inscription from "./components/Inscription";
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationIA from "./components/NotificationIA";
import Plus from "./components/Plus";

import { AuthProvider } from "./context/AuthContext";

import "./App.css";
import "./Revision.css";
import "./Auth.css";
import "./Plus.css";
import "./Navigation.css";

// Je protège mon espace personnel
function EspacePersonnel() {

    return (
        <ProtectedRoute>

            <div className="app-container">

                <Sidebar />

                <NotificationIA />

                <div className="main-content">

                    <Routes>

                        <Route
                            path="/"
                            element={<EspaceDashboard />}
                        />

                        <Route
                            path="/cours"
                            element={<EspaceCours />}
                        />

                        <Route
                            path="/fiches"
                            element={<FichesRevision />}
                        />

                        <Route
                            path="/entrainement"
                            element={<Entrainement />}
                        />

                        <Route
                            path="/assistant"
                            element={
                                <Plus
                                    key="assistant"
                                    mode="assistant"
                                />
                            }
                        />

                        <Route
                            path="/parametres"
                            element={
                                <Plus
                                    key="profil"
                                    mode="profil"
                                />
                            }
                        />

                        {/* Je redirige mes anciennes pages */}

                        <Route
                            path="/importer"
                            element={
                                <Navigate
                                    to="/cours?onglet=importer"
                                    replace
                                />
                            }
                        />

                        <Route
                            path="/quiz"
                            element={
                                <Navigate
                                    to="/entrainement?onglet=qcm"
                                    replace
                                />
                            }
                        />

                        <Route
                            path="/flashcards"
                            element={
                                <Navigate
                                    to="/entrainement?onglet=flashcards"
                                    replace
                                />
                            }
                        />

                        <Route
                            path="/statistiques"
                            element={
                                <Navigate
                                    to="/?onglet=statistiques"
                                    replace
                                />
                            }
                        />

                        <Route
                            path="/organisation"
                            element={<Navigate to="/cours" replace />}
                        />

                        <Route
                            path="/planning"
                            element={<Navigate to="/" replace />}
                        />

                        <Route
                            path="*"
                            element={<Navigate to="/" replace />}
                        />

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

                <Route
                    path="/connexion"
                    element={<Connexion />}
                />

                <Route
                    path="/inscription"
                    element={<Inscription />}
                />

                <Route
                    path="/*"
                    element={<EspacePersonnel />}
                />

            </Routes>

        </AuthProvider>
    );
}

export default App;