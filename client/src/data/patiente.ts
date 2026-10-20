// Données de l'application patiente, remplies depuis l'API (GET /api/moi/carnet) après la connexion.
// Les noms historiques (dossierP001, rdvP001…) sont conservés pour ne pas modifier les écrans :
// ils contiennent désormais le carnet de la patiente connectée.
import { aujourdhui, ajouterJours, type Statut } from './apercu';
import { versDate } from './api';

const fmt = new Intl.DateTimeFormat('fr-FR');
const fmtLong = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Patiente connectée (identité minimale utilisée par les écrans). */
export const moi = { id: '', nom: '', age: 0, ddr: null as Date | null, statut: 'regulier' as Statut, initiales: '', etablissement: 'Clinique Sutura' };

export const dossierP001 = {
  infos: [] as { libelle: string; valeur: string }[],
  antecedents: [] as { titre: string; detail: string }[],
  consultations: [] as { date: Date; type: string; par: string; notes: string }[],
  mesures: [] as { libelle: string; valeur: string; date: Date }[],
  examens: [] as { nom: string; statut: 'resultat' | 'prescrit' | 'a-planifier'; date: Date; resultat: string; nouveau?: boolean }[],
  accouchement: { maternite: '', projet: '', statut: 'Informations complétées après la naissance' },
  historique: [] as { date: Date; texte: string }[],
  dernierAcces: '' as string,
  consentement: null as null | { soins: boolean; recherche: boolean; donne_le: string },
};

export type StatutRdv = 'confirme' | 'a-confirmer' | 'honore' | 'annule';
export interface RdvPatiente { id: string; date: Date; heure: string; motif: string; lieu: string; avec: string; statut: StatutRdv; rappel?: string; preparer?: string }
export const rdvP001: RdvPatiente[] = [];

export type TypeNotif = 'rdv' | 'examen' | 'carnet' | 'important';
export interface Notification { id: string; type: TypeNotif; titre: string; texte: string; date: Date; lue: boolean }
export const notificationsP001: Notification[] = [];

const remplacer = <T>(tab: T[], nouveaux: T[]) => { tab.splice(0, tab.length, ...nouveaux); };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Brut = any;

/** Remplit les données de l'application à partir du carnet renvoyé par le serveur. */
export function hydraterPatiente(c: Brut) {
  const p = c.patiente;
  Object.assign(moi, {
    id: p.id, nom: p.nom, age: p.age, ddr: versDate(p.ddr),
    initiales: p.nom.split(/\s+/).map((m: string) => m[0]).slice(0, 2).join('').toUpperCase(),
    etablissement: c.etablissement?.nom ?? 'Clinique Sutura',
  });
  const grossesse = p.gestite > 1 ? `${p.gestite}e grossesse, ${p.parite} enfant${p.parite > 1 ? 's' : ''}` : '1re grossesse';
  const referente = [...c.consultations].reverse().find((x: Brut) => !/^Dr /.test(x.par))?.par;
  dossierP001.infos = [
    { libelle: 'Groupe sanguin', valeur: p.groupe },
    { libelle: 'Âge', valeur: `${p.age} ans` },
    { libelle: 'Grossesse', valeur: grossesse },
    { libelle: 'Établissement de suivi', valeur: `${moi.etablissement} (fictive)` },
    ...(referente ? [{ libelle: 'Sage-femme référente', valeur: `${referente} (fictive)` }] : []),
  ];
  dossierP001.antecedents = [
    { titre: p.antecedentsMed, detail: 'Antécédents médicaux renseignés par la clinique' },
    { titre: p.allergies === 'Aucune connue' ? 'Aucune allergie connue' : `Allergies : ${p.allergies}`, detail: 'Renseigné par votre soignant' },
  ];
  const cs = c.consultations.map((x: Brut) => ({ ...x, date: versDate(x.date)! })).sort((a: Brut, b: Brut) => b.date - a.date);
  dossierP001.consultations = cs.map((x: Brut) => ({ date: x.date, type: x.type, par: x.par, notes: `${x.notes} ${x.conduite}`.trim() }));
  const d = cs[0];
  dossierP001.mesures = d ? [
    ...(d.poids ? [{ libelle: 'Poids', valeur: `${d.poids} kg`, date: d.date }] : []),
    ...(d.ta ? [{ libelle: 'Tension artérielle', valeur: `${Math.round(d.ta[0] / 10)}/${Math.round(d.ta[1] / 10)}`, date: d.date }] : []),
    ...(d.hu ? [{ libelle: 'Hauteur utérine', valeur: `${d.hu} cm`, date: d.date }] : []),
  ] : [];
  const hier = ajouterJours(aujourdhui(), -2);
  dossierP001.examens = c.examens.map((x: Brut) => {
    const date = versDate(x.date)!;
    return {
      nom: x.titre, statut: x.statut, date,
      resultat: x.statut === 'resultat' ? (x.type === 'Échographie' ? 'Compte rendu disponible' : 'Résultats disponibles') : x.resume,
      nouveau: x.statut === 'resultat' && date >= hier,
    };
  }).sort((a: Brut, b: Brut) => b.date - a.date);
  dossierP001.accouchement = { maternite: p.maternite ?? moi.etablissement, projet: p.projet ?? 'À définir avec votre soignant', statut: 'Informations complétées après la naissance' };
  const acces = c.journal.filter((j: Brut) => j.role !== 'patiente' && j.resultat === 'ok');
  dossierP001.historique = c.journal.slice(0, 8).map((j: Brut) => ({ date: new Date(j.date), texte: `${j.action} (${j.utilisateur})` }));
  dossierP001.dernierAcces = acces[0] ? `${acces[0].utilisateur}, le ${fmt.format(new Date(acces[0].date))}` : 'Aucun accès d’un soignant';
  dossierP001.consentement = c.consentement;
  remplacer(rdvP001, c.rdv.map((r: Brut) => ({ ...r, date: versDate(r.date)! })));
  remplacer(notificationsP001, c.notifications.map((n: Brut) => ({ ...n, date: new Date(n.date) })));
}

/* ------------------------------------------------------------------ */
/* Carnet de l'enfant. Côté soignant : rempli depuis la base (enfant de P005).
   Côté patiente : sert d'« exemple de carnet » tant qu'aucun enfant n'est né.  */
/* ------------------------------------------------------------------ */
const t = aujourdhui();
const naissance = ajouterJours(t, -40);
export const enfantP005 = {
  prenom: 'Awa',
  nom: 'Guèye',
  sexe: 'F' as 'F' | 'M',
  mere: 'Seynabou Guèye (P005)',
  mereId: 'P005',
  naissance,
  naissanceInfos: [
    { libelle: 'Date de naissance', valeur: fmtLong.format(naissance) },
    { libelle: 'Terme', valeur: '39 SA' },
    { libelle: 'Poids de naissance', valeur: '3,2 kg' },
    { libelle: 'Taille de naissance', valeur: '49 cm' },
    { libelle: 'Lieu', valeur: 'Clinique Sutura (fictive)' },
  ],
  croissance: [
    { jours: 0, poids: 3.2, taille: 49 },
    { jours: 7, poids: 3.1, taille: 49.5 },
    { jours: 21, poids: 3.7, taille: 51.5 },
    { jours: 35, poids: 4.2, taille: 53.5 },
  ],
  vaccins: [
    { age: 'À la naissance', vaccins: 'BCG, polio oral (VPO 0), hépatite B', date: naissance, statut: 'fait' as 'fait' | 'prochain' | 'a-venir' },
    { age: '6 semaines', vaccins: 'Pentavalent 1, polio 1, pneumocoque 1, rotavirus 1', date: ajouterJours(naissance, 42), statut: 'prochain' as 'fait' | 'prochain' | 'a-venir' },
    { age: '10 semaines', vaccins: 'Pentavalent 2, polio 2, pneumocoque 2, rotavirus 2', date: ajouterJours(naissance, 70), statut: 'a-venir' as 'fait' | 'prochain' | 'a-venir' },
    { age: '14 semaines', vaccins: 'Pentavalent 3, polio 3, pneumocoque 3, polio injectable', date: ajouterJours(naissance, 98), statut: 'a-venir' as 'fait' | 'prochain' | 'a-venir' },
  ],
  consultations: [
    { date: ajouterJours(naissance, 35), type: 'Consultation postnatale du nourrisson', par: 'Dr Fatou Mbaye', notes: 'Bonne prise de poids, allaitement exclusif.' },
    { date: ajouterJours(naissance, 7), type: 'Visite du 7e jour', par: 'Awa Sarr', notes: 'Cordon en bonne voie de cicatrisation.' },
  ],
};

/** Remplit le carnet de l'enfant affiché dans l'espace professionnel à partir de la base. */
export function hydraterEnfantPro(e: Brut) {
  if (!e) return;
  const n = versDate(e.naissance)!;
  Object.assign(enfantP005, {
    prenom: e.prenom, nom: e.nom, sexe: e.sexe, mereId: e.mere, naissance: n,
    naissanceInfos: [
      { libelle: 'Date de naissance', valeur: fmtLong.format(n) },
      { libelle: 'Terme', valeur: e.terme },
      { libelle: 'Poids de naissance', valeur: e.poidsNaissance },
      { libelle: 'Taille de naissance', valeur: e.tailleNaissance },
      { libelle: 'Lieu', valeur: e.lieu },
    ],
    croissance: e.croissance,
    vaccins: e.vaccins.map((v: Brut) => ({ ...v, date: versDate(v.date)! })),
    consultations: e.consultations.map((c: Brut) => ({ ...c, date: versDate(c.date)! })),
  });
}
