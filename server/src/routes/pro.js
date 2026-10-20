// API de l'espace professionnel (logiciel de la clinique).
import { Router } from 'express';
import { q, un, tous, nouvelId, transaction } from '../db.js';
import { exigerPro, exigerSoignant, estSoignant, journaliser } from '../auth.js';
import * as f from '../format.js';

export const routesPro = Router();

export async function enfantsDe(ids) {
  if (!ids.length) return [];
  const enfants = await tous('SELECT * FROM enfants WHERE mere_id = ANY($1)', [ids]);
  for (const e of enfants) {
    e.croissance = await tous('SELECT jours, poids, taille FROM mesures_enfant WHERE enfant_id = $1 ORDER BY jours', [e.id]);
    e.vaccins = await tous('SELECT age, vaccins, date, statut FROM vaccins WHERE enfant_id = $1 ORDER BY date', [e.id]);
    e.consultations = await tous('SELECT date, type, par, notes FROM consultations_enfant WHERE enfant_id = $1 ORDER BY date DESC', [e.id]);
  }
  return enfants.map((e) => ({
    id: e.id, mere: e.mere_id, prenom: e.prenom, nom: e.nom, sexe: e.sexe, naissance: e.naissance,
    terme: e.terme, poidsNaissance: e.poids_naissance, tailleNaissance: e.taille_naissance, lieu: e.lieu,
    croissance: e.croissance, vaccins: e.vaccins, consultations: e.consultations,
  }));
}

/** État complet de la clinique pour l'utilisateur connecté. L'administration ne reçoit aucun contenu médical. */
routesPro.get('/etat', exigerPro, async (req, res) => {
  const u = req.utilisateur;
  const soignant = estSoignant(u);
  const [patientes, utilisateurs, journal, rdv] = await Promise.all([
    tous('SELECT * FROM patientes WHERE etablissement_id = $1 ORDER BY id', [u.etablissement_id]),
    tous('SELECT * FROM utilisateurs WHERE etablissement_id = $1 ORDER BY id', [u.etablissement_id]),
    tous('SELECT * FROM journal_acces ORDER BY date DESC, id DESC LIMIT 400'),
    tous(`SELECT r.* FROM rendez_vous r JOIN patientes p ON p.id = r.patiente_id WHERE p.etablissement_id = $1 AND r.statut IN ('confirme','a-confirmer') ORDER BY r.date, r.heure`, [u.etablissement_id]),
  ]);
  const base = {
    profil: u.id,
    utilisateurs: utilisateurs.map(f.utilisateur),
    journal: journal.map(f.entree),
    demo: process.env.DEMO_MODE !== 'false',
  };
  if (!soignant) {
    return res.json({
      ...base,
      patientes: patientes.map(f.patienteAdministrative),
      consultations: [], examens: [], enfants: [],
      rdv: rdv.map((r) => ({ ...f.rdv(r), motif: 'Rendez-vous (motif réservé aux soignants)' })),
    });
  }
  const ids = patientes.map((p) => p.id);
  const [consultations, examens, enfants] = await Promise.all([
    tous('SELECT * FROM consultations WHERE patiente_id = ANY($1) ORDER BY date', [ids]),
    tous(`SELECT * FROM examens WHERE patiente_id = ANY($1) AND statut = 'resultat' ORDER BY date`, [ids]),
    enfantsDe(ids),
  ]);
  res.json({
    ...base,
    patientes: patientes.map(f.patiente),
    consultations: consultations.map(f.consultation),
    examens: examens.map(f.examen),
    rdv: rdv.map(f.rdv),
    enfants,
  });
});

/** Trace une action réalisée dans l'interface (ouverture d'un dossier, refus affiché…). L'identité vient de la session, jamais du client. */
routesPro.post('/journal', exigerPro, async (req, res) => {
  const action = String(req.body?.action || '').slice(0, 200);
  if (!action) return res.status(400).json({ erreur: 'Action manquante.' });
  const dossier = String(req.body?.dossier || '—').slice(0, 20);
  // Un non-soignant ne peut jamais inscrire une lecture réussie d'un dossier
  const resultat = req.body?.resultat === 'refuse' || (!estSoignant(req.utilisateur) && dossier !== '—') ? 'refuse' : 'ok';
  await journaliser(req, { utilisateur: req.utilisateur.nom, role: req.utilisateur.role, action, dossier, resultat });
  res.json({ ok: true, resultat });
});

/** Lecture d'un dossier complet (journalisée). */
routesPro.get('/patientes/:id', exigerSoignant('Tentative d’ouverture du dossier'), async (req, res) => {
  const p = await un('SELECT * FROM patientes WHERE id = $1 AND etablissement_id = $2', [req.params.id, req.utilisateur.etablissement_id]);
  if (!p) return res.status(404).json({ erreur: 'Dossier introuvable.' });
  await journaliser(req, { utilisateur: req.utilisateur.nom, role: req.utilisateur.role, action: 'Consultation du dossier', dossier: p.id });
  res.json(f.patiente(p));
});

const texte = (v, max = 2000) => String(v ?? '').trim().slice(0, max);
const nombre = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const dateIso = (v) => (v ? String(v).slice(0, 10) : null);

routesPro.post('/patientes', exigerSoignant('Tentative de création de dossier'), async (req, res) => {
  const b = req.body || {};
  if (!texte(b.nom) || !nombre(b.age) || !texte(b.telephone)) return res.status(400).json({ erreur: 'Nom, âge et téléphone sont obligatoires.' });
  const n = (await un("SELECT count(*)::int AS n FROM patientes")).n + 1;
  let id = `P${String(n).padStart(3, '0')}`;
  while (await un('SELECT 1 FROM patientes WHERE id = $1', [id])) id = `P${String(Number(id.slice(1)) + 1).padStart(3, '0')}`;
  let code;
  do code = `MATERNA-DKR-${Math.floor(1000 + Math.random() * 9000)}`; while (await un('SELECT 1 FROM patientes WHERE code_liaison = $1', [code]));
  const r = await un(
    `INSERT INTO patientes (id, etablissement_id, nom, age, ddr, postnatal, telephone, adresse, profession, urgence_nom, urgence_lien, urgence_tel,
      code_liaison, groupe, gestite, parite, cesariennes, allergies, antecedents_med, antecedents_chir)
     VALUES ($1,$2,$3,$4,$5,false,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
    [id, req.utilisateur.etablissement_id, texte(b.nom, 120), nombre(b.age), dateIso(b.ddr), texte(b.telephone, 30), texte(b.adresse), texte(b.profession),
      texte(b.urgence?.nom), texte(b.urgence?.lien), texte(b.urgence?.tel, 30), code, texte(b.groupe) || 'À déterminer',
      nombre(b.gestite) ?? 1, nombre(b.parite) ?? 0, nombre(b.cesariennes) ?? 0,
      texte(b.allergies) || 'À renseigner', texte(b.antecedentsMed) || 'À renseigner', texte(b.antecedentsChir) || 'À renseigner']);
  await journaliser(req, { utilisateur: req.utilisateur.nom, role: req.utilisateur.role, action: 'Création du dossier', dossier: id });
  res.status(201).json(f.patiente(r));
});

routesPro.post('/consultations', exigerSoignant('Tentative de saisie de consultation'), async (req, res) => {
  const b = req.body || {};
  const p = await un('SELECT id FROM patientes WHERE id = $1 AND etablissement_id = $2', [b.patiente, req.utilisateur.etablissement_id]);
  if (!p || !texte(b.type) || !dateIso(b.date)) return res.status(400).json({ erreur: 'Patiente, date et type de consultation sont obligatoires.' });
  const ta = Array.isArray(b.ta) ? b.ta : [];
  const c = await transaction(async (cl) => {
    const id = `C${(await cl.query("SELECT nextval('seq_ids') AS n")).rows[0].n}`;
    const { rows } = await cl.query(
      `INSERT INTO consultations (id, patiente_id, date, type, par, ta_sys, ta_dia, poids, hu, bdcf, bandelette, notes, conduite, saisi_par)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [id, p.id, dateIso(b.date), texte(b.type, 80), req.utilisateur.nom, nombre(ta[0]), nombre(ta[1]), nombre(b.poids), nombre(b.hu), nombre(b.bdcf),
        texte(b.bandelette, 80) || null, texte(b.notes), texte(b.conduite), req.utilisateur.id]);
    // La patiente est prévenue dans son application
    await cl.query('INSERT INTO notifications (id, patiente_id, type, titre, texte) VALUES ($1,$2,$3,$4,$5)',
      [`N${(await cl.query("SELECT nextval('seq_ids') AS n")).rows[0].n}`, p.id, 'carnet', 'Consultation enregistrée',
        `Votre consultation (${texte(b.type, 80)}) a été enregistrée par ${req.utilisateur.nom}.`]);
    return rows[0];
  });
  await journaliser(req, { utilisateur: req.utilisateur.nom, role: req.utilisateur.role, action: `Saisie de consultation (${c.type})`, dossier: p.id });
  res.status(201).json(f.consultation(c));
});

routesPro.post('/rdv', exigerSoignant('Tentative de programmation de rendez-vous'), async (req, res) => {
  const b = req.body || {};
  const p = await un('SELECT id FROM patientes WHERE id = $1 AND etablissement_id = $2', [b.patiente, req.utilisateur.etablissement_id]);
  if (!p || !dateIso(b.date) || !/^\d{2}:\d{2}$/.test(String(b.heure || '')) || !texte(b.motif)) return res.status(400).json({ erreur: 'Patiente, date, heure et motif sont obligatoires.' });
  const id = await nouvelId('R');
  const r = await un(`INSERT INTO rendez_vous (id, patiente_id, date, heure, motif, statut, avec, lieu) VALUES ($1,$2,$3,$4,$5,'a-confirmer',$6,$7) RETURNING *`,
    [id, p.id, dateIso(b.date), b.heure, texte(b.motif, 200), texte(b.avec, 80) || req.utilisateur.nom, texte(b.lieu, 120) || 'Clinique Sutura']);
  await q('INSERT INTO notifications (id, patiente_id, type, titre, texte) VALUES ($1,$2,$3,$4,$5)',
    [await nouvelId('N'), p.id, 'rdv', 'Nouveau rendez-vous', `${r.motif}, le ${new Date(`${r.date}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${r.heure}.`]);
  await journaliser(req, { utilisateur: req.utilisateur.nom, role: req.utilisateur.role, action: 'Programmation d’un rendez-vous', dossier: p.id });
  res.status(201).json(f.rdv(r));
});

routesPro.post('/rdv/:id/confirmer', exigerPro, async (req, res) => {
  const r = await un(`UPDATE rendez_vous SET statut = 'confirme' WHERE id = $1 RETURNING *`, [req.params.id]);
  if (!r) return res.status(404).json({ erreur: 'Rendez-vous introuvable.' });
  await journaliser(req, { utilisateur: req.utilisateur.nom, role: req.utilisateur.role, action: 'Confirmation d’un rendez-vous', dossier: r.patiente_id });
  res.json(f.rdv(r));
});
