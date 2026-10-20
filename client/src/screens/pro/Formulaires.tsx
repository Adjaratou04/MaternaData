import { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { actions, profilActif, useStore, saA, type Patiente } from '../../data/store';
import { aujourdhui, ajouterJours, formatDate } from '../../data/apercu';

export function Modale({ titre, sousTitre, onFermer, children }: { titre: string; sousTitre?: string; onFermer: () => void; children: React.ReactNode }) {
  return (
    <div className="pf-fond" onClick={onFermer}>
      <div className="pf-modale" role="dialog" aria-modal="true" aria-label={titre} onClick={(e) => e.stopPropagation()}>
        <div className="pf-tete"><div><h2>{titre}</h2>{sousTitre && <p>{sousTitre}</p>}</div><button className="pf-fermer" onClick={onFermer} aria-label="Fermer"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

const Champ = ({ lib, aide, erreur, children }: { lib: string; aide?: string; erreur?: string; children: React.ReactNode }) => (
  <label className={`pf-champ${erreur ? ' pf-erreur' : ''}`}><span>{lib}</span>{children}{erreur ? <em>{erreur}</em> : aide ? <small>{aide}</small> : null}</label>
);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const depuisIso = (s: string) => { const [a, m, j] = s.split('-').map(Number); const d = new Date(a, m - 1, j); d.setHours(0, 0, 0, 0); return d; };

/* ---------------- Nouveau dossier ---------------- */
export function NouveauDossier({ onFermer, onCree }: { onFermer: () => void; onCree: (p: Patiente) => void }) {
  const [f, setF] = useState({ prenom: '', nom: '', age: '', telephone: '', adresse: '', ddr: '', gestite: '1', parite: '0', cesariennes: '0', urgenceNom: '', urgenceTel: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const maj = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const valider = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.prenom.trim()) er.prenom = 'Renseignez le prénom.';
    if (!f.nom.trim()) er.nom = 'Renseignez le nom.';
    const age = Number(f.age); if (!age || age < 12 || age > 55) er.age = 'Âge entre 12 et 55 ans.';
    if (!/^\+?[\d\s]{9,16}$/.test(f.telephone.trim())) er.telephone = 'Numéro de téléphone invalide.';
    if (f.ddr) { const d = depuisIso(f.ddr); const jours = (aujourdhui().getTime() - d.getTime()) / 86400000; if (jours < 14 || jours > 300) er.ddr = 'La date doit se situer entre 2 et 42 semaines avant aujourd’hui.'; }
    setErr(er);
    if (Object.keys(er).length) return;
    let p;
    try { p = await actions.ajouterPatiente({
      nom: `${f.prenom.trim()} ${f.nom.trim()}`, age, ddr: f.ddr ? depuisIso(f.ddr) : null, telephone: f.telephone.trim(), adresse: f.adresse.trim() || 'À renseigner', profession: 'À renseigner',
      urgence: { nom: f.urgenceNom.trim() || 'À renseigner', lien: '', tel: f.urgenceTel.trim() }, groupe: 'À déterminer', gestite: Number(f.gestite) || 1, parite: Number(f.parite) || 0, cesariennes: Number(f.cesariennes) || 0,
      allergies: 'À renseigner', antecedentsMed: 'À renseigner', antecedentsChir: 'À renseigner',
    }); } catch (x) { return setErr({ serveur: (x as Error).message }); }
    onCree(p);
  };
  return (
    <Modale titre="Nouveau dossier" sousTitre="Données fictives : n’enregistrez aucune vraie patiente dans ce prototype." onFermer={onFermer}>
      <form className="pf-form" onSubmit={valider} noValidate>
        <div className="pf-grille">
          <Champ lib="Prénom" erreur={err.prenom}><input value={f.prenom} onChange={maj('prenom')} autoFocus /></Champ>
          <Champ lib="Nom" erreur={err.nom}><input value={f.nom} onChange={maj('nom')} /></Champ>
          <Champ lib="Âge" erreur={err.age}><input inputMode="numeric" value={f.age} onChange={maj('age')} /></Champ>
          <Champ lib="Téléphone" erreur={err.telephone}><input inputMode="tel" placeholder="+221 77 000 00 00" value={f.telephone} onChange={maj('telephone')} /></Champ>
          <Champ lib="Adresse"><input value={f.adresse} onChange={maj('adresse')} /></Champ>
          <Champ lib="Date des dernières règles" aide="Facultative : sans elle, le dossier reste « incomplet »." erreur={err.ddr}><input type="date" value={f.ddr} onChange={maj('ddr')} /></Champ>
          <Champ lib="Gestité"><input inputMode="numeric" value={f.gestite} onChange={maj('gestite')} /></Champ>
          <Champ lib="Parité"><input inputMode="numeric" value={f.parite} onChange={maj('parite')} /></Champ>
          <Champ lib="Césariennes antérieures"><input inputMode="numeric" value={f.cesariennes} onChange={maj('cesariennes')} /></Champ>
          <Champ lib="Personne à prévenir"><input value={f.urgenceNom} onChange={maj('urgenceNom')} /></Champ>
        </div>
        <p className="pf-note">Un code de liaison est généré : la patiente le saisit dans l’application mobile pour relier son téléphone à ce dossier, après consentement.</p>
        {err.serveur && <p className="pf-erreur-serveur" role="alert">{err.serveur}</p>}
        <div className="pf-actions"><button type="button" className="btn btn-discret btn-sm" onClick={onFermer}>Annuler</button><button className="btn btn-primaire btn-sm">Créer le dossier</button></div>
      </form>
    </Modale>
  );
}

/* ---------------- Nouvelle consultation ---------------- */
export function NouvelleConsultation({ patienteId, onFermer, onEnregistre }: { patienteId?: string; onFermer: () => void; onEnregistre: (pid: string) => void }) {
  const e = useStore();
  const enSuivi = e.patientes;
  const [pid, setPid] = useState(patienteId ?? enSuivi[0]?.id ?? '');
  const p = e.patientes.find((x) => x.id === pid);
  const nb = e.consultations.filter((c) => c.patiente === pid && /CPN/.test(c.type)).length;
  const [f, setF] = useState({ type: p?.postnatal ? 'Consultation postnatale' : (nb < 4 ? `CPN ${nb + 1}` : 'Consultation de suivi'), tas: '', tad: '', poids: '', hu: '', bdcf: '', bandelette: 'Négative', notes: '', conduite: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const maj = (k: keyof typeof f) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: ev.target.value });
  const g = p ? saA(p, aujourdhui()) : null;
  const tas = Number(f.tas), tad = Number(f.tad);
  const alerte = tas >= 140 || tad >= 90 ? 'critique' : tas >= 135 || tad >= 85 ? 'limite' : null;
  const valider = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const er: Record<string, string> = {};
    if (!p) er.pid = 'Choisissez une patiente.';
    if (!(tas >= 70 && tas <= 220)) er.tas = 'Entre 70 et 220.';
    if (!(tad >= 40 && tad <= 140)) er.tad = 'Entre 40 et 140.';
    if (!(Number(f.poids) >= 30 && Number(f.poids) <= 200)) er.poids = 'Entre 30 et 200 kg.';
    if (f.hu && !(Number(f.hu) >= 5 && Number(f.hu) <= 45)) er.hu = 'Entre 5 et 45 cm.';
    if (f.bdcf && !(Number(f.bdcf) >= 90 && Number(f.bdcf) <= 200)) er.bdcf = 'Entre 90 et 200 bpm.';
    setErr(er);
    if (Object.keys(er).length) return;
    try { await actions.ajouterConsultation({
      patiente: pid, date: aujourdhui(), type: f.type, par: profilActif().nom, ta: [tas, tad], poids: Number(f.poids),
      hu: f.hu ? Number(f.hu) : undefined, bdcf: f.bdcf ? Number(f.bdcf) : undefined, bandelette: f.bandelette, notes: f.notes.trim() || '—', conduite: f.conduite.trim() || '—',
    }); } catch (x) { return setErr({ serveur: (x as Error).message }); }
    onEnregistre(pid);
  };
  return (
    <Modale titre="Nouvelle consultation" sousTitre={p && g ? `${p.nom} · ${g.sa} SA + ${g.j} j aujourd’hui` : p?.postnatal ? `${p.nom} · suivi postnatal` : undefined} onFermer={onFermer}>
      <form className="pf-form" onSubmit={valider} noValidate>
        <div className="pf-grille">
          {!patienteId && <Champ lib="Patiente" erreur={err.pid}><select value={pid} onChange={(ev) => setPid(ev.target.value)}>{enSuivi.map((x) => <option key={x.id} value={x.id}>{x.nom} ({x.id})</option>)}</select></Champ>}
          <Champ lib="Type"><select value={f.type} onChange={maj('type')}>{['CPN 1', 'CPN 2', 'CPN 3', 'CPN 4', 'Consultation de suivi', 'Consultation postnatale'].map((x) => <option key={x}>{x}</option>)}</select></Champ>
          <Champ lib="Tension systolique (mmHg)" erreur={err.tas}><input inputMode="numeric" value={f.tas} onChange={maj('tas')} placeholder="120" /></Champ>
          <Champ lib="Tension diastolique (mmHg)" erreur={err.tad}><input inputMode="numeric" value={f.tad} onChange={maj('tad')} placeholder="80" /></Champ>
          <Champ lib="Poids (kg)" erreur={err.poids}><input inputMode="decimal" value={f.poids} onChange={maj('poids')} /></Champ>
          <Champ lib="Hauteur utérine (cm)" erreur={err.hu}><input inputMode="numeric" value={f.hu} onChange={maj('hu')} /></Champ>
          <Champ lib="Bruits du cœur fœtal (bpm)" erreur={err.bdcf}><input inputMode="numeric" value={f.bdcf} onChange={maj('bdcf')} /></Champ>
          <Champ lib="Bandelette urinaire"><select value={f.bandelette} onChange={maj('bandelette')}>{['Négative', 'Traces de protéines', 'Protéines +', 'Glucose', 'Non réalisée'].map((x) => <option key={x}>{x}</option>)}</select></Champ>
        </div>
        {alerte && <p className={`pf-alerte ${alerte}`}><AlertTriangle size={16} />{alerte === 'critique' ? 'Tension élevée : la patiente passera « à vérifier » et un point d’attention sera créé.' : 'Tension limite : un point d’attention sera créé.'}</p>}
        <Champ lib="Observations"><textarea rows={2} value={f.notes} onChange={maj('notes')} /></Champ>
        <Champ lib="Conduite à tenir"><textarea rows={2} value={f.conduite} onChange={maj('conduite')} /></Champ>
        <p className="pf-note">Saisie signée par {profilActif().nom}, horodatée et inscrite au journal d’accès.</p>
        {err.serveur && <p className="pf-erreur-serveur" role="alert">{err.serveur}</p>}
        <div className="pf-actions"><button type="button" className="btn btn-discret btn-sm" onClick={onFermer}>Annuler</button><button className="btn btn-primaire btn-sm">Enregistrer la consultation</button></div>
      </form>
    </Modale>
  );
}

/* ---------------- Nouveau rendez-vous ---------------- */
export function NouveauRdv({ patienteId, onFermer, onEnregistre }: { patienteId?: string; onFermer: () => void; onEnregistre: () => void }) {
  const e = useStore();
  const [f, setF] = useState({ pid: patienteId ?? e.patientes[0]?.id ?? '', date: iso(ajouterJours(aujourdhui(), 7)), heure: '09:00', motif: 'Consultation prénatale', avec: profilActif().nom });
  const [err, setErr] = useState<Record<string, string>>({});
  const maj = (k: keyof typeof f) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: ev.target.value });
  const valider = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const er: Record<string, string> = {};
    const d = f.date ? depuisIso(f.date) : null;
    if (!d || d.getTime() < aujourdhui().getTime()) er.date = 'Choisissez une date à partir d’aujourd’hui.';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(f.heure)) er.heure = 'Heure invalide.';
    if (!f.motif.trim()) er.motif = 'Indiquez le motif.';
    setErr(er);
    if (Object.keys(er).length) return;
    try { await actions.ajouterRdv({ patiente: f.pid, date: d!, heure: f.heure, motif: f.motif.trim(), statut: 'a-confirmer', avec: f.avec, lieu: 'Clinique Sutura' }); } catch (x) { return setErr({ serveur: (x as Error).message }); }
    onEnregistre();
  };
  return (
    <Modale titre="Nouveau rendez-vous" sousTitre="La patiente reçoit un rappel la veille, sur le canal qu’elle a choisi." onFermer={onFermer}>
      <form className="pf-form" onSubmit={valider} noValidate>
        <div className="pf-grille">
          {!patienteId && <Champ lib="Patiente"><select value={f.pid} onChange={maj('pid')}>{e.patientes.map((x) => <option key={x.id} value={x.id}>{x.nom} ({x.id})</option>)}</select></Champ>}
          <Champ lib="Date" erreur={err.date}><input type="date" value={f.date} onChange={maj('date')} /></Champ>
          <Champ lib="Heure" erreur={err.heure}><input type="time" value={f.heure} onChange={maj('heure')} /></Champ>
          <Champ lib="Motif" erreur={err.motif}><input value={f.motif} onChange={maj('motif')} /></Champ>
          <Champ lib="Avec"><select value={f.avec} onChange={maj('avec')}>{e.utilisateurs.filter((u) => u.role === 'medecin' || u.role === 'sagefemme').map((u) => <option key={u.id}>{u.nom}</option>)}</select></Champ>
        </div>
        {err.serveur && <p className="pf-erreur-serveur" role="alert">{err.serveur}</p>}
        <div className="pf-actions"><button type="button" className="btn btn-discret btn-sm" onClick={onFermer}>Annuler</button><button className="btn btn-primaire btn-sm">Programmer</button></div>
      </form>
    </Modale>
  );
}

export function Confirmation({ texte }: { texte: string }) {
  return <div className="pf-toast" role="status"><CheckCircle2 size={17} />{texte}</div>;
}
export { formatDate };
