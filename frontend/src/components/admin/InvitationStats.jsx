import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import {
  EnvelopeIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function InvitationStats({ data, loading }) {
  const { isDarkMode } = useTheme();

  // Définir les couleurs de base en fonction du mode sombre/clair
  const themeColors = {
    background: isDarkMode ? "bg-gray-800" : "bg-white",
    card: isDarkMode ? "bg-gray-700" : "bg-gray-50",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    text: {
      primary: isDarkMode ? "text-white" : "text-gray-900",
      secondary: isDarkMode ? "text-gray-300" : "text-gray-700",
      muted: isDarkMode ? "text-gray-400" : "text-gray-500",
    },
    shadow: isDarkMode ? "shadow-gray-900/50" : "shadow-gray-200/50",
    chart: {
      grid: isDarkMode ? "#374151" : "#e5e7eb",
      tick: isDarkMode ? "#9CA3AF" : "#4B5563",
      tooltip: {
        bg: isDarkMode ? "#1F2937" : "#FFFFFF",
        text: isDarkMode ? "#F9FAFB" : "#111827",
        border: isDarkMode ? "#374151" : "#E5E7EB",
      },
    },
  };

  if (loading) {
    return (
      <div
        className={`rounded-lg shadow-md overflow-hidden ${themeColors.background} ${themeColors.shadow} transition-all duration-300`}
      >
        <div className={`px-6 py-5 border-b ${themeColors.border}`}>
          <h3
            className={`text-lg font-medium leading-6 ${themeColors.text.primary}`}
          >
            Système d'invitation
          </h3>
        </div>
        <div className="p-6 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.invitations) {
    return null;
  }

  const { invitations } = data;

  // Préparer les données pour le graphique en camembert des statuts
  const statusData = Object.entries(
    invitations.invitations_by_status || {}
  ).map(([status, data]) => ({
    name: getStatusName(status),
    value: data.count,
  }));

  // Préparer les données pour le graphique des top inviters
  const topInvitersData = (invitations.top_inviters || []).map((inviter) => ({
    name: inviter.name,
    invitations: inviter.invitation_count,
  }));

  // Fonction pour formater les nombres
  const formatNumber = (number) => {
    return new Intl.NumberFormat("fr-FR").format(number);
  };

  // Fonction pour obtenir le nom du statut en français
  function getStatusName(status) {
    switch (status) {
      case "pending":
        return "En attente";
      case "sent":
        return "Envoyée";
      case "opened":
        return "Ouverte";
      case "registered":
        return "Inscrit";
      case "expired":
        return "Expirée";
      default:
        return status;
    }
  }

  // Fonction pour obtenir l'icône du statut
  function getStatusIcon(status) {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-6 w-6" />;
      case "sent":
        return <EnvelopeIcon className="h-6 w-6" />;
      case "opened":
        return <EyeIcon className="h-6 w-6" />;
      case "registered":
        return <CheckCircleIcon className="h-6 w-6" />;
      case "expired":
        return <XCircleIcon className="h-6 w-6" />;
      default:
        return null;
    }
  }

  // Fonction pour obtenir la couleur du statut
  function getStatusColor(status) {
    switch (status) {
      case "pending":
        return isDarkMode
          ? "bg-yellow-900 text-yellow-200"
          : "bg-yellow-100 text-yellow-800";
      case "sent":
        return isDarkMode
          ? "bg-blue-900 text-blue-200"
          : "bg-blue-100 text-blue-800";
      case "opened":
        return isDarkMode
          ? "bg-purple-900 text-purple-200"
          : "bg-purple-100 text-purple-800";
      case "registered":
        return isDarkMode
          ? "bg-green-900 text-green-200"
          : "bg-green-100 text-green-800";
      case "expired":
        return isDarkMode
          ? "bg-red-900 text-red-200"
          : "bg-red-100 text-red-800";
      default:
        return isDarkMode
          ? "bg-gray-700 text-gray-200"
          : "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div
      className={`rounded-lg shadow-md overflow-hidden ${themeColors.background} ${themeColors.shadow} transition-all duration-300`}
    >
      <div className={`px-6 py-5 border-b ${themeColors.border}`}>
        <h3
          className={`text-lg font-medium leading-6 ${themeColors.text.primary}`}
        >
          Système d'invitation
        </h3>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Carte: Total des invitations */}
          <div
            className={`p-4 rounded-lg ${themeColors.card} transition-colors duration-200`}
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full ${
                  isDarkMode
                    ? "bg-blue-900 text-blue-200"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                <EnvelopeIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${themeColors.text.muted}`}>
                  Total des invitations
                </p>
                <p
                  className={`text-2xl font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formatNumber(invitations.total_invitations)}
                </p>
              </div>
            </div>
          </div>

          {/* Carte: Taux de conversion */}
          <div
            className={`p-4 rounded-lg ${
              isDarkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full ${
                  isDarkMode
                    ? "bg-green-900 text-green-200"
                    : "bg-green-100 text-green-600"
                }`}
              >
                <ArrowTrendingUpIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Taux de conversion
                </p>
                <p
                  className={`text-2xl font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {invitations.conversion_rate}%
                </p>
              </div>
            </div>
          </div>

          {/* Carte: Invitations en attente */}
          <div
            className={`p-4 rounded-lg ${
              isDarkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full ${
                  isDarkMode
                    ? "bg-yellow-900 text-yellow-200"
                    : "bg-yellow-100 text-yellow-600"
                }`}
              >
                <ClockIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  En attente
                </p>
                <p
                  className={`text-2xl font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formatNumber(
                    invitations.invitations_by_status?.pending?.count || 0
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Carte: Inscriptions réalisées */}
          <div
            className={`p-4 rounded-lg ${
              isDarkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full ${
                  isDarkMode
                    ? "bg-green-900 text-green-200"
                    : "bg-green-100 text-green-600"
                }`}
              >
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Inscriptions réalisées
                </p>
                <p
                  className={`text-2xl font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formatNumber(
                    invitations.invitations_by_status?.registered?.count || 0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique: Statuts des invitations */}
          <div
            className={`p-4 rounded-lg ${
              isDarkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <h4
              className={`text-base font-medium mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Statuts des invitations
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphique: Top inviters */}
          <div
            className={`p-4 rounded-lg ${
              isDarkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <h4
              className={`text-base font-medium mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Top inviters
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topInvitersData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDarkMode ? "#374151" : "#e5e7eb"}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: isDarkMode ? "#9CA3AF" : "#4B5563" }}
                    tickFormatter={(value) =>
                      value.length > 10 ? `${value.substring(0, 10)}...` : value
                    }
                  />
                  <YAxis tick={{ fill: isDarkMode ? "#9CA3AF" : "#4B5563" }} />
                  <Tooltip
                    formatter={(value) => formatNumber(value)}
                    contentStyle={{
                      backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                      color: isDarkMode ? "#F9FAFB" : "#111827",
                      border: `1px solid ${isDarkMode ? "#374151" : "#E5E7EB"}`,
                    }}
                  />
                  <Bar dataKey="invitations" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Liste des statuts */}
        <div className="mt-8">
          <h4
            className={`text-base font-medium mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Détail des statuts
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(invitations.invitations_by_status || {}).map(
              ([status, data]) => (
                <div
                  key={status}
                  className={`p-4 rounded-lg ${getStatusColor(status)}`}
                >
                  <div className="flex items-center">
                    {getStatusIcon(status)}
                    <span className="ml-2 font-medium">
                      {getStatusName(status)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-bold">
                      {formatNumber(data.count)}
                    </div>
                    <div className="text-sm">{data.percentage}% du total</div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
