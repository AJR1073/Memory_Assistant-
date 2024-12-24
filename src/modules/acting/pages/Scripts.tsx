import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TheaterComedy as TheaterIcon,
} from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';
import { Script } from '../types';

export default function Scripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newScript, setNewScript] = useState({ title: '', author: '' });
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchScripts() {
      if (!currentUser) return;

      try {
        const scriptsRef = collection(db, 'scripts');
        const q = query(scriptsRef, where('createdBy', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const scriptsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Script[];

        setScripts(scriptsList);
      } catch (error) {
        console.error('Error fetching scripts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchScripts();
  }, [currentUser]);

  const handleCreateScript = async () => {
    if (!currentUser || !newScript.title.trim()) return;

    try {
      const newScriptData: Partial<Script> = {
        title: newScript.title,
        author: newScript.author,
        characters: [],
        scenes: [],
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'scripts'), newScriptData);
      setScripts([...scripts, { ...newScriptData, id: docRef.id } as Script]);
      setOpenDialog(false);
      setNewScript({ title: '', author: '' });
    } catch (error) {
      console.error('Error creating script:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TheaterIcon sx={{ fontSize: 40 }} />
            My Scripts
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add New Script
          </Button>
        </Box>

        <Grid container spacing={3}>
          {scripts.map((script) => (
            <Grid item xs={12} md={4} key={script.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {script.title}
                  </Typography>
                  {script.author && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      by {script.author}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {script.characters?.length || 0} characters • {script.scenes?.length || 0} scenes
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/scripts/${script.id}`)}
                    >
                      Open
                    </Button>
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Add New Script</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Script Title"
              fullWidth
              value={newScript.title}
              onChange={(e) => setNewScript({ ...newScript, title: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Author (optional)"
              fullWidth
              value={newScript.author}
              onChange={(e) => setNewScript({ ...newScript, author: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateScript} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
