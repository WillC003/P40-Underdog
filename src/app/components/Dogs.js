'use client';
import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export default function Dogs() {
  const [dogs, setDogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    notes: '',
    photo: null,
    photo_url: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchDogs();
  }, []);

  const fetchDogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/dogs`);
      console.log('Dogs data from server:', response.data);
      setDogs(response.data);
    } catch (error) {
      console.error('Error fetching dogs:', error);
      showSnackbar('Error fetching dogs data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpen = (dog = null) => {
    if (dog) {
      setFormData({
        name: dog.name,
        breed: dog.breed,
        age: dog.age,
        notes: dog.notes || '',
        photo: null,
        photo_url: dog.photo_url || '',
      });
      setPreviewUrl(dog.photo_url || '');
      setEditingId(dog.id);
    } else {
      setFormData({
        name: '',
        breed: '',
        age: '',
        notes: '',
        photo: null,
        photo_url: '',
      });
      setPreviewUrl('');
      setEditingId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      name: '',
      breed: '',
      age: '',
      notes: '',
      photo: null,
      photo_url: '',
    });
    setPreviewUrl('');
    setEditingId(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar('File size should be less than 5MB', 'error');
        return;
      }
      setFormData({ ...formData, photo: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('breed', formData.breed);
      submitData.append('age', formData.age);
      submitData.append('notes', formData.notes);
      if (formData.photo) {
        submitData.append('photo', formData.photo);
      } else if (formData.photo_url) {
        submitData.append('photo_url', formData.photo_url);
      }

      if (editingId) {
        await axios.put(`${API_URL}/dogs/${editingId}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showSnackbar('Dog updated successfully');
      } else {
        await axios.post(`${API_URL}/dogs`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showSnackbar('Dog added successfully');
      }
      fetchDogs();
      handleClose();
    } catch (error) {
      console.error('Error saving dog:', error);
      showSnackbar('Error saving dog data', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dog?')) return;
    
    try {
      await axios.delete(`${API_URL}/dogs/${id}`);
      showSnackbar('Dog deleted successfully');
      fetchDogs();
    } catch (error) {
      console.error('Error deleting dog:', error);
      showSnackbar('Error deleting dog', 'error');
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dogs Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen()}
          size="large"
        >
          Add New Dog
        </Button>
      </Box>

      {dogs.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No dogs added yet. Click "Add New Dog" to get started.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {dogs.map((dog) => (
            <Grid item xs={12} sm={6} md={4} key={dog.id}>
              <Card>
                {dog.photo_url && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={dog.photo_url}
                    alt={dog.name}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => {
                      console.error('Error loading image:', dog.photo_url);
                      e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                    }}
                  />
                )}
                <CardContent>
                  <Typography variant="h6" gutterBottom>{dog.name}</Typography>
                  <Typography color="text.secondary">Breed: {dog.breed}</Typography>
                  <Typography color="text.secondary">Age: {dog.age}</Typography>
                  {dog.notes && (
                    <Typography 
                      color="text.secondary" 
                      sx={{ 
                        mt: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      Notes: {dog.notes}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => handleOpen(dog)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(dog.id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Dog' : 'Add New Dog'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              type="text"
              fullWidth
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <TextField
              margin="dense"
              label="Breed"
              type="text"
              fullWidth
              value={formData.breed}
              onChange={(e) =>
                setFormData({ ...formData, breed: e.target.value })
              }
              required
            />
            <TextField
              margin="dense"
              label="Age"
              type="number"
              fullWidth
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
              required
            />
            <TextField
              margin="dense"
              label="Notes"
              multiline
              rows={3}
              fullWidth
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
            <Box sx={{ mt: 2 }}>
              <input
                accept="image/*"
                type="file"
                id="photo-upload"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="photo-upload">
                <Button variant="outlined" component="span">
                  Upload Photo
                </Button>
              </label>
              {previewUrl && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 