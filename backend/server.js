const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads/');
    console.log('Upload path:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// API Routes
// Get all dogs
app.get('/api/dogs', (req, res) => {
  const query = 'SELECT * FROM dogs ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Transform the photo_url to include full URL
    const dogsWithFullUrls = results.map(dog => {
      const fullUrl = dog.photo_url ? `http://localhost:${process.env.PORT}${dog.photo_url}` : null;
      console.log('Original photo_url:', dog.photo_url);
      console.log('Full URL:', fullUrl);
      return {
        ...dog,
        photo_url: fullUrl
      };
    });
    res.json(dogsWithFullUrls);
  });
});

// Add a new dog
app.post('/api/dogs', upload.single('photo'), (req, res) => {
  const { name, breed, age, notes } = req.body;
  const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const query = 'INSERT INTO dogs (name, breed, age, notes, photo_url) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [name, breed, age, notes, photoUrl], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ 
      id: result.insertId, 
      message: 'Dog added successfully',
      photoUrl: photoUrl ? `http://localhost:${process.env.PORT}${photoUrl}` : null
    });
  });
});

// Update a dog
app.put('/api/dogs/:id', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const { name, breed, age, notes } = req.body;
  let photoUrl = req.body.photo_url;

  if (req.file) {
    photoUrl = `/uploads/${req.file.filename}`;
  }

  const query = 'UPDATE dogs SET name = ?, breed = ?, age = ?, notes = ?, photo_url = ? WHERE id = ?';
  db.query(query, [name, breed, age, notes, photoUrl, id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ 
      message: 'Dog updated successfully', 
      photoUrl: photoUrl ? `http://localhost:${process.env.PORT}${photoUrl}` : null 
    });
  });
});

// Delete a dog
app.delete('/api/dogs/:id', (req, res) => {
  const { id } = req.params;
  
  // First get the photo URL to delete the file
  db.query('SELECT photo_url FROM dogs WHERE id = ?', [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const photoUrl = results[0]?.photo_url;
    
    // Delete from database
    const query = 'DELETE FROM dogs WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // If there was a photo, try to delete the file
      if (photoUrl) {
        const filePath = path.join(__dirname, photoUrl);
        try {
          require('fs').unlinkSync(filePath);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }

      res.json({ message: 'Dog deleted successfully' });
    });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 