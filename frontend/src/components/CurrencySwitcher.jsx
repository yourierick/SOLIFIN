import React from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';

/**
 * Composant de commutateur de devise USD/CDF réutilisable - Style minimaliste
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.size - Taille des boutons ('small', 'medium', 'large')
 * @param {boolean} props.showLabels - Afficher ou masquer les labels textuels
 * @param {boolean} props.showIcons - Afficher ou masquer les icônes
 * @param {string} props.className - Classes CSS additionnelles
 * @param {Object} props.sx - Styles additionnels Material-UI
 */
const CurrencySwitcher = ({ 
  size = 'small', 
  showLabels = true,
  showIcons = false,
  className = '',
  sx = {}
}) => {
  const { isDarkMode } = useTheme();
  const { selectedCurrency, toggleCurrency, isCDFEnabled } = useCurrency();

  // Si CDF n'est pas activé, ne pas afficher le commutateur
  if (!isCDFEnabled) {
    return null;
  }

  const handleCurrencyChange = (event, newCurrency) => {
    if (newCurrency !== null) {
      toggleCurrency(newCurrency);
    }
  };

  const buttonStyles = {
    px: 2,
    py: 1,
    fontSize: '0.875rem',
    fontWeight: 500,
    textTransform: 'none',
    border: 'none',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    '&.Mui-selected': {
      backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
      color: isDarkMode ? '#ffffff' : '#111827',
      fontWeight: 600,
      boxShadow: isDarkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
    },
    '&:not(.Mui-selected)': {
      color: isDarkMode ? '#9ca3af' : '#6b7280',
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      },
    },
    ...sx
  };

  return (
    <div className={`currency-switcher ${className}`}>
      <ToggleButtonGroup
        value={selectedCurrency}
        exclusive
        onChange={handleCurrencyChange}
        size={size}
        sx={{
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          borderRadius: '8px',
          padding: '2px',
          gap: '1px',
        }}
      >
        <ToggleButton value="USD" sx={buttonStyles}>
          {showIcons && (
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {showLabels && 'USD'}
        </ToggleButton>
        <ToggleButton value="CDF" sx={buttonStyles}>
          {showIcons && (
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          )}
          {showLabels && 'CDF'}
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
};

export default CurrencySwitcher;
