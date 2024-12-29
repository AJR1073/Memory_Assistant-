import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { usePublicLibrary } from '../hooks/usePublicLibrary';
import { useVerses } from '../hooks/useVerses';
import { useAuth } from '../contexts/AuthContext';

export default function PublicLibrary() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { verses: publicVerses, loading, error, removeFromPublicLibrary, getMyContributions } = usePublicLibrary();
  const { addVerse } = useVerses();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleAddToMyVerses = async (verseId: string) => {
    const verse = publicVerses.find(v => v.id === verseId);
    if (!verse) return;

    try {
      await addVerse({
        reference: verse.reference,
        text: verse.text,
        translation: verse.translation,
      });
    } catch (error) {
      console.error('Error adding verse to personal collection:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedVerse) return;

    try {
      await removeFromPublicLibrary(selectedVerse);
      setDeleteDialogOpen(false);
      setSelectedVerse(null);
    } catch (error) {
      console.error('Error deleting verse:', error);
    }
  };

  const displayVerses = selectedTab === 0 ? publicVerses : getMyContributions();

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Public Library
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab label="All Verses" />
            <Tab label="My Contributions" />
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          {displayVerses.map((verse) => (
            <Grid item xs={12} sm={6} md={4} key={verse.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {verse.reference}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {verse.translation}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1,
                    }}
                  >
                    {verse.text}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Contributed by: {verse.contributorName}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/practice/${verse.id}`)}
                    startIcon={<PlayIcon />}
                  >
                    Practice
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleAddToMyVerses(verse.id)}
                    startIcon={<AddIcon />}
                  >
                    Add to My Verses
                  </Button>
                  {verse.contributedBy === currentUser?.uid && (
                    <Tooltip title="Delete from Public Library">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedVerse(verse.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {displayVerses.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              mt: 4,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              {selectedTab === 0 ? 'No verses in the public library' : 'You haven\'t contributed any verses yet'}
            </Typography>
          </Box>
        )}

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Remove from Public Library</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove this verse from the public library? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDelete}
              color="error"
            >
              Remove
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
