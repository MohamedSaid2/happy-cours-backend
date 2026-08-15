const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// Autorise ton site web (GitHub Pages) à envoyer des requêtes
app.use(cors());

// Configuration de Cloudinary avec tes identifiants
cloudinary.config({
  cloud_name: 'ek0tmvd9',
  api_key: '411733432464956',
  api_secret: 'haKbzhBm4nDaymY8IlOaYAPbJ34'
});

// Configuration du stockage Cloudinary pour Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'happy_cours_videos', // Dossier automatique sur Cloudinary
    resource_type: 'auto',        // Accepte vidéos et fichiers
    public_id: (req, file) => Date.now() + '-' + path.parse(file.originalname).name
  }
});

const upload = multer({ storage: storage });

// Route pour recevoir l'upload
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu' });
  }

  // Cloudinary renvoie l'URL permanente de la vidéo
  res.json({
    success: true,
    url: req.file.path
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));