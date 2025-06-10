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
  XOF: {
    symbol: "FCFA",
    code: "XOF",
    name: "Franc CFA BCEAO",
  },
  XAF: {
    symbol: "FCFA",
    code: "XAF",
    name: "Franc CFA BEAC",
  },
  EUR: {
    symbol: "€",
    code: "EUR",
    name: "Euro",
  },
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
  BANK_TRANSFER: "bank-transfer",
  CASH: "cash",
  WALLET: "wallet",
  MONEY_TRANSFER: "money-transfer",
};

// Configuration détaillée des méthodes de paiement par type
export const PAYMENT_METHODS = {
  [PAYMENT_TYPES.MOBILE_MONEY]: [
    { id: "orange-money", name: "Orange Money" },
    { id: "m-pesa", name: "M-Pesa" },
    { id: "afrimoney", name: "Afrimoney" },
    { id: "airtel-money", name: "Airtel Money" },
    { id: "mtn-mobile-money", name: "MTN Mobile Money" },
    { id: "moov-money", name: "Moov Money" },
  ],
  [PAYMENT_TYPES.CREDIT_CARD]: [
    { id: "visa", name: "Visa" },
    { id: "mastercard", name: "Mastercard" },
    { id: "american-express", name: "American Express" },
  ],
  [PAYMENT_TYPES.WALLET]: [
    { id: "solifin-wallet", name: "Portefeuille Solifin" },
  ],
  [PAYMENT_TYPES.MONEY_TRANSFER]: [
    { id: "western-union", name: "Western Union" },
    { id: "moneygram", name: "MoneyGram" },
    { id: "ria", name: "Ria Money Transfer" },
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
