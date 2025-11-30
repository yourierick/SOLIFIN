import React from "react";
import PromptLoginOrSubscribe from "../components/PromptLoginOrSubscribe";

/**
 * Page : PromptLoginOrSubscribePage
 * Affiche le composant d'invitation à la connexion ou à la souscription dans une page dédiée.
 * Peut être utilisée pour rediriger les utilisateurs non authentifiés depuis d'autres pages.
 */
export default function PromptLoginOrSubscribePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <PromptLoginOrSubscribe />
    </div>
  );
}
