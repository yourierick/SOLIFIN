import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

const icons = {
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon
};

const styles = {
  success: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
  error: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
  info: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700'
};

const iconStyles = {
  success: 'text-green-400 dark:text-green-300',
  warning: 'text-yellow-400 dark:text-yellow-300',
  error: 'text-red-400 dark:text-red-300',
  info: 'text-blue-400 dark:text-blue-300'
};

export default function TrialAlert({
  type = 'info',
  message,
  onClose,
  className = '',
  ...props
}) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = icons[type];

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/60 dark:bg-black/70 backdrop-blur-md" 
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={twMerge(
              'max-w-xl w-full mx-4 sm:mx-auto rounded-xl p-6 shadow-2xl border-2 flex flex-col sm:flex-row items-start',
              styles[type],
              className
            )}
            role="alert"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              delay: 0.1
            }}
            {...props}
          >
            <motion.div 
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-shrink-0 sm:mt-0 mb-3 sm:mb-0"
            >
              <Icon className={twMerge('h-7 w-7 sm:h-8 sm:w-8', iconStyles[type])} />
            </motion.div>
            
            <div className="ml-0 sm:ml-4 flex-grow">
              <motion.p 
                className="text-base sm:text-lg font-medium leading-relaxed"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {message}
              </motion.p>
            </div>
            
            <motion.button
              type="button"
              className={`absolute top-3 right-3 sm:static sm:ml-4 flex-shrink-0 ${iconStyles[type]} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type === 'info' ? 'blue' : type === 'success' ? 'green' : type === 'warning' ? 'yellow' : 'red'}-500`}
              onClick={handleClose}
              aria-label="Fermer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <XMarkIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
