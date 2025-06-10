import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import axios from '../utils/axios';

const PacksSelect = ({ value, onChange, label = "Pack", size = "small" }) => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/packs');
        if (response.data.success) {
          // S'assurer que packs est un tableau
          const packsData = Array.isArray(response.data.packs) ? response.data.packs : [];
          setPacks(packsData);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des packs:', error);
        setPacks([]); // En cas d'erreur, initialiser avec un tableau vide
      } finally {
        setLoading(false);
      }
    };

    fetchPacks();
  }, []);

  if (loading) {
    return <CircularProgress size={24} />;
  }

  return (
    <FormControl fullWidth size={size}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ""}
        label={label}
        onChange={onChange}
      >
        <MenuItem value="">Tous les packs</MenuItem>
        {Array.isArray(packs) && packs.map((pack) => (
          <MenuItem key={pack.id} value={pack.id}>
            {pack.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default PacksSelect;
