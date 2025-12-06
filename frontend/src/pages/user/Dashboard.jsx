import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import DashboardCarousel from "../../components/DashboardCarousel";
import TrialAlert from "../../components/TrialAlert";
import {
  BanknotesIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  GiftIcon,
  ChartBarIcon,
  PhotoIcon,
  HomeIcon,
  TrophyIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import axios from "../../utils/axios";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const getStatusColor = (status, isDarkMode) => {
  switch (status) {
    case "completed":
      return isDarkMode
        ? "bg-green-900 text-green-300"
        : "bg-green-100 text-green-800";
    case "pending":
      return isDarkMode
        ? "bg-yellow-900 text-yellow-300"
        : "bg-yellow-100 text-yellow-800";
    case "failed":
      return isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800";
    default:
      return isDarkMode
        ? "bg-gray-700 text-gray-300"
        : "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "completed":
      return "Complété";
    case "pending":
      return "En attente";
    case "failed":
      return "Échoué";
    default:
      return status;
  }
};

export default function UserDashboard() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { isCDFEnabled, canUseCDF, selectedCurrency } = useCurrency();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trialAlert, setTrialAlert] = useState(null);

  useEffect(() => {
    fetchStats();
    checkTrialStatus();
  }, [selectedCurrency]); // Recharger les stats quand la devise change

  // Vérifier si l'utilisateur est en période d'essai en utilisant localStorage
  const checkTrialStatus = () => {
    try {
      const trialInfoStr = localStorage.getItem("trialInfo");
      if (trialInfoStr) {
        const trialInfo = JSON.parse(trialInfoStr);

        if (trialInfo && trialInfo.isTrialUser) {
          const { daysRemaining } = trialInfo;

          // Déterminer le type d'alerte en fonction des jours restants
          let alertType = "info";
          if (daysRemaining <= 3) {
            alertType = "error";
          } else if (daysRemaining <= 7) {
            alertType = "warning";
          }

          // Configurer l'alerte de période d'essai
          setTrialAlert({
            type: alertType,
            message: trialInfo.message,
          });

          // Supprimer l'info du localStorage pour ne l'afficher qu'une fois
          localStorage.removeItem("trialInfo");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut d'essai:", error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Inclure la devise dans les paramètres de l'API
      const params = new URLSearchParams();
      if (isCDFEnabled) {
        params.append('currency', selectedCurrency);
      } else {
        params.append('currency', 'USD');
      }
      
      const response = await axios.get(`/api/stats/global?${params.toString()}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      setError("Erreur lors de la récupération des statistiques");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`space-y-6 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}
    >
      {trialAlert && (
        <TrialAlert
          type={trialAlert.type}
          message={trialAlert.message}
          onClose={() => setTrialAlert(null)}
        />
      )}

      {/* Carrousel */}
      <SectionDivider
        title="Actualités et événements"
        icon={
          <HomeIcon
            className={`h-6 w-6 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
        }
        isDarkMode={isDarkMode}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`p-6 rounded-xl ${
          isDarkMode 
            ? "bg-gray-800/50 border border-gray-700/50" 
            : "bg-gray-50 border border-gray-200"
        }`}
      >
        <DashboardCarousel />
      </motion.div>

      {/* Statistiques */}
      <SectionDivider
        title="Vos statistiques financières"
        icon={
          <ChartBarIcon
            className={`h-6 w-6 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
        }
        isDarkMode={isDarkMode}
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          // Afficher des squelettes de chargement modernes avec couleurs spécifiques
          <>
            {/* Squelette Solde (Bleu) */}
            <motion.div
              key="balance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 * 0.1 }}
              className={`relative rounded-2xl shadow-lg p-6 overflow-hidden ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                  : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
              }`}
            >
              <div
                className="absolute top-0 left-0 w-24 h-24 opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${
                    isDarkMode
                      ? "rgba(59, 130, 246, 0.20)"
                      : "rgba(59, 130, 246, 0.15)"
                  } 0%, transparent 70%)`,
                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                }}
              />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 p-3 rounded-xl ${
                        isDarkMode
                          ? "bg-gradient-to-br from-primary-600/20 to-primary-700/20 border border-primary-500/30"
                          : "bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-300"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`h-4 w-24 rounded-sm mb-2 ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                      <div className="space-y-2">
                        <div
                          className={`h-6 w-20 rounded-sm ${
                            isDarkMode ? "bg-gray-600" : "bg-gray-300"
                          } animate-pulse`}
                        />
                        <div
                          className={`h-4 w-16 rounded-sm ${
                            isDarkMode ? "bg-gray-600" : "bg-gray-300"
                          } animate-pulse`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-4 pt-4 border-t ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-1 w-16 rounded-full ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-3 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Squelette Commissions (Vert) */}
            <motion.div
              key="commission"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 * 0.1 }}
              className={`relative rounded-2xl shadow-lg p-6 overflow-hidden ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                  : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
              }`}
            >
              <div
                className="absolute top-0 left-0 w-24 h-24 opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${
                    isDarkMode
                      ? "rgba(16, 185, 129, 0.20)"
                      : "rgba(16, 185, 129, 0.15)"
                  } 0%, transparent 70%)`,
                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                }}
              />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 p-3 rounded-xl ${
                        isDarkMode
                          ? "bg-gradient-to-br from-primary-600/20 to-primary-700/20 border border-primary-500/30"
                          : "bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-300"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`h-4 w-32 rounded-sm mb-2 ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                      <div className="space-y-2">
                        <div
                          className={`h-6 w-24 rounded-sm ${
                            isDarkMode ? "bg-gray-600" : "bg-gray-300"
                          } animate-pulse`}
                        />
                        <div
                          className={`h-4 w-20 rounded-sm ${
                            isDarkMode ? "bg-gray-600" : "bg-gray-300"
                          } animate-pulse`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-4 pt-4 border-t ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-1 w-16 rounded-full ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-3 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Squelette Retraits (Orange) */}
            <motion.div
              key="withdrawal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 * 0.1 }}
              className={`relative rounded-2xl shadow-lg p-6 overflow-hidden ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                  : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
              }`}
            >
              <div
                className="absolute top-0 left-0 w-24 h-24 opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${
                    isDarkMode
                      ? "rgba(251, 146, 60, 0.20)"
                      : "rgba(251, 146, 60, 0.15)"
                  } 0%, transparent 70%)`,
                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                }}
              />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 p-3 rounded-xl ${
                        isDarkMode
                          ? "bg-gradient-to-br from-primary-600/20 to-primary-700/20 border border-primary-500/30"
                          : "bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-300"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`h-4 w-28 rounded-sm mb-2 ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                      <div
                        className={`h-8 w-12 rounded-sm ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                    </div>
                  </div>
                  {/* Badge de squelette */}
                  <div
                    className={`absolute -top-2 -right-2 h-6 w-20 rounded-full ${
                      isDarkMode ? "bg-orange-900/60" : "bg-orange-100"
                    } animate-pulse`}
                  />
                </div>

                <div
                  className={`mt-4 pt-4 border-t ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-1 w-16 rounded-full ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-3 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Squelette Filleuls (Violet) */}
            <motion.div
              key="referrals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3 * 0.1 }}
              className={`relative rounded-2xl shadow-lg p-6 overflow-hidden ${
                isDarkMode
                  ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                  : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
              }`}
            >
              <div
                className="absolute top-0 left-0 w-24 h-24 opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${
                    isDarkMode
                      ? "rgba(147, 51, 234, 0.20)"
                      : "rgba(147, 51, 234, 0.15)"
                  } 0%, transparent 70%)`,
                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                }}
              />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex-shrink-0 p-3 rounded-xl ${
                        isDarkMode
                          ? "bg-gradient-to-br from-primary-600/20 to-primary-700/20 border border-primary-500/30"
                          : "bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-300"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`h-4 w-28 rounded-sm mb-2 ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                      <div
                        className={`h-8 w-8 rounded-sm ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        } animate-pulse`}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-4 pt-4 border-t ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-1 w-16 rounded-full ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-3 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <>
            <StatCard
              icon={
                <BanknotesIcon
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-primary-400" : "text-primary-600"
                  }`}
                />
              }
              title="Solde actuel"
              value={
                <div className="space-y-1">
                  <div className="text-sm">
                    {selectedCurrency === "USD" ? (
                      <>USD: ${parseFloat(
                        stats?.general_stats?.wallet?.balance_usd || "0"
                      ).toFixed(2) || "0.00"}</>
                    ) : (
                      <>CDF: {new Intl.NumberFormat("fr-CD", {
                        style: "currency",
                        currency: "CDF",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(
                        parseFloat(
                          stats?.general_stats?.wallet?.balance_cdf || "0"
                        )
                      )}</>
                    )}
                  </div>
                </div>
              }
              isDarkMode={isDarkMode}
              cardType="balance"
            />

            <StatCard
              icon={
                <GiftIcon
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-primary-400" : "text-primary-600"
                  }`}
                />
              }
              title={`Commissions mensuelles (${selectedCurrency})`}
              value={
                <div className="space-y-1">
                  <div className="text-sm">
                    {selectedCurrency === "USD" ? (
                      <>USD: ${parseFloat(
                        stats?.financial_info?.commission_by_currency?.usd
                          ?.completed || "0"
                      ).toFixed(2) || "0.00"}</>
                    ) : (
                      <>CDF: {new Intl.NumberFormat("fr-CD", {
                        style: "currency",
                        currency: "CDF",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(
                        parseFloat(
                          stats?.financial_info?.commission_by_currency?.cdf
                            ?.completed || "0"
                        )
                      )}</>
                    )}
                  </div>
                </div>
              }
              isDarkMode={isDarkMode}
              cardType="commission"
            />

            <StatCard
              icon={
                <ArrowDownTrayIcon
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-primary-400" : "text-primary-600"
                  }`}
                />
              }
              title="Demandes de retrait"
              value={`${stats?.withdrawals.stats.pending_count || 0}`}
              isDarkMode={isDarkMode}
              badge={
                stats?.withdrawals.stats.pending_count > 0
                  ? {
                      text: `${stats?.withdrawals.stats.pending_count} en attente`,
                      color: isDarkMode
                        ? "bg-orange-900/90 text-orange-300 border-orange-600/50 backdrop-blur-sm"
                        : "bg-orange-100 text-orange-800 border-orange-300",
                    }
                  : null
              }
              cardType="withdrawal"
            />

            <StatCard
              icon={
                <UsersIcon
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-primary-400" : "text-primary-600"
                  }`}
                />
              }
              title="Total des filleuls"
              value={stats?.general_stats?.total_referrals || 0}
              isDarkMode={isDarkMode}
              cardType="referrals"
            />
          </>
        )}
      </div>

      {/* Graphiques financiers */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Graphique des commissions mensuelles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-lg p-6 shadow-sm ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {loading ? (
            // Squelette de chargement pour le graphique
            <div>
              <div
                className={`h-6 w-40 rounded mb-2 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                } animate-pulse`}
              />
              <div
                className={`h-4 w-48 rounded mb-4 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                } animate-pulse`}
              />
              <div
                className={`h-64 rounded ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                } animate-pulse`}
              />
            </div>
          ) : (
            <>
              <h3
                className={`text-lg font-semibold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Évolution des commissions ({selectedCurrency})
              </h3>
              {selectedCurrency === "CDF" && (
                <p
                  className={`text-sm mb-4 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  * Les montants CDF sont affichés en milliers (K CDF)
                </p>
              )}
              {stats?.progression?.monthly_commissions && (
                <div className="h-64">
                  <Line
                    data={{
                      labels: Object.keys(
                        stats.progression.monthly_commissions
                      ).reverse(),
                      datasets: [
                        {
                          label: selectedCurrency === "USD" 
                            ? "Commissions USD ($)" 
                            : "Commissions CDF (K)",
                          data: Object.values(
                            stats.progression.monthly_commissions
                          )
                            .map((item) => 
                              selectedCurrency === "USD" 
                                ? (item.usd || 0)
                                : (item.cdf || 0) / 1000 // Convertir en milliers pour CDF
                            )
                            .reverse(),
                          borderColor: selectedCurrency === "USD" ? "#3b82f6" : "#10b981",
                          backgroundColor: selectedCurrency === "USD" 
                            ? "rgba(59, 130, 246, 0.5)" 
                            : "rgba(16, 185, 129, 0.5)",
                          tension: 0.3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "top",
                          labels: {
                            color: isDarkMode ? "#e5e7eb" : "#374151",
                          },
                        },
                      },
                      scales: {
                        y: {
                          ticks: {
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            callback: function(value) {
                              if (selectedCurrency === "CDF") {
                                return value + 'K';
                              }
                              return '$' + value;
                            }
                          },
                          grid: {
                            color: isDarkMode
                              ? "rgba(75, 85, 99, 0.2)"
                              : "rgba(209, 213, 219, 0.5)",
                          },
                        },
                        x: {
                          ticks: {
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                          },
                          grid: {
                            display: false,
                          },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Graphique des inscriptions mensuelles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-lg p-6 shadow-sm ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {loading ? (
            // Squelette de chargement pour le graphique
            <div>
              <div
                className={`h-6 w-40 rounded mb-4 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                } animate-pulse`}
              />
              <div
                className={`h-64 rounded ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                } animate-pulse`}
              />
            </div>
          ) : (
            <>
              <h3
                className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Évolution des inscriptions
              </h3>
              {stats?.progression?.monthly_signups && (
                <div className="h-64">
                  <Bar
                    data={{
                      labels: Object.keys(
                        stats.progression.monthly_signups
                      ).reverse(),
                      datasets: [
                        {
                          label: "Nouveaux filleuls",
                          data: Object.values(
                            stats.progression.monthly_signups
                          ).reverse(),
                          backgroundColor: isDarkMode
                            ? "rgba(147, 51, 234, 0.5)"
                            : "rgba(147, 51, 234, 0.3)",
                          borderColor: "#9333ea",
                          borderWidth: 2,
                          borderRadius: 6,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          position: "top",
                          labels: {
                            color: isDarkMode ? "#e5e7eb" : "#374151",
                            font: {
                              size: 12,
                            },
                          },
                        },
                        tooltip: {
                          backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                          titleColor: isDarkMode ? "#e5e7eb" : "#374151",
                          bodyColor: isDarkMode ? "#e5e7eb" : "#374151",
                          borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                          borderWidth: 1,
                        },
                      },
                      scales: {
                        x: {
                          grid: {
                            display: false,
                          },
                          ticks: {
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                          },
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: isDarkMode ? "#374151" : "#e5e7eb",
                          },
                          ticks: {
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            stepSize: 1,
                          },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Demandes de retrait en attente */}
      {loading ? (
        // Squelette de chargement pour les demandes de retrait
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`mt-8 rounded-lg p-6 shadow-sm ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`h-6 w-48 rounded ${
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
              } animate-pulse`}
            />
            <div
              className={`h-5 w-20 rounded-full ${
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
              } animate-pulse`}
            />
          </div>
          <div className="overflow-x-auto">
            <div className="space-y-3">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`h-4 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-4 w-20 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-4 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-4 w-20 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                    <div
                      className={`h-4 w-16 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } animate-pulse`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        stats?.withdrawals?.pending &&
        stats.withdrawals.pending.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`mt-8 rounded-lg p-6 shadow-sm ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Demandes de retrait en attente
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {stats.withdrawals.pending.length} demande(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table
                className={`min-w-full divide-y divide-gray-200 ${
                  isDarkMode ? "divide-gray-700" : ""
                }`}
              >
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Montant
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Devise
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Méthode
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDarkMode ? "divide-gray-700" : "divide-gray-200"
                  }`}
                >
                  {stats.withdrawals.pending.map((withdrawal) => (
                    <tr key={withdrawal.id}>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {withdrawal.date}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {withdrawal.currency === "USD"
                          ? `$${parseFloat(withdrawal.amount).toFixed(2)}`
                          : new Intl.NumberFormat("fr-CD", {
                              style: "currency",
                              currency: "CDF",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(parseFloat(withdrawal.amount))}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            withdrawal.currency === "USD"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {withdrawal.currency === "USD" ? "$US" : "FC"}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {withdrawal.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          En attente
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )
      )}

      {/* Performances par pack - Jetons Esengo Hebdomadaires */}
      <SectionDivider
        title="Performance de vos packs - Jetons Esengo"
        icon={
          <GiftIcon
            className={`h-4 w-4 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
        }
        isDarkMode={isDarkMode}
      />
      <div>
        <div className="mb-4">
          <h3
            className={`text-lg font-medium leading-6 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Jetons Esengo obtenus cette semaine
          </h3>
          <p
            className={`mt-1 text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Performance hebdomadaire (lundi au dimanche) par pack d'affiliation
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats?.packs_performance?.map((pack, index) => {
            const weeklyReferrals = pack?.weekly_referrals || 0;
            const requiredReferrals = pack?.bonus_rates?.nombre_filleuls || 1;
            const tokensEarned = Math.floor(
              weeklyReferrals / requiredReferrals
            );
            const progressToNextToken =
              ((weeklyReferrals % requiredReferrals) / requiredReferrals) * 100;
            const tokensPerThreshold = pack?.bonus_rates?.points_attribues || 1;
            const totalTokensEarned = tokensEarned * tokensPerThreshold;

            return (
              <motion.div
                key={pack?.id || `pack-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`overflow-hidden rounded-xl px-4 py-5 shadow-lg sm:p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isDarkMode
                    ? "bg-gray-800 shadow-gray-900/50 border-gray-700"
                    : "bg-white shadow-gray-200/70 border-gray-100"
                }`}
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4
                        className={`text-lg font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {pack?.name || "Pack inconnu"}
                      </h4>
                      <p
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {requiredReferrals} filleul
                        {requiredReferrals > 1 ? "s" : ""} ={" "}
                        {tokensPerThreshold} jeton
                        {tokensPerThreshold > 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <div
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${
                          totalTokensEarned > 0
                            ? isDarkMode
                              ? "bg-green-900 text-green-200 border border-green-700"
                              : "bg-green-100 text-green-800 border border-green-300"
                            : isDarkMode
                            ? "bg-gray-700 text-gray-300 border border-gray-600"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        <GiftIcon className="h-4 w-4 mr-1" />
                        {totalTokensEarned} jeton
                        {totalTokensEarned > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Filleuls cette semaine
                        </p>
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {weeklyReferrals} / {requiredReferrals}
                        </span>
                      </div>

                      {/* Barre de progression */}
                      <div
                        className={`w-full rounded-full h-2 ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(progressToNextToken, 100)}%`,
                          }}
                        />
                      </div>

                      <p
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {progressToNextToken === 100
                          ? "Prochain jeton obtenu !"
                          : weeklyReferrals >= requiredReferrals
                          ? `${tokensEarned} jeton${
                              tokensEarned > 1 ? "s" : ""
                            } obtenu${tokensEarned > 1 ? "s" : ""} !`
                          : `Encore ${
                              requiredReferrals - weeklyReferrals
                            } filleul${
                              requiredReferrals - weeklyReferrals > 1 ? "s" : ""
                            } pour le prochain jeton`}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Total filleuls
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {pack?.total_referrals || 0}
                        </p>
                      </div>

                      <div>
                        <p
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Commissions
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {selectedCurrency === "USD"
                            ? `$${Number(
                                pack?.total_commissions_usd || 0
                              ).toFixed(2)}`
                            : new Intl.NumberFormat("fr-CD", {
                                style: "currency",
                                currency: "CDF",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(
                                Number(pack?.total_commissions_cdf || 0)
                              )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Indicateur de performance */}
                  <div>
                    <p
                      className={`text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Performance cette semaine
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {weeklyReferrals >= 10 ? (
                          <>
                            <span className="text-green-500 text-lg mr-2">
                              🔥
                            </span>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Excellent !
                            </span>
                          </>
                        ) : weeklyReferrals >= 6 ? (
                          <>
                            <span className="text-blue-500 text-lg mr-2">
                              ⭐
                            </span>
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              Bien !
                            </span>
                          </>
                        ) : weeklyReferrals >= 2 ? (
                          <>
                            <span className="text-yellow-500 text-lg mr-2">
                              📈
                            </span>
                            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                              En progression
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-400 text-lg mr-2">
                              💪
                            </span>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Commencez dès maintenant
                            </span>
                          </>
                        )}
                      </div>

                      {/* Système d'étoiles basé sur les filleuls (5 étoiles max) */}
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => {
                          // Chaque étoile représente 20% du seuil (2 filleuls = 1 étoile)
                          const starThreshold = (i + 1) * 2; // 2, 4, 6, 8, 10
                          const isStarActive = weeklyReferrals >= starThreshold;

                          return (
                            <motion.span
                              key={i}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.1 + i * 0.05 }}
                              className={`inline-block text-lg ${
                                isStarActive
                                  ? "text-yellow-500"
                                  : isDarkMode
                                  ? "text-gray-600"
                                  : "text-gray-300"
                              }`}
                              title={`Étoile ${
                                i + 1
                              }: ${starThreshold} filleuls`}
                            >
                              {isStarActive ? "★" : "☆"}
                            </motion.span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Texte informatif sur la progression */}
                    <p
                      className={`text-xs mt-2 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {weeklyReferrals >= 10
                        ? "🎉 Objectif atteint ! 10/10 filleuls"
                        : weeklyReferrals >= 8
                        ? `Plus que ${10 - weeklyReferrals} filleul${
                            10 - weeklyReferrals > 1 ? "s" : ""
                          } pour l'objectif !`
                        : weeklyReferrals >= 6
                        ? "Bon progression, continuez !"
                        : weeklyReferrals >= 4
                        ? "Vous êtes sur la bonne voie !"
                        : weeklyReferrals >= 2
                        ? "Début prometteur !"
                        : "Chaque filleul vous rapproche du jeton !"}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Information sur la période */}
        <div
          className={`mt-6 p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800/50 border-gray-700"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-start">
            <InformationCircleIcon
              className={`h-5 w-5 mt-0.5 mr-3 ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`}
            />
            <div>
              <p
                className={`text-sm font-medium ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                📅 Période hebdomadaire : Lundi au Dimanche
              </p>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Les jetons Esengo sont calculés chaque semaine en fonction du
                nombre de filleuls parrainés. Le compteur se réinitialise chaque
                lundi matin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant réutilisable pour les cartes de stats
function StatCard({
  icon,
  title,
  value,
  isDarkMode,
  badge = null,
  cardType = "default",
}) {
  // Définition des couleurs pour chaque type de carte
  const cardColors = {
    balance: {
      light: "rgba(59, 130, 246, 0.15)", // Bleu pour solde
      dark: "rgba(59, 130, 246, 0.20)",
    },
    commission: {
      light: "rgba(16, 185, 129, 0.15)", // Vert pour commissions
      dark: "rgba(16, 185, 129, 0.20)",
    },
    withdrawal: {
      light: "rgba(251, 146, 60, 0.15)", // Orange pour retraits
      dark: "rgba(251, 146, 60, 0.20)",
    },
    referrals: {
      light: "rgba(147, 51, 234, 0.15)", // Violet pour filleuls
      dark: "rgba(147, 51, 234, 0.20)",
    },
    default: {
      light: "rgba(99, 102, 241, 0.15)", // Indigo par défaut
      dark: "rgba(99, 102, 241, 0.20)",
    },
  };

  const colors = cardColors[cardType] || cardColors.default;
  const currentColor = isDarkMode ? colors.dark : colors.light;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      whileHover={{
        y: -4,
        boxShadow: isDarkMode
          ? "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
          : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      className={`relative rounded-2xl shadow-lg p-6 overflow-hidden transition-all duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
          : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
      }`}
    >
      {/* Coin supérieur gauche avec couleur transparente */}
      <div
        className="absolute top-0 left-0 w-24 h-24 opacity-60"
        style={{
          background: `linear-gradient(135deg, ${
            isDarkMode ? "rgba(251, 146, 60, 0.20)" : "rgba(251, 146, 60, 0.15)"
          } 0%, transparent 70%)`,
          clipPath: "polygon(0 0, 100% 0, 0 100%)",
        }}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={`flex-shrink-0 p-3 rounded-xl ${
                isDarkMode
                  ? "bg-gradient-to-br from-primary-600/20 to-primary-700/20 border border-primary-500/30"
                  : "bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-300"
              }`}
            >
              <div
                className={`transform transition-transform duration-300 group-hover:scale-110`}
              >
                {icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <dt
                className={`text-sm font-semibold uppercase tracking-wide ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {title}
              </dt>
              <dd
                className={`mt-2 text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {typeof value === "string" ? (
                  <div dangerouslySetInnerHTML={{ __html: value }} />
                ) : (
                  value
                )}
              </dd>
            </div>
          </div>

          {badge && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`absolute -top-2 -right-2 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border shadow-lg ${
                badge.color ||
                (isDarkMode
                  ? "bg-yellow-900/90 text-yellow-300 border-yellow-600/50 backdrop-blur-sm"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300")
              }`}
            >
              <span className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse" />
              {badge.text}
            </motion.div>
          )}
        </div>

        {/* Ligne décorative en bas */}
        <div
          className={`mt-4 pt-4 border-t ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`h-1 w-16 rounded-full ${
                isDarkMode
                  ? "bg-gradient-to-r from-primary-500 to-primary-600"
                  : "bg-gradient-to-r from-primary-400 to-primary-500"
              }`}
            />
            <div
              className={`text-xs font-medium ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Mis à jour
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Composant réutilisable pour les séparateurs de section
function SectionDivider({ title, icon, isDarkMode }) {
  return (
    <div className="relative py-2">
      <div className="flex items-center space-x-2">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span
          className={`text-sm font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {title}
        </span>
        {/* <div
          className={`flex-grow h-px ${
            isDarkMode ? "bg-gray-700/50" : "bg-gray-200/70"
          }`}
        /> */}
      </div>
    </div>
  );
}
