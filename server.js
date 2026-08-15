const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();

app.use(cors());
app.use(express.json());

// Identifiants Cloudinary directement intégrés
cloudinary.config({
  cloud_name: 'ek0tmvd9',
  api_key: '411733432464956',
  api_secret: 'haKbzhBm4nDaymY8llOaYAPbJ34'
});

// Stockage temporaire en mémoire pour multer (max 300 Mo)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 300 * 1024 * 1024 } 
});

// Route d'envoi de la vidéo vers Cloudinary
app.post('/upload-video', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier vidéo reçu.' });
  }

  // Envoi direct du flux vers Cloudinary
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: 'video',
      folder: 'happy_cours_videos'
    },
    (error, result) => {
      if (error) {
        console.error('Erreur Cloudinary:', error);
        return res.status(500).json({ error: 'Erreur lors de l\'envoi vers Cloudinary' });
      }

      const { titre_cours, duree_video, description_video } = req.body;

      return res.status(200).json({
        success: true,
        url: result.secure_url,
        title: titre_cours || 'Sans titre',
        duration: duree_video || 'N/A',
        description: description_video || ''
      });
    }
  );

  uploadStream.end(req.file.buffer);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));