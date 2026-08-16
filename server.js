const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(cors());
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ limit: '300mb', extended: true }));

// ==========================================
// 1. CONFIGURATION DE LA BASE DE DONNÉES SQLITE
// ==========================================
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion SQLite :', err.message);
  } else {
    console.log('Connecté à la base de données SQLite.');
  }
});

// Création des tables relationnelles
db.serialize(() => {
  // Table principale du professeur
  db.run(`CREATE TABLE IF NOT EXISTS professors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    headline TEXT NOT NULL,
    city TEXT NOT NULL,
    university TEXT,
    image_url TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    total_hours INTEGER DEFAULT 0,
    response_time TEXT,
    methodology TEXT,
    is_verified BOOLEAN DEFAULT 1
  )`);

  // Table des tarifs par niveau
  db.run(`CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professor_id INTEGER,
    level_name TEXT NOT NULL,
    price_per_hour REAL NOT NULL,
    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE CASCADE
  )`);

  // Table des diplômes
  db.run(`CREATE TABLE IF NOT EXISTS diplomas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professor_id INTEGER,
    school_name TEXT NOT NULL,
    degree_title TEXT NOT NULL,
    period TEXT NOT NULL,
    description TEXT,
    is_verified BOOLEAN DEFAULT 1,
    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE CASCADE
  )`);

  // Table des expériences professionnelles
  db.run(`CREATE TABLE IF NOT EXISTS experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professor_id INTEGER,
    job_title TEXT NOT NULL,
    company_and_type TEXT NOT NULL,
    period TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE CASCADE
  )`);

  // Table des avis clients
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professor_id INTEGER,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    date_posted TEXT NOT NULL,
    comment TEXT NOT NULL,
    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE CASCADE
  )`);

  // Insertion automatique d'un profil de test s'il n'y en a aucun
  db.get(`SELECT COUNT(*) as count FROM professors`, (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO professors (id, name, subtitle, headline, city, university, image_url, rating, review_count, total_hours, response_time, methodology) 
        VALUES (1, 'Abdel Majid', 'Brest • Maths & Physique', 'Docteur en Physique et Sciences des Matériaux propose des cours particuliers sur mesure.', 'Brest', 'UBO Brest', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600', 4.94, 17, 98, 'Répond généralement sous 6h', 'Mes cours s''adressent aux élèves du primaire, du collège et du lycée en mathématiques...')`, function(err) {
          if (!err) {
            db.run(`INSERT INTO prices (professor_id, level_name, price_per_hour) VALUES (1, 'Primaire', 20.90)`);
            db.run(`INSERT INTO prices (professor_id, level_name, price_per_hour) VALUES (1, 'Collège', 26.60)`);
            db.run(`INSERT INTO prices (professor_id, level_name, price_per_hour) VALUES (1, 'Lycée', 32.30)`);

            db.run(`INSERT INTO diplomas (professor_id, school_name, degree_title, period, description) VALUES (1, 'Université de Bretagne Occidentale', 'Doctorat en Physique', '2016 - 2020', 'Doctorat obtenu avec mention.')`);

            db.run(`INSERT INTO reviews (professor_id, author_name, rating, date_posted, comment) VALUES (1, 'Ayat', 5, 'Il y a 3 mois', 'Très bonne explication, j''ai tout de suite compris !')`);
            
            console.log('Profil de test inséré dans la base de données !');
          }
      });
    }
  });
});

// ==========================================
// 2. CONFIGURATION CLOUDINARY (Vidéos)[cite: 5]
// ==========================================
cloudinary.config({
  cloud_name: 'dzs2xuhjn',
  api_key: '411733432464956',
  api_secret: 'haKbzhBm4nDaymY8IlOaYAPbJ34'
});

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

// ==========================================
// 3. ROUTES API
// ==========================================

app.get('/', (req, res) => {
  res.send('Serveur Happy Cours en ligne et opérationnel !');
});

// ROUTE : Récupérer le profil complet d'un professeur avec toutes ses données reliées
app.get('/api/professors/:id', (req, res) => {
  const profId = req.params.id;

  db.get(`SELECT * FROM professors WHERE id = ?`, [profId], (err, professor) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!professor) return res.status(404).json({ error: 'Professeur non trouvé' });

    db.all(`SELECT * FROM prices WHERE professor_id = ?`, [profId], (err, prices) => {
      db.all(`SELECT * FROM diplomas WHERE professor_id = ?`, [profId], (err, diplomas) => {
        db.all(`SELECT * FROM experiences WHERE professor_id = ?`, [profId], (err, experiences) => {
          db.all(`SELECT * FROM reviews WHERE professor_id = ?`, [profId], (err, reviews) => {
            res.json({
              ...professor,
              prices,
              diplomas,
              experiences,
              reviews
            });
          });
        });
      });
    });
  });
});

// ROUTE D'UPLOAD VIDÉO : Envoi vers Cloudinary[cite: 5]
app.post('/upload-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Aucun fichier vidéo n'a été transmis." });
    }

    const localFilePath = req.file.path;

    // 1. Envoi automatique vers Cloudinary[cite: 5]
    const cloudinaryResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'video',
      folder: 'happy_cours_videos'
    });

    // 2. Nettoyage : Suppression du fichier temporaire[cite: 5]
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    // 3. Réponse renvoyée au client[cite: 5]
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

// ==========================================
// 4. LANCEMENT DU SERVEUR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});