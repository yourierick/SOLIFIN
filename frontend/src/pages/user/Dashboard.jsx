import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trialAlert, setTrialAlert] = useState(null);

  useEffect(() => {
    fetchStats();
    checkTrialStatus();
  }, []);

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
      const response = await axios.get("/api/stats/global");
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
            className={`h-4 w-4 ${
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
      >
        <DashboardCarousel />
      </motion.div>

      {/* Statistiques */}
      <SectionDivider
        title="Vos statistiques financières"
        icon={
          <ChartBarIcon
            className={`h-4 w-4 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
        }
        isDarkMode={isDarkMode}
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={
            <BanknotesIcon
              className={`h-6 w-6 ${
                isDarkMode ? "text-primary-400" : "text-primary-600"
              }`}
            />
          }
          title="Solde actuel"
          value={`${stats?.financial_info?.wallet || "0.00"} $`}
          isDarkMode={isDarkMode}
        />

        <StatCard
          icon={
            <GiftIcon
              className={`h-6 w-6 ${
                isDarkMode ? "text-primary-400" : "text-primary-600"
              }`}
            />
          }
          title="Commissions mensuelles"
          value={`${
            stats?.financial_info?.total_commission?.toFixed(2) || "0.00"
          } $`}
          isDarkMode={isDarkMode}
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
                    ? "bg-yellow-900 text-yellow-200"
                    : "bg-yellow-100 text-yellow-800",
                }
              : null
          }
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
        />
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
          <h3
            className={`text-lg font-semibold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Évolution des commissions
          </h3>
          {stats?.progression?.monthly_commissions && (
            <div className="h-64">
              <Line
                data={{
                  labels: Object.keys(
                    stats.progression.monthly_commissions
                  ).reverse(),
                  datasets: [
                    {
                      label: "Commissions ($)",
                      data: Object.values(
                        stats.progression.monthly_commissions
                      ).reverse(),
                      borderColor: "#3b82f6",
                      backgroundColor: "rgba(59, 130, 246, 0.5)",
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
          <h3
            className={`text-lg font-semibold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Nouveaux filleuls par mois
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
                      backgroundColor: "rgba(16, 185, 129, 0.7)",
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
        </motion.div>
      </div>

      {/* Demandes de retrait en attente */}
      {stats?.withdrawals?.pending && stats.withdrawals.pending.length > 0 && (
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
                      {withdrawal.amount} $
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
      )}

      {/* Performances par pack */}
      <SectionDivider
        title="Résultats de vos packs d'affiliation"
        icon={
          <TrophyIcon
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
            Performances par pack
          </h3>
          <p
            className={`mt-1 text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Aperçu de vos performances par pack d'affiliation
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats?.packs_performance?.map((pack, index) => (
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
                <div className="flex justify-between items-center">
                  <h4
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {pack?.name || "Pack inconnu"}
                  </h4>

                  {pack?.performance && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pack.performance.color === "error"
                          ? isDarkMode
                            ? "bg-red-900 text-red-200"
                            : "bg-red-100 text-red-800"
                          : pack.performance.color === "warning"
                          ? isDarkMode
                            ? "bg-yellow-900 text-yellow-200"
                            : "bg-yellow-100 text-yellow-800"
                          : pack.performance.color === "primary"
                          ? isDarkMode
                            ? "bg-blue-900 text-blue-200"
                            : "bg-blue-100 text-blue-800"
                          : isDarkMode
                          ? "bg-green-900 text-green-200"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {pack.performance.monthly_count || 0} membres en{" "}
                      {pack.performance.month || "-"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Filleuls
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
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
                    <p className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                      {Number(pack?.total_commissions || 0).toFixed(2)} $
                    </p>
                  </div>
                </div>

                <div>
                  <p
                    className={`text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Performance
                  </p>
                  <div className="flex items-center">
                    {pack?.performance &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <motion.span
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + i * 0.05 }}
                          className={`inline-block text-xl ${
                            i < (pack.performance.stars || 0)
                              ? pack.performance.color === "error"
                                ? "text-red-500"
                                : pack.performance.color === "warning"
                                ? "text-yellow-500"
                                : pack.performance.color === "primary"
                                ? "text-blue-500"
                                : "text-green-500"
                              : isDarkMode
                              ? "text-gray-600"
                              : "text-gray-300"
                          }`}
                        >
                          {i < (pack.performance.stars || 0) ? "★" : "☆"}
                        </motion.span>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Composant réutilisable pour les cartes de stats
function StatCard({ icon, title, value, isDarkMode, badge = null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`rounded-lg shadow-sm p-6 ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt
              className={`truncate text-sm font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {title}
            </dt>
            <dd>
              <div className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                {value}
              </div>
              {badge && (
                <span
                  className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
                >
                  {badge.text}
                </span>
              )}
            </dd>
          </dl>
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
          className={`text-xs font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {title}
        </span>
        <div
          className={`flex-grow h-px ${
            isDarkMode ? "bg-gray-700/50" : "bg-gray-200/70"
          }`}
        />
      </div>
    </div>
  );
}
