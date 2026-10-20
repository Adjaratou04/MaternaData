// Données de démonstration ENTIÈREMENT FICTIVES (patientes, soignants, clinique).
// Les dates sont calculées par rapport au jour du chargement pour que les grossesses restent cohérentes.
// Usage direct : npm run db:seed   (vide les tables puis recharge les données)
import './env.js';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

export const MOT_DE_PASSE_DEMO = 'Demo2026!';

const jour = (n) => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const instant = (n, h, m) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(h, m, 0, 0);
  return d.toISOString();
};

export async function remplir(client = pool) {
  const hash = await bcrypt.hash(MOT_DE_PASSE_DEMO, 10);
  // Numéro réel facultatif pour tester le vrai SMS avec le dossier de démonstration de Mariama Sow
  const telMariama = process.env.TELEPHONE_DEMO || '+221 77 000 00 01';

  await client.query(`TRUNCATE journal_acces, notifications, consentements, verifications_sms, comptes_patientes,
    consultations_enfant, vaccins, mesures_enfant, enfants, rendez_vous, examens, consultations, patientes,
    utilisateurs, etablissements RESTART IDENTITY CASCADE`);
  await client.query("SELECT setval('seq_ids', 100)");

  await client.query(`INSERT INTO etablissements (id, nom, ville) VALUES ('E01', 'Clinique Sutura', 'Dakar')`);

  const utilisateurs = [
    ['U01', 'Dr Aminata Diop', 'medecin', 'Gynécologue-obstétricienne', 'AD', 'a.diop@sutura.exemple.sn', true],
    ['U02', 'Awa Sarr', 'sagefemme', 'Sage-femme', 'AS', 'a.sarr@sutura.exemple.sn', true],
    ['U03', 'Dr Fatou Mbaye', 'medecin', 'Gynécologue', 'FM', 'f.mbaye@sutura.exemple.sn', true],
    ['U04', 'Cheikh Ndiaye', 'admin', 'Administrateur de l’établissement', 'CN', 'c.ndiaye@sutura.exemple.sn', true],
    ['U05', 'Compte externe', 'externe', 'Non accrédité auprès de la clinique', 'EX', 'externe@exemple.sn', false],
  ];
  for (const u of utilisateurs) {
    await client.query(
      `INSERT INTO utilisateurs (id, etablissement_id, nom, role, fonction, initiales, email, actif, mot_de_passe_hash)
       VALUES ($1, 'E01', $2, $3, $4, $5, $6, $7, $8)`, [...u, hash]);
  }

  const patientes = [
    { id: 'P001', nom: 'Mariama Sow', age: 29, ddr: jour(-171), tel: telMariama, adresse: 'Sicap Liberté 6, Dakar', profession: 'Enseignante', urgence: ['Ibrahima Sow', 'Époux', '+221 77 000 00 11'], code: 'MATERNA-DKR-4821', groupe: 'O+', g: 2, p: 1, c: 0, allergies: 'Aucune connue', med: 'Accouchement par voie basse en 2022, sans complication', chir: 'Aucun', projet: 'Voie basse envisagée, à confirmer avec votre soignant' },
    { id: 'P002', nom: 'Khady Faye', age: 24, ddr: null, tel: '+221 77 000 00 02', adresse: 'Parcelles Assainies, Dakar', profession: 'Couturière', urgence: ['Ndèye Faye', 'Mère', '+221 77 000 00 12'], code: 'MATERNA-DKR-5307', groupe: 'À déterminer', g: 1, p: 0, c: 0, allergies: 'À renseigner', med: 'À renseigner', chir: 'À renseigner' },
    { id: 'P003', nom: 'Aïssatou Ba', age: 33, ddr: jour(-219), tel: '+221 77 000 00 03', adresse: 'Ouakam, Dakar', profession: 'Comptable', urgence: ['Abdou Ba', 'Époux', '+221 77 000 00 13'], code: 'MATERNA-DKR-9042', groupe: 'A+', g: 2, p: 1, c: 0, allergies: 'Pénicilline (réaction cutanée)', med: 'Aucun antécédent chronique', chir: 'Aucun' },
    { id: 'P004', nom: 'Coumba Ndiaye', age: 31, ddr: jour(-264), tel: '+221 77 000 00 04', adresse: 'Mermoz, Dakar', profession: 'Commerçante', urgence: ['Moustapha Ndiaye', 'Époux', '+221 77 000 00 14'], code: 'MATERNA-DKR-2265', groupe: 'B+', g: 2, p: 1, c: 1, allergies: 'Aucune connue', med: 'Aucun antécédent chronique', chir: 'Césarienne en 2023' },
    { id: 'P005', nom: 'Seynabou Guèye', age: 27, ddr: null, postnatal: true, tel: '+221 77 000 00 05', adresse: 'Grand Yoff, Dakar', profession: 'Infirmière', urgence: ['Pape Guèye', 'Époux', '+221 77 000 00 15'], code: 'MATERNA-DKR-7718', groupe: 'O−', g: 1, p: 1, c: 0, allergies: 'Aucune connue', med: 'Aucun', chir: 'Aucun' },
  ];
  for (const p of patientes) {
    await client.query(
      `INSERT INTO patientes (id, etablissement_id, nom, age, ddr, postnatal, telephone, adresse, profession,
        urgence_nom, urgence_lien, urgence_tel, code_liaison, groupe, gestite, parite, cesariennes,
        allergies, antecedents_med, antecedents_chir, projet_naissance)
       VALUES ($1,'E01',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [p.id, p.nom, p.age, p.ddr, !!p.postnatal, p.tel, p.adresse, p.profession, ...p.urgence, p.code, p.groupe,
        p.g, p.p, p.c, p.allergies, p.med, p.chir, p.projet ?? 'À définir avec votre soignant']);
  }

  const consultations = [
    ['C01', 'P001', -110, 'CPN 1', 'Awa Sarr', 110, 70, 63, null, null, null, 'Ouverture du dossier. Grossesse confirmée.', 'Bilan prénatal prescrit. Fer et acide folique.'],
    ['C02', 'P001', -55, 'Consultation de suivi', 'Dr Fatou Mbaye', 105, 65, 65, null, 150, 'Négative', 'Bon état général. Consultation intermédiaire entre la CPN 1 et la CPN 2.', 'Échographie morphologique prescrite.'],
    ['C03', 'P001', -3, 'CPN 2', 'Awa Sarr', 110, 70, 68, 23, 146, 'Négative', 'Mouvements du bébé ressentis.', 'Poursuivre fer et acide folique. Glycémie à jeun à programmer.'],
    ['C04', 'P003', -170, 'CPN 1', 'Dr Fatou Mbaye', 120, 75, 70, null, null, null, 'Deuxième grossesse, premier accouchement sans complication.', 'Bilan prénatal prescrit.'],
    ['C05', 'P003', -50, 'CPN 2', 'Awa Sarr', 125, 80, 72, null, 148, 'Négative', 'RAS.', 'Échographie du 2e trimestre prescrite.'],
    ['C06', 'P003', -2, 'CPN 3', 'Dr Fatou Mbaye', 138, 89, 76, 29, 142, 'Traces de protéines', 'Tension à la limite, traces de protéines à la bandelette. Pas de céphalées ni de troubles visuels rapportés.', 'Contrôle tensionnel dans 48 heures. Consulter immédiatement en cas de maux de tête, troubles visuels, douleur sous les côtes ou gonflement brutal.'],
    ['C07', 'P004', -200, 'CPN 1', 'Awa Sarr', 115, 75, 66, null, null, null, 'Antécédent de césarienne (2023).', 'Bilan prénatal prescrit.'],
    ['C08', 'P004', -95, 'CPN 2', 'Dr Aminata Diop', 118, 76, 69, null, 152, 'Négative', 'Croissance normale.', 'Échographie morphologique prescrite.'],
    ['C09', 'P004', -38, 'CPN 3', 'Awa Sarr', 120, 78, 72, 26, 144, 'Négative', 'RAS.', 'Échographie du 3e trimestre prescrite.'],
    ['C10', 'P004', -5, 'CPN 4', 'Dr Aminata Diop', 120, 80, 74, 33, 140, 'Négative', 'Présentation céphalique.', 'Consultation du terme : discuter la voie d’accouchement (utérus cicatriciel).'],
    ['C11', 'P005', -6, 'Consultation postnatale', 'Dr Fatou Mbaye', 115, 70, 62, null, null, null, 'Bonne récupération, allaitement exclusif.', 'Vaccination de l’enfant à 6 semaines.'],
  ];
  for (const c of consultations) {
    const [id, pid, n, type, par, s, d, poids, hu, bdcf, band, notes, conduite] = c;
    await client.query(
      `INSERT INTO consultations (id, patiente_id, date, type, par, ta_sys, ta_dia, poids, hu, bdcf, bandelette, notes, conduite)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [id, pid, jour(n), type, par, s, d, poids, hu, bdcf, band, notes, conduite]);
  }

  const examens = [
    ['E01', 'P001', -105, 'Biologie', 'Bilan prénatal initial', 'Pas d’anémie, sérologies négatives, groupe sanguin O+.', [['Hémoglobine', '11,8 g/dL'], ['Groupe sanguin', 'O+'], ['Sérologie VIH', 'Négative'], ['Syphilis (TPHA-VDRL)', 'Négative'], ['Ag HBs', 'Négatif']], 'resultat'],
    ['E02', 'P001', -30, 'Échographie', 'Échographie morphologique', 'Morphologie fœtale normale, placenta normalement inséré, liquide amniotique normal.', [['Biométrie', 'Conforme au terme'], ['Placenta', 'Antérieur, non recouvrant'], ['Liquide amniotique', 'Normal']], 'resultat'],
    ['E03', 'P001', -1, 'Biologie', 'Numération formule sanguine', 'Hémoglobine dans les normes.', [['Hémoglobine', '11,4 g/dL'], ['Plaquettes', '238 000 /mm³']], 'resultat'],
    ['E06', 'P001', 6, 'Biologie', 'Glycémie à jeun', 'À réaliser avant le prochain rendez-vous', [], 'prescrit'],
    ['E07', 'P001', 50, 'Échographie', 'Échographie du 3e trimestre', 'À programmer avec votre soignant', [], 'a-planifier'],
    ['E04', 'P003', -60, 'Échographie', 'Échographie du 2e trimestre', 'Morphologie normale, croissance harmonieuse.', [['Biométrie', 'Conforme au terme'], ['Liquide amniotique', 'Normal']], 'resultat'],
    ['E05', 'P004', -3, 'Échographie', 'Échographie du 3e trimestre', 'Présentation céphalique, croissance normale, liquide normal.', [['Présentation', 'Céphalique'], ['Placenta', 'Fundique'], ['Liquide amniotique', 'Normal']], 'resultat'],
  ];
  for (const [id, pid, n, type, titre, resume, valeurs, statut] of examens) {
    await client.query(`INSERT INTO examens (id, patiente_id, date, type, titre, resume, valeurs, statut) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, pid, jour(n), type, titre, resume, JSON.stringify(valeurs), statut]);
  }

  const rdv = [
    ['R01', 'P002', 0, '09:30', 'Première consultation prénatale', 'confirme', 'Awa Sarr', 'Cabinet de maïeutique', null, null],
    ['R02', 'P004', 0, '11:00', 'Consultation du terme', 'confirme', 'Dr Aminata Diop', 'Consultation obstétrique', null, null],
    ['R03', 'P005', 0, '15:00', 'Consultation postnatale et vaccination de l’enfant', 'a-confirmer', 'Dr Fatou Mbaye', 'Consultation pédiatrique', null, null],
    ['R05', 'P003', 2, '08:30', 'Contrôle de la tension artérielle', 'confirme', 'Dr Aminata Diop', 'Consultation obstétrique', null, null],
    ['R06', 'P001', 6, '08:00', 'Glycémie à jeun', 'a-confirmer', 'Laboratoire', 'Laboratoire de la clinique', 'Veille au soir', 'Venir à jeun depuis la veille au soir.'],
    ['R04', 'P001', 10, '10:00', 'Consultation de suivi (résultat de la glycémie)', 'confirme', 'Awa Sarr', 'Cabinet de maïeutique', 'La veille à 18 h', 'Apporter le résultat de votre glycémie à jeun.'],
    ['R07', 'P001', 53, '09:30', 'Consultation prénatale (CPN 3)', 'a-confirmer', 'Dr Fatou Mbaye', 'Consultation obstétrique', null, null],
    ['R08', 'P001', -3, '10:30', 'Consultation prénatale (CPN 2)', 'honore', 'Awa Sarr', 'Cabinet de maïeutique', null, null],
    ['R09', 'P001', -30, '11:00', 'Échographie morphologique', 'honore', 'Dr Fatou Mbaye', 'Consultation obstétrique', null, null],
    ['R10', 'P001', -55, '09:00', 'Consultation de suivi', 'honore', 'Dr Fatou Mbaye', 'Consultation obstétrique', null, null],
  ];
  for (const [id, pid, n, heure, motif, statut, avec, lieu, rappel, preparer] of rdv) {
    await client.query(`INSERT INTO rendez_vous (id, patiente_id, date, heure, motif, statut, avec, lieu, rappel, preparer) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, pid, jour(n), heure, motif, statut, avec, lieu, rappel, preparer]);
  }

  // Carnet de l'enfant de Seynabou Guèye (P005), née il y a 40 jours
  await client.query(`INSERT INTO enfants (id, mere_id, prenom, nom, sexe, naissance, terme, poids_naissance, taille_naissance, lieu)
    VALUES ('N01', 'P005', 'Awa', 'Guèye', 'F', $1, '39 SA', '3,2 kg', '49 cm', 'Clinique Sutura (fictive)')`, [jour(-40)]);
  for (const [j, p, t] of [[0, 3.2, 49], [7, 3.1, 49.5], [21, 3.7, 51.5], [35, 4.2, 53.5]]) {
    await client.query('INSERT INTO mesures_enfant (enfant_id, jours, poids, taille) VALUES ($1,$2,$3,$4)', ['N01', j, p, t]);
  }
  const vaccins = [
    ['À la naissance', 'BCG, polio oral (VPO 0), hépatite B', -40, 'fait'],
    ['6 semaines', 'Pentavalent 1, polio 1, pneumocoque 1, rotavirus 1', 2, 'prochain'],
    ['10 semaines', 'Pentavalent 2, polio 2, pneumocoque 2, rotavirus 2', 30, 'a-venir'],
    ['14 semaines', 'Pentavalent 3, polio 3, pneumocoque 3, polio injectable', 58, 'a-venir'],
  ];
  for (const [age, v, n, statut] of vaccins) {
    await client.query('INSERT INTO vaccins (enfant_id, age, vaccins, date, statut) VALUES ($1,$2,$3,$4,$5)', ['N01', age, v, jour(n), statut]);
  }
  await client.query(`INSERT INTO consultations_enfant (enfant_id, date, type, par, notes) VALUES
    ('N01', $1, 'Consultation postnatale du nourrisson', 'Dr Fatou Mbaye', 'Bonne prise de poids, allaitement exclusif.'),
    ('N01', $2, 'Visite du 7e jour', 'Awa Sarr', 'Cordon en bonne voie de cicatrisation.')`, [jour(-5), jour(-33)]);

  // Compte patiente de démonstration déjà relié (code + SMS + consentement faits)
  await client.query(`INSERT INTO comptes_patientes (id, nom, telephone, email, mot_de_passe_hash, patiente_id, lie_le)
    VALUES ('A01', 'Mariama Sow', $1, 'mariama.sow@demo.sn', $2, 'P001', $3)`, [telMariama, hash, instant(-100, 10, 0)]);
  await client.query(`INSERT INTO consentements (compte_id, patiente_id, soins, recherche, donne_le) VALUES ('A01', 'P001', true, false, $1)`, [instant(-100, 10, 1)]);

  const notifs = [
    ['N1', 'carnet', 'Nouveaux résultats disponibles', 'Vos résultats de numération formule sanguine ont été ajoutés à votre carnet.', instant(0, 8, 0), false],
    ['N2', 'examen', 'Examen à réaliser', 'Glycémie à jeun prévue dans 6 jours. Venez à jeun depuis la veille au soir.', instant(0, 8, 5), false],
    ['N3', 'rdv', 'Rendez-vous confirmé', 'Consultation de suivi avec Awa Sarr, dans 10 jours à 10 h, pour le résultat de votre glycémie.', instant(-3, 11, 0), true],
    ['N4', 'important', 'Signes qui doivent vous faire consulter', 'Saignement, forte fièvre, maux de tête intenses, bébé qui bouge moins : consultez sans attendre.', instant(-5, 9, 0), true],
    ['N5', 'carnet', 'Consultation enregistrée', 'Votre consultation prénatale (CPN 2) a été validée par Awa Sarr.', instant(-3, 10, 50), true],
  ];
  for (const [id, type, titre, texte, date, lue] of notifs) {
    await client.query('INSERT INTO notifications (id, patiente_id, type, titre, texte, date, lue) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, 'P001', type, titre, texte, date, lue]);
  }

  const journal = [
    [instant(-2, 9, 12), 'Awa Sarr', 'sagefemme', 'Consultation du dossier', 'P001', 'ok'],
    [instant(-2, 9, 30), 'Dr Fatou Mbaye', 'medecin', 'Saisie de consultation (CPN 3)', 'P003', 'ok'],
    [instant(-1, 10, 5), 'Compte externe', 'externe', 'Tentative de lecture d’un dossier', 'P003', 'refuse'],
    [instant(-1, 10, 45), 'Mariama Sow', 'patiente', 'Lecture du carnet depuis l’application mobile', 'P001', 'ok'],
  ];
  for (const [date, u, role, action, dossier, res] of journal) {
    await client.query('INSERT INTO journal_acces (date, utilisateur, role, action, dossier, resultat) VALUES ($1,$2,$3,$4,$5,$6)', [date, u, role, action, dossier, res]);
  }
}

// Exécution directe : npm run db:seed
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await remplir();
  console.log('Données fictives rechargées.');
  await pool.end();
}
