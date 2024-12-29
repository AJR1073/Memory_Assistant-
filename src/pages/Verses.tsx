import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Share as ShareIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useVerses } from '../hooks/useVerses';
import { useAuth } from '../contexts/AuthContext';
import { doc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Verses() {
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const { verses, loading } = useVerses();
  const { currentUser } = useAuth();

  const handleDelete = async () => {
    if (!selectedVerse) return;

    try {
      const verseRef = doc(db, 'verses', selectedVerse);
      await deleteDoc(verseRef);
      setDeleteDialogOpen(false);
      setSelectedVerse(null);
      window.location.reload();
    } catch (err) {
      console.error('Error deleting verse:', err);
      setDeleteError('Failed to delete verse');
    }
  };

  const handleShareToPublic = async (verseId: string) => {
    const verse = verses.find(v => v.id === verseId);
    if (!verse || !currentUser) return;

    try {
      await addDoc(collection(db, 'publicLibrary'), {
        ...verse,
        contributedBy: currentUser.uid,
        contributorName: currentUser.displayName || 'Anonymous User',
        likedBy: [],
      });

      setShareDialogOpen(false);
      setSelectedVerse(null);
      window.location.reload();
    } catch (err) {
      console.error('Error sharing verse:', err);
      setShareError('Failed to share verse to public library');
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
          <Button
            component={Link}
            to="/verses/add"
            variant="contained"
            color="primary"
          >
            Add Verse
          </Button>
        </Box>

        {(deleteError || shareError || error) && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => {
            setDeleteError(null);
            setShareError(null);
            setError(null);
          }}>
            {deleteError || shareError || error}
          </Alert>
        )}

        {verses.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary">
              You haven't added any verses yet
            </Typography>
            <Button
              component={Link}
              to="/verses/add"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Add Your First Verse
            </Button>
          </Box>
        ) : (
          verses.map(verse => (
            <Card key={verse.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {verse.reference}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {verse.translation}
                </Typography>
                <Typography variant="body1">
                  {verse.text}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  component={Link}
                  to={`/practice/${verse.id}`}
                  size="small"
                  startIcon={<PlayIcon />}
                >
                  Practice
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title="Share to Public Library">
                  <IconButton
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
                    onClick={() => {
                      setSelectedVerse(verse.id);
                      setDeleteDialogOpen(true);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          ))
        )}
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Delete Verse
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this verse? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
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
        <DialogTitle>
          Share to Public Library
        </DialogTitle>
        <DialogContent>
          <Typography>
            Share this verse to the public library? Other users will be able to see and practice it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => selectedVerse && handleShareToPublic(selectedVerse)}
            color="primary"
            variant="contained"
          >
            Share
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
