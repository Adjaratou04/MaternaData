// Connexion unique : le même formulaire ouvre l'espace professionnel ou l'application patiente.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { un } from '../db.js';
import { ouvrirSession, fermerSession, journaliser } from '../auth.js';
import { normaliserTelephone } from '../sms.js';
import * as f from '../format.js';

export const routesAuth = Router();
const limite = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { erreur: 'Trop de tentatives. Réessayez dans quelques minutes.' } });

routesAuth.post('/connexion', limite, async (req, res) => {
  const identifiant = String(req.body?.identifiant || '').trim().toLowerCase();
  const mdp = String(req.body?.mdp || '');
  if (!identifiant || !mdp) return res.status(400).json({ erreur: 'Renseignez votre identifiant et votre mot de passe.' });
  const refus = () => res.status(401).json({ erreur: 'Identifiant ou mot de passe incorrect.' });

  // 1) Personnel de la clinique
  const u = await un('SELECT * FROM utilisateurs WHERE lower(email) = $1', [identifiant]);
  if (u) {
    if (!(await bcrypt.compare(mdp, u.mot_de_passe_hash))) return refus();
    if (!u.actif) {
      await journaliser(req, { utilisateur: u.nom, role: u.role, action: 'Tentative de connexion d’un compte non accrédité', resultat: 'refuse' });
      return res.status(403).json({ erreur: 'Ce compte n’est pas accrédité par l’établissement. La tentative a été enregistrée.' });
    }
    ouvrirSession(res, { t: 'pro', id: u.id });
    await journaliser(req, { utilisateur: u.nom, role: u.role, action: 'Connexion au logiciel professionnel' });
    return res.json({ espace: 'pro', utilisateur: f.utilisateur(u) });
  }

  // 2) Compte patiente (e-mail ou téléphone)
  const tel = /^[+\d\s]{8,}$/.test(identifiant) ? normaliserTelephone(identifiant) : null;
  const c = await un(
    `SELECT * FROM comptes_patientes WHERE lower(email) = $1 OR ($2::text IS NOT NULL AND regexp_replace(telephone, '[^0-9+]', '', 'g') = $2)`,
    [identifiant, tel]);
  if (!c || !(await bcrypt.compare(mdp, c.mot_de_passe_hash))) return refus();
  ouvrirSession(res, { t: 'pat', id: c.id });
  await journaliser(req, { utilisateur: c.nom, role: 'patiente', action: 'Connexion à l’application mobile', dossier: c.patiente_id || '—' });
  return res.json({ espace: 'patiente', relie: !!c.patiente_id });
});

routesAuth.post('/deconnexion', (req, res) => { fermerSession(res); res.json({ ok: true }); });

/** Qui est connecté ? (utilisé au chargement de l'application) */
routesAuth.get('/moi', async (req, res) => {
  if (req.session?.t === 'pro') {
    const u = await un('SELECT * FROM utilisateurs WHERE id = $1 AND actif', [req.session.id]);
    if (u) return res.json({ espace: 'pro', utilisateur: f.utilisateur(u) });
  }
  if (req.session?.t === 'pat') {
    const c = await un('SELECT id, nom, patiente_id FROM comptes_patientes WHERE id = $1', [req.session.id]);
    if (c) return res.json({ espace: 'patiente', relie: !!c.patiente_id, nom: c.nom });
  }
  res.json({ espace: null });
});
