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
      const permissions = [...prev.permissions];
      if (permissions.includes(permissionId)) {
        return {
          ...prev,
          permissions: permissions.filter((id) => id !== permissionId),
        };
      } else {
        return {
          ...prev,
          permissions: [...permissions, permissionId],
        };
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
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestion des Rôles et Permissions
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={openCreateRoleModal}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Nouveau Rôle
          </button>
          <button
            onClick={openAssignRoleModal}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Attribuer Rôle
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Nom
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Slug
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Permissions
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {role.nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {role.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                    {role.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditRoleModal(role)}
                        className="text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {role.slug !== "super-admin" && role.slug !== "user" && (
                        <button
                          onClick={() => deleteRole(role.id)}
                          className="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal pour créer/modifier un rôle */}
      {showRoleModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-gray-800 dark:text-white">
            <h3 className="text-xl font-bold mb-4">
              {editingRole ? "Modifier le rôle" : "Créer un nouveau rôle"}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nom du rôle"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slug
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="slug-du-role"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Description du rôle"
                rows="3"
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permissions
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`permission-${permission.id}`}
                      checked={formData.permissions.includes(permission.id)}
                      onChange={() => handlePermissionChange(permission.id)}
                      className="mr-2 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
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

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveRole}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-gray-800 dark:text-white">
            <h3 className="text-xl font-bold mb-4">
              Attribuer un rôle à un utilisateur
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Utilisateur
              </label>
              <select
                value={selectedUser}
                onChange={handleUserChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Sélectionner un utilisateur</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rôle
              </label>
              <select
                value={selectedRole}
                onChange={handleRoleChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Sélectionner un rôle</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={assignRoleToUser}
                disabled={!selectedUser || !selectedRole}
                className={`px-4 py-2 ${
                  !selectedUser || !selectedRole
                    ? "bg-primary-400 dark:bg-primary-800 cursor-not-allowed"
                    : "bg-primary-600 hover:bg-primary-700"
                } text-white rounded transition-colors`}
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
