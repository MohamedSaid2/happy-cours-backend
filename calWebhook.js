// calWebhook.js
// Module de gestion du Webhook Cal.com / Cal.eu et envoi des notifications WhatsApp

const handleCalWebhook = async (req, res) => {
  try {
    const event = req.body;

    // Déclencheur : Nouvelle réservation créée sur Cal.com
    if (event.triggerEvent === 'BOOKING_CREATED') {
      const payload = event.payload || {};
      const attendees = payload.attendees || [];
      const eleve = attendees[0] || {};

      const nomEleve = eleve.name || 'Non renseigné';
      const emailEleve = eleve.email || 'Non renseigné';
      const titreCours = payload.title || 'Cours particulier';

      // Formatage de la date en heure française
      const dateHeure = payload.startTime 
        ? new Date(payload.startTime).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
        : 'Non précisée';

      console.log(`🔔 NOUVELLE RÉSERVATION COURS LIVE !`);
      console.log(`👤 Élève : ${nomEleve} (${emailEleve})`);
      console.log(`📅 Date : ${dateHeure}`);

      // Construction du message WhatsApp
      const message = `🚨 *NOUVELLE RÉSERVATION COURS LIVE !*\n\n` +
        `👤 *Élève :* ${nomEleve}\n` +
        `📧 *Email :* ${emailEleve}\n` +
        `📅 *Date :* ${dateHeure}\n` +
        `📚 *Cours :* ${titreCours}`;

      // Récupération des identifiants API (ex: Twilio / Green-API) depuis les variables d'environnement
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      const toNumber = process.env.MY_WHATSAPP_NUMBER || 'whatsapp:+33759047764';

      if (accountSid && authToken) {
        // Envoi via l'API officielle Twilio WhatsApp
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const params = new URLSearchParams({
          From: fromNumber,
          To: toNumber,
          Body: message
        });

        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        if (twilioRes.ok) {
          console.log('✅ Notification WhatsApp envoyée avec succès sur votre téléphone !');
        } else {
          const errText = await twilioRes.text();
          console.error('⚠️ Erreur envoi Twilio WhatsApp:', errText);
        }
      } else {
        console.log('ℹ️ Notification reçue, mais identifiants WhatsApp non configurés sur Render.');
      }
    }

    // Réponse rapide 200 OK requise par Cal.com
    return res.status(200).json({ success: true, message: 'Webhook traité avec succès' });
  } catch (error) {
    console.error('Erreur traitement Webhook Cal.com:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { handleCalWebhook };