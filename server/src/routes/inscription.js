// Inscription patiente : 1) compte  2) code de liaison  3) code SMS  4) consentement.
// Le compte seul ne donne accès à aucun dossier.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { q, un, nouvelId, transaction } from '../db.js';
import { ouvrirSession, exigerComptePatiente, journaliser } from '../auth.js';
import { envoyerCode, masquerTelephone, normaliserTelephone, fournisseurActif } from '../sms.js';

export const routesInscription = Router();
const limite = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false,
  message: { erreur: 'Trop de tentatives. Réessayez dans quelques minutes.' } });
routesInscription.use(limite);

const MAX_ESSAIS_CODE = 5;
const MAX_ESSAIS_SMS = 5;
const empreinte = (code) => crypto.createHash('sha256').update(`${process.env.JWT_SECRET || 'dev'}:${code}`).digest('hex');
const normaliserCode = (c) => {
  const brut = String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const chiffres = brut.match(/(\d{4})$/)?.[1];
  return chiffres ? `MATERNA-DKR-${chiffres}` : brut;
};

routesInscription.get('/sms-mode', (_req, res) => res.json({ fournisseur: fournisseurActif() }));

routesInscription.post('/compte', async (req, res) => {
  const nom = String(req.body?.nom || '').trim();
  const tel = normaliserTelephone(req.body?.telephone);
  const mdp = String(req.body?.mdp || '');
  if (nom.split(/\s+/).length < 2) return res.status(400).json({ erreur: 'Indiquez votre prénom et votre nom.' });
  if (!/^\+\d{9,15}$/.test(tel)) return res.status(400).json({ erreur: 'Numéro de téléphone invalide.' });
  if (mdp.length < 8) return res.status(400).json({ erreur: 'Le mot de passe doit contenir au moins 8 caractères.' });
  if (!req.body?.cgu) return res.status(400).json({ erreur: 'Acceptez les conditions d’utilisation pour continuer.' });
  const existe = await un(`SELECT id FROM comptes_patientes WHERE regexp_replace(telephone, '[^0-9+]', '', 'g') = $1`, [tel]);
  if (existe) return res.status(409).json({ erreur: 'Un compte existe déjà avec ce numéro. Connectez-vous.' });
  const id = await nouvelId('A');
  await q('INSERT INTO comptes_patientes (id, nom, telephone, mot_de_passe_hash) VALUES ($1,$2,$3,$4)', [id, nom, tel, await bcrypt.hash(mdp, 10)]);
  ouvrirSession(res, { t: 'pat', id });
  await journaliser(req, { utilisateur: nom, role: 'patiente', action: 'Création du compte patiente (aucun dossier relié)' });
  res.status(201).json({ ok: true });
});

async function envoyerSms(compte, patiente) {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const envoi = await envoyerCode(patiente.telephone, code);
  await q(`UPDATE verifications_sms SET valide = false, expire_le = now() WHERE compte_id = $1 AND NOT valide`, [compte.id]);
  await q(`INSERT INTO verifications_sms (compte_id, patiente_id, code_hash, expire_le, fournisseur) VALUES ($1,$2,$3, now() + interval '10 minutes', $4)`,
    [compte.id, patiente.id, empreinte(code), envoi.fournisseur]);
  return envoi;
}

/** Étape 2 : code de liaison, puis envoi du SMS au numéro enregistré DANS LE DOSSIER (pas celui saisi par l'utilisatrice). */
routesInscription.post('/code', exigerComptePatiente, async (req, res) => {
  const c = req.compte;
  if (c.patiente_id) return res.status(400).json({ erreur: 'Ce compte est déjà relié à un carnet.' });
  if (c.essais_code >= MAX_ESSAIS_CODE) return res.status(429).json({ erreur: 'Trop d’essais. Demandez un nouveau code à votre sage-femme.' });
  const code = normaliserCode(req.body?.code);
  const p = await un('SELECT p.*, e.nom AS etab FROM patientes p JOIN etablissements e ON e.id = p.etablissement_id WHERE code_liaison = $1', [code]);
  if (!p) {
    await q('UPDATE comptes_patientes SET essais_code = essais_code + 1 WHERE id = $1', [c.id]);
    await journaliser(req, { utilisateur: c.nom, role: 'patiente', action: 'Tentative de liaison avec un code invalide', resultat: 'refuse' });
    const reste = MAX_ESSAIS_CODE - c.essais_code - 1;
    return res.status(404).json({ erreur: `Ce code ne correspond à aucun dossier. Vérifiez-le sur votre fiche de liaison (${reste} essai${reste > 1 ? 's' : ''} restant${reste > 1 ? 's' : ''}).` });
  }
  if (await un('SELECT 1 FROM comptes_patientes WHERE patiente_id = $1', [p.id])) {
    await journaliser(req, { utilisateur: c.nom, role: 'patiente', action: 'Tentative de liaison d’un carnet déjà relié', dossier: p.id, resultat: 'refuse' });
    return res.status(409).json({ erreur: 'Ce carnet est déjà relié à un autre compte. Adressez-vous à votre clinique.' });
  }
  if (!p.ddr && !p.postnatal) {
    return res.status(409).json({ erreur: 'Votre carnet sera disponible dès que votre sage-femme aura renseigné la date de vos dernières règles.' });
  }
  if (p.postnatal) {
    return res.status(409).json({ erreur: 'Le suivi postnatal dans l’application arrive prochainement. Votre clinique vous préviendra.' });
  }
  try {
    const envoi = await envoyerSms(c, p);
    res.json({ telephoneMasque: masquerTelephone(p.telephone), fournisseur: envoi.fournisseur, ...(envoi.demo ? { codeDemo: envoi.codeDemo } : {}) });
  } catch (e) {
    console.error(e);
    res.status(502).json({ erreur: 'L’envoi du SMS a échoué. Réessayez dans un instant.' });
  }
});

routesInscription.post('/sms/renvoyer', exigerComptePatiente, async (req, res) => {
  const v = await un('SELECT * FROM verifications_sms WHERE compte_id = $1 ORDER BY cree_le DESC LIMIT 1', [req.compte.id]);
  if (!v) return res.status(400).json({ erreur: 'Saisissez d’abord votre code de liaison.' });
  if (Date.now() - new Date(v.cree_le).getTime() < 60_000) return res.status(429).json({ erreur: 'Patientez une minute avant de demander un nouveau code.' });
  const p = await un('SELECT * FROM patientes WHERE id = $1', [v.patiente_id]);
  try {
    const envoi = await envoyerSms(req.compte, p);
    res.json({ telephoneMasque: masquerTelephone(p.telephone), fournisseur: envoi.fournisseur, ...(envoi.demo ? { codeDemo: envoi.codeDemo } : {}) });
  } catch (e) {
    console.error(e);
    res.status(502).json({ erreur: 'L’envoi du SMS a échoué. Réessayez dans un instant.' });
  }
});

/** Étape 3 : vérification du code reçu par SMS. */
routesInscription.post('/sms/verifier', exigerComptePatiente, async (req, res) => {
  const v = await un('SELECT * FROM verifications_sms WHERE compte_id = $1 ORDER BY cree_le DESC LIMIT 1', [req.compte.id]);
  if (!v) return res.status(400).json({ erreur: 'Aucun code en attente.' });
  if (new Date(v.expire_le) < new Date()) return res.status(410).json({ erreur: 'Ce code a expiré. Demandez-en un nouveau.' });
  if (v.essais >= MAX_ESSAIS_SMS) return res.status(429).json({ erreur: 'Trop d’essais. Demandez un nouveau code.' });
  const saisi = String(req.body?.code || '').replace(/\D/g, '');
  if (empreinte(saisi) !== v.code_hash) {
    await q('UPDATE verifications_sms SET essais = essais + 1 WHERE id = $1', [v.id]);
    await journaliser(req, { utilisateur: req.compte.nom, role: 'patiente', action: 'Code SMS incorrect lors de la liaison', dossier: v.patiente_id, resultat: 'refuse' });
    return res.status(400).json({ erreur: 'Code SMS incorrect.' });
  }
  await q('UPDATE verifications_sms SET valide = true WHERE id = $1', [v.id]);
  const p = await un('SELECT p.id, p.nom, p.ddr, e.nom AS etablissement FROM patientes p JOIN etablissements e ON e.id = p.etablissement_id WHERE p.id = $1', [v.patiente_id]);
  res.json({ dossier: p });
});

/** Étape 4 : consentement explicite, puis liaison effective du carnet. */
routesInscription.post('/consentement', exigerComptePatiente, async (req, res) => {
  if (!req.body?.soins) return res.status(400).json({ erreur: 'Sans ce consentement, vos soignants ne pourront pas partager votre carnet avec vous.' });
  const v = await un(`SELECT * FROM verifications_sms WHERE compte_id = $1 AND valide AND cree_le > now() - interval '30 minutes' ORDER BY cree_le DESC LIMIT 1`, [req.compte.id]);
  if (!v) return res.status(403).json({ erreur: 'La vérification par SMS est requise avant de relier le carnet.' });
  const recherche = !!req.body?.recherche;
  await transaction(async (cl) => {
    await cl.query('UPDATE comptes_patientes SET patiente_id = $1, lie_le = now() WHERE id = $2', [v.patiente_id, req.compte.id]);
    await cl.query('INSERT INTO consentements (compte_id, patiente_id, soins, recherche) VALUES ($1,$2,true,$3)', [req.compte.id, v.patiente_id, recherche]);
  });
  await journaliser(req, { utilisateur: req.compte.nom, role: 'patiente', action: 'Liaison du carnet (code + vérification SMS)', dossier: v.patiente_id });
  await journaliser(req, { utilisateur: req.compte.nom, role: 'patiente', action: `Consentement au partage enregistré${recherche ? ' (et usage anonymisé accepté)' : ''}`, dossier: v.patiente_id });
  res.json({ ok: true });
});
