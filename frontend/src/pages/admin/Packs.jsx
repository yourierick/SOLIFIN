import { useState, useEffect, Fragment, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import {
  PlusIcon,
  ArrowPathIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  GiftIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useToast } from "../../hooks/useToast";
import Notification from "../../components/Notification";
import { Tooltip } from "react-tooltip";
import {
  Tabs,
  Tab,
  Box,
  Paper,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useTheme as useAppTheme } from "../../contexts/ThemeContext";

// Import du composant MyPacks avec lazy loading
const MyPacks = lazy(() => import("./MyPacks"));

// Composant FormulaireAjoutBonus déplacé en dehors pour éviter la re-création
const FormulaireAjoutBonus = ({
  packId,
  onBonusAdded,
  bonusType,
  onBonusTypeChange,
  setBonusRates,
}) => {
  const [formBonus, setFormBonus] = useState({
    type: "esengo",
    nombre_filleuls: "",
    points_attribues: "",
  });

  const handleBonusChange = (e) => {
    const { name, value } = e.target;
    setFormBonus((prevState) => {
      const newState = {
        ...prevState,
        [name]: value,
      };
      return newState;
    });
  };

  const handleBonusSubmit = async (e) => {
    e.preventDefault();

    // Pas de validation spéciale nécessaire pour les jetons Esengo

    try {
      const response = await axios.post(
        `/api/admin/packs/${packId}/bonus-rates`,
        formBonus
      );
      if (response.data.success) {
        Notification.success("Jetons Esengo configurés avec succès");

        // Mettre à jour la liste des bonus immédiatement
        const updatedBonusResponse = await axios.get(
          `/api/admin/packs/${packId}/bonus-rates`
        );
        if (updatedBonusResponse.data.success) {
          setBonusRates(updatedBonusResponse.data.bonusRates || []);
        }

        setFormBonus({
          type: "esengo",
          nombre_filleuls: "",
          points_attribues: "",
        });
        onBonusAdded();
      }
    } catch (error) {
      // Gérer l'erreur lorsqu'un type de bonus est déjà configuré
      if (error.response && error.response.status === 422) {
        Notification.error(
          error.response.data.message ||
            "Une configuration de jetons Esengo existe déjà pour ce pack"
        );
      } else {
        Notification.error(
          "Une erreur est survenue lors de l'ajout du bonus. Veuillez réessayer."
        );
      }
    }
  };

  // Type fixé à Esengo uniquement

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        Configurer les jetons Esengo
      </h3>
      <form onSubmit={handleBonusSubmit}>
        {/* Type fixé à Esengo - pas de sélection nécessaire */}

        <div className="mb-4">
          <label
            htmlFor="nombre_filleuls"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Nombre de filleuls pour obtenir des jetons
          </label>
          <input
            type="number"
            id="nombre_filleuls"
            name="nombre_filleuls"
            value={formBonus.nombre_filleuls}
            onChange={handleBonusChange}
            onFocus={() => console.log("Input focused: nombre_filleuls")}
            onBlur={() => console.log("Input blurred: nombre_filleuls")}
            onKeyDown={(e) => console.log("Key pressed:", e.key)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            min="1"
            required
            placeholder="Ex: 5 (1 jeton tous les 5 filleuls)"
            disabled={false}
            readOnly={false}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Si un utilisateur parraine 10 filleuls, il recevra 1 jeton.
          </p>
        </div>

        <div className="mb-4">
          <label
            htmlFor="points_attribues"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Nombre de jetons Esengo par palier
          </label>
          <input
            type="number"
            id="points_attribues"
            name="points_attribues"
            value={formBonus.points_attribues}
            onChange={handleBonusChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            min="1"
            required
            placeholder="Ex: 1 (1 jeton par palier atteint)"
            disabled={false}
            readOnly={false}
          />
        </div>

        {/* Champ valeur_point supprimé car non nécessaire pour les jetons Esengo */}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Ajouter
        </button>
      </form>
    </div>
  );
};

export default function Packs() {
  // État pour gérer les onglets
  const [activeTab, setActiveTab] = useState(0);
  const [tabHover, setTabHover] = useState(null);
  const { isDarkMode } = useAppTheme();

  // États existants
  const [packs, setPacks] = useState([]);
  const [filteredPacks, setFilteredPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // État pour les permissions utilisateur
  const [userPermissions, setUserPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isCommissionModalVisible, setIsCommissionModalVisible] =
    useState(false);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [commissionRates, setCommissionRates] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [packToDelete, setPackToDelete] = useState(null);
  const [packToDeleteName, setPackToDeleteName] = useState("");
  const [isBonusModalVisible, setIsBonusModalVisible] = useState(false);
  const [selectedPackIdForBonus, setSelectedPackIdForBonus] = useState(null);
  const [selectedPackNameForBonus, setSelectedPackNameForBonus] = useState("");
  const [bonusRates, setBonusRates] = useState([]);
  const [currentBonusType, setCurrentBonusType] = useState("esengo");
  const [newBonusRate, setNewBonusRate] = useState({
    frequence: "weekly",
    nombre_filleuls: 5,
    taux_bonus: 50,
  });
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    prix: "",
    duree: "",
    image: null,
    frequence: "weekly",
    nombre_filleuls: "",
    points_attribues: "",
    valeur_point: "",
  });

  // Fonction pour déterminer les onglets disponibles en fonction des permissions
  const getAvailableTabs = () => {
    const tabs = [];

    if (
      userPermissions.includes("manage-packs") ||
      userPermissions.includes("super-admin")
    ) {
      tabs.push("gestion");
    }

    if (
      userPermissions.includes("manage-own-packs") ||
      userPermissions.includes("super-admin")
    ) {
      tabs.push("mes-packs");
    }

    return tabs;
  };

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    const availableTabs = getAvailableTabs();

    if (newValue >= 0 && newValue < availableTabs.length) {
      setActiveTab(newValue);
    }
  };

  // Fonction pour récupérer les permissions de l'utilisateur
  const fetchUserPermissions = async () => {
    setLoadingPermissions(true);
    try {
      // Récupérer les permissions depuis l'API pour tous les utilisateurs
      const response = await axios.get(`/api/user/permissions`);
      if (response.data && response.data.permissions) {
        // Stocker les slugs des permissions
        const permissionSlugs = response.data.permissions.map(
          (permission) => permission.slug
        );
        setUserPermissions(permissionSlugs);
      } else {
        setUserPermissions([]);
      }
    } catch (error) {
      console.error(
        "[DEBUG] Erreur lors de la récupération des permissions:",
        error
      );
      setUserPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
    // Charger les packs seulement si l'utilisateur a la permission manage-packs
    if (
      userPermissions.includes("manage-packs") ||
      userPermissions.includes("super-admin")
    ) {
      fetchPacks();
    }
  }, []);

  // Initialiser l'onglet actif en fonction des permissions disponibles
  useEffect(() => {
    if (!loadingPermissions) {
      const availableTabs = getAvailableTabs();

      // Si aucun onglet n'est disponible, ne rien faire
      if (availableTabs.length === 0) {
        return;
      }

      // Si l'onglet actif n'est pas dans les onglets disponibles, sélectionner le premier onglet disponible
      if (!availableTabs[activeTab]) {
        setActiveTab(0);
      }
    }
  }, [userPermissions, loadingPermissions]);

  // Charger les packs quand les permissions sont chargées
  useEffect(() => {
    if (
      !loadingPermissions &&
      (userPermissions.includes("manage-packs") ||
        userPermissions.includes("super-admin"))
    ) {
      fetchPacks();
    }
  }, [userPermissions, loadingPermissions]);

  useEffect(() => {
    applyFilters();
  }, [packs, filters]);

  // Récupérer les permissions de l'utilisateur
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const response = await axios.get(`/api/user/permissions`);
        if (response.data && response.data.permissions) {
          const permissionSlugs = response.data.permissions.map(
            (permission) => permission.slug
          );
          setUserPermissions(permissionSlugs);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des permissions:", error);
      }
    };

    if (user) {
      fetchUserPermissions();
    }
  }, [user]);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/packs");
      setPacks(response.data.packs || []);
      setFilteredPacks(response.data.packs || []);
    } catch (err) {
      Notification.error("Erreur lors du chargement des packs");
      setPacks([]);
      setFilteredPacks([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...packs];

    if (filters.category) {
      result = result.filter((pack) =>
        pack.categorie.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.status !== "") {
      const statusValue = filters.status === "active";
      result = result.filter((pack) => pack.status === statusValue);
    }

    if (filters.search) {
      result = result.filter(
        (pack) =>
          pack.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          pack.avantages.some((avantage) =>
            avantage.toLowerCase().includes(filters.search.toLowerCase())
          )
      );
    }

    setFilteredPacks(result);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      status: "",
      search: "",
    });
  };

  const togglePackStatus = async (packId) => {
    try {
      const response = await axios.patch(
        `/api/admin/packs/${packId}/toggle-status`
      );
      if (response.data.success) {
        Notification.success(response.data.message);
        fetchPacks();
      }
    } catch (err) {
      Notification.error("Erreur lors de la mise à jour du statut");
    }
  };

  const showDeleteModal = (packId, packName) => {
    setPackToDelete(packId);
    setPackToDeleteName(packName);
    setIsDeleteModalVisible(true);
  };

  const hideDeleteModal = () => {
    setIsDeleteModalVisible(false);
    setPackToDelete(null);
    setPackToDeleteName("");
  };

  const showBonusModal = async (packId, packName) => {
    setSelectedPackIdForBonus(packId);
    setSelectedPackNameForBonus(packName);

    try {
      const response = await axios.get(
        `/api/admin/packs/${packId}/bonus-rates`
      );
      if (response.data.success) {
        setBonusRates(response.data.bonusRates || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des taux de bonus:", error);
      setBonusRates([]);
    }

    setIsBonusModalVisible(true);
  };

  const hideBonusModal = () => {
    setIsBonusModalVisible(false);
    setSelectedPackIdForBonus(null);
    setSelectedPackNameForBonus("");
    setBonusRates([]);
    setNewBonusRate({
      frequence: "monthly",
      nombre_filleuls: 5,
      points_attribues: 1,
    });
  };

  const deleteBonusRate = async (id) => {
    try {
      const response = await axios.delete(`/api/admin/bonus-rates/${id}`);
      if (response.data.success) {
        Notification.success("Taux de bonus supprimé avec succès");

        // Mettre à jour la liste des bonus immédiatement
        const updatedBonusResponse = await axios.get(
          `/api/admin/packs/${selectedPackIdForBonus}/bonus-rates`
        );
        if (updatedBonusResponse.data.success) {
          setBonusRates(updatedBonusResponse.data.bonusRates || []);
        }
      }
    } catch (error) {
      Notification.error("Erreur lors de la suppression du taux de bonus");
    }
  };

  const handleDelete = async () => {
    if (!packToDelete) return;

    try {
      const response = await axios.delete(`/api/admin/packs/${packToDelete}`);
      if (response.data.success) {
        showToast(response.data.message, "success");
        fetchPacks();
        hideDeleteModal();
      }
    } catch (err) {
      Notification.error("Erreur lors de la suppression du pack");
      hideDeleteModal();
    }
  };

  const showCommissionModal = (packId) => {
    setSelectedPackId(packId);
    axios
      .get(`/api/admin/packs/${packId}/commission-rates`)
      .then((response) => {
        setCommissionRates(response.data.rates);
        setIsCommissionModalVisible(true);
      })
      .catch((error) => {
        showToast("Erreur lors du chargement des taux de commission", "error");
      });
  };

  const handleCommissionSubmit = async (level, rate) => {
    try {
      await axios.post(`/api/admin/packs/${selectedPackId}/commission-rate`, {
        level,
        commission_rate: rate,
      });

      setCommissionRates((prev) => ({
        ...prev,
        [level]: rate,
      }));

      Notification.success(
        "Taux de commission mis à jour avec succès",
        "success"
      );
    } catch (error) {
      Notification.error(
        "Erreur lors de la mise à jour du taux de commission",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {!loadingPermissions && getAvailableTabs().length > 0
            ? getAvailableTabs()[activeTab] === "gestion"
              ? "Gestion des Packs"
              : "Mes Packs"
            : "Gestion des Packs"}
        </h1>
        <div className="flex space-x-2">
          {!loadingPermissions &&
            getAvailableTabs()[activeTab] === "gestion" && (
              <>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <FunnelIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={fetchPacks}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <Link
                  to="/admin/packs/add"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Ajouter un pack
                </Link>
              </>
            )}
        </div>
      </div>

      {/* Onglets avec design moderne - Afficher seulement si l'utilisateur a des permissions */}
      {!loadingPermissions && getAvailableTabs().length > 0 && (
        <Paper
          elevation={isDarkMode ? 2 : 3}
          sx={{
            p: 0,
            mb: 3,
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            borderRadius: 2,
            overflow: "hidden",
            transition: "all 0.3s ease",
            boxShadow: isDarkMode
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            TabIndicatorProps={{
              style: {
                backgroundColor: isDarkMode ? "#3b82f6" : "#2563eb",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
            sx={{
              borderBottom: 1,
              borderColor: isDarkMode
                ? "rgba(55, 65, 81, 0.5)"
                : "rgba(0, 0, 0, 0.08)",
              bgcolor: isDarkMode ? "#111827" : "#f8fafc",
              "& .MuiTabs-flexContainer": {
                gap: 1,
                px: 1,
                pt: 1,
              },
              "& .MuiTab-root": {
                minHeight: 48,
                transition: "all 0.2s ease",
                borderRadius: "8px 8px 0 0",
                fontWeight: 500,
                textTransform: "none",
                fontSize: "0.95rem",
                "&:hover": {
                  backgroundColor: isDarkMode
                    ? "rgba(59, 130, 246, 0.1)"
                    : "rgba(37, 99, 235, 0.05)",
                  color: isDarkMode ? "#60a5fa" : "#3b82f6",
                },
                "&.Mui-selected": {
                  color: isDarkMode ? "#60a5fa" : "#2563eb",
                  fontWeight: 600,
                },
              },
            }}
          >
            {/* Afficher les onglets en fonction des permissions disponibles */}
            {getAvailableTabs().map((tab, index) =>
              tab === "gestion" ? (
                <Tab
                  key="gestion"
                  icon={<FunnelIcon className="h-5 w-5" />}
                  iconPosition="start"
                  label="Gestion des packs"
                  onMouseEnter={() => setTabHover(index)}
                  onMouseLeave={() => setTabHover(null)}
                  sx={{
                    transform: tabHover === index ? "translateY(-2px)" : "none",
                  }}
                />
              ) : (
                <Tab
                  key="mes-packs"
                  icon={<PlusIcon className="h-5 w-5" />}
                  iconPosition="start"
                  label="Mes packs"
                  onMouseEnter={() => setTabHover(index)}
                  onMouseLeave={() => setTabHover(null)}
                  sx={{
                    transform: tabHover === index ? "translateY(-2px)" : "none",
                  }}
                />
              )
            )}
          </Tabs>
        </Paper>
      )}

      {!loadingPermissions && (
        <>
          {/* Contenu de l'onglet Gestion des packs */}
          {getAvailableTabs()[activeTab] === "gestion" && showFilters && (
            <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label
                    htmlFor="search"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Recherche
                  </label>
                  <input
                    type="text"
                    id="search"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Rechercher par nom ou avantage"
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Catégorie
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    placeholder="Filtrer par catégorie"
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Statut
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="">Tous</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table des packs */}
          {getAvailableTabs()[activeTab] === "gestion" && (
            <div className="mt-8 flex flex-col w-full">
              <div className="overflow-x-auto">
                <div className="w-full py-2 align-middle">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600 table-fixed">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="w-12 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                            N°
                          </th>
                          <th className="w-1/6 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                            Catégorie
                          </th>
                          <th className="w-1/5 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                            Nom
                          </th>
                          <th className="w-1/5 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                            Type d'abonnement
                          </th>
                          <th className="w-1/8 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                            Prix
                          </th>
                          <th className="w-1/8 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                            Status
                          </th>
                          <th className="w-1/6 px-3 py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-gray-200">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {filteredPacks.map((pack) => (
                          <tr
                            key={pack.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                              {filteredPacks.indexOf(pack) + 1}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-200 truncate">
                              {pack.categorie}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-200 truncate">
                              {pack.name}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-200 truncate">
                              {pack.abonnement}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                              {pack.price} $
                            </td>
                            <td className="px-3 py-4 text-sm">
                              <button
                                onClick={() => togglePackStatus(pack.id)}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  pack.status
                                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                    : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                                }`}
                              >
                                {pack.status ? "Actif" : "Inactif"}
                              </button>
                            </td>
                            <td className="px-3 py-4 text-sm text-center">
                              <div className="flex items-center justify-center">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => showCommissionModal(pack.id)}
                                    className="p-1.5 rounded-md text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                    title="Gérer les commissions"
                                  >
                                    <CurrencyDollarIcon className="h-4 w-4" />
                                  </button>
                                  <Link
                                    to={`/admin/packs/edit/${pack.id}`}
                                    className="p-1.5 rounded-md text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                    title="Modifier ce pack"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Link>
                                  <button
                                    onClick={() =>
                                      showBonusModal(pack.id, pack.name)
                                    }
                                    className="p-1.5 rounded-md text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                    title="Configurer les bonus"
                                  >
                                    <GiftIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      showDeleteModal(pack.id, pack.name)
                                    }
                                    className="p-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                    title="Supprimer ce pack"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet "Mes packs" */}
          {getAvailableTabs()[activeTab] === "mes-packs" && (
            <Box sx={{ mt: 2 }}>
              <Suspense
                fallback={
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height="400px"
                  >
                    <CircularProgress color="primary" />
                    <Typography variant="body1" ml={2} color="textSecondary">
                      Chargement des packs...
                    </Typography>
                  </Box>
                }
              >
                <MyPacks />
              </Suspense>
            </Box>
          )}

          {/* Message si aucun onglet n'est disponible */}
          {!loadingPermissions && getAvailableTabs().length === 0 && (
            <div className="mt-8 text-center">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-6">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400 dark:text-yellow-500" />
                <h3 className="mt-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Accès restreint
                </h3>
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-300">
                  Vous n'avez pas les permissions nécessaires pour accéder à
                  cette section.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Indicateur de chargement des permissions */}
      {loadingPermissions && (
        <div className="mt-8 text-center">
          <CircularProgress color="primary" />
          <Typography variant="body1" mt={2} color="textSecondary">
            Vérification des permissions...
          </Typography>
        </div>
      )}

      {/* Modal de suppression */}
      {isDeleteModalVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4 text-red-500">
              <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-semibold">
                Confirmer la suppression
              </h3>
            </div>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Êtes-vous sûr de vouloir supprimer le pack{" "}
              <span className="font-semibold">{packToDeleteName}</span> ? Cette
              action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={hideDeleteModal}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuration des bonus */}
      {isBonusModalVisible && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={hideBonusModal}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] border border-gray-200 dark:border-gray-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête avec gradient */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <GiftIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Configuration des Jetons Esengo
                    </h3>
                    <p className="text-emerald-100 text-sm">
                      Pack: {selectedPackNameForBonus}
                    </p>
                  </div>
                </div>
                <button
                  onClick={hideBonusModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            {/* Contenu défilant */}
            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
              {/* Section des taux existants */}
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Taux de bonus configurés
                  </h4>
                </div>

                {bonusRates.length > 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Type de bonus
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Fréquence
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Nombre de filleuls
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Jetons attribués
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {bonusRates.map((rate) => (
                            <tr
                              key={rate.id}
                              className="hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                    Jetons Esengo
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                  Mensuel
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-sm text-gray-900 dark:text-gray-200 font-medium">
                                  {rate.nombre_filleuls} filleuls
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                  {rate.points_attribues} jetons
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={() => deleteBonusRate(rate.id)}
                                  className="inline-flex items-center p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                                  title="Supprimer ce taux"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <GiftIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Aucun taux configuré
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Commencez par ajouter un taux de bonus pour ce pack
                    </p>
                  </div>
                )}
              </div>

              {/* Section d'ajout de nouveau taux */}
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ajouter un nouveau taux
                  </h4>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <FormulaireAjoutBonus
                    packId={selectedPackIdForBonus}
                    onBonusAdded={() => setBonusRates((prev) => [...prev])}
                    bonusType={currentBonusType}
                    onBonusTypeChange={setCurrentBonusType}
                    setBonusRates={setBonusRates}
                  />
                </div>
              </div>

              {/* Section d'aide et exemple */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <svg
                        className="h-6 w-6 text-amber-600 dark:text-amber-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 003.75-1.262c.955-.46 1.749-1.124 2.343-1.96a6.006 6.006 0 00.344-6.296 6.006 6.006 0 00-3.154-3.154 6.006 6.006 0 00-6.296.344c-.836.594-1.5 1.388-1.96 2.343a14.406 14.406 0 00-1.262 3.75 14.405 14.405 0 001.262 3.75c.46.955 1.124 1.749 1.96 2.343a6.006 6.006 0 006.296.344 6.006 6.006 0 003.154-3.154 6.006 6.006 0 00-.344-6.296c-.594-.836-1.388-1.5-2.343-1.96a14.405 14.405 0 00-3.75-1.262z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-3">
                      💡 Comment fonctionnent les jetons Esengo ?
                    </h4>
                    <div className="space-y-3 text-sm text-amber-800 dark:text-amber-300">
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p>
                          <strong>Exemple :</strong> Si vous configurez{" "}
                          <span className="bg-amber-200 dark:bg-amber-800 px-2 py-1 rounded font-medium">
                            2 jetons
                          </span>{" "}
                          pour{" "}
                          <span className="bg-amber-200 dark:bg-amber-800 px-2 py-1 rounded font-medium">
                            10 filleuls
                          </span>
                          , un utilisateur qui parraine 10 filleuls dans le mois
                          recevra 2 jetons Esengo.
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p>
                          <strong>Utilisation :</strong> Ces jetons permettent
                          de participer aux tirages au sort pour gagner des
                          cadeaux de valeur variable.
                        </p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p>
                          <strong>Fréquence :</strong> Les bonus sont calculés
                          mensuellement selon les critères définis.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pied de page fixe */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Les modifications sont appliquées immédiatement
                </div>
                <button
                  onClick={hideBonusModal}
                  className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des taux de commission */}
      {isCommissionModalVisible && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsCommissionModalVisible(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] border border-gray-200 dark:border-gray-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête avec gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Taux de Commission
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Configuration des niveaux de parrainage
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCommissionModalVisible(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            {/* Contenu principal */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    Configuration des commissions par génération
                  </p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Définissez les taux de commission pour chaque niveau de
                  parrainage. Ces taux seront appliqués automatiquement sur tous
                  les achats effectués par les filleuls.
                </p>
              </div>

              {/* Grille des niveaux de commission */}
              <div className="grid gap-4 mb-8">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className="group bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              level === 1
                                ? "bg-gradient-to-r from-green-500 to-green-600"
                                : level === 2
                                ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                : level === 3
                                ? "bg-gradient-to-r from-purple-500 to-purple-600"
                                : "bg-gradient-to-r from-orange-500 to-orange-600"
                            }`}
                          >
                            {level}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {level === 1 && "Première génération"}
                            {level === 2 && "Deuxième génération"}
                            {level === 3 && "Troisième génération"}
                            {level === 4 && "Quatrième génération"}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {level === 1 && "Filleuls directs"}
                            {level === 2 && "Filleuls des filleuls"}
                            {level === 3 && "Troisième niveau"}
                            {level === 4 && "Quatrième niveau"}
                          </p>
                        </div>
                      </div>

                      <form
                        className="flex items-center space-x-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const rate = parseFloat(e.target.rate.value);
                          handleCommissionSubmit(level, rate);
                        }}
                      >
                        <div className="relative">
                          <input
                            type="number"
                            name="rate"
                            step="0.01"
                            min="0"
                            max="100"
                            defaultValue={commissionRates[level]}
                            className="w-20 px-3 py-2 pr-8 text-center font-semibold rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium text-sm">
                            %
                          </span>
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <span className="flex items-center space-x-1">
                            <span>Sauver</span>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </span>
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>

              {/* Section d'information améliorée */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      💡 Comment ça fonctionne ?
                    </h4>
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                      <p>
                        Les taux de commission sont appliqués en cascade sur les
                        achats de vos filleuls :
                      </p>
                      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 mt-3">
                        <p className="font-medium mb-1">Exemple pratique :</p>
                        <p>
                          Si vous définissez{" "}
                          <span className="font-bold text-blue-700 dark:text-blue-300">
                            10%
                          </span>{" "}
                          pour la 1ère génération, vous recevrez 10% de
                          commission sur tous les achats effectués par vos
                          filleuls directs.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pied de page */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Les modifications sont appliquées immédiatement
                </div>
                <button
                  onClick={() => setIsCommissionModalVisible(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
