/**
 * Exemple d'utilisation du CurrencyContext dans un composant
 *
 * Ce fichier montre comment utiliser le contexte de devise pour
 * conditionner l'affichage des fonctionnalités CDF dans l'application.
 */

import React from "react";
import { useCurrency } from "../contexts/CurrencyContext";

const ExempleComposant = () => {
  const { isCDFEnabled, loading, error, canUseCDF, availableCurrencies } =
    useCurrency();

  // Pendant le chargement
  if (loading) {
    return <div>Chargement de la configuration des devises...</div>;
  }

  // En cas d'erreur
  if (error) {
    return <div>Erreur de chargement: {error.message}</div>;
  }

  return (
    <div>
      <h2>Configuration des devises</h2>

      {/* Affichage des informations de débogage */}
      <div
        style={{
          padding: "10px",
          backgroundColor: "#f5f5f5",
          marginBottom: "20px",
        }}
      >
        <p>
          <strong>CDF activé:</strong> {isCDFEnabled ? "Oui" : "Non"}
        </p>
        <p>
          <strong>Peut utiliser CDF:</strong> {canUseCDF() ? "Oui" : "Non"}
        </p>
        <p>
          <strong>Devises disponibles:</strong> {availableCurrencies.join(", ")}
        </p>
      </div>

      {/* Exemple: Affichage conditionnel d'options CDF */}
      <div>
        <h3>Sélection de la devise</h3>
        <select>
          <option value="USD">USD - Dollar Américain</option>
          {canUseCDF() && <option value="CDF">CDF - Franc Congolais</option>}
        </select>
      </div>

      {/* Exemple: Message informatif */}
      {!isCDFEnabled && (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "5px",
            marginTop: "20px",
          }}
        >
          <p>
            <strong>Information:</strong> Les transactions en Francs Congolais
            (CDF) sont actuellement désactivées. Seules les transactions en
            Dollars Américains (USD) sont disponibles.
          </p>
        </div>
      )}

      {/* Exemple: Cartes de sélection de devise */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div
          style={{
            padding: "20px",
            border: "2px solid #007bff",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          <h4>USD</h4>
          <p>Dollar Américain</p>
        </div>

        {canUseCDF() && (
          <div
            style={{
              padding: "20px",
              border: "2px solid #28a745",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <h4>CDF</h4>
            <p>Franc Congolais</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExempleComposant;
