import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../../contexts/AuthContext';

interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function Scripts() {
  const { currentUser } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScripts = async () => {
      if (!currentUser) return;

      try {
        const q = query(
          collection(db, 'scripts'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const scriptsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: (doc.data().createdAt as Timestamp).toDate(),
          updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
        })) as Script[];
        setScripts(scriptsData);
      } catch (err) {
        console.error('Error fetching scripts:', err);
        setError('Failed to load scripts');
      }
    };

    fetchScripts();
  }, [currentUser]);

  const handleAdd = async () => {
    if (!currentUser || !title.trim() || !content.trim()) return;

    try {
      const now = new Date();
      await addDoc(collection(db, 'scripts'), {
        title,
        content,
        userId: currentUser.uid,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
      setTitle('');
      setContent('');
      setOpenDialog(false);
      // Refresh scripts list
      const q = query(
        collection(db, 'scripts'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const scriptsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
      })) as Script[];
      setScripts(scriptsData);
    } catch (err) {
      console.error('Error adding script:', err);
      setError('Failed to add script');
    }
  };

  const handleDelete = async (scriptId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'scripts', scriptId));
      setScripts(scripts.filter(script => script.id !== scriptId));
    } catch (err) {
      console.error('Error deleting script:', err);
      setError('Failed to delete script');
    }
  };

  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Scripts
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Script
          </Button>
        </Box>

        {error && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
            {error}
          </Paper>
        )}

        <Paper>
          <List>
            {scripts.map((script) => (
              <ListItem key={script.id}>
                <ListItemText
                  primary={script.title}
                  secondary={`Last updated: ${script.updatedAt.toLocaleDateString()}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => {/* TODO: Implement edit */}}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(script.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Add New Script</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Content"
              fullWidth
              multiline
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} variant="contained" disabled={!title.trim() || !content.trim()}>
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
