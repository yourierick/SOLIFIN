import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Chip,
} from '@mui/material';
import { PeopleAlt as PeopleIcon } from '@mui/icons-material';

const ReferralStats = ({ stats }) => {
  if (!stats) return null;

  const { total_referrals, referrals_by_pack } = stats;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <PeopleIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            Statistiques des Filleuls
          </Typography>
        </Box>

        <Typography variant="h4" color="primary" gutterBottom>
          {total_referrals}
          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
            Total Filleuls
          </Typography>
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Répartition par Pack
        </Typography>
        <List>
          {Object.entries(referrals_by_pack).map(([id, pack]) => (
            <ListItem key={id}>
              <ListItemText
                primary={`#${pack.pack_name}`}
                secondary={
                  <Typography component="span" variant="body2">
                    <Chip
                      label={`${pack.total_filleuls} filleul${pack.total_filleuls > 1 ? 's' : ''}`}
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default ReferralStats;
