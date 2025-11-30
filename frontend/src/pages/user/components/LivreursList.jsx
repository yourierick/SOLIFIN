import React from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";

const statusLabels = {
  en_attente: "En attente",
  approuve: "Approuvé",
  rejete: "Rejeté",
  revoque: "Révoqué",
};

const statusColors = {
  en_attente: "bg-yellow-100 text-yellow-800",
  approuve: "bg-green-100 text-green-800",
  rejete: "bg-red-100 text-red-800",
  revoque: "bg-gray-100 text-gray-800",
};

export default function LivreursList({
  livreurs,
  onApprove,
  onReject,
  onDelete,
  onRevoke,
  isPageOwner,
}) {
  if (!livreurs || livreurs.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">
          {isPageOwner
            ? "Aucun livreur n'a postulé pour votre page pour le moment."
            : "Vous n'avez pas encore postulé comme livreur pour cette page."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Livreur
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Description
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Zone de livraison
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Statut
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {livreurs.map((livreur) => (
            <tr key={livreur.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    {livreur.user?.picture ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={livreur.user.picture}
                        alt=""
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-800 font-medium">
                          {livreur.user?.name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {livreur.user?.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {livreur.coordonnees}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 dark:text-white line-clamp-2">
                  {livreur.description || "Aucune description fournie"}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 dark:text-white">
                  {livreur.zone_livraison || "Non spécifiée"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    statusColors[livreur.statut]
                  }`}
                >
                  {statusLabels[livreur.statut]}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  {livreur.statut === "en_attente" ||
                    (livreur.statut === "revoque" && (
                      <>
                        <button
                          onClick={() => onApprove(livreur.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Approuver"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onReject(livreur.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Rejeter"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onDelete(livreur.id)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </>
                    ))}
                  {livreur.statut === "approuve" && (
                    <>
                      <button
                        onClick={() => onRevoke(livreur.id)}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                        title="Révoquer"
                      >
                        <NoSymbolIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onDelete(livreur.id)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
