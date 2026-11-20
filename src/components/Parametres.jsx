
import { useState } from "react";
import {
    Settings,
    GraduationCap,
    Bell,
    Save,
    CheckCircle2,
    ShieldCheck
} from "lucide-react";

const preferencesInitiales = {
    formatFiche: "synthetique",
    niveauDetail: "equilibre",
    genererQuiz: true,
    afficherProgression: true,
    notifications: false
};

function Parametres() {

    // Je récupère mes préférences enregistrées
    const [preferences, setPreferences] = useState(() => {
        const sauvegarde = localStorage.getItem(
            "medstudy-preferences"
        );

        if (sauvegarde) {
            try {
                return {
                    ...preferencesInitiales,
                    ...JSON.parse(sauvegarde)
                };
            } catch {
                return preferencesInitiales;
            }
        }

        return preferencesInitiales;
    });

    // Je gère le message de confirmation
    const [enregistre, setEnregistre] = useState(false);

    // Je modifie une préférence
    function modifierPreference(nom, valeur) {
        setPreferences({
            ...preferences,
            [nom]: valeur
        });

        setEnregistre(false);
    }

    // J'enregistre mes préférences
    function enregistrerPreferences() {
        localStorage.setItem(
            "medstudy-preferences",
            JSON.stringify(preferences)
        );

        setEnregistre(true);
    }

    return (
        <main className="med-page">

            <div className="med-page-header">
                <div className="med-page-icon">
                    <Settings size={30} />
                </div>

                <div>
                    <h1>Paramètres</h1>
                    <p>
                        Personnalise ton expérience sur MedStudy AI.
                    </p>
                </div>
            </div>

            <div className="med-settings-grid">

                <section className="med-settings-card">

                    <div className="med-settings-heading">
                        <GraduationCap size={28} />

                        <div>
                            <h2>Préférences de révision</h2>
                            <p>
                                Prépare tes futurs outils de révision.
                            </p>
                        </div>
                    </div>

                    <label className="med-field">
                        <span>Format des fiches IA</span>

                        <select
                            value={preferences.formatFiche}
                            onChange={(e) =>
                                modifierPreference(
                                    "formatFiche",
                                    e.target.value
                                )
                            }
                        >
                            <option value="synthetique">
                                Fiche synthétique
                            </option>
                            <option value="detaillee">
                                Fiche détaillée
                            </option>
                            <option value="points">
                                Points essentiels
                            </option>
                        </select>
                    </label>

                    <label className="med-field">
                        <span>Niveau de détail</span>

                        <select
                            value={preferences.niveauDetail}
                            onChange={(e) =>
                                modifierPreference(
                                    "niveauDetail",
                                    e.target.value
                                )
                            }
                        >
                            <option value="court">
                                Court
                            </option>
                            <option value="equilibre">
                                Équilibré
                            </option>
                            <option value="approfondi">
                                Approfondi
                            </option>
                        </select>
                    </label>

                    <label className="med-toggle-row">
                        <span>
                            Générer automatiquement des quiz
                            <small>
                                Préférence pour la future génération IA
                            </small>
                        </span>

                        <input
                            type="checkbox"
                            checked={preferences.genererQuiz}
                            onChange={(e) =>
                                modifierPreference(
                                    "genererQuiz",
                                    e.target.checked
                                )
                            }
                        />
                    </label>

                    <label className="med-toggle-row">
                        <span>
                            Suivre ma progression
                            <small>
                                Préférence pour les futures statistiques
                            </small>
                        </span>

                        <input
                            type="checkbox"
                            checked={preferences.afficherProgression}
                            onChange={(e) =>
                                modifierPreference(
                                    "afficherProgression",
                                    e.target.checked
                                )
                            }
                        />
                    </label>

                </section>

                <section className="med-settings-card">

                    <div className="med-settings-heading">
                        <Bell size={28} />

                        <div>
                            <h2>Notifications</h2>
                            <p>
                                Prépare tes futurs rappels de révision.
                            </p>
                        </div>
                    </div>

                    <label className="med-toggle-row">
                        <span>
                            Rappels de révision
                            <small>
                                Option enregistrée, rappels pas encore actifs
                            </small>
                        </span>

                        <input
                            type="checkbox"
                            checked={preferences.notifications}
                            onChange={(e) =>
                                modifierPreference(
                                    "notifications",
                                    e.target.checked
                                )
                            }
                        />
                    </label>

                    <div className="med-settings-note">
                        <ShieldCheck size={24} />

                        <p>
                            Tes préférences sont actuellement
                            enregistrées dans ce navigateur.
                            Elles ne sont pas encore liées à un compte.
                        </p>
                    </div>

                </section>

            </div>

            <div className="med-settings-footer">

                {enregistre && (
                    <p className="med-saved-message">
                        <CheckCircle2 size={19} />
                        Préférences enregistrées !
                    </p>
                )}

                <button
                    className="med-primary-btn"
                    onClick={enregistrerPreferences}
                >
                    <Save size={19} />
                    Enregistrer les modifications
                </button>

            </div>

        </main>
    );
}

export default Parametres;
