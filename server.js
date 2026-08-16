const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration Cloudinary avec .trim() pour éliminer automatiquement les espaces invisibles
cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim()
});

// Configuration Multer (stockage temporaire avant upload Cloudinary)
const upload = multer({ dest: 'uploads/' });

// Base de données temporaire en mémoire
let annonces = [];

// Fonction utilitaire pour uploader sur Cloudinary
const uploadToCloudinary = async (filePath, folder, resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: resourceType
    });
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Nettoyage sécurisé
    return result.secure_url;
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
  }
};

// ENDPOINT : Publier une annonce
app.post('/api/annonces', upload.fields([
  { name: 'photo_file', maxCount: 1 },
  { name: 'diploma_files' }
]), async (req, res) => {
  try {
    const body = req.body;
    let photoUrl = '';

    // 1. Upload de la photo de profil vers Cloudinary
    if (req.files && req.files['photo_file'] && req.files['photo_file'][0]) {
      photoUrl = await uploadToCloudinary(
        req.files['photo_file'][0].path,
        'happy_cours/photos',
        'image'
      );
    }

    // 2. Traitement des diplômes et upload de leurs justificatifs (PDF ou Image)
    let diplomes = [];
    if (body.diplomes) {
      const parsedDiplomes = typeof body.diplomes === 'string' ? JSON.parse(body.diplomes || '[]') : (body.diplomes || []);
      const diplomaFiles = (req.files && req.files['diploma_files']) ? req.files['diploma_files'] : [];

      for (let i = 0; i < parsedDiplomes.length; i++) {
        let dip = parsedDiplomes[i];
        let fileUrl = '';
        if (diplomaFiles[i]) {
          fileUrl = await uploadToCloudinary(
            diplomaFiles[i].path,
            'happy_cours/diplomes',
            'auto'
          );
        }
        diplomes.push({
          ...dip,
          justificatif_url: fileUrl
        });
      }
    }

    // 3. Traitement sécurisé des tableaux et objets
    const modes = body.modes ? (Array.isArray(body.modes) ? body.modes : [body.modes]) : [];
    const niveaux = body.niveaux ? (Array.isArray(body.niveaux) ? body.niveaux : [body.niveaux]) : [];
    const experiences = typeof body.experiences === 'string' ? JSON.parse(body.experiences || '[]') : (body.experiences || []);

    // 4. Objet Annonce structuré
    const nouvelleAnnonce = {
      id: Date.now().toString(),
      prenom: body.prenom,
      nom: body.nom,
      email: body.email,
      telephone: body.phone,
      ville: body.ville,
      etablissement: body.etablissement,
      photo_url: photoUrl,
      matieres: body.matieres,
      titre_accroche: body.titre_accroche,
      modes: modes,
      niveaux: niveaux,
      methodologie: body.methodologie,
      tarif_primaire: parseFloat(body.tarif_primaire) || 0,
      tarif_college: parseFloat(body.tarif_college) || 0,
      tarif_lycee: parseFloat(body.tarif_lycee) || 0,
      diplomes: diplomes,
      experiences: experiences,
      date_creation: new Date().toISOString()
    };

    annonces.push(nouvelleAnnonce);

    res.status(201).json({ success: true, id: nouvelleAnnonce.id, annonce: nouvelleAnnonce });
  } catch (err) {
    console.error('Erreur Backend:', err);
    res.status(500).json({ success: false, message: err.message || 'Erreur lors de la publication d\'annonce' });
  }
});

// ENDPOINT : Récupérer toutes les annonces
app.get('/api/annonces', (req, res) => {
  res.json(annonces);
});

// ENDPOINT : Récupérer une annonce par ID
app.get('/api/annonces/:id', (req, res) => {
  const annonce = annonces.find(a => a.id === req.params.id);
  if (!annonce) return res.status(404).json({ message: 'Professeur non trouvé' });
  res.json(annonce);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));