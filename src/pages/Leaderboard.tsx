import { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, Avatar, LinearProgress, Chip } from '@mui/material';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

interface LeaderboardEntry {
  id: string;
  displayName: string;
  photoURL: string;
  score: number;
}

const POINTS_PER_LEVEL = 100;

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // Query users collection instead of leaderboard
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('score', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs
          .filter(doc => doc.data().score > 0) // Only show users with scores
          .map(doc => ({
            id: doc.id,
            displayName: doc.data().displayName || 'Anonymous User',
            photoURL: doc.data().photoURL || '',
            score: doc.data().score || 0,
          }));
        setLeaderboardData(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };

    fetchLeaderboardData();
  }, []);

  const calculateLevel = (score: number) => Math.floor(score / POINTS_PER_LEVEL) + 1;
  const calculateProgress = (score: number) => (score % POINTS_PER_LEVEL) / POINTS_PER_LEVEL * 100;

  const getPositionStyle = (index: number) => {
    const baseStyle = {
      p: 2,
      mb: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      borderRadius: 2,
      position: 'relative' as const,
    };

    const colors = {
      0: { border: '2px solid #FFD700', bgcolor: 'rgba(255, 215, 0, 0.1)' },
      1: { border: '2px solid #C0C0C0', bgcolor: 'rgba(192, 192, 192, 0.1)' },
      2: { border: '2px solid #CD7F32', bgcolor: 'rgba(205, 127, 50, 0.1)' },
    };

    return {
      ...baseStyle,
      ...(index < 3 ? colors[index] : {}),
    };
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <EmojiEventsIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Leaderboard
          </Typography>
        </Box>

        {/* Top 3 Showcase */}
        {leaderboardData.slice(0, 3).length > 0 && (
          <Box sx={{ mb: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
            {leaderboardData.slice(0, 3).map((entry, index) => (
              <Paper
                key={entry.id}
                elevation={3}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  flex: 1,
                  maxWidth: 200,
                  ...getPositionStyle(index),
                }}
              >
                <WorkspacePremiumIcon 
                  sx={{ 
                    fontSize: 40,
                    color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'
                  }} 
                />
                <Avatar
                  src={entry.photoURL}
                  alt={entry.displayName}
                  sx={{ width: 64, height: 64, mb: 1 }}
                />
                <Typography variant="h6" align="center" noWrap>
                  {entry.displayName}
                </Typography>
                <Chip
                  icon={<StarIcon />}
                  label={`Level ${calculateLevel(entry.score)}`}
                  color="primary"
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary">
                  {entry.score} points
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* Rest of Leaderboard */}
        <Paper elevation={3} sx={{ p: 3 }}>
          {leaderboardData.slice(3).map((entry, index) => {
            const level = calculateLevel(entry.score);
            const progress = calculateProgress(entry.score);
            const position = index + 4;

            return (
              <Paper
                key={entry.id}
                sx={{
                  ...getPositionStyle(position - 1),
                  bgcolor: entry.id === currentUser?.uid ? 'action.selected' : 'inherit',
                }}
              >
                <Typography variant="h6" sx={{ minWidth: 32 }}>
                  #{position}
                </Typography>
                <Avatar src={entry.photoURL} alt={entry.displayName} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1">
                    {entry.displayName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      size="small"
                      icon={<StarIcon />}
                      label={`Level ${level}`}
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {entry.score} points
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Paper>
            );
          })}
        </Paper>
      </Box>
    </Container>
  );
}
