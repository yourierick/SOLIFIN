import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import DashboardCarousel from "../../components/DashboardCarousel";
import {
  BanknotesIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";
import axios from "../../utils/axios";

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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

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
      className={`space-y-8 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}
    >
      <div>
        <h1
          className={`text-2xl font-semibold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Mon tableau de bord
        </h1>
        <p
          className={`mt-2 text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          }`}
        >
          Bienvenue ! Voici un aperçu de votre activité
        </p>
      </div>

      {/* Carrousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardCarousel />
      </motion.div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          key="Solde actuel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={`overflow-hidden rounded-lg px-4 py-5 shadow sm:p-6 ${
            isDarkMode
              ? "bg-gray-800 shadow-gray-900"
              : "bg-white shadow-gray-200"
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon
                className={`h-6 w-6 ${
                  isDarkMode ? "text-primary-400" : "text-primary-600"
                }`}
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt
                  style={{ fontSize: "10px" }}
                  className={`text-sm font-medium truncate ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Solde actuel
                </dt>
                <dd className="items-baseline">
                  <div
                    className={`text-2xl font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {stats?.general_stats?.wallet.balance} $
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </motion.div>
        <motion.div
          key="Total commissions gagnées"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className={`overflow-hidden rounded-lg px-4 py-5 shadow sm:p-6 ${
            isDarkMode
              ? "bg-gray-800 shadow-gray-900"
              : "bg-white shadow-gray-200"
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GiftIcon
                className={`h-6 w-6 ${
                  isDarkMode ? "text-primary-400" : "text-primary-600"
                }`}
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt
                  style={{ fontSize: "10px" }}
                  className={`text-sm font-medium truncate ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Commissions mensuelles
                </dt>
                <dd className="flex items-baseline">
                  <div
                    className={`text-2xl font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {stats?.financial_info.total_commission.toFixed(2)} $
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </motion.div>
        <motion.div
          key="Total des filleuls"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className={`overflow-hidden rounded-lg px-4 py-5 shadow sm:p-6 ${
            isDarkMode
              ? "bg-gray-800 shadow-gray-900"
              : "bg-white shadow-gray-200"
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon
                className={`h-6 w-6 ${
                  isDarkMode ? "text-primary-400" : "text-primary-600"
                }`}
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt
                  style={{ fontSize: "10px" }}
                  className={`text-sm font-medium truncate ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Total des filleuls
                </dt>
                <dd className="flex items-baseline">
                  <div
                    className={`text-2xl font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {stats?.general_stats.total_referrals}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </motion.div>
        <motion.div
          key="Failed commission"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className={`overflow-hidden rounded-lg px-4 py-5 shadow sm:p-6 ${
            isDarkMode
              ? "bg-gray-800 shadow-gray-900"
              : "bg-white shadow-gray-200"
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GiftIcon
                className={`h-6 w-6 ${
                  isDarkMode ? "text-primary-400" : "text-primary-600"
                }`}
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt
                  style={{ fontSize: "10px" }}
                  className={`text-sm font-medium truncate ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Points bonus
                </dt>
                <dd className="flex items-baseline">
                  <div
                    className={`text-2xl font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {stats?.general_stats.bonus}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performances par pack */}
      <div
        className={`shadow rounded-lg ${
          isDarkMode
            ? "bg-gray-800 shadow-gray-900"
            : "bg-white shadow-gray-200"
        }`}
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
            Performances par pack
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
                  Pack
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Nombre de filleuls
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Commissions générées
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Performance mensuelle
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDarkMode ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              {stats?.packs_performance?.map((pack) => (
                <tr
                  key={pack?.id || "unknown"}
                  className={
                    isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                  }
                >
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {pack?.name || "-"}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {pack?.total_referrals || 0}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {Number(pack?.total_commissions || 0).toFixed(2)} $
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap`}>
                    <div className="flex items-center">
                      {pack?.performance &&
                        Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`inline-block ${
                              i < (pack.performance.stars || 0)
                                ? pack.performance.color === "error"
                                  ? "text-red-500"
                                  : pack.performance.color === "warning"
                                  ? "text-yellow-500"
                                  : pack.performance.color === "primary"
                                  ? "text-blue-500"
                                  : "text-green-500"
                                : "text-gray-300"
                            }`}
                          >
                            {i < (pack.performance.stars || 0) ? "★" : "☆"}
                          </span>
                        ))}
                      {pack?.performance && (
                        <span
                          className={`ml-2 text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          ({pack.performance.monthly_count || 0} membres en{" "}
                          {pack.performance.month || "-"})
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
