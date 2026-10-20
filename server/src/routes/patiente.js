// API de l'application patiente (uniquement son propre carnet, après liaison + consentement).
import { Router } from 'express';
import { q, un, tous } from '../db.js';
import { exigerPatienteLiee, journaliser } from '../auth.js';
import { enfantsDe } from './pro.js';
import * as f from '../format.js';

export const routesPatiente = Router();

routesPatiente.get('/carnet', exigerPatienteLiee, async (req, res) => {
  const pid = req.compte.patiente_id;
  const [p, consultations, examens, rdv, notifications, journal, consentement, etab] = await Promise.all([
    un('SELECT * FROM patientes WHERE id = $1', [pid]),
    tous('SELECT * FROM consultations WHERE patiente_id = $1 ORDER BY date', [pid]),
    tous('SELECT * FROM examens WHERE patiente_id = $1 ORDER BY date', [pid]),
    tous('SELECT * FROM rendez_vous WHERE patiente_id = $1 ORDER BY date, heure', [pid]),
    tous('SELECT * FROM notifications WHERE patiente_id = $1 ORDER BY date DESC', [pid]),
    tous('SELECT * FROM journal_acces WHERE dossier = $1 ORDER BY date DESC, id DESC LIMIT 100', [pid]),
    un('SELECT soins, recherche, donne_le FROM consentements WHERE compte_id = $1 AND patiente_id = $2 AND retire_le IS NULL ORDER BY donne_le DESC LIMIT 1', [req.compte.id, pid]),
    un('SELECT e.nom, e.ville FROM etablissements e JOIN patientes p ON p.etablissement_id = e.id WHERE p.id = $1', [pid]),
  ]);
  if (req.query.silencieux !== '1') {
    await journaliser(req, { utilisateur: req.compte.nom, role: 'patiente', action: 'Lecture du carnet depuis l’application mobile', dossier: pid });
  }
  res.json({
    patiente: f.patiente(p),
    etablissement: etab,
    consultations: consultations.map(f.consultation),
    examens: examens.map(f.examen),
    rdv: rdv.map(f.rdv),
    notifications: notifications.map(f.notification),
    journal: journal.map(f.entree),
    consentement,
    enfants: await enfantsDe([pid]),
  });
});

routesPatiente.post('/notifications/:id/lue', exigerPatienteLiee, async (req, res) => {
  await q('UPDATE notifications SET lue = true WHERE id = $1 AND patiente_id = $2', [req.params.id, req.compte.patiente_id]);
  res.json({ ok: true });
});
routesPatiente.post('/notifications/tout-lu', exigerPatienteLiee, async (req, res) => {
  await q('UPDATE notifications SET lue = true WHERE patiente_id = $1', [req.compte.patiente_id]);
  res.json({ ok: true });
});

/** Actions de la patiente à tracer (ouverture d'un examen, partage…). */
routesPatiente.post('/journal', exigerPatienteLiee, async (req, res) => {
  const action = String(req.body?.action || '').slice(0, 200);
  if (!action) return res.status(400).json({ erreur: 'Action manquante.' });
  await journaliser(req, { utilisateur: req.compte.nom, role: 'patiente', action, dossier: req.compte.patiente_id });
  res.json({ ok: true });
});

/** Retrait du consentement : le carnet n'est plus accessible depuis l'application (loi n° 2008-12). */
routesPatiente.post('/consentement/retirer', exigerPatienteLiee, async (req, res) => {
  const pid = req.compte.patiente_id;
  await q('UPDATE consentements SET retire_le = now() WHERE compte_id = $1 AND patiente_id = $2 AND retire_le IS NULL', [req.compte.id, pid]);
  await q('UPDATE comptes_patientes SET patiente_id = NULL, lie_le = NULL WHERE id = $1', [req.compte.id]);
  await journaliser(req, { utilisateur: req.compte.nom, role: 'patiente', action: 'Retrait du consentement et déliaison du carnet', dossier: pid });
  res.json({ ok: true });
});
