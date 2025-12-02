import React, { useState, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import Notification from "../../../components/Notification";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Pagination,
  TablePagination,
  Paper,
  Box,
  Typography,
  Fade,
} from "@mui/material";
import {
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  PlusIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  CreditCardIcon as PaymentIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  CurrencyDollarIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import axios from "axios";
import { API_URL, PAYMENT_TYPES, PAYMENT_METHODS } from "../../../config";

const TransactionFeeSettings = () => {
  const { isDarkMode } = useTheme();
  const [transactionFees, setTransactionFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // 'add' ou 'edit'
  const [currentFee, setCurrentFee] = useState({
    payment_type: "",
    payment_method: "",
    transfer_fee_percentage: "",
    withdrawal_fee_percentage: "",
    is_active: true,
  });
  
  const [validationErrors, setValidationErrors] = useState({});

  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);

  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchTransactionFees();
  }, []);

  // Mettre à jour les méthodes de paiement disponibles lorsque le type de paiement change
  useEffect(() => {
    if (currentFee.payment_type && PAYMENT_METHODS[currentFee.payment_type]) {
      setAvailablePaymentMethods(PAYMENT_METHODS[currentFee.payment_type]);
    } else {
      setAvailablePaymentMethods([]);
    }
  }, [currentFee.payment_type]);

  // Réinitialiser la page lorsque le nombre de lignes par page change
  useEffect(() => {
    setPage(0);
  }, [rowsPerPage]);

  const fetchTransactionFees = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/admin/transaction-fees", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.data.status === "success") {
        setTransactionFees(response.data.data);
        setTotalCount(response.data.data.length);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des frais de transaction:",
        error
      );
      Notification.error(
        "Erreur lors de la récupération des frais de transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode, fee = null) => {
    setDialogMode(mode);
    if (mode === "edit" && fee) {
      setCurrentFee({
        ...fee,
      });

      // Assurez-vous que les méthodes de paiement sont chargées immédiatement
      if (fee.payment_type && PAYMENT_METHODS[fee.payment_type]) {
        setAvailablePaymentMethods(PAYMENT_METHODS[fee.payment_type]);
      }
    } else {
      setCurrentFee({
        payment_type: "",
        payment_method: "",
        is_active: true,
      });
      setAvailablePaymentMethods([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setValidationErrors({});
  };

  const handleSubmit = async () => {
    try {
      // Réinitialiser les erreurs de validation
      setValidationErrors({});
      
      // Préparer les données à envoyer
      const dataToSend = {
        ...currentFee,
      };

      let response;
      if (dialogMode === "add") {
        response = await axios.post("/api/admin/transaction-fees", dataToSend, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      } else {
        response = await axios.put(
          `/api/admin/transaction-fees/${currentFee.id}`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      if (response.data.status === "success") {
        Notification.success(response.data.message);
        fetchTransactionFees();
        handleCloseDialog();
      }
    } catch (error) {
      console.error(
        "Erreur lors de la soumission des frais de transaction:",
        error
      );
      
      // Gestion des erreurs de validation
      if (error.response?.status === 422 && error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        Notification.error("Veuillez corriger les erreurs de validation");
      } else {
        Notification.error(
          error.response?.data?.message || "Une erreur est survenue"
        );
      }
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer ces frais de transaction ?"
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(`/api/admin/transaction-fees/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.status === "success") {
        Notification.success("Frais de transaction supprimés avec succès");
        fetchTransactionFees();
      }
    } catch (error) {
      console.error(
        "Erreur lors de la suppression des frais de transaction:",
        error
      );
      Notification.error(
        error.response?.data?.message ||
          "Une erreur est survenue lors de la suppression"
      );
    }
  };

  const handleToggleStatus = async (fee) => {
    try {
      const response = await axios.put(
        `/api/admin/transaction-fees/${fee.id}`,
        {
          ...fee,
          is_active: !fee.is_active,
          fee_cap: fee.fee_cap === "" ? null : fee.fee_cap,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.status === "success") {
        Notification.success(
          `Frais de transaction ${
            fee.is_active ? "désactivés" : "activés"
          } avec succès`
        );
        fetchTransactionFees();
      }
    } catch (error) {
      console.error(
        "Erreur lors du changement de statut des frais de transaction:",
        error
      );
      Notification.error(
        error.response?.data?.message ||
          "Une erreur est survenue lors du changement de statut"
      );
    }
  };

  // Fonction pour obtenir le nom d'affichage d'une méthode de paiement
  const getPaymentMethodName = (type, methodId) => {
    if (!type || !methodId) return methodId;

    const methods = PAYMENT_METHODS[type] || [];
    const method = methods.find((m) => m.id === methodId);
    return method ? method.name : methodId;
  };

  // Fonction pour obtenir le nom d'affichage d'un type de paiement
  const getPaymentTypeName = (type) => {
    switch (type) {
      case PAYMENT_TYPES.MOBILE_MONEY:
        return "Mobile Money";
      case PAYMENT_TYPES.CREDIT_CARD:
        return "Carte de crédit";
      case PAYMENT_TYPES.WALLET:
        return "Portefeuille";
      default:
        return type;
    }
  };

  const renderFormFields = () => (
    <Box className="space-y-6">
      {/* Section Type de paiement */}
      <Box className="space-y-2">
        <Typography variant="subtitle2" className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Box className="w-2 h-2 bg-blue-500 rounded-full" />
          Type de paiement
        </Typography>
        <FormControl fullWidth required>
          <InputLabel 
            className="text-gray-600 dark:text-gray-400"
            sx={{
              "&.Mui-focused": {
                color: "#3b82f6",
              },
            }}
          >
            Sélectionnez le type de paiement
          </InputLabel>
          <Select
            value={currentFee.payment_type}
            onChange={(e) => {
              setCurrentFee({
                ...currentFee,
                payment_type: e.target.value,
                payment_method: "",
              });
              // Effacer l'erreur lorsque l'utilisateur modifie le champ
              if (validationErrors.payment_type) {
                setValidationErrors(prev => ({
                  ...prev,
                  payment_type: undefined
                }));
              }
            }}
            error={!!validationErrors.payment_type}
            label="Sélectionnez le type de paiement"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "0.75rem",
                backgroundColor: isDarkMode ? "#1f2937" : "#f9fafb",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#3b82f6",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#3b82f6",
                  borderWidth: "2px",
                },
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: isDarkMode ? "#1f2937" : "white",
                  color: isDarkMode ? "white" : "inherit",
                  borderRadius: "0.75rem",
                  boxShadow: isDarkMode 
                    ? "0 10px 25px rgba(0, 0, 0, 0.3)" 
                    : "0 10px 25px rgba(0, 0, 0, 0.1)",
                  "& .MuiMenuItem-root": {
                    borderRadius: "0.5rem",
                    mx: 1,
                    my: 0.5,
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? "rgba(59, 130, 246, 0.1)"
                        : "rgba(59, 130, 246, 0.05)",
                    },
                    "&.Mui-selected": {
                      bgcolor: isDarkMode
                        ? "rgba(59, 130, 246, 0.2)"
                        : "rgba(59, 130, 246, 0.1)",
                    },
                  },
                },
              },
            }}
          >
            {Object.values(PAYMENT_TYPES).map((type) => (
              <MenuItem key={type} value={type}>
                <Box className="flex items-center gap-3">
                  <Box 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    sx={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    }}
                  >
                    <PaymentIcon className="h-4 w-4 text-white" />
                  </Box>
                  <Typography className="font-medium">{getPaymentTypeName(type)}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
          {validationErrors.payment_type && (
            <Typography variant="caption" className="text-red-500 mt-1">
              {validationErrors.payment_type[0]}
            </Typography>
          )}
        </FormControl>
      </Box>

      {/* Section Méthode de paiement */}
      <Box className="space-y-2">
        <Typography variant="subtitle2" className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Box className="w-2 h-2 bg-purple-500 rounded-full" />
          Méthode de paiement
        </Typography>
        <FormControl fullWidth required disabled={!currentFee.payment_type}>
          <InputLabel 
            className="text-gray-600 dark:text-gray-400"
            sx={{
              "&.Mui-focused": {
                color: "#8b5cf6",
              },
            }}
          >
            Sélectionnez la méthode de paiement
          </InputLabel>
          <Select
            value={currentFee.payment_method}
            onChange={(e) => {
              setCurrentFee({ ...currentFee, payment_method: e.target.value });
              // Effacer l'erreur lorsque l'utilisateur modifie le champ
              if (validationErrors.payment_method) {
                setValidationErrors(prev => ({
                  ...prev,
                  payment_method: undefined
                }));
              }
            }}
            error={!!validationErrors.payment_method}
            label="Sélectionnez la méthode de paiement"
            disabled={!currentFee.payment_type}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "0.75rem",
                backgroundColor: isDarkMode ? "#1f2937" : "#f9fafb",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#8b5cf6",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#8b5cf6",
                  borderWidth: "2px",
                },
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: isDarkMode ? "#1f2937" : "white",
                  color: isDarkMode ? "white" : "inherit",
                  borderRadius: "0.75rem",
                  boxShadow: isDarkMode 
                    ? "0 10px 25px rgba(0, 0, 0, 0.3)" 
                    : "0 10px 25px rgba(0, 0, 0, 0.1)",
                  "& .MuiMenuItem-root": {
                    borderRadius: "0.5rem",
                    mx: 1,
                    my: 0.5,
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? "rgba(139, 92, 246, 0.1)"
                        : "rgba(139, 92, 246, 0.05)",
                    },
                    "&.Mui-selected": {
                      bgcolor: isDarkMode
                        ? "rgba(139, 92, 246, 0.2)"
                        : "rgba(139, 92, 246, 0.1)",
                    },
                  },
                },
              },
            }}
          >
            {availablePaymentMethods.map((method) => (
              <MenuItem key={method.id} value={method.id}>
                <Box className="flex items-center gap-3">
                  <Box 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    sx={{
                      background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                    }}
                  >
                    <PaymentIcon className="h-4 w-4 text-white" />
                  </Box>
                  <Typography className="font-medium">{method.name}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
          {validationErrors.payment_method && (
            <Typography variant="caption" className="text-red-500 mt-1">
              {validationErrors.payment_method[0]}
            </Typography>
          )}
        </FormControl>
      </Box>

      {/* Section Statut */}
      <Box className="space-y-2">
        <Typography variant="subtitle2" className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Box className="w-2 h-2 bg-green-500 rounded-full" />
          Statut du moyen de paiement
        </Typography>
        <Box className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
          <Box className="flex items-center gap-3">
            <Box 
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                currentFee.is_active 
                  ? "bg-green-100 dark:bg-green-900" 
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              {currentFee.is_active ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <NoSymbolIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </Box>
            <Box>
              <Typography variant="subtitle1" className="font-medium text-gray-900 dark:text-white">
                {currentFee.is_active ? "Actif" : "Inactif"}
              </Typography>
              <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                {currentFee.is_active 
                  ? "Ce moyen de paiement est disponible pour les utilisateurs"
                  : "Ce moyen de paiement est temporairement désactivé"
                }
              </Typography>
            </Box>
          </Box>
          <Switch
            checked={currentFee.is_active}
            onChange={(e) =>
              setCurrentFee({ ...currentFee, is_active: e.target.checked })
            }
            color="primary"
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#10b981",
                "& + .MuiSwitch-track": {
                  backgroundColor: "#10b981",
                },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );

  const renderTransactionFeeTable = () => {
    // Calculer les éléments à afficher pour la page actuelle
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const displayedFees = transactionFees.slice(startIndex, endIndex);

    return (
      <>
        {/* Cards pour mobile */}
        <div className="space-y-4 sm:hidden">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <CircularProgress size={24} />
            </div>
          ) : displayedFees.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Aucun frais de transaction trouvé
            </div>
          ) : (
            displayedFees.map((fee) => (
              <div
                key={fee.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                      <CurrencyDollarIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {getPaymentMethodName(fee.payment_type, fee.payment_method)}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getPaymentTypeName(fee.payment_type)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {fee.is_active ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                        <XCircleIcon className="h-3 w-3 mr-1" />
                        Inactif
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Frais fixe:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {fee.fixed_fee} XOF
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Frais variable:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {fee.variable_fee}%
                    </span>
                  </div>
                  {fee.fee_cap && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Plafond:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {fee.fee_cap} XOF
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleOpenDialog("edit", fee)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-300 rounded-lg text-xs font-medium transition-all duration-200"
                  >
                    <PencilSquareIcon className="h-3 w-3" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleToggleStatus(fee)}
                    className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      fee.is_active
                        ? "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300"
                        : "bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-300"
                    }`}
                  >
                    {fee.is_active ? (
                      <>
                        <XCircleIcon className="h-3 w-3" />
                        Désactiver
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-3 w-3" />
                        Activer
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(fee.id)}
                    className="inline-flex items-center justify-center p-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300 rounded-lg transition-all duration-200"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tableau pour desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type de paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Méthode de paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <CircularProgress size={24} />
                  </td>
                </tr>
              ) : displayedFees.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    Aucun frais de transaction trouvé
                  </td>
                </tr>
              ) : (
                displayedFees.map((fee) => (
                  <tr
                    key={fee.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {getPaymentTypeName(fee.payment_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {getPaymentMethodName(fee.payment_type, fee.payment_method)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {fee.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                          <NoSymbolIcon className="h-4 w-4 mr-1" />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenDialog("edit", fee)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(fee.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 mr-3"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(fee)}
                        className={`text-${
                          fee.is_active ? "red" : "green"
                        }-600 dark:text-${
                          fee.is_active ? "red" : "green"
                        }-400 hover:text-${
                          fee.is_active ? "red" : "green"
                        }-900 dark:hover:text-${
                          fee.is_active ? "red" : "green"
                        }-300`}
                      >
                        {fee.is_active ? (
                          <NoSymbolIcon className="h-5 w-5" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </>
    );

  const renderTransactionFeeTableWithPagination = () => (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "transparent",
        overflow: "hidden",
        borderRadius: "0.5rem",
      }}
    >
      {renderTransactionFeeTable()}
    </Paper>
  );

  return (
    <div className="text-gray-900 dark:text-white w-full">
      {/* Header optimisé pour mobile */}
      <div className="relative overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl opacity-10 blur-xl"></div>
        <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur-lg opacity-30"></div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <CurrencyDollarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Gestion des frais de transaction
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Configurez les frais pour chaque moyen de paiement
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenDialog("add")}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg w-full sm:w-auto"
            title="Ajouter un moyen de paiement"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Ajouter des frais</span>
          </button>
        </div>
      </div>

      <Paper
        elevation={2}
        sx={{
          backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
          borderRadius: "0.5rem",
          overflow: "hidden",
          border: isDarkMode
            ? "1px solid rgba(75, 85, 99, 0.7)"
            : "1px solid rgba(229, 231, 235, 1)",
        }}
      >
        {renderTransactionFeeTableWithPagination()}
      </Paper>

      {/* Pagination */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: 2,
          }}
        >
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) =>
              setRowsPerPage(parseInt(event.target.value, 10))
            }
            rowsPerPageOptions={[5, 10, 20]}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
            }
            sx={{
              ".MuiTablePagination-select": {
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                borderRadius: "0.375rem",
                backgroundColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.02)",
                border: isDarkMode
                  ? "1px solid rgba(255, 255, 255, 0.1)"
                  : "1px solid rgba(0, 0, 0, 0.1)",
              },
              ".MuiTablePagination-selectIcon": {
                color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "inherit",
              },
              ".MuiTablePagination-displayedRows": {
                color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "inherit",
              },
              ".MuiTablePagination-actions": {
                "& .MuiIconButton-root": {
                  color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "inherit",
                  "&.Mui-disabled": {
                    color: isDarkMode
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(0, 0, 0, 0.26)",
                  },
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                  },
                },
              },
            }}
          />
        </Box>
      </div>
    );
  };

  const renderTransactionFeeTableWithPagination = () => (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "transparent",
        overflow: "hidden",
        borderRadius: "0.5rem",
      }}
    >
      {renderTransactionFeeTable()}
    </Paper>
  );

  return (
    <div className="text-gray-900 dark:text-white w-full">
      {/* Header optimisé pour mobile */}
      <div className="relative overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl opacity-10 blur-xl"></div>
        <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur-lg opacity-30"></div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <CurrencyDollarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Gestion des frais de transaction
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Configurez les frais pour chaque moyen de paiement
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenDialog("add")}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg w-full sm:w-auto"
            title="Ajouter un moyen de paiement"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Ajouter des frais</span>
          </button>
        </div>
      </div>

      <Paper
        elevation={2}
        sx={{
          backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
          borderRadius: "0.5rem",
          overflow: "hidden",
          border: isDarkMode
            ? "1px solid rgba(75, 85, 99, 0.7)"
            : "1px solid rgba(229, 231, 235, 1)",
        }}
      >
        {renderTransactionFeeTableWithPagination()}
      </Paper>

      {/* Dialog pour ajouter/modifier des frais */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white",
          sx: {
            boxShadow: isDarkMode 
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" 
              : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            borderRadius: "1rem",
            border: isDarkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid rgba(229, 231, 235, 0.5)",
            overflow: "hidden",
          },
        }}
        BackdropProps={{
          sx: {
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          },
        }}
        TransitionComponent={Fade}
        transitionDuration={300}
      >
        {/* Header avec dégradé */}
        <Box className="relative overflow-hidden">
          <Box 
            className="absolute inset-0 opacity-10"
            sx={{
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
            }}
          />
          <DialogTitle className="relative border-b border-gray-200 dark:border-gray-700 text-xl font-bold text-gray-900 dark:text-white py-6">
            <Box className="flex items-center gap-3">
              <Box 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                sx={{
                  background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                }}
              >
                <PaymentIcon className="h-6 w-6 text-white" />
              </Box>
              <Box>
                <Typography variant="h6" className="font-bold text-gray-900 dark:text-white">
                  {dialogMode === "add" ? "Ajouter un moyen de paiement" : "Modifier le moyen de paiement"}
                </Typography>
                <Typography variant="body2" className="text-gray-500 dark:text-gray-400 mt-1">
                  Configurez les options de paiement disponibles
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
        </Box>
        
        <DialogContent className="pt-6 bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white">
          {renderFormFields()}
        </DialogContent>
        
        <DialogActions className="border-t border-gray-200 dark:border-gray-700 py-4 px-6 bg-gray-50 dark:bg-[#111827]">
          <button
            onClick={handleCloseDialog}
            className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            {dialogMode === "add" ? (
              <Box className="flex items-center gap-2">
                <PlusCircleIcon className="h-4 w-4" />
                Ajouter
              </Box>
            ) : (
              <Box className="flex items-center gap-2">
                <PencilSquareIcon className="h-4 w-4" />
                Mettre à jour
              </Box>
            )}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TransactionFeeSettings;
