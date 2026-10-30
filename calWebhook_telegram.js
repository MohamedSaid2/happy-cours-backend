// calWebhook_telegram.js
const handleCalWebhookTelegram = async (req, res) => {
  console.log('📥 REQUÊTE WEBHOOK REÇUE DE CAL.COM (TELEGRAM BOT) !');

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

    // Message formaté pour Telegram
    const message = `🚨 *NOUVELLE RÉSERVATION COURS LIVE !*\n\n` +
      `👤 *Élève :* ${nomEleve}\n` +
      `📧 *Email :* ${emailEleve}\n` +
      `📅 *Date :* ${dateHeure}\n` +
      `📚 *Cours :* ${titreCours}`;

    // Vos identifiants Bot Telegram
    const botToken = '9203227989:AAGQ71kVKygrq8ok8blJVMPC4q7UZxku-a0';
    const chatId = '6955670219';

    const urlTelegram = `https://api.telegram.org/bot${botToken}/sendMessage`;

    console.log(`📤 Envoi vers le Bot Telegram (${urlTelegram})...`);

    const telegramResponse = await fetch(urlTelegram, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const responseData = await telegramResponse.json();
    console.log(`📨 Réponse Bot Telegram (Statut ${telegramResponse.status}):`, JSON.stringify(responseData));

    return res.status(200).json({ success: true, message: 'Webhook Telegram envoyé avec succès' });
  } catch (error) {
    console.error('❌ Erreur critique dans handleCalWebhookTelegram:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { handleCalWebhookTelegram };