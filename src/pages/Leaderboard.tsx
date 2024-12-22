import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Whatshot as FireIcon,
  Stars as StarsIcon,
} from '@mui/icons-material';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

interface LeaderboardEntry {
  id: string;
  userId: string;
  initials: string;
  totalScore: number;
  versesMemorized: number;
  lastUpdated: Date;
}

const getRankColor = (rank: number): string => {
  switch (rank) {
    case 1:
      return '#FFD700'; // Gold
    case 2:
      return '#C0C0C0'; // Silver
    case 3:
      return '#CD7F32'; // Bronze
    default:
      return '#1976d2'; // Default blue
  }
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <TrophyIcon sx={{ fontSize: 40, color: '#FFD700' }} />;
    case 2:
      return <StarsIcon sx={{ fontSize: 40, color: '#C0C0C0' }} />;
    case 3:
      return <FireIcon sx={{ fontSize: 40, color: '#CD7F32' }} />;
    default:
      return <FireIcon sx={{ fontSize: 30, color: '#1976d2' }} />;
  }
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('totalScore', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const leaderboardData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
        })) as LeaderboardEntry[];
        
        setEntries(leaderboardData);
        setLoading(false);
      },
      (err) => {
        console.error('Error in leaderboard listener:', err);
        setError('Failed to load leaderboard data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  const topThree = entries.slice(0, 3);
  const restOfEntries = entries.slice(3);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Memory Champions
        </Typography>

        {/* Scoring System Card */}
        <Card sx={{ mb: 6, bgcolor: 'background.paper', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrophyIcon /> Scoring System
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, textAlign: 'center', borderRadius: 1 }}>
                  <TrophyIcon sx={{ fontSize: 40, color: '#FFD700', mb: 1 }} />
                  <Typography variant="h6">10 Points</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Perfect Recitation (95%+ accuracy)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, textAlign: 'center', borderRadius: 1 }}>
                  <StarsIcon sx={{ fontSize: 40, color: '#C0C0C0', mb: 1 }} />
                  <Typography variant="h6">5 Points</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Great Recitation (80-94% accuracy)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, textAlign: 'center', borderRadius: 1 }}>
                  <FireIcon sx={{ fontSize: 40, color: '#CD7F32', mb: 1 }} />
                  <Typography variant="h6">2 Points</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Recitation (below 80%)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Top 3 Podium */}
        {entries.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {topThree.map((entry, index) => (
              <Grid item xs={12} md={4} key={entry.id}>
                <Card 
                  elevation={4}
                  sx={{
                    height: '100%',
                    bgcolor: 'background.paper',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                    position: 'relative',
                    overflow: 'visible'
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 1
                    }}
                  >
                    {getRankIcon(index + 1)}
                  </Box>
                  <CardContent sx={{ pt: 4, textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: getRankColor(index + 1),
                        margin: '0 auto 1rem',
                        fontSize: '1.5rem'
                      }}
                    >
                      {entry.initials}
                    </Avatar>
                    <Typography variant="h5" gutterBottom sx={{ color: getRankColor(index + 1) }}>
                      #{index + 1}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {entry.initials}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h4" color="primary" gutterBottom>
                        {entry.totalScore}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Points
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6">
                        {entry.versesMemorized}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Verses Memorized
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Rest of Leaderboard */}
        {restOfEntries.length > 0 && (
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ pl: 2 }}>
                Top Challengers
              </Typography>
              {restOfEntries.map((entry, index) => (
                <Box
                  key={entry.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <Typography variant="h6" sx={{ minWidth: 40, color: 'text.secondary' }}>
                    #{index + 4}
                  </Typography>
                  <Avatar sx={{ bgcolor: getRankColor(index + 4), mx: 2 }}>
                    {entry.initials}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1">
                      {entry.initials}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {entry.versesMemorized} verses memorized
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color="primary">
                      {entry.totalScore}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      points
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {entries.length === 0 && (
          <Card sx={{ textAlign: 'center', p: 4 }}>
            <TrophyIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Champions Yet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Start practicing verses to become the first champion on the leaderboard!
            </Typography>
          </Card>
        )}
      </Box>
    </Container>
  );
}
