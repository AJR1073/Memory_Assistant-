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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useVerses } from '../hooks/useVerses';
import { usePublicLibrary } from '../hooks/usePublicLibrary';
import { useAuth } from '../contexts/AuthContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Verses() {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { verses, loading } = useVerses();
  const { addToPublicLibrary } = usePublicLibrary();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async (verseId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'verses', verseId));
      setDeleteDialogOpen(false);
      setSelectedVerse(null);
      setDeleteError(null);
    } catch (error) {
      console.error('Error deleting verse:', error);
      setDeleteError('Failed to delete verse');
    }
  };

  const handleShare = async () => {
    if (!selectedVerse) return;

    try {
      const verse = verses.find(v => v.id === selectedVerse);
      if (!verse) return;

      await addToPublicLibrary({
        reference: verse.reference,
        text: verse.text,
        translation: verse.translation,
      });

      setShareDialogOpen(false);
      setSelectedVerse(null);
      setShareError(null);
    } catch (error) {
      console.error('Error sharing verse:', error);
      setShareError('Failed to share verse');
    }
  };

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
            My Verses
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/verses/add')}
            >
              Add New Verse
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/public-library')}
            >
              Public Library
            </Button>
          </Box>
        </Box>

        {(deleteError || shareError) && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => {
            setDeleteError(null);
            setShareError(null);
          }}>
            {deleteError || shareError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {verses.map((verse) => (
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
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/practice/${verse.id}`)}
                  >
                    Practice
                  </Button>
                  <Tooltip title="Edit Verse">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/verses/edit/${verse.id}`)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Share to Public Library">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedVerse(verse.id);
                        setShareDialogOpen(true);
                      }}
                    >
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Verse">
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
                  <Tooltip title="Schedule Practice">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/schedule/${verse.id}`)}
                    >
                      <CalendarIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {verses.length === 0 && (
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
              No verses added yet
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/verses/add')}
            >
              Add Your First Verse
            </Button>
          </Box>
        )}

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Verse</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this verse? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedVerse && handleDelete(selectedVerse)}
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
        >
          <DialogTitle>Share to Public Library</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to share this verse to the public library? Other users will be able to view and practice with this verse.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleShare}
              color="primary"
              variant="contained"
            >
              Share
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
