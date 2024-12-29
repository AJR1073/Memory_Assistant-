import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { usePublicLibrary } from '../hooks/usePublicLibrary';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface PublicVerse {
  id: string;
  reference: string;
  text: string;
  translation: string;
  contributedBy: string;
  contributorName: string;
  likedBy: string[];
}

export default function PublicLibrary() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [verseToDelete, setVerseToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { verses, loading, error: libError, toggleLike, isVerseLiked } = usePublicLibrary();
  const { currentUser } = useAuth();

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (libError) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {libError}
        </Alert>
      </Container>
    );
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const myVerses = verses.filter(verse => verse.contributedBy === currentUser?.uid);
  const likedVerses = verses.filter(verse => verse.likedBy.includes(currentUser?.uid || ''));

  const displayVerses = selectedTab === 0 ? verses : selectedTab === 1 ? myVerses : likedVerses;

  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Public Library
          </Typography>
          <Button
            component={Link}
            to="/verses/add"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Verse
          </Button>
        </Box>

        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 4 }}>
          <Tab label="All Verses" />
          <Tab label="My Contributions" />
          <Tab label="Liked Verses" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          {displayVerses.map((verse: PublicVerse) => (
            <Card key={verse.id} sx={{ p: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {verse.reference} ({verse.translation})
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {verse.text}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Contributed by: {verse.contributorName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      component={Link}
                      to={`/practice/${verse.id}`}
                      variant="outlined"
                      size="small"
                      startIcon={<PlayIcon />}
                    >
                      Practice
                    </Button>
                  </Box>
                </Box>
              </CardContent>
              <CardActions>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title={isVerseLiked(verse.id) ? "Unlike" : "Like"}>
                    <IconButton onClick={() => toggleLike(verse.id)}>
                      {isVerseLiked(verse.id) ? (
                        <FavoriteIcon color="error" />
                      ) : (
                        <FavoriteBorderIcon />
                      )}
                    </IconButton>
                  </Tooltip>
                  {verse.contributedBy === currentUser?.uid && (
                    <IconButton
                      color="error"
                      onClick={() => {
                        setVerseToDelete(verse.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </CardActions>
            </Card>
          ))}
        </Stack>
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
            color="error"
            onClick={async () => {
              if (verseToDelete) {
                try {
                  // Remove from public library
                  const verseRef = doc(db, 'publicLibrary', verseToDelete);
                  await deleteDoc(verseRef);
                  
                  // Trigger a refetch
                  window.location.reload();
                } catch (err) {
                  console.error('Error deleting verse:', err);
                  setError('Failed to delete verse');
                }
                setDeleteDialogOpen(false);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
