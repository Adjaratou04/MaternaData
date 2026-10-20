// Données FICTIVES de l'étape 1 (aperçu du design).
// Elles seront remplacées à l'étape 2 par le jeu de données complet et relié.
// Les dates sont calculées par rapport à la date du jour pour rester cohérentes.

export const JOUR_MS = 86_400_000;

export function aujourdhui(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
export function ajouterJours(d: Date, n: number): Date {
  return new Date(d.getTime() + n * JOUR_MS);
}
export function joursEntre(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / JOUR_MS);
}

/** Calcul conventionnel : DPA = DDR + 280 jours (cycle régulier de 28 jours supposé). */
export function suiviGrossesse(ddr: Date, ref: Date = aujourdhui()) {
  const jours = joursEntre(ddr, ref);
  const sa = Math.floor(jours / 7); // semaines d'aménorrhée révolues
  const j = jours % 7;
  const sg = sa - 2; // semaines de grossesse ≈ SA − 2
  const dpa = ajouterJours(ddr, 280); // règle de Naegele : date prévue = DDR + 280 jours = 40 SA + 0 j
  const trimestre: 1 | 2 | 3 = sa < 15 ? 1 : sa < 29 ? 2 : 3;
  return { sa, j, sg, dpa, trimestre, progression: Math.min(jours / 280, 1) };
}

const fmtJour = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
export const formatJour = (d: Date) => fmtJour.format(d);
export const formatDate = (d: Date) => fmtDate.format(d);

const t = aujourdhui();

export const etablissement = { id: 'E01', nom: 'Clinique Sutura', ville: 'Dakar', fictif: true };

export const professionnelConnecte = {
  id: 'U01', nom: 'Dr Aminata Diop', nomCourt: 'Dr Diop', role: 'Gynécologue-obstétricienne', initiales: 'AD',
};

export type Statut = 'regulier' | 'incomplet' | 'verifier' | 'terme' | 'postnatal';

export const patientes = [
  { id: 'P001', nom: 'Mariama Sow', age: 29, ddr: ajouterJours(t, -171), statut: 'regulier' as Statut },
  { id: 'P002', nom: 'Khady Faye', age: 24, ddr: null, statut: 'incomplet' as Statut },
  { id: 'P003', nom: 'Aïssatou Ba', age: 33, ddr: ajouterJours(t, -219), statut: 'verifier' as Statut },
  { id: 'P004', nom: 'Coumba Ndiaye', age: 31, ddr: ajouterJours(t, -264), statut: 'terme' as Statut },
  { id: 'P005', nom: 'Seynabou Guèye', age: 27, ddr: null, statut: 'postnatal' as Statut },
];

export const rendezVous = [
  { id: 'R01', patiente: 'P002', date: t, heure: '09:30', motif: 'Première consultation prénatale', statut: 'confirme' },
  { id: 'R02', patiente: 'P004', date: t, heure: '11:00', motif: 'Consultation prénatale (3e trimestre)', statut: 'confirme' },
  { id: 'R03', patiente: 'P005', date: t, heure: '15:00', motif: 'Consultation postnatale et vaccination de l’enfant', statut: 'a-confirmer' },
  { id: 'R04', patiente: 'P001', date: ajouterJours(t, 10), heure: '10:00', motif: 'Consultation de suivi (résultat de la glycémie)', statut: 'confirme' },
  { id: 'R05', patiente: 'P003', date: ajouterJours(t, 2), heure: '08:30', motif: 'Contrôle de la tension artérielle', statut: 'confirme' },
];

export const consultations = [
  { id: 'C01', patiente: 'P001', date: ajouterJours(t, -3), type: 'Consultation prénatale (CPN 2)', par: 'Awa Sarr' },
  { id: 'C02', patiente: 'P003', date: ajouterJours(t, -2), type: 'Consultation prénatale', par: 'Dr Fatou Mbaye' },
  { id: 'C03', patiente: 'P004', date: ajouterJours(t, -5), type: 'Consultation prénatale', par: 'Awa Sarr' },
  { id: 'C04', patiente: 'P005', date: ajouterJours(t, -6), type: 'Consultation postnatale', par: 'Dr Fatou Mbaye' },
  { id: 'C05', patiente: 'P001', date: ajouterJours(t, -1), type: 'Résultats d’analyses enregistrés', par: 'Awa Sarr' },
  { id: 'C06', patiente: 'P004', date: ajouterJours(t, -3), type: 'Échographie enregistrée', par: 'Dr Fatou Mbaye' },
];

export const nomPatiente = (id: string) => patientes.find((p) => p.id === id)?.nom ?? id;
