// Vérifie la forme des requêtes envoyées aux fournisseurs SMS (sans réseau : fetch est simulé).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { envoyerCode, normaliserTelephone, masquerTelephone } from '../src/sms.js';

test('normalisation des numéros sénégalais', () => {
  assert.equal(normaliserTelephone('+221 77 000 00 01'), '+221770000001');
  assert.equal(normaliserTelephone('77 000 00 01'), '+221770000001');
  assert.equal(normaliserTelephone('00221770000001'), '+221770000001');
  assert.equal(masquerTelephone('+221 77 123 45 67'), '+221 77 ··· ·· 67');
});

test('mode démo : aucun envoi, code renvoyé', async () => {
  process.env.SMS_FOURNISSEUR = 'demo';
  const r = await envoyerCode('+221770000001', '123456');
  assert.deepEqual(r, { fournisseur: 'demo', demo: true, codeDemo: '123456' });
});

test('Twilio : requête Messages.json correcte', async () => {
  Object.assign(process.env, { SMS_FOURNISSEUR: 'twilio', TWILIO_ACCOUNT_SID: 'ACtest', TWILIO_AUTH_TOKEN: 'jeton', TWILIO_FROM: '+15550001111' });
  let appel;
  globalThis.fetch = async (url, opts) => { appel = { url, opts }; return { ok: true, json: async () => ({ sid: 'SM1' }) }; };
  const r = await envoyerCode('+221 77 123 45 67', '654321');
  assert.equal(r.fournisseur, 'twilio');
  assert.equal(r.demo, false);
  assert.equal(appel.url, 'https://api.twilio.com/2010-04-01/Accounts/ACtest/Messages.json');
  assert.equal(appel.opts.headers.Authorization, `Basic ${Buffer.from('ACtest:jeton').toString('base64')}`);
  const corps = new URLSearchParams(appel.opts.body);
  assert.equal(corps.get('To'), '+221771234567');
  assert.equal(corps.get('From'), '+15550001111');
  assert.match(corps.get('Body'), /654321/);
});

test('Twilio : erreur remontée', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({ message: 'numéro non vérifié' }) });
  await assert.rejects(() => envoyerCode('+221771234567', '111111'), /numéro non vérifié/);
});

test('Orange : jeton puis envoi', async () => {
  Object.assign(process.env, { SMS_FOURNISSEUR: 'orange', ORANGE_CLIENT_ID: 'id', ORANGE_CLIENT_SECRET: 'secret', ORANGE_SENDER: 'tel:+2210000' });
  const appels = [];
  globalThis.fetch = async (url, opts) => {
    appels.push({ url, opts });
    return url.includes('oauth') ? { ok: true, json: async () => ({ access_token: 'T', expires_in: 3600 }) } : { ok: true, text: async () => '' };
  };
  await envoyerCode('+221771234567', '222222');
  assert.equal(appels[0].url, 'https://api.orange.com/oauth/v3/token');
  assert.equal(appels[1].url, `https://api.orange.com/smsmessaging/v1/outbound/${encodeURIComponent('tel:+2210000')}/requests`);
  assert.equal(JSON.parse(appels[1].opts.body).outboundSMSMessageRequest.address, 'tel:+221771234567');
});
