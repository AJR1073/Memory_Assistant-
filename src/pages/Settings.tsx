import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { useModules } from '../hooks/useModules';
import { moduleConfig } from '../modules/config';

export default function Settings() {
  const { userModules, toggleModule } = useModules();

  if (!userModules) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SettingsIcon sx={{ fontSize: 40 }} />
          Settings
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" gutterBottom color="primary">
            Module Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enable or disable modules based on your needs. Some modules may require premium access.
          </Typography>

          <Grid container spacing={3}>
            {Object.values(moduleConfig).map(module => (
              <Grid item xs={12} md={6} key={module.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        {module.name}
                      </Typography>
                      <Chip 
                        label={module.requiredRole}
                        color={module.requiredRole === 'premium' ? 'secondary' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {module.description}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={userModules.enabledModules.includes(module.id)}
                          onChange={() => toggleModule(module.id)}
                          disabled={module.requiredRole === 'premium' && userModules.role !== 'premium'}
                        />
                      }
                      label={module.requiredRole === 'premium' && userModules.role !== 'premium' 
                        ? "Requires Premium" 
                        : "Enabled"
                      }
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
}
