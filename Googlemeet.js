const { google } = require('googleapis');

// Nécessite dans le .env :
//   GOOGLE_CLIENT_ID=...
//   GOOGLE_CLIENT_SECRET=...
//   GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
//   GOOGLE_REFRESH_TOKEN=...
//
// Ces identifiants correspondent au compte Google qui "possède" les
// événements créés (celui qui apparaîtra comme organisateur). Voir les
// instructions de configuration fournies séparément pour les obtenir.
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Crée un événement Google Calendar avec un lien Google Meet, et invite
 * automatiquement le professeur et l'élève par email (Google envoie
 * lui-même l'invitation, avec le lien Meet inclus dedans).
 *
 * @param {Object} params
 * @param {string} params.titre
 * @param {string} params.description
 * @param {string} params.dateISO   Format "YYYY-MM-DD"
 * @param {string} params.heure     Format "HH:MM"
 * @param {string} params.emailProf
 * @param {string} params.emailEleve
 * @param {number} [params.dureeMinutes=30]
 */
async function creerEvenementMeet({ titre, description, dateISO, heure, emailProf, emailEleve, dureeMinutes = 30 }) {
  const [year, month, day] = dateISO.split('-').map(Number);
  const [hour, minute] = heure.split(':').map(Number);

  const startDateTime = new Date(year, month - 1, day, hour, minute);
  const endDateTime = new Date(startDateTime.getTime() + dureeMinutes * 60000);

  const event = {
    summary: titre,
    description: description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'Europe/Paris'
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'Europe/Paris'
    },
    attendees: [
      { email: emailProf },
      { email: emailEleve }
    ],
    conferenceData: {
      createRequest: {
        requestId: `happycours-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all' // envoie l'invitation par email au prof + à l'élève automatiquement
  });

  return {
    lienVisio: response.data.hangoutLink,
    eventId: response.data.id,
    eventLink: response.data.htmlLink
  };
}

module.exports = { creerEvenementMeet };