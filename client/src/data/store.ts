// État partagé de l'interface, alimenté par l'API Node.js / PostgreSQL.
// Les écrans lisent cet état avec useStore() ; chaque action appelle l'API puis recharge les données.
// Toutes les données de démonstration sont FICTIVES.
import { useSyncExternalStore } from 'react';
import { aujourdhui, joursEntre, suiviGrossesse, type Statut } from './apercu';
import { api, versDate, versIso } from './api';
import { hydraterEnfantPro } from './patiente';

export type Role = 'medecin' | 'sagefemme' | 'admin' | 'externe' | 'patiente';
export type Utilisateur = { id: string; nom: string; role: Role; fonction: string; initiales: string; email: string; actif: boolean };
export type Patiente = {
  id: string; nom: string; age: number; ddr: Date | null; postnatal?: boolean; statut: Statut;
  telephone: string; adresse: string; profession: string; urgence: { nom: string; lien: string; tel: string };
  code: string; groupe: string; gestite: number; parite: number; cesariennes: number;
  allergies: string; antecedentsMed: string; antecedentsChir: string; masque?: boolean;
  maternite?: string; projet?: string;
};
export type Consultation = {
  id: string; patiente: string; date: Date; type: string; par: string;
  ta?: [number, number]; poids?: number; hu?: number; bdcf?: number; bandelette?: string;
  notes: string; conduite: string;
};
export type Examen = { id: string; patiente: string; date: Date; type: 'Échographie' | 'Biologie'; titre: string; resume: string; valeurs: [string, string][]; statut?: string };
export type Rdv = { id: string; patiente: string; date: Date; heure: string; motif: string; statut: 'confirme' | 'a-confirmer' | 'honore' | 'annule'; avec: string; lieu: string; rappel?: string; preparer?: string };
export type Entree = { id: string; date: Date; utilisateur: string; role: Role; action: string; dossier: string; resultat: 'ok' | 'refuse' };

export const roles: Record<Role, string> = { medecin: 'Médecin', sagefemme: 'Sage-femme', admin: 'Administration', externe: 'Non accrédité', patiente: 'Patiente' };

export type Etat = {
  patientes: Patiente[]; consultations: Consultation[]; examens: Examen[]; rdv: Rdv[]; journal: Entree[];
  utilisateurs: Utilisateur[]; profil: string; charge: boolean; demo: boolean;
};
const vide = (): Etat => ({ patientes: [], consultations: [], examens: [], rdv: [], journal: [], utilisateurs: [], profil: '', charge: false, demo: true });

let etat: Etat = vide();
const abonnes = new Set<() => void>();
const publier = (nouveau: Etat) => { etat = nouveau; abonnes.forEach((f) => f()); };
export const useStore = () => useSyncExternalStore((f) => { abonnes.add(f); return () => abonnes.delete(f); }, () => etat);
export const lireEtat = () => etat;

const utilisateurInconnu: Utilisateur = { id: '', nom: '—', role: 'externe', fonction: '', initiales: '—', email: '', actif: false };
export const profilActif = (e: Etat = etat) => e.utilisateurs.find((u) => u.id === e.profil) ?? utilisateurInconnu;
/** L'administration et les comptes non accrédités n'ont pas accès au contenu des dossiers médicaux (contrôlé aussi côté serveur). */
export const peutLireDossier = (u: Utilisateur) => u.role === 'medecin' || u.role === 'sagefemme';

/* ---------------- Conversion des réponses de l'API ---------------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Brut = any;
export const convPatiente = (p: Brut): Patiente => ({ ...p, ddr: versDate(p.ddr), statut: 'regulier' });
export const convConsultation = (c: Brut): Consultation => ({ ...c, date: versDate(c.date)! });
export const convExamen = (x: Brut): Examen => ({ ...x, date: versDate(x.date)! });
export const convRdv = (r: Brut): Rdv => ({ ...r, date: versDate(r.date)! });
export const convEntree = (j: Brut): Entree => ({ ...j, date: new Date(j.date) });

/** Remplit l'état avec des données déjà converties et recalcule le statut de chaque dossier. */
export function remplirEtat(partiel: Partial<Etat>) {
  const suivant = { ...etat, ...partiel, charge: true };
  suivant.patientes = suivant.patientes.map((p) => (p.masque ? { ...p, statut: 'incomplet' as Statut } : { ...p, statut: statutCalcule(p, suivant.consultations) }));
  publier(suivant);
}

/** Chargement de l'espace professionnel (GET /api/etat). */
export async function charger() {
  const d = await api.get<Brut>('/etat');
  hydraterEnfantPro(d.enfants?.[0]);
  remplirEtat({
    patientes: d.patientes.map(convPatiente), consultations: d.consultations.map(convConsultation), examens: d.examens.map(convExamen),
    rdv: d.rdv.map(convRdv), journal: d.journal.map(convEntree), utilisateurs: d.utilisateurs, profil: d.profil, demo: d.demo,
  });
}
export const viderEtat = () => publier(vide());

const recharger = () => charger().catch(() => {});

export const actions = {
  /** Trace une action dans le journal (l'identité est celle de la session, vérifiée par le serveur). */
  journaliser(action: string, dossier: string, resultat: 'ok' | 'refuse' = 'ok') {
    api.post('/journal', { action, dossier, resultat }).then(recharger).catch(() => {});
  },
  /** Action de la patiente dans l'application mobile. */
  journaliserPatiente(_nom: string, action: string) {
    api.post('/moi/journal', { action }).catch(() => {});
  },
  /** Démonstration : change de compte professionnel (le serveur ouvre une nouvelle session). */
  async changerProfil(profil: string) {
    await api.post('/demo/profil', { id: profil });
    await charger();
  },
  async tentativeExterne(dossier: string) {
    await api.post('/demo/tentative-externe', { dossier });
    await charger();
  },
  async reinitialiser() {
    await api.post('/demo/reinitialiser');
    await charger();
  },
  async ajouterPatiente(p: Omit<Patiente, 'id' | 'code' | 'statut'>): Promise<Patiente> {
    const cree = await api.post<Brut>('/patientes', { ...p, ddr: p.ddr ? versIso(p.ddr) : null });
    await charger();
    return etat.patientes.find((x) => x.id === cree.id) ?? convPatiente(cree);
  },
  async ajouterConsultation(c: Omit<Consultation, 'id'>) {
    await api.post('/consultations', { ...c, date: versIso(c.date) });
    await charger();
  },
  async ajouterRdv(r: Omit<Rdv, 'id'>) {
    await api.post('/rdv', { ...r, date: versIso(r.date) });
    await charger();
  },
  async confirmerRdv(rid: string) {
    await api.post(`/rdv/${rid}/confirmer`);
    await charger();
  },
};

/* ---------- Règles de vigilance (calcul réel, à partir des dernières valeurs saisies) ---------- */
export type Point = { niveau: 'critique' | 'alerte' | 'info'; texte: string };
export const consultationsDe = (pid: string, cs: Consultation[] = etat.consultations) => cs.filter((c) => c.patiente === pid).sort((a, b) => a.date.getTime() - b.date.getTime());
export const derniere = (pid: string, cs?: Consultation[]) => consultationsDe(pid, cs).slice(-1)[0];

export function pointsAttention(p: Patiente, cs: Consultation[] = etat.consultations): Point[] {
  const pts: Point[] = [];
  const d = derniere(p.id, cs);
  if (!p.ddr && !p.postnatal) pts.push({ niveau: 'alerte', texte: 'Date des dernières règles à renseigner' });
  if (d?.ta) {
    const [s, di] = d.ta;
    if (s >= 140 || di >= 90) pts.push({ niveau: 'critique', texte: `Tension élevée ${s}/${di} mmHg` });
    else if (s >= 135 || di >= 85) pts.push({ niveau: 'alerte', texte: `Tension limite ${s}/${di} mmHg` });
  }
  if (d?.bandelette && /prot/i.test(d.bandelette)) pts.push({ niveau: 'alerte', texte: 'Protéinurie à surveiller' });
  if (d?.ta && d.bandelette && /prot/i.test(d.bandelette) && (d.ta[0] >= 135 || d.ta[1] >= 85)) pts.push({ niveau: 'critique', texte: 'Surveillance prééclampsie' });
  if (p.cesariennes > 0 && !p.postnatal) pts.push({ niveau: 'info', texte: 'Utérus cicatriciel (césarienne antérieure)' });
  if (p.ddr) { const g = suiviGrossesse(p.ddr); const r = joursEntre(aujourdhui(), g.dpa); if (r <= 30) pts.push({ niveau: 'info', texte: `Terme proche (J-${r})` }); }
  return pts;
}

export function statutCalcule(p: Patiente, cs: Consultation[] = etat.consultations): Statut {
  if (p.postnatal) return 'postnatal';
  if (!p.ddr) return 'incomplet';
  const pts = pointsAttention(p, cs);
  if (pts.some((x) => x.niveau === 'critique' || /Tension|Protéinurie/.test(x.texte))) return 'verifier';
  if (joursEntre(aujourdhui(), suiviGrossesse(p.ddr).dpa) <= 30) return 'terme';
  return 'regulier';
}

/** Âge gestationnel à une date donnée, recalculé depuis la DDR. */
export const saA = (p: Patiente, d: Date) => (p.ddr ? suiviGrossesse(p.ddr, d) : null);
