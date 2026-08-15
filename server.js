const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Route pour enregistrer les métadonnées une fois le fichier chez Cloudinary
app.post('/save-video', (req, res) => {
  const { url, title, description, duration } = req.body;

  console.log('Nouvelle vidéo sauvegardée :', { url, title, description, duration });

  res.json({
    success: true,
    url,
    title,
    description,
    duration
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));