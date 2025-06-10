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
} from "@mui/material";
import {
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  PlusIcon,
  CheckCircleIcon,
  NoSymbolIcon,
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
    transfer_fee_percentage: 0,
    withdrawal_fee_percentage: 0,
    fee_fixed: 0,
    fee_cap: "",
    is_active: true,
  });
  const [updatingFromApi, setUpdatingFromApi] = useState(false);
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
        fee_cap: fee.fee_cap || "",
      });

      // Assurez-vous que les méthodes de paiement sont chargées immédiatement
      if (fee.payment_type && PAYMENT_METHODS[fee.payment_type]) {
        setAvailablePaymentMethods(PAYMENT_METHODS[fee.payment_type]);
      }
    } else {
      setCurrentFee({
        payment_type: "",
        payment_method: "",
        transfer_fee_percentage: 0,
        withdrawal_fee_percentage: 0,
        fee_fixed: 0,
        fee_cap: "",
        is_active: true,
      });
      setAvailablePaymentMethods([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setCurrentFee({ ...currentFee, [name]: checked });
    } else if (
      [
        "transfer_fee_percentage",
        "withdrawal_fee_percentage",
        "fee_fixed",
        "fee_cap",
      ].includes(name)
    ) {
      // Convertir en nombre ou laisser vide pour fee_cap
      const numValue =
        value === "" ? (name === "fee_cap" ? "" : 0) : parseFloat(value);
      setCurrentFee({ ...currentFee, [name]: numValue });
    } else {
      setCurrentFee({ ...currentFee, [name]: value });
    }
  };

  const handleSubmit = async () => {
    try {
      // Préparer les données à envoyer
      const dataToSend = {
        ...currentFee,
        fee_cap: currentFee.fee_cap === "" ? null : currentFee.fee_cap,
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
      Notification.error(
        error.response?.data?.message || "Une erreur est survenue"
      );
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

  const handleUpdateFromApi = async () => {
    setUpdatingFromApi(true);
    try {
      const response = await axios.post(
        "/app/admin/transaction-fees/update-from-api",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.status === "success") {
        Notification.success(
          "Frais de transaction mis à jour depuis l'API avec succès"
        ),
          fetchTransactionFees();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour depuis l'API:", error);
      Notification.error(
        error.response?.data?.message ||
          "Une erreur est survenue lors de la mise à jour depuis l'API"
      );
    } finally {
      setUpdatingFromApi(false);
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
      case PAYMENT_TYPES.BANK_TRANSFER:
        return "Transfert bancaire";
      case PAYMENT_TYPES.CASH:
        return "Espèces";
      case PAYMENT_TYPES.WALLET:
        return "Portefeuille";
      case PAYMENT_TYPES.MONEY_TRANSFER:
        return "Transfert d'argent";
      default:
        return type;
    }
  };

  const renderFormFields = () => (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Type de paiement</InputLabel>
          <Select
            value={currentFee.payment_type}
            onChange={(e) =>
              setCurrentFee({
                ...currentFee,
                payment_type: e.target.value,
                payment_method: "",
              })
            }
            label="Type de paiement"
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: isDarkMode ? "#1e283b" : "white",
                  color: isDarkMode ? "white" : "inherit",
                  "& .MuiMenuItem-root": {
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.04)",
                    },
                  },
                },
              },
            }}
          >
            {Object.values(PAYMENT_TYPES).map((type) => (
              <MenuItem key={type} value={type}>
                {getPaymentTypeName(type)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required disabled={!currentFee.payment_type}>
          <InputLabel>Méthode de paiement</InputLabel>
          <Select
            value={currentFee.payment_method}
            onChange={(e) =>
              setCurrentFee({ ...currentFee, payment_method: e.target.value })
            }
            label="Méthode de paiement"
            disabled={!currentFee.payment_type}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: isDarkMode ? "#1e283b" : "white",
                  color: isDarkMode ? "white" : "inherit",
                  "& .MuiMenuItem-root": {
                    "&:hover": {
                      bgcolor: isDarkMode
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.04)",
                    },
                  },
                },
              },
            }}
          >
            {availablePaymentMethods.map((method) => (
              <MenuItem key={method.id} value={method.id}>
                {method.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Frais de transfert (%)"
          type="number"
          fullWidth
          value={currentFee.transfer_fee_percentage}
          onChange={(e) =>
            setCurrentFee({
              ...currentFee,
              transfer_fee_percentage: parseFloat(e.target.value),
            })
          }
          inputProps={{ min: 0, max: 100, step: 0.01 }}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Frais de retrait (%)"
          type="number"
          fullWidth
          value={currentFee.withdrawal_fee_percentage}
          onChange={(e) =>
            setCurrentFee({
              ...currentFee,
              withdrawal_fee_percentage: parseFloat(e.target.value),
            })
          }
          inputProps={{ min: 0, max: 100, step: 0.01 }}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Frais fixes"
          type="number"
          fullWidth
          value={currentFee.fee_fixed}
          onChange={(e) =>
            setCurrentFee({
              ...currentFee,
              fee_fixed: parseFloat(e.target.value),
            })
          }
          inputProps={{ min: 0, step: 0.01 }}
          required
          helperText="Montant minimum des frais appliqués"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Plafond des frais"
          type="number"
          fullWidth
          value={currentFee.fee_cap}
          onChange={(e) =>
            setCurrentFee({
              ...currentFee,
              fee_cap: e.target.value ? parseFloat(e.target.value) : "",
            })
          }
          inputProps={{ min: 0, step: 0.01 }}
          helperText="Montant maximum des frais (laisser vide pour aucun plafond)"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={currentFee.is_active}
              onChange={(e) =>
                setCurrentFee({ ...currentFee, is_active: e.target.checked })
              }
              color="primary"
            />
          }
          label="Actif"
        />
      </Grid>
    </Grid>
  );

  const renderTransactionFeeTable = () => {
    // Calculer les éléments à afficher pour la page actuelle
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const displayedFees = transactionFees.slice(startIndex, endIndex);

    return (
      <div className="overflow-x-auto">
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
                Frais de transfert (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Frais de retrait (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Frais fixe ($)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Plafond ($)
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
                    {fee.transfer_fee_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {fee.withdrawal_fee_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {fee.fee_fixed} $
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {fee.fee_cap || "-"} $
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
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Afficher
            </span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
              className="ml-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              lignes
            </span>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Précédent
            </button>
            <span className="mx-2 text-sm text-gray-500 dark:text-gray-400">
              {page + 1} / {Math.ceil(totalCount / rowsPerPage)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * rowsPerPage >= totalCount}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTransactionFeeTableWithPagination = () => (
    <div>{renderTransactionFeeTable()}</div>
  );

  return (
    <div className="text-gray-900 dark:text-white w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">
          Gestion des frais de transaction
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenDialog("add")}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Ajouter
          </button>
          <button
            onClick={handleUpdateFromApi}
            disabled={updatingFromApi}
            className="flex items-center px-4 py-2 border border-green-500 text-green-500 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/30 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className="h-5 w-5 mr-1" />
            {updatingFromApi ? "Mise à jour..." : "Mettre à jour depuis l'API"}
            {updatingFromApi && <CircularProgress size={16} className="ml-2" />}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1f2937] rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        {renderTransactionFeeTableWithPagination()}
      </div>

      {/* Dialog pour ajouter/modifier des frais */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white",
          sx: {
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            borderRadius: "0.5rem",
          },
        }}
      >
        <DialogTitle className="border-b border-gray-200 dark:border-gray-700 text-xl font-medium text-gray-900 dark:text-white">
          {dialogMode === "add"
            ? "Ajouter des frais de transaction"
            : "Modifier des frais de transaction"}
        </DialogTitle>
        <DialogContent className="pt-4 bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white">
          {renderFormFields()}
        </DialogContent>
        <DialogActions className="border-t border-gray-200 dark:border-gray-700 py-3 px-4">
          <button
            onClick={handleCloseDialog}
            className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
          >
            {dialogMode === "add" ? "Ajouter" : "Mettre à jour"}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TransactionFeeSettings;
