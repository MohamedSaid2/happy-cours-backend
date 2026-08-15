const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// CORRECTION CAUSE 1 : Configuration CORS
app.use(cors());

// Augmentation des limites pour le corps de la requête
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ limit: '300mb', extended: true }));

// CORRECTION CAUSE 2 : Vérification et création automatique du dossier 'uploads'
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration de Multer pour le stockage local
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Limite Multer (ex: 300 MB max)
const upload = multer({
  storage: storage,
  limits: { fileSize: 300 * 1024 * 1024 }
});

// Rend le dossier d'uploads accessible en statique
app.use('/uploads', express.static(uploadDir));

// Route d'accueil pour tester le serveur
app.get('/', (req, res) => {
  res.send('Serveur Backend en ligne !');
});

// CORRECTION CAUSE 3 : Route /upload-video sécurisée avec bloc try/catch et nom de champ exact ('video')
app.post('/upload-video', (req, res) => {
  upload.single('video')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Erreur liée à Multer (ex: fichier trop grand)
      return res.status(400).json({ error: `Erreur Multer: ${err.message}` });
    } else if (err) {
      // Autre erreur serveur
      return res.status(500).json({ error: `Erreur Serveur: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier vidéo n'a été transmis." });
    }

    try {
      // Récupération des données du formulaire
      const { nom, prenom, telephone, email, matiere, duree, format, pdf, description, diffusion, iban } = req.body;

      // Traitement ou enregistrement dans votre base de données...

      return res.status(200).json({
        success: true,
        message: "Vidéo téléversée avec succès !",
        fileUrl: `/uploads/${req.file.filename}`
      });
    } catch (error) {
      return res.status(500).json({ error: `Erreur lors du traitement : ${error.message}` });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});