import React, { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import TransactionFeeSettings from "./components/TransactionFeeSettings";
import CountryAccessSettings from "./components/CountryAccessSettings";
import GeneralSettings from "./components/GeneralSettings";
import ExchangeRatesSettings from "./components/ExchangeRatesSettings";
import RoleManagement from "./components/RoleManagement";
import { useTheme } from "../../contexts/ThemeContext";
import {
  CurrencyDollarIcon,
  Cog6ToothIcon,
  CurrencyEuroIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Settings = () => {
  const { isDarkMode } = useTheme();
  const [isEmailNotificationEnabled, setIsEmailNotificationEnabled] =
    useState(true);
  const [password, setPassword] = useState("");

  // Configuration des onglets avec leurs icônes et titres
  const tabs = [
    { name: "Frais De Transaction", icon: CurrencyDollarIcon },
    { name: "Paramètres Généraux", icon: Cog6ToothIcon },
    { name: "Taux de change", icon: CurrencyDollarIcon },
    { name: "Pays Autorisés", icon: GlobeAltIcon },
    { name: "Rôles & Permissions", icon: UserGroupIcon },
  ];

  return (
    <div className="bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white rounded-lg shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6 flex items-center">
          <Cog6ToothIcon className="h-7 w-7 mr-2 text-primary-600 dark:text-primary-400" />
          Paramètres du système
        </h1>

        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                className={({ selected }) =>
                  classNames(
                    "w-full py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out flex items-center justify-center",
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
          <hr className="my-4" />

          <Tab.Panels className="mt-4">
            <Tab.Panel>
              <div className="rounded-lg bg-white p-4 dark:bg-[#1f2937] dark:text-white">
                <TransactionFeeSettings />
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="rounded-lg bg-white p-4 dark:bg-[#1f2937] dark:text-white">
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
                  <CurrencyDollarIcon className="h-6 w-6 mr-2 text-primary-600 dark:text-primary-400" />
                  Taux de change
                </h2>
                <div className="space-y-4">
                  <ExchangeRatesSettings />
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
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default Settings;
