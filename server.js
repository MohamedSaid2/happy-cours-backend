const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { creerEvenementMeet } = require('./Googlemeet');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim()
});

const upload = multer({ dest: 'uploads/' });

const uploadToCloudinary = async (filePath, folder, resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: resourceType
    });
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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

    if (req.files && req.files['photo_file'] && req.files['photo_file'][0]) {
      photoUrl = await uploadToCloudinary(
        req.files['photo_file'][0].path,
        'happy_cours/photos',
        'image'
      );
    }

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

    const modes = body.modes ? (Array.isArray(body.modes) ? body.modes : [body.modes]) : [];
    const niveaux = body.niveaux ? (Array.isArray(body.niveaux) ? body.niveaux : [body.niveaux]) : [];
    const experiences = typeof body.experiences === 'string' ? JSON.parse(body.experiences || '[]') : (body.experiences || []);

    const nouvelleAnnonce = await prisma.annonce.create({
      data: {
        prenom: body.prenom || '',
        nom: body.nom || '',
        email: body.email || '',
        telephone: body.phone || '',
        ville: body.ville || '',
        etablissement: body.etablissement || '',
        photo_url: photoUrl,
        matieres: body.matieres || '',
        titre_accroche: body.titre_accroche || '',
        modes: modes,
        niveaux: niveaux,
        methodologie: body.methodologie || '',
        tarif_primaire: parseFloat(body.tarif_primaire) || 0,
        tarif_college: parseFloat(body.tarif_college) || 0,
        tarif_lycee: parseFloat(body.tarif_lycee) || 0,
        tarif_domicile_primaire: parseFloat(body.tarif_domicile_primaire) || 0,
        tarif_domicile_college: parseFloat(body.tarif_domicile_college) || 0,
        tarif_domicile_lycee: parseFloat(body.tarif_domicile_lycee) || 0,
        diplomes: diplomes,
        experiences: experiences
      }
    });

    res.status(201).json({ success: true, id: nouvelleAnnonce.id, annonce: nouvelleAnnonce });
  } catch (err) {
    console.error('Erreur Backend:', err);
    res.status(500).json({ success: false, message: err.message || 'Erreur lors de la publication d\'annonce' });
  }
});

// ENDPOINT : Mettre à jour une annonce existante
app.put('/api/annonces/:id', upload.fields([
  { name: 'photo_file', maxCount: 1 },
  { name: 'diploma_files' }
]), async (req, res) => {
  try {
    const annonceId = req.params.id;
    const body = req.body;

    const existingAnnonce = await prisma.annonce.findUnique({ where: { id: annonceId } });
    if (!existingAnnonce) return res.status(404).json({ message: 'Annonce non trouvée' });

    let photoUrl = existingAnnonce.photo_url;
    if (req.files && req.files['photo_file'] && req.files['photo_file'][0]) {
      photoUrl = await uploadToCloudinary(
        req.files['photo_file'][0].path,
        'happy_cours/photos',
        'image'
      );
    }

    let diplomes = [];
    if (body.diplomes) {
      const parsedDiplomes = typeof body.diplomes === 'string' ? JSON.parse(body.diplomes || '[]') : (body.diplomes || []);
      const diplomaFiles = (req.files && req.files['diploma_files']) ? req.files['diploma_files'] : [];

      for (let i = 0; i < parsedDiplomes.length; i++) {
        let dip = parsedDiplomes[i];
        let fileUrl = dip.justificatif_url || '';
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

    const modes = body.modes ? (Array.isArray(body.modes) ? body.modes : [body.modes]) : [];
    const niveaux = body.niveaux ? (Array.isArray(body.niveaux) ? body.niveaux : [body.niveaux]) : [];
    const experiences = typeof body.experiences === 'string' ? JSON.parse(body.experiences || '[]') : (body.experiences || []);

    const updatedAnnonce = await prisma.annonce.update({
      where: { id: annonceId },
      data: {
        prenom: body.prenom || existingAnnonce.prenom,
        nom: body.nom || existingAnnonce.nom,
        email: body.email || existingAnnonce.email,
        telephone: body.phone || existingAnnonce.telephone,
        ville: body.ville || existingAnnonce.ville,
        etablissement: body.etablissement || existingAnnonce.etablissement,
        photo_url: photoUrl,
        matieres: body.matieres || existingAnnonce.matieres,
        titre_accroche: body.titre_accroche || existingAnnonce.titre_accroche,
        modes: modes,
        niveaux: niveaux,
        methodologie: body.methodologie || existingAnnonce.methodologie,
        tarif_primaire: parseFloat(body.tarif_primaire) || existingAnnonce.tarif_primaire,
        tarif_college: parseFloat(body.tarif_college) || existingAnnonce.tarif_college,
        tarif_lycee: parseFloat(body.tarif_lycee) || existingAnnonce.tarif_lycee,
        tarif_domicile_primaire: parseFloat(body.tarif_domicile_primaire) || existingAnnonce.tarif_domicile_primaire,
        tarif_domicile_college: parseFloat(body.tarif_domicile_college) || existingAnnonce.tarif_domicile_college,
        tarif_domicile_lycee: parseFloat(body.tarif_domicile_lycee) || existingAnnonce.tarif_domicile_lycee,
        diplomes: diplomes,
        experiences: experiences
      }
    });

    res.json({ success: true, annonce: updatedAnnonce });
  } catch (err) {
    console.error('Erreur Update:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ENDPOINT : Récupérer toutes les annonces
app.get('/api/annonces', async (req, res) => {
  try {
    const annonces = await prisma.annonce.findMany({
      include: {
        avis: true,
        disponibilites: true,
        reservations: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(annonces);
  } catch (err) {
    console.error('Erreur Backend:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ENDPOINT : Récupérer une annonce par ID
app.get('/api/annonces/:id', async (req, res) => {
  try {
    const annonce = await prisma.annonce.findUnique({
      where: { id: req.params.id },
      include: {
        avis: true,
        disponibilites: true,
        reservations: true
      }
    });

    if (!annonce) return res.status(404).json({ message: 'Professeur non trouvé' });
    res.json(annonce);
  } catch (err) {
    console.error('Erreur Backend:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Ajouter un avis sur une annonce
app.post('/api/annonces/:id/avis', async (req, res) => {
  try {
    const { auteur, note, commentaire } = req.body;
    const nouveauAvis = await prisma.avis.create({
      data: {
        auteur,
        note: parseInt(note) || 5,
        commentaire,
        annonceId: req.params.id
      }
    });
    res.status(201).json({ success: true, avis: nouveauAvis });
  } catch (err) {
    console.error('Erreur Avis:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Enregistrer/Remplacer plusieurs disponibilités pour un prof
app.post('/api/annonces/:id/disponibilites', async (req, res) => {
  try {
    const { slots } = req.body;
    const annonceId = req.params.id;

    if (Array.isArray(slots)) {
      await prisma.disponibilite.deleteMany({
        where: { annonceId: annonceId }
      });

      const records = slots.map(s => ({
        jour: s.jour || null,
        date: s.date ? new Date(s.date) : null,
        heure: s.heure,
        statut: s.statut || 'disponible',
        annonceId: annonceId
      }));

      await prisma.disponibilite.createMany({
        data: records
      });
    }

    res.status(201).json({ success: true, message: 'Disponibilités enregistrées' });
  } catch (err) {
    console.error('Erreur Disponibilité:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ENDPOINT : Réserver un créneau de cours
app.post('/api/annonces/:id/reservations', async (req, res) => {
  try {
    const { nomEleve, emailEleve, phoneEleve, dateCours, heureCours } = req.body;
    const annonceId = req.params.id;

    if (!nomEleve || !emailEleve || !dateCours || !heureCours) {
      return res.status(400).json({ success: false, message: 'Veuillez remplir tous les champs requis.' });
    }

    const annonce = await prisma.annonce.findUnique({ where: { id: annonceId } });
    if (!annonce) return res.status(404).json({ success: false, message: 'Professeur non trouvé' });

    const reservation = await prisma.reservation.create({
      data: {
        nomEleve,
        emailEleve,
        phoneEleve: phoneEleve || '',
        dateCours,
        heureCours,
        annonceId
      }
    });

    // On ne peut créer un événement Google Meet que si un créneau précis
    // (date + heure) a réellement été choisi dans le calendrier — pas pour
    // les demandes génériques ("A convenir" / "Premier créneau disponible").
    const dateValide = /^\d{4}-\d{2}-\d{2}$/.test(dateCours);
    const heureValide = /^\d{2}:\d{2}$/.test(heureCours);

    let lienVisio = null;

    if (dateValide && heureValide && annonce.email) {
      try {
        const resultatMeet = await creerEvenementMeet({
          titre: `Cours d'essai Happy Cours - ${annonce.prenom} & ${nomEleve}`,
          description: `Cours d'essai entre ${annonce.prenom} ${annonce.nom || ''} et ${nomEleve}, organisé via Happy Cours.`,
          dateISO: dateCours,
          heure: heureCours,
          emailProf: annonce.email,
          emailEleve: emailEleve
        });

        lienVisio = resultatMeet.lienVisio;

        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { lienVisio }
        });
      } catch (meetErr) {
        // La réservation reste valide même si la création du lien Meet échoue ;
        // le prof et l'élève devront alors convenir d'un lien manuellement.
        console.error('Erreur création lien Google Meet:', meetErr);
      }
    }

    res.status(201).json({ success: true, reservation: { ...reservation, lienVisio } });
  } catch (err) {
    console.error('Erreur Réservation:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));