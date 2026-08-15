const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const app = express();

app.use(cors());

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: 'ek0tmvd9',
  api_key: '411733432464956',
  api_secret: 'haKbzhBm4nDaymY8IlOaYAPbJ34'
});

// Stockage temporaire en local sur le serveur (dossier 'uploads/')
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

// Limite fixée à 300 Mo
const upload = multer({
  storage: storage,
  limits: { fileSize: 300 * 1024 * 1024 }
});

// Route d'upload
app.post('/upload', (req, res) => {
  upload.single('video')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'La vidéo dépasse la limite autorisée de 300 Mo.' });
      }
      return res.status(500).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Erreur lors du transfert sur le serveur.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    const filePath = req.file.path;

    try {
      // Transfert vers Cloudinary par morceaux (Chunked Upload) — idéal pour > 100 Mo
      const result = await cloudinary.uploader.upload_large(filePath, {
        resource_type: 'video',
        folder: 'happy_cours_videos',
        chunk_size: 6000000 // Morceaux de 6 Mo
      });

      // Suppression du fichier temporaire sur le serveur
      fs.unlinkSync(filePath);

      // Réponse de succès envoyée au client HTML
      res.json({
        success: true,
        url: result.secure_url,
        title: req.body.titre_cours || "Nouveau cours",
        description: req.body.description_video || "",
        duration: req.body.duree_video || ""
      });

    } catch (uploadError) {
      // Nettoyage en cas d'erreur
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      console.error('Erreur Cloudinary:', uploadError);
      res.status(500).json({ error: 'Échec de l\'envoi vers Cloudinary: ' + uploadError.message });
    }
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));

// Augmentation des timeouts du serveur pour autoriser les longs téléversements
server.timeout = 600000; // 10 minutes
server.keepAliveTimeout = 600000;