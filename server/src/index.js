// Serveur Materna Data : API REST + fichiers de l'interface React (dossier client/dist).
import './env.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { lireSession, exigerPro, ouvrirSession, journaliser } from './auth.js';
import { routesAuth } from './routes/auth.js';
import { routesPro } from './routes/pro.js';
import { routesPatiente } from './routes/patiente.js';
import { routesInscription } from './routes/inscription.js';
import { remplir } from './seed.js';
import { pool, un } from './db.js';
import { fournisseurActif } from './sms.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use(lireSession);
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'same-origin');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  next();
});

app.get('/api/sante', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, base: 'connectée', sms: fournisseurActif() }); }
  catch { res.status(503).json({ ok: false, base: 'indisponible' }); }
});
app.use('/api/auth', routesAuth);
app.use('/api/inscription', routesInscription);
app.use('/api/moi', routesPatiente);
app.use('/api', routesPro);

// ---- Fonctions réservées à la démonstration (désactivables avec DEMO_MODE=false) ----
const demo = process.env.DEMO_MODE !== 'false';
app.post('/api/demo/reinitialiser', exigerPro, async (_req, res) => {
  if (!demo) return res.status(403).json({ erreur: 'Mode démonstration désactivé.' });
  await remplir();
  res.json({ ok: true });
});
/** Change de compte professionnel sans ressaisir le mot de passe (démonstration devant le jury uniquement). */
app.post('/api/demo/profil', exigerPro, async (req, res) => {
  if (!demo) return res.status(403).json({ erreur: 'Mode démonstration désactivé.' });
  const u = await un('SELECT * FROM utilisateurs WHERE id = $1', [req.body?.id]);
  if (!u) return res.status(404).json({ erreur: 'Compte introuvable.' });
  if (!u.actif) {
    await journaliser(req, { utilisateur: u.nom, role: u.role, action: 'Tentative de connexion d’un compte non accrédité', resultat: 'refuse' });
    return res.status(403).json({ erreur: 'Compte non accrédité : connexion refusée et enregistrée.' });
  }
  ouvrirSession(res, { t: 'pro', id: u.id });
  await journaliser(req, { utilisateur: u.nom, role: u.role, action: 'Connexion au logiciel professionnel' });
  res.json({ ok: true });
});
/** Simule une tentative de lecture par un compte externe non accrédité (le refus est journalisé). */
app.post('/api/demo/tentative-externe', exigerPro, async (req, res) => {
  if (!demo) return res.status(403).json({ erreur: 'Mode démonstration désactivé.' });
  await journaliser(req, { utilisateur: 'Compte externe', role: 'externe', action: 'Tentative de lecture d’un dossier', dossier: String(req.body?.dossier || 'P003').slice(0, 20), resultat: 'refuse' });
  res.json({ ok: true });
});

app.use('/api', (_req, res) => res.status(404).json({ erreur: 'Route inconnue.' }));

// ---- Interface React compilée ----
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ erreur: 'Erreur interne du serveur.' });
});

// Au premier démarrage sur une base vide, crée les tables et charge les données fictives.
async function preparerBase() {
  const existe = await un(`SELECT to_regclass('public.patientes') AS t`);
  if (!existe?.t) {
    const { readFileSync } = await import('node:fs');
    const schema = readFileSync(fileURLToPath(new URL('../sql/schema.sql', import.meta.url)), 'utf8');
    await pool.query(schema);
    await remplir();
    console.log('Base initialisée avec les données fictives.');
  }
}

const port = Number(process.env.PORT || 3000);
preparerBase()
  .then(() => app.listen(port, () => console.log(`Materna Data en ligne sur le port ${port} (SMS : ${fournisseurActif()})`)))
  .catch((e) => { console.error('Impossible de préparer la base :', e.message); process.exit(1); });

export default app;
