import React, { useState, useEffect, useRef } from "react";
import { Tab } from "@headlessui/react";
import TransactionFeeSettings from "./components/TransactionFeeSettings";
import CountryAccessSettings from "./components/CountryAccessSettings";
import GeneralSettings from "./components/GeneralSettings";
import RoleManagement from "./components/RoleManagement";
import TransactionSerdipay from "./components/TransactionSerdipay";
import { useTheme } from "../../contexts/ThemeContext";
import {
  CurrencyDollarIcon,
  Cog6ToothIcon,
  CurrencyEuroIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Style pour masquer la barre de défilement
const style = document.createElement("style");
style.textContent = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(style);

const Settings = () => {
  const { isDarkMode } = useTheme();
  const [isEmailNotificationEnabled, setIsEmailNotificationEnabled] =
    useState(true);
  const [password, setPassword] = useState("");
  const tabListRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Fonction pour vérifier si les flèches doivent être affichées
  const checkForArrows = () => {
    if (tabListRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = tabListRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth);
    }
  };

  // Vérifier au chargement et au redimensionnement
  useEffect(() => {
    checkForArrows();
    window.addEventListener("resize", checkForArrows);
    return () => window.removeEventListener("resize", checkForArrows);
  }, []);

  // Fonctions pour faire défiler
  const scrollLeft = () => {
    if (tabListRef.current) {
      tabListRef.current.scrollBy({ left: -200, behavior: "smooth" });
      setTimeout(checkForArrows, 300);
    }
  };

  const scrollRight = () => {
    if (tabListRef.current) {
      tabListRef.current.scrollBy({ left: 200, behavior: "smooth" });
      setTimeout(checkForArrows, 300);
    }
  };

  // Configuration des onglets avec leurs icônes et titres
  const tabs = [
    { name: "Frais De Transaction", icon: CurrencyDollarIcon },
    { name: "Paramètres Généraux", icon: Cog6ToothIcon },
    { name: "Pays Autorisés", icon: GlobeAltIcon },
    { name: "Rôles & Permissions", icon: UserGroupIcon },
    { name: "Transactions Serdipay", icon: CreditCardIcon },
  ];

  return (
    <div className="bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white rounded-lg shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6 flex items-center">
          <Cog6ToothIcon className="h-7 w-7 mr-2 text-primary-600 dark:text-primary-400" />
          Paramètres du système
        </h1>

        <Tab.Group>
          <div className="relative flex items-center">
            {showLeftArrow && (
              <button
                onClick={scrollLeft}
                className="absolute left-0 z-10 flex items-center justify-center h-8 w-8 rounded-full bg-white dark:bg-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 ease-in-out"
                style={{ transform: "translateX(-50%)" }}
                aria-label="Défiler vers la gauche"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}

            <div className="relative flex-1 overflow-hidden">
              <Tab.List
                ref={tabListRef}
                className="flex space-x-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800 overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                onScroll={checkForArrows}
              >
                {tabs.map((tab, index) => (
                  <Tab
                    key={index}
                    className={({ selected }) =>
                      classNames(
                        "flex-shrink-0 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out flex items-center justify-center",
                        "focus:outline-none",
                        selected
                          ? "bg-white dark:bg-[#141c2f] shadow-md text-primary-600 dark:text-primary-400"
                          : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] dark:hover:bg-white/[0.08] hover:text-primary-600 dark:hover:text-primary-400"
                      )
                    }
                  >
                    <tab.icon className="h-5 w-5 mr-1" />
                    {tab.name}
                  </Tab>
                ))}
              </Tab.List>
            </div>

            {showRightArrow && (
              <button
                onClick={scrollRight}
                className="absolute right-0 z-10 flex items-center justify-center h-8 w-8 rounded-full bg-white dark:bg-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 ease-in-out"
                style={{ transform: "translateX(50%)" }}
                aria-label="Défiler vers la droite"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          <hr className="my-4" />

          <Tab.Panels className="mt-4">
            <Tab.Panel>
              <div className="rounded-lg bg-white p-4 dark:bg-[#1f2937] dark:text-white">
                <TransactionFeeSettings />
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="rounded-lg bg-white p-4 dark:bg-[#1a2538] dark:text-white">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Cog6ToothIcon className="h-6 w-6 mr-2 text-primary-600 dark:text-primary-400" />
                  Paramètres généraux
                </h2>
                <div className="space-y-4">
                  <GeneralSettings />
                </div>
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="rounded-lg bg-white p-4 dark:bg-[#1f2937] dark:text-white">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <GlobeAltIcon className="h-6 w-6 mr-2 text-primary-600 dark:text-primary-400" />
                  Pays autorisés
                </h2>
                <div className="space-y-4">
                  <CountryAccessSettings />
                </div>
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="rounded-lg bg-white p-4 dark:bg-[#1f2937] dark:text-white">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <UserGroupIcon className="h-6 w-6 mr-2 text-primary-600 dark:text-primary-400" />
                  Rôles et Permissions
                </h2>
                <div className="space-y-4">
                  <RoleManagement />
                </div>
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="rounded-lg bg-white p-4 dark:bg-[#1f2937] dark:text-white">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CreditCardIcon className="h-6 w-6 mr-2 text-primary-600 dark:text-primary-400" />
                  Transactions Serdipay
                </h2>
                <div className="space-y-4">
                  <TransactionSerdipay />
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default Settings;
