import React from "react";
import { Tab } from "@headlessui/react";
import { motion } from "framer-motion";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function SubTabsPanel({ tabs, panels }) {
  return (
    <Tab.Group>
      <div className="relative mb-6">
        <Tab.List className="flex overflow-x-auto hide-scrollbar rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700 p-2 shadow-sm">
          {tabs.map((tab, idx) => (
            <Tab
              key={idx}
              className={({ selected }) =>
                classNames(
                  "relative min-w-[120px] flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out mx-1",
                  "focus:outline-none",
                  selected
                    ? "bg-white dark:bg-gray-900 text-primary-700 dark:text-primary-400 shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-800/50 hover:text-primary-600"
                )
              }
            >
              {({ selected }) => (
                <>
                  <span className="flex items-center">
                    {tab.icon && (
                      <tab.icon
                        className={classNames(
                          "h-4 w-4 transition-all duration-200",
                          selected
                            ? "text-primary-600 dark:text-primary-400"
                            : "text-gray-500 dark:text-gray-400",
                          tab.label ? "mr-2" : ""
                        )}
                      />
                    )}
                    <span className={selected ? "font-semibold" : ""}>
                      {tab.label}
                    </span>
                  </span>
                  {selected && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full"
                      layoutId="underline"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </>
              )}
            </Tab>
          ))}
        </Tab.List>
      </div>

      <Tab.Panels className="mt-2">
        {panels.map((panel, idx) => (
          <Tab.Panel
            key={idx}
            className={classNames(
              "rounded-xl p-1 focus:outline-none transition-all duration-300 ease-in-out",
              panel.className || ""
            )}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {panel.content}
            </motion.div>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}
