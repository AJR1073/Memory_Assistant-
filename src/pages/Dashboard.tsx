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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  School as SchoolIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useAuth } from '../contexts/AuthContext';
import { useRehearsal, FREQUENCY_OPTIONS } from '../hooks/useRehearsal';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { addDays } from 'date-fns';

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
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(addDays(new Date(), 1));
  const [selectedFrequency, setSelectedFrequency] = useState<number | ''>('');
  
  const { currentUser } = useAuth();
  const { scheduleRehearsal } = useRehearsal();
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
          const data = doc.data();
          versesData.push({
            id: doc.id,
            reference: data.reference,
            text: data.text,
            lastPracticed: data.lastPracticed?.toDate(),
            accuracy: data.accuracy,
          });
        });
        setVerses(versesData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching verses:', err);
        setError('Failed to fetch verses');
        setLoading(false);
      }
    };

    fetchVerses();
  }, [currentUser, navigate]);

  const handleDelete = async (verseId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'verses', verseId));
      setVerses(verses.filter(verse => verse.id !== verseId));
    } catch (err) {
      console.error('Error deleting verse:', err);
      setDeleteError('Failed to delete verse');
    }
  };

  const handleScheduleClick = (verse: Verse) => {
    setSelectedVerse(verse);
    setSelectedDate(addDays(new Date(), 1));
    setScheduleDialogOpen(true);
  };

  const handleScheduleConfirm = async () => {
    if (!selectedVerse || !selectedDate) return;

    try {
      await scheduleRehearsal(
        selectedVerse.id,
        selectedVerse.reference,
        true,
        selectedDate,
        selectedFrequency || undefined
      );
      setScheduleDialogOpen(false);
      setSelectedFrequency('');
    } catch (error) {
      console.error('Error scheduling rehearsal:', error);
      setError('Failed to schedule rehearsal');
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
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Verses
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/add-verse')}
          sx={{ mb: 3 }}
        >
          Add New Verse
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {verses.map((verse) => (
          <Grid item xs={12} sm={6} md={4} key={verse.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2">
                  {verse.reference}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {verse.text.length > 100
                    ? `${verse.text.substring(0, 100)}...`
                    : verse.text}
                </Typography>
                {verse.lastPracticed && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Last practiced: {verse.lastPracticed.toLocaleDateString()}
                    {verse.accuracy !== undefined && ` (${Math.round(verse.accuracy * 100)}% accuracy)`}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Tooltip title="Practice">
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/practice/${verse.id}`)}
                  >
                    <SchoolIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Schedule Practice">
                  <IconButton
                    color="primary"
                    onClick={() => handleScheduleClick(verse)}
                  >
                    <CalendarIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(verse.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {deleteError && (
        <Snackbar
          open={Boolean(deleteError)}
          autoHideDuration={6000}
          onClose={() => setDeleteError(null)}
        >
          <Alert severity="error">{deleteError}</Alert>
        </Snackbar>
      )}

      {/* Schedule Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule Practice</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>
              When would you like to practice {selectedVerse?.reference}?
            </Typography>
            <DateTimePicker
              label="First Practice Date & Time"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              minDateTime={new Date()}
              sx={{ width: '100%', mt: 2, mb: 3 }}
            />
            <FormControl fullWidth>
              <InputLabel id="frequency-label">Repeat Schedule</InputLabel>
              <Select
                labelId="frequency-label"
                value={selectedFrequency}
                onChange={(e) => setSelectedFrequency(e.target.value as number)}
                label="Repeat Schedule"
              >
                <MenuItem value="">
                  <em>No repetition</em>
                </MenuItem>
                {FREQUENCY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {selectedFrequency ? 
                  `Will create 12 rehearsals, one every ${selectedFrequency} days` : 
                  'One-time rehearsal with spaced repetition'}
              </FormHelperText>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setScheduleDialogOpen(false);
            setSelectedFrequency('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleScheduleConfirm}
            variant="contained"
            color="primary"
            disabled={!selectedDate}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
