import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import { useToast } from '../contexts/ToastContext';
import PurchasePackForm from '../components/PurchasePackForm';
import axios from '../utils/axios';

const Packs = () => {
  const { toast } = useToast();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const response = await axios.get('/api/packs');
        if (response.data.success) {
          setPacks(response.data.data.filter(pack => pack.status));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des packs:', error);
        toast.error('Impossible de charger les packs disponibles');
      } finally {
        setLoading(false);
      }
    };

    fetchPacks();
  }, []);

  const handlePurchaseClick = (pack) => {
    setSelectedPack(pack);
    setPurchaseDialogOpen(true);
  };

  const handlePurchaseClose = () => {
    setPurchaseDialogOpen(false);
    setSelectedPack(null);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Packs disponibles
      </Typography>

      <Grid container spacing={3}>
        {packs.map(pack => (
          <Grid item xs={12} sm={6} md={4} key={pack.id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  {pack.name}
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  {pack.price}€/mois
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {pack.description}
                </Typography>
                {pack.avantages && (
                  <ul>
                    {pack.avantages.map((avantage, index) => (
                      <li key={index}>
                        <Typography variant="body2">
                          {avantage}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => handlePurchaseClick(pack)}
                >
                  Acheter
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <PurchasePackForm
        open={purchaseDialogOpen}
        onClose={handlePurchaseClose}
        pack={selectedPack}
      />
    </Container>
  );
};

export default Packs;
