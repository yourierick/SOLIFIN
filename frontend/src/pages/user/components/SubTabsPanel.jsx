import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function SubTabsPanel({ tabs, panels }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (index) => {
    setSelectedIndex(index);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Dropdown Header */}
      <div className="mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          <div className="flex items-center">
            <div className="flex items-center mr-3">
              {tabs[selectedIndex]?.icon && React.createElement(tabs[selectedIndex].icon, {
                className: "h-5 w-5 text-primary-600 dark:text-primary-400 mr-2 transition-all duration-300 group-hover:scale-110"
              })}
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Menu
              </span>
            </div>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mr-3"></div>
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              {tabs[selectedIndex]?.label}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {selectedIndex + 1} / {tabs.length}
            </span>
            {isOpen ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform duration-300" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform duration-300 group-hover:text-primary-500 dark:group-hover:text-primary-400" />
            )}
          </div>
          
          {/* Animated gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-purple-500/5 dark:from-primary-500/10 dark:to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl shadow-gray-200/20 dark:shadow-gray-900/20 overflow-hidden"
          >
            <div className="p-2">
              {tabs.map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={classNames(
                    "relative w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] group",
                    selectedIndex === idx
                      ? "bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 text-primary-700 dark:text-primary-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary-600 dark:hover:text-primary-400"
                  )}
                >
                  <div className="flex items-center flex-1">
                    {tab.icon && React.createElement(tab.icon, {
                      className: classNames(
                        "h-4 w-4 mr-3 transition-all duration-200",
                        selectedIndex === idx
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-gray-500 dark:text-gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400"
                      )
                    })}
                    <span className={selectedIndex === idx ? "font-semibold" : "font-medium"}>
                      {tab.label}
                    </span>
                  </div>
                  {selectedIndex === idx && (
                    <CheckIcon className="h-4 w-4 text-primary-600 dark:text-primary-400 ml-2" />
                  )}
                  
                  {/* Hover indicator */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-purple-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Panel Content */}
      <motion.div
        key={selectedIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={classNames(
          "rounded-xl p-1 focus:outline-none transition-all duration-300 ease-in-out",
          panels[selectedIndex]?.className || ""
        )}
      >
        {panels[selectedIndex]?.content}
      </motion.div>
    </div>
  );
}
