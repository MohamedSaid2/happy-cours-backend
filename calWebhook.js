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

      // Récupération des clés Green-API
      const idInstance = process.env.GREEN_INSTANCE_ID;
      const apiToken = process.env.GREEN_API_TOKEN;
      const myPhone = process.env.MY_WHATSAPP_NUMBER || '33759047764';

      if (idInstance && apiToken) {
        // Utilisation de l'URL spécifique à votre instance (ex: https://7107.api.greenapi.com)
        const apiUrl = process.env.GREEN_API_URL || 'https://7107.api.greenapi.com';
        const urlWa = `${apiUrl}/waInstance${idInstance}/sendMessage/${apiToken}`;
        
        const waResponse = await fetch(urlWa, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: `${myPhone}@c.us`,
            message: message
          })
        });

        if (waResponse.ok) {
          console.log('✅ Message WhatsApp envoyé avec succès sur votre téléphone !');
        } else {
          const errBody = await waResponse.text();
          console.error('⚠️ Erreur envoi WhatsApp:', errBody);
        }
      } else {
        console.log('ℹ️ Identifiants WhatsApp non définis sur Render.');
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook traité avec succès' });
  } catch (error) {
    console.error('Erreur traitement Webhook Cal.com:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { handleCalWebhook };