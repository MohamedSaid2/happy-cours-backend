const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

app.use(cors());

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: 'ek0tmvd9',
  api_key: '411733432464956',
  api_secret: 'haKbzhBm4nDaymY8IlOaYAPbJ34'
});

// Configuration du stockage avec support des grands fichiers vidéos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'happy_cours_videos',
    resource_type: 'video', // Mode vidéo requis pour les fichiers volumineux
    format: 'mp4',
    public_id: (req, file) => Date.now() + '-' + path.parse(file.originalname).name
  }
});

// Limite fixée à 300 Mo (300 * 1024 * 1024 octets)
const upload = multer({
  storage: storage,
  limits: { fileSize: 300 * 1024 * 1024 }
});

// Route d'upload
app.post('/upload', (req, res) => {
  upload.single('video')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'La vidéo dépasse la limite autorisée de 300 Mo.' });
      }
      return res.status(500).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Erreur lors du téléversement vers Cloudinary.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    res.json({
      success: true,
      url: req.file.path
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));