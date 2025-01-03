import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { useRehearsal } from '../hooks/useRehearsal';
import { useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rehearsal-tabpanel-${index}`}
      aria-labelledby={`rehearsal-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function getRelativeTimeText(date: Date): string {
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, 'h:mm a')}`;
  }
  return format(date, 'PPp');
}

export default function RehearsalSchedule() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const [practiceDialogOpen, setPracticeDialogOpen] = useState(false);
  const [selectedVerseId, setSelectedVerseId] = useState<string | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRehearsalId, setSelectedRehearsalId] = useState<string | null>(null);
  
  const {
    schedules,
    loading,
    error,
    getTodayRehearsals,
    getUpcomingRehearsals,
    scheduleRehearsal,
  } = useRehearsal();

  const todayRehearsals = getTodayRehearsals();
  const upcomingRehearsals = getUpcomingRehearsals();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handlePracticeClick = (verseId: string) => {
    setSelectedVerseId(verseId);
    setPracticeDialogOpen(true);
  };

  const handlePracticeConfirm = () => {
    if (selectedVerseId) {
      navigate(`/practice/${selectedVerseId}`);
    }
    setPracticeDialogOpen(false);
  };

  const handleRescheduleClick = (rehearsalId: string) => {
    setSelectedRehearsalId(rehearsalId);
    const rehearsal = schedules.find(r => r.id === rehearsalId);
    setSelectedDate(rehearsal?.scheduledDate || addDays(new Date(), 1));
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleConfirm = async () => {
    if (selectedRehearsalId && selectedDate) {
      try {
        const rehearsal = schedules.find(r => r.id === selectedRehearsalId);
        if (rehearsal) {
          await scheduleRehearsal(
            rehearsal.verseId,
            rehearsal.reference,
            false,
            selectedDate
          );
        }
      } catch (error) {
        console.error('Error rescheduling:', error);
      }
    }
    setRescheduleDialogOpen(false);
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
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Rehearsal Schedule
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            How to Get Started
          </Typography>
          <Typography variant="body1" paragraph>
            Regular rehearsal is key to memorizing verses effectively. Here's how to use the rehearsal schedule:
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <Typography component="li" sx={{ mb: 1 }}>
              Practice a verse until you achieve at least 90% accuracy
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              The verse will automatically be added to your rehearsal schedule
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              Follow the schedule to maintain and improve your memorization
            </Typography>
            <Typography component="li">
              Keep practicing to earn points and climb the leaderboard!
            </Typography>
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CalendarIcon sx={{ mr: 1 }} />
              <Typography variant="h5" component="h2">
                Your Schedule
              </Typography>
            </Box>
            
            <Tabs value={selectedTab} onChange={handleTabChange} aria-label="rehearsal tabs">
              <Tab 
                icon={<TodayIcon />} 
                label={`Today (${todayRehearsals.length})`}
                iconPosition="start"
                sx={{ minHeight: 'auto' }}
              />
              <Tab 
                icon={<ScheduleIcon />} 
                label={`Upcoming (${upcomingRehearsals.length})`}
                iconPosition="start"
                sx={{ minHeight: 'auto' }}
              />
            </Tabs>
          </Box>

          <TabPanel value={selectedTab} index={0}>
            {todayRehearsals.length === 0 ? (
              <Alert severity="info">No rehearsals scheduled for today!</Alert>
            ) : (
              <List>
                {todayRehearsals.map((rehearsal) => (
                  <ListItem
                    key={rehearsal.id}
                    sx={{
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <ListItemText
                      primary={rehearsal.reference}
                      secondary={getRelativeTimeText(rehearsal.scheduledDate)}
                    />
                    <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Reschedule">
                        <IconButton
                          edge="end"
                          onClick={() => handleRescheduleClick(rehearsal.id)}
                        >
                          <DateRangeIcon />
                        </IconButton>
                      </Tooltip>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handlePracticeClick(rehearsal.verseId)}
                        startIcon={<CheckCircleIcon />}
                      >
                        Practice
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          <TabPanel value={selectedTab} index={1}>
            {upcomingRehearsals.length === 0 ? (
              <Alert severity="info">No upcoming rehearsals scheduled!</Alert>
            ) : (
              <List>
                {upcomingRehearsals.map((rehearsal) => (
                  <ListItem
                    key={rehearsal.id}
                    sx={{
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <ListItemText
                      primary={rehearsal.reference}
                      secondary={getRelativeTimeText(rehearsal.scheduledDate)}
                    />
                    <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Reschedule">
                        <IconButton
                          edge="end"
                          onClick={() => handleRescheduleClick(rehearsal.id)}
                        >
                          <DateRangeIcon />
                        </IconButton>
                      </Tooltip>
                      <Chip
                        label={format(rehearsal.scheduledDate, 'MMM d')}
                        color="primary"
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>
        </Paper>
      </Box>

      {/* Practice Confirmation Dialog */}
      <Dialog
        open={practiceDialogOpen}
        onClose={() => setPracticeDialogOpen(false)}
      >
        <DialogTitle>Start Practice Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you ready to practice this verse? Make sure you have a few minutes of quiet time.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPracticeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePracticeConfirm} variant="contained" color="primary">
            Start Practice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog
        open={rescheduleDialogOpen}
        onClose={() => setRescheduleDialogOpen(false)}
      >
        <DialogTitle>Reschedule Rehearsal</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <DateTimePicker
              label="New Date & Time"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              minDateTime={new Date()}
              sx={{ width: '100%' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRescheduleConfirm} 
            variant="contained" 
            color="primary"
            disabled={!selectedDate}
          >
            Reschedule
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
