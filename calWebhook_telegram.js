// calWebhook_telegram.js
const handleCalWebhookTelegram = async (req, res) => {
  console.log('📥 REQUÊTE WEBHOOK REÇUE DE CAL.COM (TELEGRAM) !');

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

    console.log(`🔔 Traitement réservation Telegram -> Élève : ${nomEleve} | Date : ${dateHeure}`);

    const message = `🚨 *NOUVELLE RÉSERVATION COURS LIVE !*\n\n` +
      `👤 *Élève :* ${nomEleve}\n` +
      `📧 *Email :* ${emailEleve}\n` +
      `📅 *Date :* ${dateHeure}\n` +
      `📚 *Cours :* ${titreCours}`;

    const apiUrl = 'https://api.green-api.com';
    const idInstance = '410022785285';
    const apiToken = '88937e6a929d427f8785d8eec5840294c4d75247c82f4405b6';

    const urlWa = `${apiUrl}/waInstance${idInstance}/sendMessage/${apiToken}`;

    console.log(`📤 Envoi vers Telegram via Green-API (${apiUrl})...`);

    const waResponse = await fetch(urlWa, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: 'default',
        message: message
      })
    });

    const responseData = await waResponse.text();
    console.log(`📨 Réponse Green-API Telegram (Statut ${waResponse.status}):`, responseData);

    return res.status(200).json({ success: true, message: 'Webhook Telegram traité avec succès' });
  } catch (error) {
    console.error('❌ Erreur critique dans handleCalWebhookTelegram:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { handleCalWebhookTelegram };