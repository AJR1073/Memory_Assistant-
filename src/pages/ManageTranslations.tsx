import { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTranslations } from '../hooks/useTranslations';
import type { Translation } from '../types/verse';

interface TranslationFormData {
  name: string;
  abbreviation: string;
  description: string;
  isDefault: boolean;
}

const initialFormData: TranslationFormData = {
  name: '',
  abbreviation: '',
  description: '',
  isDefault: false,
};

export default function ManageTranslations() {
  const { translations, loading, addTranslation, updateTranslation, deleteTranslation } = useTranslations();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TranslationFormData>(initialFormData);

  const handleOpenDialog = (translation?: Translation) => {
    if (translation) {
      setFormData({
        name: translation.name,
        abbreviation: translation.abbreviation,
        description: translation.description || '',
        isDefault: translation.isDefault || false,
      });
      setEditingId(translation.id);
    } else {
      setFormData(initialFormData);
      setEditingId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormData);
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (formData.name.trim() === '' || formData.abbreviation.trim() === '') {
        setError('Name and abbreviation are required');
        return;
      }

      if (editingId) {
        await updateTranslation(editingId, formData);
        setSuccess('Translation updated successfully');
      } else {
        await addTranslation(formData);
        setSuccess('Translation added successfully');
      }

      handleCloseDialog();
    } catch (err) {
      setError('Failed to save translation. Please try again.');
      console.error('Error saving translation:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTranslation(id);
      setSuccess('Translation deleted successfully');
    } catch (err) {
      setError('Failed to delete translation');
      console.error('Error deleting translation:', err);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Typography>Loading translations...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box mt={4}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">
              Manage Bible Translations
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Translation
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <List>
            {translations.map((translation) => (
              <ListItem
                key={translation.id}
                divider
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleOpenDialog(translation)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(translation.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={`${translation.name} (${translation.abbreviation})`}
                  secondary={translation.description}
                />
                {translation.isDefault && (
                  <Typography variant="caption" color="primary" sx={{ ml: 2 }}>
                    Default
                  </Typography>
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Translation' : 'Add Translation'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Translation Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Abbreviation"
              value={formData.abbreviation}
              onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
              }
              label="Set as default translation"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
