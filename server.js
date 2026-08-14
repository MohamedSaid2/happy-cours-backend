const express = require('express');
const multer = require('multer');
const cors = require('cors'); // Obligatoire pour autoriser GitHub Pages à contacter Render
const path = require('path');

const app = express();

// Autorise ton site GitHub Pages à envoyer des requêtes
app.use(cors());

// Dossier public pour lire les vidéos
app.use('/uploads', express.static('uploads'));

// Configuration du stockage local sur le serveur
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// Route pour recevoir l'upload
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
  
  // URL de la vidéo hébergée
  const videoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url: videoUrl });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));