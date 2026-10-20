// Conversion des lignes SQL vers le format attendu par l'interface React.
export const patiente = (r) => ({
  id: r.id, nom: r.nom, age: r.age, ddr: r.ddr, postnatal: r.postnatal,
  telephone: r.telephone, adresse: r.adresse, profession: r.profession,
  urgence: { nom: r.urgence_nom, lien: r.urgence_lien, tel: r.urgence_tel },
  code: r.code_liaison, groupe: r.groupe, gestite: r.gestite, parite: r.parite, cesariennes: r.cesariennes,
  allergies: r.allergies, antecedentsMed: r.antecedents_med, antecedentsChir: r.antecedents_chir,
  maternite: r.maternite_prevue, projet: r.projet_naissance,
});

/** Version sans contenu médical (pour l'administration de la clinique). */
export const patienteAdministrative = (r) => ({
  id: r.id, nom: r.nom, age: r.age, ddr: null, postnatal: false, telephone: r.telephone, adresse: '', profession: '',
  urgence: { nom: '', lien: '', tel: '' }, code: r.code_liaison, groupe: '', gestite: 0, parite: 0, cesariennes: 0,
  allergies: '', antecedentsMed: '', antecedentsChir: '', masque: true,
});

export const consultation = (r) => ({
  id: r.id, patiente: r.patiente_id, date: r.date, type: r.type, par: r.par,
  ...(r.ta_sys != null && r.ta_dia != null ? { ta: [r.ta_sys, r.ta_dia] } : {}),
  ...(r.poids != null ? { poids: r.poids } : {}), ...(r.hu != null ? { hu: r.hu } : {}),
  ...(r.bdcf != null ? { bdcf: r.bdcf } : {}), ...(r.bandelette ? { bandelette: r.bandelette } : {}),
  notes: r.notes, conduite: r.conduite,
});

export const examen = (r) => ({ id: r.id, patiente: r.patiente_id, date: r.date, type: r.type, titre: r.titre, resume: r.resume, valeurs: r.valeurs, statut: r.statut });

export const rdv = (r) => ({ id: r.id, patiente: r.patiente_id, date: r.date, heure: r.heure, motif: r.motif, statut: r.statut, avec: r.avec, lieu: r.lieu, rappel: r.rappel ?? undefined, preparer: r.preparer ?? undefined });

export const entree = (r) => ({ id: `J${r.id}`, date: r.date, utilisateur: r.utilisateur, role: r.role, action: r.action, dossier: r.dossier, resultat: r.resultat });

export const utilisateur = (r) => ({ id: r.id, nom: r.nom, role: r.role, fonction: r.fonction, initiales: r.initiales, email: r.email, actif: r.actif });

export const notification = (r) => ({ id: r.id, type: r.type, titre: r.titre, texte: r.texte, date: r.date, lue: r.lue });
