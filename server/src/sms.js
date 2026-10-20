// Envoi des SMS de vérification.
// SMS_FOURNISSEUR = twilio | orange | demo   (par défaut : twilio si ses clés sont présentes, sinon demo)
//  - twilio : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, et TWILIO_FROM (numéro Twilio) ou TWILIO_MESSAGING_SERVICE_SID
//  - orange : ORANGE_CLIENT_ID, ORANGE_CLIENT_SECRET, ORANGE_SENDER (ex. tel:+2210000)   (API SMS Orange / Sonatel)
//  - demo   : aucun SMS n'est envoyé ; le code est renvoyé à l'écran, clairement signalé comme démonstration.

/** Met un numéro au format international E.164 (+221XXXXXXXXX). */
export function normaliserTelephone(tel) {
  let t = String(tel || '').replace(/[^\d+]/g, '');
  if (t.startsWith('00')) t = `+${t.slice(2)}`;
  if (!t.startsWith('+')) t = t.length === 9 ? `+221${t}` : `+${t}`;
  return t;
}

/** Masque un numéro pour l'affichage : +221 77 ··· ·· 01 */
export function masquerTelephone(tel) {
  const t = normaliserTelephone(tel);
  return `${t.slice(0, 4)} ${t.slice(4, 6)} ··· ·· ${t.slice(-2)}`;
}

export function fournisseurActif() {
  const choisi = (process.env.SMS_FOURNISSEUR || '').toLowerCase();
  if (choisi) return choisi;
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return 'twilio';
  if (process.env.ORANGE_CLIENT_ID && process.env.ORANGE_CLIENT_SECRET) return 'orange';
  return 'demo';
}

async function envoyerTwilio(to, texte) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const corps = new URLSearchParams({ To: to, Body: texte });
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) corps.set('MessagingServiceSid', process.env.TWILIO_MESSAGING_SERVICE_SID);
  else corps.set('From', process.env.TWILIO_FROM);
  const rep = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: corps,
  });
  const json = await rep.json().catch(() => ({}));
  if (!rep.ok) throw new Error(`Twilio : ${json.message || rep.status}`);
  return json.sid;
}

let jetonOrange = null;
async function envoyerOrange(to, texte) {
  if (!jetonOrange || jetonOrange.expire < Date.now()) {
    const id = Buffer.from(`${process.env.ORANGE_CLIENT_ID}:${process.env.ORANGE_CLIENT_SECRET}`).toString('base64');
    const r = await fetch('https://api.orange.com/oauth/v3/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${id}`, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: 'grant_type=client_credentials',
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Orange (jeton) : ${j.error_description || r.status}`);
    jetonOrange = { valeur: j.access_token, expire: Date.now() + (Number(j.expires_in || 3600) - 60) * 1000 };
  }
  const emetteur = process.env.ORANGE_SENDER; // ex. tel:+2210000
  const rep = await fetch(`https://api.orange.com/smsmessaging/v1/outbound/${encodeURIComponent(emetteur)}/requests`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jetonOrange.valeur}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      outboundSMSMessageRequest: {
        address: `tel:${to}`,
        senderAddress: emetteur,
        ...(process.env.ORANGE_SENDER_NAME ? { senderName: process.env.ORANGE_SENDER_NAME } : {}),
        outboundSMSTextMessage: { message: texte },
      },
    }),
  });
  if (!rep.ok) throw new Error(`Orange : ${rep.status} ${await rep.text().catch(() => '')}`);
  return 'orange';
}

/**
 * Envoie le code. Renvoie { fournisseur, demo } ; en mode démo, `codeDemo` contient le code à afficher.
 */
export async function envoyerCode(telephone, code) {
  const to = normaliserTelephone(telephone);
  const texte = `Materna Data : votre code de vérification est ${code}. Il expire dans 10 minutes. Ne le communiquez à personne.`;
  const f = fournisseurActif();
  if (f === 'twilio') { await envoyerTwilio(to, texte); return { fournisseur: 'twilio', demo: false }; }
  if (f === 'orange') { await envoyerOrange(to, texte); return { fournisseur: 'orange', demo: false }; }
  return { fournisseur: 'demo', demo: true, codeDemo: code };
}
