const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const app = express();

app.use(cors());
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ limit: '300mb', extended: true }));

// CONFIGURATION CLOUDINARY (Vos clés officielles)
cloudinary.config({
  cloud_name: 'dzs2xuhjn', // Remplacez par votre Cloud Name si besoin, ou laissez si c'est le vôtre
  api_key: '411733432464956',
  api_secret: 'haKbzhBm4nDaymY8IlOaYAPbJ34'
});

// Dossier temporaire pour stocker le fichier le temps de l'envoyer sur Cloudinary
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 300 * 1024 * 1024 } // Limite 300Mo
});

app.get('/', (req, res) => {
  res.send('Serveur Happy Cours en ligne et opérationnel !');
});

// ROUTE D'UPLOAD : Le client envoie au serveur Render, qui bascule sur Cloudinary
app.post('/upload-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Aucun fichier vidéo n'a été transmis." });
    }

    const localFilePath = req.file.path;

    // 1. Envoi automatique et discret vers votre dashboard Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'video',
      folder: 'happy_cours_videos'
    });

    // 2. Nettoyage : Suppression du fichier temporaire sur Render
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    // 3. Réponse renvoyée au site (le client ne voit pas les clés Cloudinary)
    return res.status(200).json({
      success: true,
      message: "Vidéo enregistrée avec succès sur Cloudinary !",
      title: req.body.titre_cours || "Cours sans titre",
      description: req.body.description_video || "",
      duration: req.body.duree_video || "1h",
      url: cloudinaryResult.secure_url
    });

  } catch (error) {
    console.error("Erreur Cloudinary:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});