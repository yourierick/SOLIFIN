import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { toast } from "react-toastify";
import axios from "axios";
import {
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

const RoleManagement = () => {
  const { token } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [formData, setFormData] = useState({
    nom: "",
    slug: "",
    description: "",
    permissions: [],
  });

  // Récupérer les rôles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors de la récupération des rôles:", error);
      toast.error("Erreur lors de la récupération des rôles");
      setLoading(false);
    }
  };

  // Récupérer les permissions
  const fetchPermissions = async () => {
    try {
      const response = await axios.get("/api/admin/roles/permissions/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPermissions(response.data.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des permissions:", error);
      toast.error("Erreur lors de la récupération des permissions");
    }
  };

  // Récupérer les utilisateurs
  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.data.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      toast.error("Erreur lors de la récupération des utilisateurs");
    }
  };

  // Récupérer les données au chargement du composant
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchUsers();
  }, []);

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gérer les changements de permissions
  const handlePermissionChange = (permissionId) => {
    setFormData((prev) => {
      const currentPermissions = [...prev.permissions];
      const isRemoving = currentPermissions.includes(permissionId);
      
      // Trouver les permissions par slug
      const manageGiftsId = permissions.find(p => p.slug === "manage-gifts")?.id;
      const manageGiftsHistoryId = permissions.find(p => p.slug === "manage-gifts-history")?.id;
      const manageTicketsId = permissions.find(p => p.slug === "manage-tickets")?.id;
      
      // Vérifier si la permission cliquée est manage-gifts
      const isManageGifts = permissionId === manageGiftsId;
      
      // Si on désactive une permission
      if (isRemoving) {
        // Si on désactive manage-gifts, désactiver aussi les permissions dépendantes
        if (isManageGifts) {
          return {
            ...prev,
            permissions: currentPermissions.filter(id => 
              id !== manageGiftsId && 
              id !== manageGiftsHistoryId && 
              id !== manageTicketsId
            ),
          };
        } else {
          // Désactivation normale pour les autres permissions
          return {
            ...prev,
            permissions: currentPermissions.filter(id => id !== permissionId),
          };
        }
      } 
      // Si on active une permission
      else {
        // Si on active manage-gifts, activer aussi les permissions dépendantes
        if (isManageGifts) {
          const newPermissions = [...currentPermissions, permissionId];
          
          // Ajouter les permissions dépendantes si elles ne sont pas déjà présentes
          if (manageGiftsHistoryId && !newPermissions.includes(manageGiftsHistoryId)) {
            newPermissions.push(manageGiftsHistoryId);
          }
          
          if (manageTicketsId && !newPermissions.includes(manageTicketsId)) {
            newPermissions.push(manageTicketsId);
          }
          
          return {
            ...prev,
            permissions: newPermissions,
          };
        } 
        // Si on essaie d'activer une permission dépendante
        else if (
          (permissionId === manageGiftsHistoryId || permissionId === manageTicketsId) && 
          !currentPermissions.includes(manageGiftsId)
        ) {
          // Ne pas permettre l'activation des permissions dépendantes si manage-gifts est désactivé
          toast.warning("Vous devez d'abord activer la permission 'Gérer les cadeaux'");
          return prev;
        } 
        // Activation normale pour les autres permissions
        else {
          return {
            ...prev,
            permissions: [...currentPermissions, permissionId],
          };
        }
      }
    });
  };

  // Ouvrir le modal pour créer un rôle
  const openCreateRoleModal = () => {
    setEditingRole(null);
    setFormData({
      nom: "",
      slug: "",
      description: "",
      permissions: [],
    });
    setShowRoleModal(true);
  };

  // Ouvrir le modal pour modifier un rôle
  const openEditRoleModal = (role) => {
    setEditingRole(role.id);
    setFormData({
      nom: role.nom,
      slug: role.slug,
      description: role.description || "",
      permissions: role.permissions.map((p) => p.id),
    });
    setShowRoleModal(true);
  };

  // Créer ou mettre à jour un rôle
  const saveRole = async () => {
    try {
      if (editingRole) {
        // Mettre à jour un rôle existant
        await axios.put(`/api/admin/roles/${editingRole}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Rôle mis à jour avec succès");
      } else {
        // Créer un nouveau rôle
        await axios.post("/api/admin/roles", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Rôle créé avec succès");
      }
      setShowRoleModal(false);
      fetchRoles();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du rôle:", error);
      toast.error("Erreur lors de la sauvegarde du rôle");
    }
  };

  // Supprimer un rôle
  const deleteRole = async (roleId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rôle ?")) {
      try {
        await axios.delete(`/api/admin/roles/${roleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Rôle supprimé avec succès");
        fetchRoles();
      } catch (error) {
        console.error("Erreur lors de la suppression du rôle:", error);
        toast.error("Erreur lors de la suppression du rôle");
      }
    }
  };

  // Ouvrir le modal pour attribuer un rôle à un utilisateur
  const openAssignRoleModal = () => {
    setSelectedUser("");
    setSelectedRole("");
    setShowAssignModal(true);
  };

  // Gérer le changement d'utilisateur sélectionné
  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  // Gérer le changement de rôle sélectionné
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  // Attribuer un rôle à un utilisateur
  const assignRoleToUser = async () => {
    try {
      await axios.post(
        "/api/admin/roles/assign-to-user",
        {
          user_id: selectedUser,
          role_id: selectedRole,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Rôle attribué avec succès");
      setShowAssignModal(false);
      fetchUsers();
    } catch (error) {
      console.error("Erreur lors de l'attribution du rôle:", error);
      toast.error("Erreur lors de l'attribution du rôle");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-10 blur-xl"></div>
        <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-lg opacity-30"></div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Gestion des rôles et permissions
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Administrez les rôles et les permissions des utilisateurs
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={openCreateRoleModal}
              className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg w-full sm:w-auto"
            >
              <PlusCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Nouveau rôle</span>
            </button>
            <button
              onClick={openAssignRoleModal}
              className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg w-full sm:w-auto"
            >
              <UserPlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Attribuer rôle</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-2 border-pink-600 border-opacity-30"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Cards pour mobile */}
          <div className="space-y-4 sm:hidden">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {role.nom}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {role.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditRoleModal(role)}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-300 transition-all duration-200"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => openDeleteRoleModal(role)}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300 transition-all duration-200"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {role.description}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions && role.permissions.slice(0, 3).map((permission, index) => (
                      <span
                        key={permission.id || index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100"
                      >
                        {permission.nom}
                      </span>
                    ))}
                    {role.permissions && role.permissions.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        +{role.permissions.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tableau pour desktop */}
          <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white"
                  >
                    Nom
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white"
                  >
                    Slug
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white"
                  >
                    Permissions
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                          <ShieldCheckIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {role.nom}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {role.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {role.description || (
                        <span className="text-gray-400 italic">Aucune description</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map((permission) => (
                          <span
                            key={permission.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {permission.nom}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditRoleModal(role)}
                          className="inline-flex items-center justify-center p-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-300 transition-all duration-200 transform hover:scale-105"
                          title="Modifier"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteRoleModal(role)}
                          className="inline-flex items-center justify-center p-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300 transition-all duration-200 transform hover:scale-105"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal pour créer/modifier un rôle */}
      {showRoleModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700">
            <div className="relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-10"></div>
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <ShieldCheckIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingRole ? "Modifier le rôle" : "Créer un nouveau rôle"}
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Nom du rôle"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="slug-du-role"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Description du rôle"
                  rows="3"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`permission-${permission.id}`}
                        checked={formData.permissions.includes(permission.id)}
                        onChange={() => handlePermissionChange(permission.id)}
                        className="mr-2 w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label
                        htmlFor={`permission-${permission.id}`}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        {permission.nom}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
              >
                Annuler
              </button>
              <button
                onClick={saveRole}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {editingRole ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour attribuer un rôle à un utilisateur */}
      {showAssignModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700">
            <div className="relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl opacity-10"></div>
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                  <UserPlusIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Attribuer un rôle à un utilisateur
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Utilisateur
                </label>
                <select
                  value={selectedUser}
                  onChange={handleUserChange}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Rôle
                </label>
                <select
                  value={selectedRole}
                  onChange={handleRoleChange}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <option value="">Sélectionner un rôle</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
              >
                Annuler
              </button>
              <button
                onClick={assignRoleToUser}
                disabled={!selectedUser || !selectedRole}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg ${
                  !selectedUser || !selectedRole
                    ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed scale-100"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                }`}
              >
                Attribuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
