import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  CircularProgress,
} from '@mui/material';
import axios from '../utils/axios';
import PacksSelect from './PacksSelect';

const ReferralList = ({ userId }) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPack, setSelectedPack] = useState('');
  const [error, setError] = useState(null);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/admin/users/${userId}/referrals${
        selectedPack ? `?pack_id=${selectedPack}` : ''
      }`;
      const response = await axios.get(url);
      setReferrals(response.data.data);
    } catch (err) {
      setError('Erreur lors de la récupération des filleuls');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchReferrals();
    }
  }, [userId, selectedPack]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="p" style={{ marginRight:12 }}>Filleuls</Typography>
          <PacksSelect
            value={selectedPack}
            onChange={(e) => setSelectedPack(e.target.value)}
            label="Filtrer par Pack"
          />
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Pack</TableCell>
                <TableCell>Date d'achat</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>{referral.name}</TableCell>
                  <TableCell>{referral.email}</TableCell>
                  <TableCell>
                    {referral.packs.map((pack) => pack.name).join(', ')}
                  </TableCell>
                  <TableCell>
                    {new Date(referral.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{referral.status}</TableCell>
                </TableRow>
              ))}
              {referrals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Aucun filleul trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default ReferralList;
