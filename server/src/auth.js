// Sessions (jeton signé dans un cookie HttpOnly), contrôle des rôles et journal des accès.
import jwt from 'jsonwebtoken';
import { q, un } from './db.js';

const SECRET = process.env.JWT_SECRET || 'secret-de-developpement-a-changer';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('ATTENTION : JWT_SECRET n’est pas défini. Définissez-le dans les variables d’environnement.');
}
const COOKIE = 'materna_session';
const DUREE_H = 8;

export function ouvrirSession(res, charge) {
  const jeton = jwt.sign(charge, SECRET, { expiresIn: `${DUREE_H}h` });
  res.cookie(COOKIE, jeton, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: DUREE_H * 3600 * 1000,
    path: '/',
  });
}
export const fermerSession = (res) => res.clearCookie(COOKIE, { path: '/' });

export function lireSession(req, _res, next) {
  const jeton = req.cookies?.[COOKIE];
  if (jeton) {
    try { req.session = jwt.verify(jeton, SECRET); } catch { req.session = null; }
  }
  next();
}

/** Inscrit une ligne dans le journal des accès. */
export async function journaliser(req, { utilisateur, role, action, dossier = '—', resultat = 'ok' }) {
  await q('INSERT INTO journal_acces (utilisateur, role, action, dossier, resultat, ip) VALUES ($1,$2,$3,$4,$5,$6)',
    [utilisateur, role, action, dossier || '—', resultat, req.ip]);
}

/** Personnel de la clinique connecté et accrédité. */
export async function exigerPro(req, res, next) {
  if (req.session?.t !== 'pro') return res.status(401).json({ erreur: 'Connexion requise.' });
  const u = await un('SELECT id, nom, role, fonction, initiales, email, actif, etablissement_id FROM utilisateurs WHERE id = $1', [req.session.id]);
  if (!u || !u.actif) return res.status(403).json({ erreur: 'Compte non accrédité.' });
  req.utilisateur = u;
  next();
}

export const estSoignant = (u) => u.role === 'medecin' || u.role === 'sagefemme';

/** Seuls les médecins et sages-femmes accèdent au contenu médical. Tout refus est journalisé. */
export function exigerSoignant(actionRefusee = 'Tentative d’accès au contenu médical') {
  return async (req, res, next) => {
    await exigerPro(req, res, async () => {
      if (!estSoignant(req.utilisateur)) {
        await journaliser(req, { utilisateur: req.utilisateur.nom, role: req.utilisateur.role, action: actionRefusee, dossier: req.params.id || req.body?.patiente || '—', resultat: 'refuse' });
        return res.status(403).json({ erreur: 'Votre rôle ne donne pas accès au contenu médical des dossiers.' });
      }
      next();
    });
  };
}

/** Compte patiente connecté (relié ou non). */
export async function exigerComptePatiente(req, res, next) {
  if (req.session?.t !== 'pat') return res.status(401).json({ erreur: 'Connexion requise.' });
  const c = await un('SELECT id, nom, telephone, email, patiente_id, essais_code FROM comptes_patientes WHERE id = $1', [req.session.id]);
  if (!c) return res.status(401).json({ erreur: 'Compte introuvable.' });
  req.compte = c;
  next();
}

/** Compte patiente relié à un dossier, avec consentement actif. */
export async function exigerPatienteLiee(req, res, next) {
  await exigerComptePatiente(req, res, async () => {
    if (!req.compte.patiente_id) return res.status(403).json({ erreur: 'Aucun carnet n’est relié à ce compte.', code: 'NON_RELIE' });
    const c = await un('SELECT id FROM consentements WHERE compte_id = $1 AND patiente_id = $2 AND soins AND retire_le IS NULL', [req.compte.id, req.compte.patiente_id]);
    if (!c) return res.status(403).json({ erreur: 'Consentement au partage absent ou retiré.', code: 'SANS_CONSENTEMENT' });
    next();
  });
}
