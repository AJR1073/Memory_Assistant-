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
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { usePublicLibrary, SortOption } from '../hooks/usePublicLibrary';
import { useVerses } from '../hooks/useVerses';
import { useAuth } from '../contexts/AuthContext';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PublicLibrary() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    verses,
    loading,
    error,
    removeFromPublicLibrary,
    getMyContributions,
    getLikedVerses,
    toggleLike,
    isVerseLiked,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
  } = usePublicLibrary();
  const { addVerse } = useVerses();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleAddToMyVerses = async (verseId: string) => {
    const verse = verses.find(v => v.id === verseId);
    if (!verse) return;

    try {
      await addVerse({
        reference: verse.reference,
        text: verse.text,
        translation: verse.translation,
      });
    } catch (error) {
      console.error('Error adding verse to personal collection:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedVerse) return;

    try {
      await removeFromPublicLibrary(selectedVerse);
      setDeleteDialogOpen(false);
      setSelectedVerse(null);
    } catch (error) {
      console.error('Error deleting verse:', error);
    }
  };

  const handleLike = async (verseId: string) => {
    try {
      await toggleLike(verseId);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const displayVerses = () => {
    switch (selectedTab) {
      case 0:
        return verses;
      case 1:
        return getMyContributions();
      case 2:
        return getLikedVerses();
      default:
        return verses;
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
        <Typography variant="h4" component="h1" gutterBottom>
          Public Library
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search verses"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  endAdornment: <SearchIcon color="action" />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="popular">Most Popular</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab label="All Verses" />
            <Tab label="My Contributions" />
            <Tab label="Liked Verses" />
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={selectedTab}>
          <Grid container spacing={3}>
            {displayVerses().map((verse) => (
              <Grid item xs={12} sm={6} md={4} key={verse.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {verse.reference}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {verse.tags?.map((tag) => (
                          <Chip key={tag} label={tag} size="small" />
                        ))}
                      </Stack>
                    </Box>
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
                    <Typography variant="caption" color="text.secondary">
                      Contributed by: {verse.contributorName}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/practice/${verse.id}`)}
                      startIcon={<PlayIcon />}
                    >
                      Practice
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleAddToMyVerses(verse.id)}
                      startIcon={<AddIcon />}
                    >
                      Add to My Verses
                    </Button>
                    <Tooltip title={isVerseLiked(verse.id) ? 'Unlike' : 'Like'}>
                      <IconButton
                        size="small"
                        onClick={() => handleLike(verse.id)}
                        color={isVerseLiked(verse.id) ? 'primary' : 'default'}
                      >
                        {isVerseLiked(verse.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    {verse.contributedBy === currentUser?.uid && (
                      <Tooltip title="Delete from Public Library">
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
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {displayVerses().length === 0 && (
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
                {selectedTab === 0
                  ? 'No verses in the public library'
                  : selectedTab === 1
                  ? 'You haven\'t contributed any verses yet'
                  : 'You haven\'t liked any verses yet'}
              </Typography>
            </Box>
          )}
        </TabPanel>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Remove from Public Library</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove this verse from the public library? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDelete}
              color="error"
            >
              Remove
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
