import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import axios from "axios";
import AdminStandardWallet from "./components/AdminStandardWallet";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  UsersIcon,
  CurrencyEuroIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  UserPlusIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import Notification from "../../components/Notification";

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

export default function Dashboard() {
  const { isDarkMode } = useTheme();
  const {
    isCDFEnabled,
    availableCurrencies,
    selectedCurrency,
    setSelectedCurrency,
    loading: currencyLoading,
  } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [period, setPeriod] = useState("month"); // day, week, month, year
  const [userPermissions, setUserPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  // État pour contrôler l'affichage initial
  const [interfaceReady, setInterfaceReady] = useState(false);

  // Définir les couleurs de base en fonction du mode sombre/clair
  const themeColors = {
    background: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    card: isDarkMode ? "bg-gray-800" : "bg-white",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    text: {
      primary: isDarkMode ? "text-white" : "text-gray-900",
      secondary: isDarkMode ? "text-gray-300" : "text-gray-700",
      muted: isDarkMode ? "text-gray-400" : "text-gray-500",
    },
    shadow: isDarkMode ? "shadow-gray-900/50" : "shadow-gray-200/50",
  };

  // Effet pour vérifier les permissions au chargement initial
  useEffect(() => {
    fetchUserPermissions();
  }, []);

  // Effet pour charger les données du dashboard uniquement si l'utilisateur est super admin
  useEffect(() => {
    if (isSuperAdmin && !loadingPermissions) {
      fetchDashboardData();
    }
  }, [period, isSuperAdmin, loadingPermissions, selectedCurrency]);

  // Fonction pour récupérer les permissions de l'utilisateur
  const fetchUserPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const response = await axios.get(`/api/user/permissions`);
      let isAdmin = false;

      // Vérifier si l'utilisateur est super-admin
      if (response.data && response.data.isSuperAdmin) {
        isAdmin = true;
      }

      if (response.data && response.data.permissions) {
        const permissionSlugs = response.data.permissions.map(
          (permission) => permission.slug
        );
        setUserPermissions(permissionSlugs);
      }

      setIsSuperAdmin(isAdmin);
    } catch (error) {
      console.error("Erreur lors de la récupération des permissions:", error);
      setIsSuperAdmin(false);
    } finally {
      setLoadingPermissions(false);
      setInterfaceReady(true);
    }
  };

  // Fonction pour vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (permission) => {
    return (
      userPermissions.includes("super-admin") ||
      userPermissions.includes(permission)
    );
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period });
      if (selectedCurrency) {
        params.append("currency", selectedCurrency);
      }

      const response = await axios.get(
        `/api/admin/dashboard/data?${params.toString()}`
      );
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données du tableau de bord:",
        error
      );
      Notification.error(
        "Erreur lors de la récupération des données du tableau de bord"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires
  const formatNumber = (number) => {
    return new Intl.NumberFormat("fr-FR").format(number);
  };

  const formatAmount = (amount, currency) => {
    if (!amount || amount === 0) return "0";
    const formattedNumber = formatNumber(amount);
    return `${formattedNumber} ${currency || "USD"}`;
  };

  const getCurrencySymbol = (currency) => {
    switch (currency?.toUpperCase()) {
      case "USD":
        return "$";
      case "CDF":
        return "FC";
      default:
        return "$";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusTextUtil = (status) => {
    const statusMap = {
      pending: "En attente",
      processing: "En cours",
      completed: "Terminé",
      failed: "Échoué",
      cancelled: "Annulé",
      approved: "Approuvé",
      rejected: "Rejeté",
    };
    return statusMap[status] || status;
  };

  const getStatusColorUtil = (status, isDark = false) => {
    switch (status) {
      case "completed":
      case "approved":
        return isDark
          ? "bg-green-900 text-green-300"
          : "bg-green-100 text-green-800";
      case "pending":
      case "processing":
        return isDark
          ? "bg-yellow-900 text-yellow-300"
          : "bg-yellow-100 text-yellow-800";
      case "failed":
      case "rejected":
      case "cancelled":
        return isDark ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800";
      default:
        return isDark
          ? "bg-gray-700 text-gray-300"
          : "bg-gray-100 text-gray-800";
    }
  };

  // Afficher un écran de chargement pendant la vérification des permissions
  if (!interfaceReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 transition-all duration-300">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-8 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center space-y-6"
        >
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Cercle extérieur animé */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 border-r-primary-500 opacity-30"
            />
            {/* Cercle intérieur animé */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary-600 border-l-primary-600 opacity-70"
            />
            {/* Icône centrale */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="z-10 bg-white dark:bg-gray-800 rounded-full p-3 shadow-md"
            >
              <svg
                className="h-10 w-10 text-primary-600 dark:text-primary-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </motion.div>
          </div>

          <div className="text-center space-y-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-2xl font-bold text-gray-800 dark:text-white"
            >
              Chargement...
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-gray-600 dark:text-gray-300 font-medium"
            >
              Vérification des accès
            </motion.p>
          </div>

          {/* Indicateur de progression */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.7, duration: 3, repeat: Infinity }}
            className="h-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full w-full mt-4"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-xs text-gray-500 dark:text-gray-400 italic"
          >
            Préparation de votre tableau de bord
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas super admin, afficher le composant Wallet à la place
  if (!isSuperAdmin) {
    return <AdminStandardWallet />;
  }

  return (
    <div className={`${themeColors.background} min-h-screen p-6 md:p-8`}>
      {/* Affichage du Dashboard uniquement pour les super admin */}
      {/* Sélecteur de période et de devise */}
      <div className="flex justify-between items-center mb-8">
        {/* Sélecteur de période */}
        <div
          className={`inline-flex rounded-md shadow-sm ${themeColors.card} shadow-md`}
        >
          <button
            type="button"
            onClick={() => setPeriod("day")}
            className={`px-4 py-2 text-sm font-medium rounded-l-md transition-colors duration-200 ${
              period === "day"
                ? "bg-primary-600 text-white"
                : `${themeColors.text.secondary} hover:${
                    isDarkMode ? "bg-gray-700" : "bg-gray-50"
                  }`
            }`}
          >
            Jour
          </button>
          <button
            type="button"
            onClick={() => setPeriod("week")}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              period === "week"
                ? "bg-primary-600 text-white"
                : `${themeColors.text.secondary} hover:${
                    isDarkMode ? "bg-gray-700" : "bg-gray-50"
                  }`
            }`}
          >
            Semaine
          </button>
          <button
            type="button"
            onClick={() => setPeriod("month")}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              period === "month"
                ? "bg-primary-600 text-white"
                : `${themeColors.text.secondary} hover:${
                    isDarkMode ? "bg-gray-700" : "bg-gray-50"
                  }`
            }`}
          >
            Mois
          </button>
          <button
            type="button"
            onClick={() => setPeriod("year")}
            className={`px-4 py-2 text-sm font-medium rounded-r-md transition-colors duration-200 ${
              period === "year"
                ? "bg-primary-600 text-white"
                : `${themeColors.text.secondary} hover:${
                    isDarkMode ? "bg-gray-700" : "bg-gray-50"
                  }`
            }`}
          >
            Année
          </button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 transition-all duration-300">
        {loading
          ? // Afficher des placeholders pendant le chargement
            [...Array(4)].map((_, index) => (
              <motion.div
                key={index}
                className={`overflow-hidden rounded-lg px-4 py-5 shadow-lg sm:p-6 animate-pulse 
                ${themeColors.card} ${themeColors.shadow} border-l-4 ${
                  [
                    "border-blue-500",
                    "border-green-500",
                    "border-yellow-500",
                    "border-red-500",
                  ][index % 4]
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-2/3">
                    <div
                      className={`h-4 ${themeColors.text.muted} rounded w-3/4 mb-3`}
                    ></div>
                    <div
                      className={`h-6 ${themeColors.text.muted} rounded w-1/2 mb-3`}
                    ></div>
                    <div
                      className={`h-3 ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      } rounded w-1/4`}
                    ></div>
                  </div>
                  <div
                    className={`p-4 rounded-full ${
                      isDarkMode ? "bg-gray-700/50" : "bg-gray-200/70"
                    }`}
                  >
                    <div className="h-8 w-8 animate-pulse rounded-full bg-gray-400 dark:bg-gray-600"></div>
                  </div>
                </div>
                <div className="mt-3 h-10">
                  <div className="h-full bg-gray-300 dark:bg-gray-600 rounded animate-pulse opacity-50"></div>
                </div>
              </motion.div>
            ))
          : dashboardData
          ? // Afficher les données réelles
            [
              {
                name: "Utilisateurs totaux",
                value: formatNumber(dashboardData.cards.total_users),
                icon: UsersIcon,
                color: "blue",
              },
              {
                name: "Nouveaux utilisateurs",
                value: formatNumber(dashboardData.cards.today_users),
                icon: UserPlusIcon,
                color: "green",
              },
              {
                name: "Demandes de retrait en attente",
                value: `${formatNumber(dashboardData.cards.total_withdrawals)}`,
                icon: CurrencyDollarIcon,
                color: "yellow",
              },
              {
                name: "Commissions échouées",
                value: formatNumber(dashboardData.cards.failed_commissions),
                icon: ExclamationCircleIcon,
                color: "red",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              let borderColor, iconBgColor, iconColor, chartColor;

              switch (item.color) {
                case "blue":
                  borderColor = "border-blue-500";
                  iconBgColor = isDarkMode ? "bg-blue-900/30" : "bg-blue-100";
                  iconColor = isDarkMode ? "text-blue-300" : "text-blue-600";
                  chartColor = "#3B82F6";
                  break;
                case "green":
                  borderColor = "border-green-500";
                  iconBgColor = isDarkMode ? "bg-green-900/30" : "bg-green-100";
                  iconColor = isDarkMode ? "text-green-300" : "text-green-600";
                  chartColor = "#10B981";
                  break;
                case "yellow":
                  borderColor = "border-yellow-500";
                  iconBgColor = isDarkMode
                    ? "bg-yellow-900/30"
                    : "bg-yellow-100";
                  iconColor = isDarkMode
                    ? "text-yellow-300"
                    : "text-yellow-600";
                  chartColor = "#F59E0B";
                  break;
                case "red":
                  borderColor = "border-red-500";
                  iconBgColor = isDarkMode ? "bg-red-900/30" : "bg-red-100";
                  iconColor = isDarkMode ? "text-red-300" : "text-red-600";
                  chartColor = "#EF4444";
                  break;
                default:
                  borderColor = "border-gray-500";
                  iconBgColor = isDarkMode ? "bg-gray-700" : "bg-gray-100";
                  iconColor = isDarkMode ? "text-gray-300" : "text-gray-600";
                  chartColor = "#6B7280";
              }

              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`p-5 rounded-lg ${themeColors.card} shadow-lg ${themeColors.shadow} border-l-4 ${borderColor} transition-all duration-200`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm font-medium ${themeColors.text.muted}`}
                      >
                        {item.name}
                      </p>
                      <p
                        className={`text-2xl font-bold mt-1 ${themeColors.text.primary}`}
                      >
                        {item.value}
                      </p>
                      <div className="flex items-center mt-2">
                        {item.trendDirection === "up" ? (
                          <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 text-green-500 mr-1" />
                        )}
                        <span className="text-xs text-green-500">
                          {index == 1 ? "aujourd'hui" : "ce mois"}
                        </span>
                      </div>
                    </div>
                    <div className={`p-4 rounded-full ${iconBgColor}`}>
                      <Icon className={`h-8 w-8 ${iconColor}`} />
                    </div>
                  </div>
                  <div className="mt-3 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={item.chartData}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      >
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke={chartColor}
                          fill={chartColor}
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              );
            })
          : null}
      </div>

      {/* Vue d'ensemble du réseau */}
      {dashboardData && (
        <div
          className={`shadow rounded-lg ${themeColors.card} ${themeColors.shadow} transition-all duration-300 mb-10`}
        >
          <div
            className={`px-4 py-5 sm:px-6 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-medium leading-6 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Vue d'ensemble du réseau
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4
                className={`text-base font-medium mb-4 ${themeColors.text.secondary}`}
              >
                Membres actifs et inactifs
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  } transition-colors duration-200`}
                >
                  <p className={`text-sm ${themeColors.text.muted}`}>Actifs</p>
                  <p
                    className={`text-2xl font-semibold ${
                      isDarkMode ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {formatNumber(dashboardData.network_overview.active_users)}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  } transition-colors duration-200`}
                >
                  <p className={`text-sm ${themeColors.text.muted}`}>
                    Inactifs
                  </p>
                  <p
                    className={`text-2xl font-semibold ${
                      isDarkMode ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    {formatNumber(
                      dashboardData.network_overview.inactive_users
                    )}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg col-span-2 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  } transition-colors duration-200`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className={`text-sm ${themeColors.text.muted}`}>
                      Nouveaux membres ({dashboardData.network_overview.period})
                    </p>
                    <p
                      className={`text-xl font-semibold ${
                        isDarkMode ? "text-blue-400" : "text-blue-600"
                      }`}
                    >
                      {formatNumber(dashboardData.network_overview.new_users)}
                    </p>
                  </div>

                  {/* Graphique des nouveaux membres par jour */}
                  <div className="h-32 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={
                          dashboardData.network_overview.weekly_signups || []
                        }
                        margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                        barSize={18}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{
                            fill: isDarkMode ? "#9CA3AF" : "#6B7280",
                            fontSize: 10,
                          }}
                          axisLine={{
                            stroke: isDarkMode ? "#4B5563" : "#D1D5DB",
                          }}
                          tickLine={false}
                        />
                        <YAxis hide={true} />
                        <Tooltip
                          formatter={(value) => [
                            `${value} nouveaux membres`,
                            "Inscriptions",
                          ]}
                          contentStyle={{
                            backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                            borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                          }}
                          labelStyle={{
                            color: isDarkMode ? "#F3F4F6" : "#111827",
                          }}
                          cursor={{
                            fill: isDarkMode
                              ? "rgba(55, 65, 81, 0.3)"
                              : "rgba(243, 244, 246, 0.3)",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill={isDarkMode ? "#3B82F6" : "#2563EB"}
                          radius={[4, 4, 0, 0]}
                          animationDuration={1500}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4
                className={`text-base font-medium mb-4 ${themeColors.text.secondary}`}
              >
                Top parrains
              </h4>
              <div
                className={`rounded-lg overflow-hidden ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                } transition-colors duration-200`}
              >
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                  {dashboardData.network_overview.top_referrers
                    .slice(0, 5)
                    .map((referrer, index) => (
                      <li
                        key={index}
                        className="px-4 py-3 flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          {referrer.profile_photo ? (
                            <img
                              src={referrer.profile_photo}
                              alt={referrer.name}
                              className="w-8 h-8 rounded-full mr-3 object-cover border border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                                isDarkMode
                                  ? "bg-gray-600 text-gray-300"
                                  : "bg-gray-300 text-gray-700"
                              }`}
                            >
                              {referrer.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }
                          >
                            {referrer.name} ({referrer.account_id})
                          </span>
                        </div>
                        <span
                          className={`font-semibold ${
                            isDarkMode ? "text-primary-400" : "text-primary-600"
                          }`}
                        >
                          {referrer.referral_count}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gestion des membres */}
      {dashboardData && (
        <div
          className={`shadow rounded-lg ${
            isDarkMode
              ? "bg-gray-800 shadow-gray-900"
              : "bg-white shadow-gray-200"
          } mb-10`}
        >
          <div
            className={`px-4 py-5 sm:px-6 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-medium leading-6 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Gestion des membres
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              className={`p-4 rounded-lg ${
                isDarkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <h4
                className={`text-base font-medium mb-2 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Nouveaux membres
              </h4>
              <div className="flex items-end space-x-2">
                <p
                  className={`text-2xl font-semibold ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  {formatNumber(dashboardData.member_management.new_members)}
                </p>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  cette période
                </p>
              </div>
              <div className="mt-2">
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Total:{" "}
                  {formatNumber(dashboardData.member_management.total_members)}
                </p>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${
                isDarkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <h4
                className={`text-base font-medium mb-2 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Membres actifs
              </h4>
              <div className="flex items-end space-x-2">
                <p
                  className={`text-2xl font-semibold ${
                    isDarkMode ? "text-green-400" : "text-green-600"
                  }`}
                >
                  {formatNumber(dashboardData.member_management.active_members)}
                </p>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {dashboardData.member_management.active_percentage}%
                </p>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                <div
                  className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full"
                  style={{
                    width: `${dashboardData.member_management.active_percentage}%`,
                  }}
                ></div>
              </div>
            </div>

            {dashboardData.member_management.acquisition_sources &&
              dashboardData.member_management.acquisition_sources.length >
                0 && (
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <h4
                    className={`text-base font-medium mb-2 ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Comment ils ont connu SOLIFIN
                  </h4>
                  <div className="space-y-2">
                    {dashboardData.member_management.acquisition_sources.map(
                      (source, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <span
                            className={
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }
                          >
                            {source.source}
                          </span>
                          <span
                            className={`font-semibold ${
                              isDarkMode
                                ? "text-primary-400"
                                : "text-primary-600"
                            }`}
                          >
                            {source.count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {dashboardData.network_overview.acquisition_sources &&
            dashboardData.network_overview.acquisition_sources.length > 0 ? (
              <div className="mt-4">
                <h3
                  className={`text-lg font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Sources d'acquisition
                </h3>
                <div
                  className={`mt-2 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  } shadow`}
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={
                          dashboardData.network_overview.acquisition_sources
                        }
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                        />
                        <XAxis
                          type="number"
                          domain={[0, "dataMax + 2"]}
                          tick={{ fill: isDarkMode ? "#D1D5DB" : "#4B5563" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="source"
                          tick={{ fill: isDarkMode ? "#D1D5DB" : "#4B5563" }}
                          width={80}
                          tickFormatter={(value) => value || "Non spécifié"}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                            borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                          }}
                          labelStyle={{
                            color: isDarkMode ? "#F3F4F6" : "#111827",
                          }}
                          formatter={(value) => [
                            `${value} utilisateurs`,
                            "Nombre",
                          ]}
                          labelFormatter={(value) => value || "Non spécifié"}
                        />
                        <Bar
                          dataKey="count"
                          name="Utilisateurs"
                          fill={isDarkMode ? "#60A5FA" : "#3B82F6"}
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Système de parrainage */}
      {dashboardData && (
        <div
          className={`shadow rounded-lg ${
            isDarkMode
              ? "bg-gray-800 shadow-gray-900"
              : "bg-white shadow-gray-200"
          } mb-10`}
        >
          <div
            className={`px-4 py-5 sm:px-6 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-medium leading-6 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Système de parrainage et attribution de bonus
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4
                className={`text-base font-medium mb-4 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Performance du système de parrainage
              </h4>
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Total des parrainages
                    </p>
                    <p
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-primary-400" : "text-primary-600"
                      }`}
                    >
                      {formatNumber(
                        dashboardData.referral_system.total_referrals
                      )}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Nouveaux parrainages (
                      {dashboardData.referral_system.period})
                    </p>
                    <p
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-blue-400" : "text-blue-600"
                      }`}
                    >
                      {formatNumber(
                        dashboardData.referral_system.new_referrals
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4
                className={`text-base font-medium mb-4 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Top packs par parrainage
              </h4>
              <div
                className={`rounded-lg overflow-hidden ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                  {dashboardData.referral_system.top_packs.map(
                    (pack, index) => (
                      <li key={index} className="px-4 py-3">
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`font-medium ${
                              isDarkMode ? "text-gray-200" : "text-gray-700"
                            }`}
                          >
                            {pack.name}
                          </span>
                          <span
                            className={`font-semibold ${
                              isDarkMode
                                ? "text-primary-400"
                                : "text-primary-600"
                            }`}
                          >
                            {pack.referral_count} parrainages
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 dark:bg-primary-500 h-1.5 rounded-full"
                            style={{
                              width: `${
                                (pack.referral_count /
                                  dashboardData.referral_system.top_packs[0]
                                    .referral_count) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions récentes - visible uniquement avec la permission view-finances */}
      {(hasPermission("view-finances") || hasPermission("super-admin")) && (
        <div
          className={`shadow rounded-lg ${
            isDarkMode
              ? "bg-gray-800 shadow-gray-900"
              : "bg-white shadow-gray-200"
          } mb-10`}
        >
          <div
            className={`px-4 py-5 sm:px-6 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-medium leading-6 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Transactions récentes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table
              className={`min-w-full divide-y ${
                isDarkMode ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              <thead className={isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}>
                <tr>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Utilisateur
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Montant
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Devise
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Type
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Statut
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDarkMode ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                {loading ? (
                  // Afficher des placeholders pendant le chargement
                  [...Array(5)].map((_, index) => (
                    <tr
                      key={index}
                      className={isDarkMode ? "bg-gray-800" : "bg-white"}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : dashboardData && dashboardData.latest_transactions ? (
                  dashboardData.latest_transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className={
                        isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                      }
                    >
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {transaction.metadata?.bénéficiaire ||
                          transaction.metadata?.user ||
                          "Non défini"}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {formatAmount(transaction.amount, transaction.currency)}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.currency === "USD"
                              ? isDarkMode
                                ? "bg-blue-900 text-blue-300"
                                : "bg-blue-100 text-blue-800"
                              : isDarkMode
                              ? "bg-green-900 text-green-300"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {transaction.currency || "USD"}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {transaction.type === "pack_sale"
                          ? "Vente de Pack"
                          : transaction.type === "withdrawal"
                          ? "retrait"
                          : transaction.type === "boost_sale"
                          ? "Boost de publication"
                          : transaction.type === "renew_pack_sale"
                          ? "Renouvellement de Pack"
                          : transaction.type === "digital_product_sale"
                          ? "Vente de produit numérique"
                          : transaction.type === "commission de retrait"
                          ? "Commission de retrait"
                          : transaction.type === "commission de parrainage"
                          ? "Commission de parrainage"
                          : transaction.type === "commission de transfert"
                          ? "Commission de transfert"
                          : transaction.type === "virtual_sale"
                          ? "Vente virtuelle"
                          : transaction.type === "transfer"
                          ? "Transfert des fonds"
                          : transaction.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorUtil(
                            transaction.status,
                            isDarkMode
                          )}`}
                        >
                          {getStatusTextUtil(transaction.status)}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {formatDate(transaction.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm">
                      <p
                        className={
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }
                      >
                        Aucune transaction disponible
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section des statistiques par pack */}
      {!loading && (
        <div
          className={`rounded-lg shadow-md mt-10 overflow-hidden ${themeColors.card} ${themeColors.shadow} transition-all duration-300 mb-10`}
        >
          <div className={`px-6 py-5 border-b ${themeColors.border}`}>
            <h3
              className={`text-lg font-medium leading-6 ${themeColors.text.primary}`}
            >
              Statistiques par pack
            </h3>
          </div>
          {/* Graphique circulaire pour la répartition des packs */}
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                } lg:col-span-1 transition-colors duration-200`}
              >
                <h6
                  className={`text-md font-semibold ${themeColors.text.primary} mb-2`}
                >
                  Répartition des utilisateurs par pack
                </h6>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.pack_stats
                          .filter(
                            (pack) =>
                              pack.total_users_count &&
                              parseInt(pack.total_users_count) > 0
                          ) // Ne montrer que les packs avec des utilisateurs
                          .map((pack) => ({
                            name: pack.name || pack.pack_name, // Utiliser pack.name ou pack.pack_name selon la structure
                            // Utiliser le nombre total d'utilisateurs par pack comme valeur réelle
                            value: parseInt(pack.total_users_count) || 0, // Convertir en nombre entier et s'assurer qu'il n'est pas NaN
                          }))}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={70}
                        innerRadius={30}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={false} // Désactiver les labels sur le graphique pour éviter les superpositions
                      >
                        {dashboardData.pack_stats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                "#3B82F6",
                                "#10B981",
                                "#F59E0B",
                                "#EF4444",
                                "#8B5CF6",
                                "#EC4899",
                                "#9333EA",
                                "#14B8A6",
                                "#F97316",
                                "#06B6D4",
                              ][index % 10]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => {
                          // Afficher le pourcentage dans le tooltip avec les données réelles
                          const total = dashboardData.pack_stats
                            .filter(
                              (pack) =>
                                pack.total_users_count &&
                                parseInt(pack.total_users_count) > 0
                            )
                            .reduce(
                              (sum, pack) =>
                                sum + (parseInt(pack.total_users_count) || 0),
                              0
                            );
                          const percent =
                            total > 0 ? ((value / total) * 100).toFixed(1) : 0;

                          return [
                            `${formatNumber(
                              value || 0
                            )} utilisateurs (${percent}%)`,
                            name || "Pack",
                          ];
                        }}
                        contentStyle={{
                          backgroundColor: "#fff",
                          borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                        }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: "9px", paddingTop: "5px" }}
                        formatter={(value) => {
                          // Vérifier si value est défini et est une chaîne de caractères
                          if (value && typeof value === "string") {
                            // Tronquer les noms longs dans la légende
                            const shortValue =
                              value.length > 8
                                ? value.substring(0, 8) + "..."
                                : value;
                            return (
                              <span
                                style={{
                                  color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                }}
                              >
                                {shortValue}
                              </span>
                            );
                          }
                          // Valeur par défaut si value n'est pas une chaîne
                          return (
                            <span
                              style={{
                                color: isDarkMode ? "#D1D5DB" : "#4B5563",
                              }}
                            >
                              Pack
                            </span>
                          );
                        }}
                        iconSize={8}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  } transition-colors duration-200`}
                >
                  <h6
                    className={`text-md font-semibold ${themeColors.text.primary} mb-2`}
                  >
                    Évolution des ventes par pack
                  </h6>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={(() => {
                          // Utiliser les données réelles des 4 dernières semaines
                          const weeks = [
                            "Semaine 1",
                            "Semaine 2",
                            "Semaine 3",
                            "Semaine 4",
                          ];
                          const data = [
                            { name: "Semaine 1" },
                            { name: "Semaine 2" },
                            { name: "Semaine 3" },
                            { name: "Semaine 4" },
                          ];

                          // Remplir les données pour chaque pack
                          dashboardData.pack_stats.forEach((pack) => {
                            if (pack.weekly_sales) {
                              // Utiliser les données hebdomadaires réelles si disponibles
                              data[0][pack.name] = pack.weekly_sales.week1 || 0;
                              data[1][pack.name] = pack.weekly_sales.week2 || 0;
                              data[2][pack.name] = pack.weekly_sales.week3 || 0;
                              data[3][pack.name] = pack.weekly_sales.week4 || 0;
                            } else {
                              // Fallback au cas où les données hebdomadaires ne sont pas disponibles
                              data[3][pack.name] = pack.sales || 0;

                              // Calculer approximativement les semaines précédentes à partir du pourcentage de changement
                              const changeRatio =
                                1 - (pack.sales_change || 0) / 100;

                              if (changeRatio > 0 && pack.sales > 0) {
                                data[2][pack.name] =
                                  Math.round(
                                    pack.sales /
                                      (1 + (pack.sales_change || 0) / 400)
                                  ) || 0;
                                data[1][pack.name] =
                                  Math.round(
                                    pack.sales /
                                      (1 + (pack.sales_change || 0) / 200)
                                  ) || 0;
                                data[0][pack.name] =
                                  Math.round(
                                    pack.sales /
                                      (1 + (pack.sales_change || 0) / 133)
                                  ) || 0;
                              } else {
                                data[2][pack.name] =
                                  Math.round(
                                    pack.sales *
                                      (1 -
                                        Math.abs(pack.sales_change || 0) / 400)
                                  ) || 0;
                                data[1][pack.name] =
                                  Math.round(
                                    pack.sales *
                                      (1 -
                                        Math.abs(pack.sales_change || 0) / 200)
                                  ) || 0;
                                data[0][pack.name] =
                                  Math.round(
                                    pack.sales *
                                      (1 -
                                        Math.abs(pack.sales_change || 0) / 133)
                                  ) || 0;
                              }
                            }
                          });

                          return data;
                        })()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: isDarkMode ? "#D1D5DB" : "#4B5563" }}
                        />
                        <YAxis
                          tick={{ fill: isDarkMode ? "#D1D5DB" : "#4B5563" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                            borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                          }}
                          labelStyle={{
                            color: isDarkMode ? "#F3F4F6" : "#111827",
                          }}
                          formatter={(value, name, props) => {
                            // Afficher la valeur réelle des ventes pour cette semaine
                            const weekSales = value || 0;

                            // Trouver le pack correspondant pour des informations supplémentaires
                            const pack = dashboardData.pack_stats.find(
                              (p) => p.name === name
                            );

                            // Formater le nom du pack pour l'affichage
                            const formattedName =
                              name &&
                              typeof name === "string" &&
                              name.length > 15
                                ? name.substring(0, 15) + "..."
                                : name || "Pack";

                            return [
                              `${formatNumber(weekSales)} ventes`,
                              formattedName,
                            ];
                          }}
                        />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{ fontSize: "9px", paddingTop: "10px" }}
                          formatter={(value) => {
                            // Vérifier si value est défini et est une chaîne de caractères
                            if (value && typeof value === "string") {
                              // Tronquer les noms longs dans la légende
                              const shortValue =
                                value.length > 8
                                  ? value.substring(0, 8) + "..."
                                  : value;
                              return (
                                <span
                                  style={{
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                  }}
                                >
                                  {shortValue}
                                </span>
                              );
                            }
                            // Valeur par défaut si value n'est pas une chaîne
                            return (
                              <span
                                style={{
                                  color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                }}
                              >
                                Pack
                              </span>
                            );
                          }}
                          iconSize={8}
                          iconType="circle"
                        />
                        {dashboardData.pack_stats.map((pack, index) => (
                          <Line
                            key={pack.name}
                            type="monotone"
                            dataKey={pack.name}
                            stroke={
                              [
                                "#3B82F6",
                                "#10B981",
                                "#F59E0B",
                                "#EF4444",
                                "#8B5CF6",
                                "#EC4899",
                                "#9333EA",
                                "#14B8A6",
                                "#F97316",
                                "#06B6D4",
                              ][index % 10]
                            }
                            activeDot={{ r: 4 }}
                            strokeWidth={1.5}
                            dot={{ r: 3 }}
                            // Ajouter un style de ligne différent pour chaque pack pour mieux les distinguer
                            strokeDasharray={
                              index % 3 === 0
                                ? ""
                                : index % 3 === 1
                                ? "3 3"
                                : "5 2"
                            }
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            {/* Titre du tableau des statistiques par pack */}
            <div className="flex justify-between items-center mb-4 px-2">
              <h4
                className={`text-base font-medium ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Détails des ventes par pack
              </h4>
            </div>
            <table
              className={`min-w-full divide-y ${
                isDarkMode ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              <thead className={isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}>
                <tr>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Pack
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Ventes
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Prix
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Utilisateurs
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Tendance
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDarkMode ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                {loading ? (
                  // Afficher des placeholders pendant le chargement
                  [...Array(5)].map((_, index) => (
                    <tr
                      key={index}
                      className={isDarkMode ? "bg-gray-800" : "bg-white"}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : dashboardData && dashboardData.pack_stats ? (
                  dashboardData.pack_stats.map((pack) => (
                    <tr
                      key={pack.id}
                      className={
                        isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                      }
                    >
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {pack.name}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {formatNumber(pack.sales)}
                        {pack.sales_change > 0 && (
                          <span className="text-green-500 ml-2">
                            +{pack.sales_change}%
                          </span>
                        )}
                        {pack.sales_change < 0 && (
                          <span className="text-red-500 ml-2">
                            {pack.sales_change}%
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {formatAmount(pack.revenue, pack.currency)}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {formatNumber(pack.total_users_count || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pack.trend === "up" && (
                          <span className="text-green-500 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                                clipRule="evenodd"
                              />
                            </svg>
                            En hausse
                          </span>
                        )}
                        {pack.trend === "down" && (
                          <span className="text-red-500 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1v-5a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L16 9.586 20.293 5.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0L12 8.414l-3.293 3.293A1 1 0 018 12H5.414L12 13z"
                                clipRule="evenodd"
                              />
                            </svg>
                            En baisse
                          </span>
                        )}
                        {pack.trend === "stable" && (
                          <span className="text-yellow-500 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a1 1 0 01-1 1H3a1 1 0 110-2h14a1 1 0 011 1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Stable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm">
                      <p
                        className={
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }
                      >
                        Aucune statistique disponible
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
