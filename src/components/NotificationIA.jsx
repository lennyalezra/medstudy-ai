import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import "./NotificationIA.css";

function NotificationIA() {

    const navigate = useNavigate();
    const { utilisateur } = useAuth();

    const anciensStatuts = useRef(new Map());
    const [notifications, setNotifications] = useState([]);

    // Je surveille mes générations
    useEffect(() => {

        anciensStatuts.current = new Map();
        setNotifications([]);

        if (!utilisateur) return;

        const controller = new AbortController();
        let minuterie;

        async function verifierGenerations() {
            try {
                const cours = await api("/cours", {
                    signal: controller.signal
                });

                if (controller.signal.aborted) return;

                const nouvellesNotifications = [];

                for (const unCours of cours) {

                    const ancienStatut =
                        anciensStatuts.current.get(unCours.id);

                    const etaitEnCours = [
                        "file_attente",
                        "analyse",
                        "generation"
                    ].includes(ancienStatut);

                    if (
                        etaitEnCours &&
                        unCours.statut_ia === "termine" &&
                        unCours.fiche_id
                    ) {
                        nouvellesNotifications.push({
                            id: `${unCours.id}-${Date.now()}`,
                            nom: unCours.nom,
                            ficheId: unCours.fiche_id,
                            erreur: false
                        });
                    }

                    if (
                        etaitEnCours &&
                        unCours.statut_ia === "erreur"
                    ) {
                        nouvellesNotifications.push({
                            id: `${unCours.id}-${Date.now()}`,
                            nom: unCours.nom,
                            erreur: true
                        });
                    }

                    anciensStatuts.current.set(
                        unCours.id,
                        unCours.statut_ia
                    );
                }

                if (nouvellesNotifications.length > 0) {
                    setNotifications(anciennes => [
                        ...anciennes,
                        ...nouvellesNotifications
                    ].slice(-5));
                }

            } catch (err) {
                if (!controller.signal.aborted) {
                    console.error(err.message);
                }

            } finally {
                if (!controller.signal.aborted) {
                    minuterie = setTimeout(
                        verifierGenerations,
                        3000
                    );
                }
            }
        }

        verifierGenerations();

        return () => {
            controller.abort();
            clearTimeout(minuterie);
        };

    }, [utilisateur?.id]);

    // Je ferme ma notification
    function fermerNotification(id) {
        setNotifications(anciennes =>
            anciennes.filter(notification =>
                notification.id !== id
            )
        );
    }

    return (
        <div
            className="notifications-ia"
            aria-live="polite"
        >

            {notifications.map(notification => (

                <div
                    className="notification-ia"
                    key={notification.id}
                >

                    <button
                        className="notification-ia-fermer"
                        aria-label="Fermer la notification"
                        onClick={() =>
                            fermerNotification(notification.id)
                        }
                    >
                        ×
                    </button>

                    <h3>
                        {notification.erreur
                            ? "Génération interrompue"
                            : "Votre fiche est prête !"}
                    </h3>

                    <p>{notification.nom}</p>

                    <button
                        className="notification-ia-action"
                        onClick={() => {

                            navigate(
                                notification.erreur
                                    ? "/cours"
                                    : `/fiches?fiche=${notification.ficheId}`
                            );

                            fermerNotification(notification.id);
                        }}
                    >
                        {notification.erreur
                            ? "Voir mes cours"
                            : "Consulter ma fiche"}
                    </button>

                </div>

            ))}

        </div>
    );
}

export default NotificationIA;