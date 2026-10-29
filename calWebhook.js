// calWebhook.js
// Module de gestion du Webhook Cal.com / Cal.eu -> Notification WhatsApp via Green-API

const handleCalWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (event.triggerEvent === 'BOOKING_CREATED') {
      const payload = event.payload || {};
      const attendees = payload.attendees || [];
      const eleve = attendees[0] || {};

      const nomEleve = eleve.name || 'Non renseigné';
      const emailEleve = eleve.email || 'Non renseigné';
      const titreCours = payload.title || 'Cours particulier';

      const dateHeure = payload.startTime 
        ? new Date(payload.startTime).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
        : 'Non précisée';

      console.log(`🔔 NOUVELLE RÉSERVATION COURS LIVE !`);
      console.log(`👤 Élève : ${nomEleve} (${emailEleve})`);
      console.log(`📅 Date : ${dateHeure}`);

      const message = `🚨 *NOUVELLE RÉSERVATION COURS LIVE !*\n\n` +
        `👤 *Élève :* ${nomEleve}\n` +
        `📧 *Email :* ${emailEleve}\n` +
        `📅 *Date :* ${dateHeure}\n` +
        `📚 *Cours :* ${titreCours}`;

      // Récupération sécurisée des variables d'environnement (avec valeurs de secours basées sur votre instance)
      const idInstance = process.env.GREEN_INSTANCE_ID || '710722783902';
      const apiToken = process.env.GREEN_API_TOKEN || 'bba639acf2c3493a1be4705b4c3969aad00abf10b6f4918a2';
      const myPhone = process.env.MY_WHATSAPP_NUMBER || '33759047764';

      // Construction propre de l'URL Green-API
      const rawUrl = process.env.GREEN_API_URL || 'https://7107.api.greenapi.com';
      const cleanBaseUrl = rawUrl.trim().replace(/[\[\]()]/g, '').replace(/\/+$/, '');
      const urlWa = `${cleanBaseUrl}/waInstance${idInstance}/sendMessage/${apiToken}`;

      console.log(`📤 Envoi vers Green-API pour ${myPhone}...`);

      const waResponse = await fetch(urlWa, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${myPhone}@c.us`,
          message: message
        })
      });

      const responseData = await waResponse.text();

      if (waResponse.ok) {
        console.log('✅ Message WhatsApp envoyé avec succès sur votre téléphone !');
        console.log('Réponse Green-API:', responseData);
      } else {
        console.error(`⚠️ Erreur Green-API (Code HTTP ${waResponse.status}):`, responseData);
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook traité avec succès' });
  } catch (error) {
    console.error('Erreur traitement Webhook Cal.com:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { handleCalWebhook };