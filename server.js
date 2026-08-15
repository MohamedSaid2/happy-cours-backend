const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();

// Configuration CORS et limites de taille
app.use(cors());
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ limit: '300mb', extended: true }));

// CONFIGURATION CLOUDINARY (Remplacez par vos identifiants Cloudinary)
cloudinary.config({
  cloud_name: 'VOTRE_CLOUD_NAME',
  api_key: 'VOTRE_API_KEY',
  api_secret: 'VOTRE_API_SECRET'
});

// Stockage en mémoire RAM pour transmettre directement le flux à Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 300 * 1024 * 1024 } // 300 Mo max
});

// Route d'accueil pour tester le serveur
app.get('/', (req, res) => {
  res.send('Serveur Backend en ligne !');
});

// ROUTE D'UPLOAD VERS CLOUDINARY
app.post('/upload-video', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier vidéo n'a été transmis." });
  }

  try {
    // Envoi de la vidéo vers Cloudinary via upload_stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'happy_cours_videos' // Nom du dossier sur Cloudinary
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: `Erreur Cloudinary: ${error.message}` });
        }

        // Succès : Cloudinary renvoie l'URL HTTPS permanente de la vidéo
        return res.status(200).json({
          success: true,
          message: "Vidéo téléversée sur Cloudinary avec succès !",
          url: result.secure_url,
          title: req.body.titre_cours || 'Nouvelle vidéo',
          description: req.body.description_video || '',
          duration: req.body.duree_video || ''
        });
      }
    );

    // Injection des données de la vidéo dans le flux
    uploadStream.end(req.file.buffer);

  } catch (error) {
    return res.status(500).json({ error: `Erreur traitement : ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});