// calWebhook.js
const handleCalWebhook = async (req, res) => {
  console.log('📥 REQUÊTE WEBHOOK REÇUE DE CAL.COM !');

  try {
    const event = req.body || {};
    const payload = event.payload || {};
    const attendees = payload.attendees || [];
    const eleve = attendees[0] || {};

    const nomEleve = eleve.name || 'Non renseigné';
    const emailEleve = eleve.email || 'Non renseigné';
    const titreCours = payload.title || 'Cours particulier';

    const dateHeure = payload.startTime 
      ? new Date(payload.startTime).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
      : 'Non précisée';

    const message = `🚨 *NOUVELLE RÉSERVATION COURS LIVE !*\n\n` +
      `👤 *Élève :* ${nomEleve}\n` +
      `📧 *Email :* ${emailEleve}\n` +
      `📅 *Date :* ${dateHeure}\n` +
      `📚 *Cours :* ${titreCours}`;

    // Valeurs extraites directement de votre capture d'écran Green-API
    const apiUrl = 'https://7107.api.greenapi.com';
    const idInstance = '710722783902';
    const apiToken = 'bba639acf2c3493a1be4705b4c3969aad00abf10b6f4918a2';
    const myPhone = '33759047764';

    const urlWa = `${apiUrl}/waInstance${idInstance}/sendMessage/${apiToken}`;

    console.log(`📤 Envoi vers Green-API (${apiUrl}) pour ${myPhone}...`);

    const waResponse = await fetch(urlWa, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: `${myPhone}@c.us`,
        message: message
      })
    });

    const responseData = await waResponse.text();
    console.log(`📨 Réponse Green-API (Statut ${waResponse.status}):`, responseData);

    return res.status(200).json({ success: true, message: 'Webhook traité avec succès' });
  } catch (error) {
    console.error('❌ Erreur critique:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { handleCalWebhook };