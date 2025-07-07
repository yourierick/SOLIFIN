/**
 * Configuration globale de l'application
 * Ce fichier centralise les variables de configuration utilisées dans l'application
 */

// URL de base de l'API
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Configuration des timeouts pour les requêtes API
export const API_TIMEOUT = 30000; // 30 secondes

// Configuration des formats de date
export const DATE_FORMAT = {
  default: "DD/MM/YYYY",
  withTime: "DD/MM/YYYY HH:mm",
  iso: "YYYY-MM-DD",
};

// Configuration des devises
export const CURRENCIES = {
  USD: {
    symbol: "$",
    code: "USD",
    name: "Dollar américain",
  },
  CDF: {
    symbol: "FC",
    code: "CDF",
    name: "Franc Congolais",
  },
};

// Limites de pagination par défaut
export const PAGINATION = {
  defaultLimit: 10,
  options: [5, 10, 25, 50, 100],
};

// Configuration des types de paiement
export const PAYMENT_TYPES = {
  MOBILE_MONEY: "mobile-money",
  CREDIT_CARD: "credit-card",
};

// Configuration détaillée des méthodes de paiement par type
export const PAYMENT_METHODS = {
  [PAYMENT_TYPES.MOBILE_MONEY]: [
    { id: "orange-money", name: "Orange Money" },
    { id: "m-pesa", name: "M-Pesa" },
    { id: "afrimoney", name: "Afrimoney" },
    { id: "airtel-money", name: "Airtel Money" },
  ],
  [PAYMENT_TYPES.CREDIT_CARD]: [
    { id: "visa", name: "Visa" },
    { id: "mastercard", name: "Mastercard" },
    { id: "american-express", name: "American Express" },
  ],
};

export default {
  API_URL,
  API_TIMEOUT,
  DATE_FORMAT,
  CURRENCIES,
  PAGINATION,
  PAYMENT_TYPES,
  PAYMENT_METHODS,
};
