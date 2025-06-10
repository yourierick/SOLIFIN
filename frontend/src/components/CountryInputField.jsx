import React from 'react';
import { useFormContext } from 'react-hook-form';
import CountrySelector from './CountrySelector';

/**
 * Composant pour afficher un champ de sélection de pays avec drapeaux
 * Ce composant est conçu pour être utilisé avec react-hook-form
 */
const CountryInputField = ({ name, label, required, placeholder, defaultValue }) => {
  const { register, setValue, watch } = useFormContext();
  const value = watch(name);

  // Fonction appelée lorsqu'un pays est sélectionné
  const handleCountryChange = (countryName) => {
    setValue(name, countryName, { shouldValidate: true });
  };

  // Enregistrer le champ avec react-hook-form (mais de façon cachée)
  register(name, { required: required && `${label} est requis` });

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <CountrySelector 
        value={value || defaultValue}
        onChange={handleCountryChange}
        placeholder={placeholder || "Sélectionner un pays"}
      />
    </div>
  );
};

export default CountryInputField;
