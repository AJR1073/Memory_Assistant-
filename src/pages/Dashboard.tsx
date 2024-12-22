import { useState, useEffect } from 'react';
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
  Snackbar,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, School as SchoolIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

interface Verse {
  id: string;
  reference: string;
  text: string;
  lastPracticed?: Date;
  accuracy?: number;
}

export default function Dashboard() {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchVerses = async () => {
      try {
        const versesRef = collection(db, 'verses');
        const q = query(versesRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const versesData: Verse[] = [];
        querySnapshot.forEach((doc) => {
          versesData.push({ id: doc.id, ...doc.data() } as Verse);
        });
        
        setVerses(versesData);
      } catch (err) {
        console.error('Error fetching verses:', err);
        setError('Failed to load verses');
      } finally {
        setLoading(false);
      }
    };

    fetchVerses();
  }, [currentUser, navigate]);

  const handleAddVerse = () => {
    navigate('/add-verse');
  };

  const handleEditVerse = (verseId: string) => {
    navigate(`/edit-verse/${verseId}`);
  };

  const handlePracticeVerse = (verseId: string) => {
    navigate(`/practice/${verseId}`);
  };

  const handleDeleteVerse = async (verseId: string) => {
    try {
      await deleteDoc(doc(db, 'verses', verseId));
      setVerses(verses.filter((verse) => verse.id !== verseId));
    } catch (err) {
      console.error('Error deleting verse:', err);
      setDeleteError('Failed to delete verse. Please try again.');
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

  if (error) {
    return (
      <Container>
        <Box mt={4}>
          <Alert severity="error">
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          My Verses
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddVerse}
        >
          Add New Verse
        </Button>
      </Box>

      {verses.length === 0 ? (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No verses added yet. Click the button above to add your first verse!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {verses.map((verse) => (
            <Grid item xs={12} sm={6} md={4} key={verse.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {verse.reference}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {verse.text}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Tooltip title="Practice this verse">
                    <IconButton 
                      onClick={() => navigate(`/practice/${verse.id}`)}
                      color="primary"
                    >
                      <SchoolIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit verse">
                    <IconButton
                      onClick={() => navigate(`/edit-verse/${verse.id}`)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete verse">
                    <IconButton
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this verse?')) {
                          handleDeleteVerse(verse.id);
                        }
                      }}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={!!deleteError}
        autoHideDuration={6000}
        onClose={() => setDeleteError(null)}
        message={deleteError}
      >
        <Alert onClose={() => setDeleteError(null)} severity="error">
          {deleteError}
        </Alert>
      </Snackbar>
    </Container>
  );
}
