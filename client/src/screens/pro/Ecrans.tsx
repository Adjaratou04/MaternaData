import { useState } from 'react';
import { CalendarPlus, ClipboardPlus, Check, Search, Download, ShieldCheck, RotateCcw, Building2, Lock, Minus, Syringe, Baby, ChevronRight } from 'lucide-react';
import { useStore, actions, profilActif, roles, saA, consultationsDe, type Role } from '../../data/store';
import { aujourdhui, joursEntre, formatDate, suiviGrossesse, etablissement } from '../../data/apercu';
import { enfantP005 } from '../../data/patiente';
import { IconeBebe } from '../../components/IconeBebe';

const initiales = (n: string) => n.split(' ').map((m) => m[0]).join('').slice(0, 2);
const fmtJourLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtCourt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtHeure = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const nom = (e: ReturnType<typeof useStore>, pid: string) => e.patientes.find((p) => p.id === pid)?.nom ?? pid;

const Tete = ({ titre, sous, children }: { titre: string; sous: string; children?: React.ReactNode }) => (
  <div className="pro-v2-tete"><div><h1>{titre}</h1><p className="pro-v2-resume">{sous}</p></div>{children && <div className="pro-actions">{children}</div>}</div>
);

/* ---------------- Agenda ---------------- */
export function Agenda({ ouvrir, nouveau }: { ouvrir: (pid: string) => void; nouveau: () => void }) {
  const e = useStore();
  const t = aujourdhui();
  const avenir = e.rdv.filter((r) => joursEntre(t, r.date) >= 0).sort((a, b) => a.date.getTime() - b.date.getTime() || a.heure.localeCompare(b.heure));
  const jours = [...new Set(avenir.map((r) => r.date.toDateString()))];
  return (
    <main className="pro-zone pro-v2">
      <Tete titre="Rendez-vous" sous={`${avenir.length} rendez-vous à venir · ${avenir.filter((r) => r.statut === 'a-confirmer').length} à confirmer`}>
        <button className="btn btn-primaire btn-sm" onClick={nouveau}><CalendarPlus size={16} />Nouveau rendez-vous</button>
      </Tete>
      {jours.map((j) => { const d = new Date(j); const n = joursEntre(t, d); return (
        <section key={j} className="carte pro-bloc">
          <div className="pro-bloc-titre"><h2 className="pro-maj">{n === 0 ? 'Aujourd’hui' : n === 1 ? 'Demain' : fmtJourLong.format(d)}</h2><span className="pro-muet">{n > 1 ? `dans ${n} jours` : ''}</span></div>
          <ul className="pro-v2-liste">
            {avenir.filter((r) => r.date.toDateString() === j).map((r) => (
              <li key={r.id}>
                <span className="pro-agenda-heure chiffres">{r.heure}</span>
                <button className="pro-v2-liste-texte pro-lien-ligne" onClick={() => ouvrir(r.patiente)}><strong>{nom(e, r.patiente)}</strong><em>{r.motif} · {r.avec}</em></button>
                {r.statut === 'confirme' ? <span className="pastille p-ok">Confirmé</span> : <button className="btn btn-discret btn-sm" onClick={() => actions.confirmerRdv(r.id)}><Check size={15} />Confirmer</button>}
              </li>
            ))}
          </ul>
        </section>); })}
    </main>
  );
}

/* ---------------- Consultations ---------------- */
export function Consultations({ ouvrir, nouvelle }: { ouvrir: (pid: string) => void; nouvelle: () => void }) {
  const e = useStore();
  const [q, setQ] = useState('');
  const liste = [...e.consultations].sort((a, b) => b.date.getTime() - a.date.getTime()).filter((c) => !q.trim() || `${nom(e, c.patiente)} ${c.type} ${c.par}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <main className="pro-zone pro-v2">
      <Tete titre="Consultations" sous={`${e.consultations.length} consultations enregistrées et signées`}>
        <button className="btn btn-primaire btn-sm" onClick={nouvelle}><ClipboardPlus size={16} />Nouvelle consultation</button>
      </Tete>
      <label className="pro-recherche pro-v2-recherche"><Search size={16} /><input placeholder="Patiente, type ou praticien" value={q} onChange={(ev) => setQ(ev.target.value)} /></label>
      <section className="carte pro-bloc">
        <div className="pro-table-scroll">
          <table className="pro-table">
            <thead><tr><th>Date</th><th>Patiente</th><th>Type</th><th>Âge gestationnel</th><th>TA</th><th>Praticien</th></tr></thead>
            <tbody>
              {liste.map((c) => { const p = e.patientes.find((x) => x.id === c.patiente)!; const s = saA(p, c.date); return (
                <tr key={c.id} onClick={() => ouvrir(c.patiente)}>
                  <td className="chiffres">{fmtCourt.format(c.date)}</td>
                  <td><div className="pro-pat"><span className="pro-pat-av">{initiales(p.nom)}</span><span className="pro-patiente">{p.nom}</span></div></td>
                  <td><span className="pro-type">{c.type}</span></td>
                  <td className="chiffres pro-muet">{s ? `${s.sa} SA + ${s.j} j` : '—'}</td>
                  <td className={`chiffres ${c.ta && (c.ta[0] >= 135 || c.ta[1] >= 85) ? 'pro-haute' : ''}`}>{c.ta ? `${c.ta[0]}/${c.ta[1]}` : '—'}</td>
                  <td className="pro-muet">{c.par}</td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

/* ---------------- Suivi de grossesse ---------------- */
const reperes: [number, string][] = [[12, 'Échographie du 1er trimestre'], [22, 'Échographie morphologique'], [24, 'Glycémie à jeun'], [32, 'Échographie du 3e trimestre'], [36, 'Consultation du 9e mois'], [40, 'Terme prévu (DDR + 280 jours)']];
export function SuiviGrossesse({ ouvrir }: { ouvrir: (pid: string) => void }) {
  const e = useStore();
  const t = aujourdhui();
  const enCours = e.patientes.filter((p) => p.ddr).map((p) => ({ p, g: suiviGrossesse(p.ddr!) }));
  const groupes: [string, (g: ReturnType<typeof suiviGrossesse>) => boolean][] = [['1er trimestre', (g) => g.trimestre === 1], ['2e trimestre', (g) => g.trimestre === 2], ['3e trimestre', (g) => g.trimestre === 3]];
  const sansDdr = e.patientes.filter((p) => !p.ddr && !p.postnatal);
  return (
    <main className="pro-zone pro-v2">
      <Tete titre="Suivi de grossesse" sous={`${enCours.length} grossesses en cours · repères calculés à partir de la date des dernières règles`} />
      {groupes.map(([titre, f]) => { const l = enCours.filter(({ g }) => f(g)); return (
        <section key={titre} className="carte pro-bloc">
          <div className="pro-bloc-titre"><h2>{titre}</h2><span className="pro-muet">{l.length} patiente{l.length > 1 ? 's' : ''}</span></div>
          {l.length === 0 ? <p className="pro-muet">Aucune patiente à ce stade.</p> : (
          <ul className="pro-v2-liste">
            {l.map(({ p, g }) => { const cs = consultationsDe(p.id, e.consultations); const d = cs[cs.length - 1]; const rep = reperes.find(([sa]) => sa > g.sa); return (
              <li key={p.id}>
                <span className="pro-pat-av">{initiales(p.nom)}</span>
                <button className="pro-v2-liste-texte pro-lien-ligne" onClick={() => ouvrir(p.id)}>
                  <strong>{p.nom} <span className="pro-muet chiffres">{g.sa} SA + {g.j} j</span></strong>
                  <em>{cs.filter((c) => /^CPN/.test(c.type)).length} CPN sur 4 · dernière TA {d?.ta ? `${d.ta[0]}/${d.ta[1]}` : '—'} · date prévue {formatDate(g.dpa)}</em>
                </button>
                {rep && <span className="pro-repere">Prochain repère : {rep[1]} <b className="chiffres">vers {rep[0]} SA</b></span>}
                <span className="pro-muet chiffres">J-{joursEntre(t, g.dpa)}</span>
              </li>); })}
          </ul>)}
        </section>); })}
      {sansDdr.length > 0 && (
        <section className="carte pro-bloc">
          <div className="pro-bloc-titre"><h2>Terme à renseigner</h2></div>
          <ul className="pro-v2-liste">{sansDdr.map((p) => <li key={p.id}><span className="pro-pat-av">{initiales(p.nom)}</span><button className="pro-v2-liste-texte pro-lien-ligne" onClick={() => ouvrir(p.id)}><strong>{p.nom}</strong><em>Date des dernières règles manquante : l’âge gestationnel ne peut pas être calculé.</em></button><span className="pastille p-alerte">Incomplet</span></li>)}</ul>
        </section>
      )}
    </main>
  );
}

/* ---------------- Suivi de l'enfant ---------------- */
export function SuiviEnfant({ ouvrirMere }: { ouvrirMere: (pid: string) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const x = enfantP005;
  const t = aujourdhui();
  const age = joursEntre(x.naissance, t);
  const faits = x.vaccins.filter((v) => v.statut === 'fait').length;
  const prochain = x.vaccins.find((v) => v.statut === 'prochain');
  const W = 420, H = 150, pg = 34, pd = 14, ph = 12, pb = 24, maxJ = 42, minP = 2.5, maxP = 4.5;
  const X = (j: number) => pg + (j / maxJ) * (W - pg - pd); const Y = (p: number) => H - pb - ((p - minP) / (maxP - minP)) * (H - ph - pb);
  if (!ouvert) return (
    <main className="pro-zone pro-v2">
      <Tete titre="Suivi de l’enfant" sous="1 enfant suivi · carnets créés à la naissance et rattachés au dossier de la mère" />
      <section className="carte pro-bloc">
        <ul className="pro-v2-liste"><li>
          <IconeBebe sexe={x.sexe} taille={44} />
          <button className="pro-v2-liste-texte pro-lien-ligne" onClick={() => setOuvert(true)}><strong>{x.prenom} {x.nom}</strong><em>{Math.floor(age / 7)} semaines · {faits} vaccin{faits > 1 ? 's' : ''} sur {x.vaccins.length} · mère : {x.mere}</em></button>
          {prochain && <span className="pastille p-info">Vaccins le {fmtCourt.format(prochain.date)}</span>}
          <ChevronRight size={16} className="pro-muet" />
        </li></ul>
      </section>
    </main>
  );
  return (
    <main className="pro-zone pro-v2">
      <button className="pro-retour" onClick={() => setOuvert(false)}>← Suivi de l’enfant</button>
      <section className="carte pro-fiche-tete">
        <IconeBebe sexe={x.sexe} taille={64} />
        <div className="pro-fiche-id"><h1>{x.prenom} {x.nom}</h1><p>{x.sexe === 'F' ? 'Fille' : 'Garçon'} · {Math.floor(age / 7)} semaines · née le {formatDate(x.naissance)}</p></div>
        <div className="pro-actions"><button className="btn btn-discret btn-sm" onClick={() => ouvrirMere('P005')}><Baby size={16} />Dossier de la mère</button></div>
      </section>
      <CarnetEnfantContenu />
    </main>
  );
}


/** Carnet de l'enfant (naissance, croissance, vaccins) : utilisé dans le dossier de la mère. */
export function CarnetEnfantContenu() {
  const x = enfantP005;
  const prochain = x.vaccins.find((v) => v.statut === 'prochain');
  const W = 420, H = 150, pg = 34, pd = 14, ph = 12, pb = 24, maxJ = 42, minP = 2.5, maxP = 4.5;
  const X = (j: number) => pg + (j / maxJ) * (W - pg - pd); const Y = (p: number) => H - pb - ((p - minP) / (maxP - minP)) * (H - ph - pb);
  return (
    <>
      {prochain && <div className="pro-bandeau-vaccin"><Syringe size={18} /><div><strong>Prochaine vaccination : {prochain.vaccins}</strong><span>Prévue le {formatDate(prochain.date)} ({prochain.age})</span></div></div>}
      <div className="pro-v2-deux">
        <section className="carte pro-bloc">
          <div className="pro-bloc-titre"><h2>Naissance</h2></div>
          <dl className="pro-dl pro-dl-ligne">{x.naissanceInfos.map((i) => <div key={i.libelle}><dt>{i.libelle}</dt><dd>{i.valeur}</dd></div>)}</dl>
        </section>
        <section className="carte pro-bloc">
          <div className="pro-bloc-titre"><h2>Croissance</h2><span className="pro-muet">Poids en kg selon l’âge en jours</span></div>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Courbe de poids de l’enfant">
            {[2.5, 3, 3.5, 4, 4.5].map((v) => <g key={v}><line x1={pg} x2={W - pd} y1={Y(v)} y2={Y(v)} stroke="#F6EEF0" /><text x={pg - 6} y={Y(v) + 3} fontSize="9" textAnchor="end" fill="#7D5F68">{String(v).replace('.', ',')}</text></g>)}
            <path d={x.croissance.map((m, k) => `${k ? 'L' : 'M'}${X(m.jours)} ${Y(m.poids)}`).join(' ')} fill="none" stroke="#C81849" strokeWidth="2.5" />
            {x.croissance.map((m) => <g key={m.jours}><circle cx={X(m.jours)} cy={Y(m.poids)} r="4" fill="#C81849" /><text x={X(m.jours)} y={H - 8} fontSize="9" textAnchor="middle" fill="#7D5F68">J{m.jours}</text></g>)}
          </svg>
        </section>
      </div>
      <section className="carte pro-bloc">
        <div className="pro-bloc-titre"><h2>Calendrier vaccinal</h2><span className="pro-muet">Programme national, données fictives</span></div>
        <ul className="pro-v2-liste">
          {x.vaccins.map((v) => (
            <li key={v.age}>
              <span className={`pro-vaccin-etat ${v.statut}`}>{v.statut === 'fait' ? <Check size={15} /> : <Syringe size={14} />}</span>
              <span className="pro-v2-liste-texte"><strong>{v.vaccins}</strong><em>{v.age} · {v.statut === 'fait' ? `fait le ${fmtCourt.format(v.date)}` : `prévu le ${fmtCourt.format(v.date)}`}</em></span>
              <span className={`pastille ${v.statut === 'fait' ? 'p-ok' : v.statut === 'prochain' ? 'p-info' : 'p-alerte'}`}>{v.statut === 'fait' ? 'Administré' : v.statut === 'prochain' ? 'Prochain' : 'À venir'}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/* ---------------- Rapports ---------------- */
export function Rapports({ signaler }: { signaler: (m: string) => void }) {
  const e = useStore();
  const t = aujourdhui();
  const n = e.patientes.length;
  const complets = e.patientes.filter((p) => (p.ddr || p.postnatal) && p.groupe !== 'À déterminer').length;
  const cs30 = e.consultations.filter((c) => joursEntre(c.date, t) <= 30).length;
  const stades: [string, number][] = [
    ['1er trimestre', e.patientes.filter((p) => p.ddr && suiviGrossesse(p.ddr).trimestre === 1).length],
    ['2e trimestre', e.patientes.filter((p) => p.ddr && suiviGrossesse(p.ddr).trimestre === 2).length],
    ['3e trimestre', e.patientes.filter((p) => p.ddr && suiviGrossesse(p.ddr).trimestre === 3).length],
    ['Post-partum', e.patientes.filter((p) => p.postnatal).length],
    ['Terme à renseigner', e.patientes.filter((p) => !p.ddr && !p.postnatal).length],
  ];
  const parPraticien = [...new Set(e.consultations.map((c) => c.par))].map((p) => [p, e.consultations.filter((c) => c.par === p).length] as [string, number]).sort((a, b) => b[1] - a[1]);
  const cpn = e.consultations.filter((c) => /CPN/.test(c.type));
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const apres24 = e.patientes.filter((p) => p.ddr && suiviGrossesse(p.ddr).sa >= 24);
  const conformite: [string, string, number, number][] = [
    ['Tension mesurée à chaque CPN', `${cpn.filter((c) => c.ta).length} sur ${cpn.length} CPN`, pct(cpn.filter((c) => c.ta).length, cpn.length), 100],
    ['Bandelette urinaire à chaque CPN (à partir de la CPN 2)', `${cpn.filter((c) => c.type !== 'CPN 1' && c.bandelette).length} sur ${cpn.filter((c) => c.type !== 'CPN 1').length} CPN`, pct(cpn.filter((c) => c.type !== 'CPN 1' && c.bandelette).length, cpn.filter((c) => c.type !== 'CPN 1').length), 95],
    ['Échographie du 2e trimestre réalisée après 24 SA', `${apres24.filter((p) => e.examens.some((x) => x.patiente === p.id && /morpholog|2e trimestre/i.test(x.titre))).length} sur ${apres24.length} grossesses`, pct(apres24.filter((p) => e.examens.some((x) => x.patiente === p.id && /morpholog|2e trimestre/i.test(x.titre))).length, apres24.length), 90],
    ['Dossiers avec date des dernières règles', `${e.patientes.filter((p) => p.ddr || p.postnatal).length} sur ${n} dossiers`, pct(e.patientes.filter((p) => p.ddr || p.postnatal).length, n), 100],
  ];
  const max = Math.max(...stades.map((s) => s[1]), 1);
  const exporter = () => {
    const lignes = [['Indicateur', 'Valeur'], ['Dossiers actifs', String(n)], ['Dossiers complets (%)', String(pct(complets, n))], ['Consultations sur 30 jours', String(cs30)], ...stades.map(([k, v]) => [`File active : ${k}`, String(v)]), ...conformite.map(([k, , v]) => [`${k} (%)`, String(v)])];
    if (window.self !== window.top) { signaler('Export disponible dans la version installée ou le fichier de démo'); return; }
    try {
      const blob = new Blob(['﻿' + lignes.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'materna-data-indicateurs.csv'; a.click();
      signaler('Indicateurs exportés en CSV');
    } catch { signaler('Export non disponible dans cette page de démonstration'); }
  };
  return (
    <main className="pro-zone pro-v2">
      <Tete titre="Rapports" sous="Indicateurs calculés en direct sur les dossiers de démonstration (anonymisés, fictifs)">
        <button className="btn btn-discret btn-sm" onClick={exporter}><Download size={16} />Exporter en CSV</button>
      </Tete>
      <section className="pro-v2-kpi">
        <div className="carte pro-v2-indic"><span>Dossiers actifs</span><strong className="chiffres">{n}</strong><em>{e.patientes.filter((p) => p.postnatal).length} en post-partum</em></div>
        <div className="carte pro-v2-indic"><span>Dossiers complets</span><strong className="chiffres">{pct(complets, n)} %</strong><em>{complets} sur {n}</em></div>
        <div className="carte pro-v2-indic"><span>Consultations sur 30 jours</span><strong className="chiffres">{cs30}</strong><em>validées et signées</em></div>
        <div className="carte pro-v2-indic pro-v2-indic-alerte"><span><i />À surveiller</span><strong className="chiffres">{e.patientes.filter((p) => p.statut === 'verifier').length}</strong><em>{pct(e.patientes.filter((p) => p.statut === 'verifier').length, n)} % de la file active</em></div>
      </section>
      <div className="pro-v2-deux">
        <section className="carte pro-bloc">
          <div className="pro-bloc-titre"><h2>File active par stade</h2></div>
          <ul className="pro-barres">{stades.map(([k, v]) => <li key={k}><span>{k}</span><i><b style={{ width: `${(v / max) * 100}%` }} /></i><strong className="chiffres">{v}</strong></li>)}</ul>
        </section>
        <section className="carte pro-bloc">
          <div className="pro-bloc-titre"><h2>Activité par praticien</h2><span className="pro-muet">Consultations saisies</span></div>
          <ul className="pro-barres">{parPraticien.map(([k, v]) => <li key={k}><span>{k}</span><i><b style={{ width: `${(v / parPraticien[0][1]) * 100}%` }} /></i><strong className="chiffres">{v}</strong></li>)}</ul>
        </section>
      </div>
      <section className="carte pro-bloc">
        <div className="pro-bloc-titre"><h2>Respect des bonnes pratiques</h2><span className="pro-muet">Le trait vertical marque l’objectif interne retenu pour la démonstration</span></div>
        <ul className="pro-conformite">
          {conformite.map(([k, d, v, obj]) => (
            <li key={k}>
              <div><strong>{k}</strong><span className="chiffres">{v} %</span></div>
              <i className={v >= obj ? 'ok' : 'non'}><b style={{ width: `${v}%` }} /><u style={{ left: `${obj}%` }} /></i>
              <em>{d} · objectif {obj} % · {v >= obj ? 'atteint' : 'non atteint'}</em>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

/* ---------------- Utilisateurs, droits et journal ---------------- */
const matrice: [string, string, Record<'medecin' | 'sagefemme' | 'admin' | 'patiente', boolean | 'soi'>][] = [
  ['Lire le dossier obstétrical', 'Constantes, échographies, antécédents', { medecin: true, sagefemme: true, admin: false, patiente: 'soi' }],
  ['Saisir et signer une consultation', 'TA, poids, HU, BDCF, conduite à tenir', { medecin: true, sagefemme: true, admin: false, patiente: false }],
  ['Prescrire examens et échographies', 'Bilans, sérologies, échographies', { medecin: true, sagefemme: true, admin: false, patiente: false }],
  ['Utiliser l’Espace IA', 'Estimation qualitative, simulation', { medecin: true, sagefemme: false, admin: false, patiente: false }],
  ['Programmer un rendez-vous', 'Agenda de l’établissement', { medecin: true, sagefemme: true, admin: true, patiente: false }],
  ['Voir les rapports anonymisés', 'Indicateurs agrégés', { medecin: true, sagefemme: true, admin: true, patiente: false }],
  ['Gérer les comptes et les droits', 'Créer, suspendre, attribuer un rôle', { medecin: false, sagefemme: false, admin: true, patiente: false }],
  ['Consulter le journal d’accès', 'Lectures, saisies, refus', { medecin: false, sagefemme: false, admin: true, patiente: 'soi' }],
];
export function Acces() {
  const e = useStore();
  const [onglet, setOnglet] = useState<'journal' | 'comptes' | 'matrice'>('journal');
  const [filtre, setFiltre] = useState<'tous' | 'ok' | 'refuse'>('tous');
  const [q, setQ] = useState('');
  const [teste, setTeste] = useState(false);
  const liste = e.journal.filter((j) => filtre === 'tous' || j.resultat === filtre).filter((j) => !q.trim() || `${j.utilisateur} ${j.action} ${j.dossier}`.toLowerCase().includes(q.trim().toLowerCase()));
  const tester = async () => {
    await actions.tentativeExterne('P003').catch(() => {});
    setTeste(true); setOnglet('journal'); setFiltre('tous');
  };
  const Case = ({ v }: { v: boolean | 'soi' }) => v === true ? <Check size={16} className="pro-ok" aria-label="Autorisé" /> : v === 'soi' ? <span className="pro-soi">Le sien</span> : <Minus size={16} className="pro-muet" aria-label="Non autorisé" />;
  return (
    <main className="pro-zone pro-v2">
      <Tete titre="Utilisateurs et journal" sous="Qui peut lire et modifier les dossiers de la maternité, et qui l’a fait">
        <button className="btn btn-discret btn-sm" onClick={tester}><ShieldCheck size={16} />Tester le contrôle d’accès</button>
      </Tete>
      {teste && <div className="pro-test-acces"><Lock size={18} /><div><strong>Accès refusé à un compte non accrédité</strong><span>Le compte externe a tenté d’ouvrir le dossier P003 : l’accès a été bloqué et la tentative ajoutée en tête du journal.</span></div></div>}
      <div className="pro-v2-filtres" role="tablist">
        {([['journal', 'Journal d’accès', e.journal.length], ['comptes', 'Comptes', e.utilisateurs.length], ['matrice', 'Matrice des droits']] as [typeof onglet, string, number?][]).map(([id, l, n]) => <button key={id} role="tab" aria-selected={onglet === id} className={onglet === id ? 'actif' : ''} onClick={() => setOnglet(id)}>{l}{n !== undefined && <span className="chiffres">{n}</span>}</button>)}
      </div>
      {onglet === 'journal' && (
        <section className="carte pro-bloc">
          <div className="pro-journal-outils">
            <div className="pro-segment">{([['tous', 'Tous'], ['ok', 'Autorisés'], ['refuse', 'Refusés']] as const).map(([id, l]) => <button key={id} className={filtre === id ? 'actif' : ''} onClick={() => setFiltre(id)}>{l} <span className="chiffres">{e.journal.filter((j) => id === 'tous' || j.resultat === id).length}</span></button>)}</div>
            <label className="pro-recherche pro-v2-recherche"><Search size={16} /><input placeholder="Utilisateur, dossier, action" value={q} onChange={(ev) => setQ(ev.target.value)} /></label>
          </div>
          <ul className="pro-v2-liste">
            {liste.map((j) => (
              <li key={j.id}>
                <span className="pro-v2-liste-texte"><strong>{j.action}</strong><em>{j.utilisateur} ({roles[j.role]}) · dossier {j.dossier} · {fmtHeure.format(j.date)}</em></span>
                <span className={`pastille ${j.resultat === 'ok' ? 'p-ok' : 'p-critique'}`}>{j.resultat === 'ok' ? 'Autorisé' : 'Refusé'}</span>
              </li>
            ))}
          </ul>
          <p className="pro-muet">Le journal ne peut pas être modifié : chaque lecture, saisie et tentative refusée est horodatée.</p>
        </section>
      )}
      {onglet === 'comptes' && (
        <section className="carte pro-bloc">
          <ul className="pro-v2-liste">
            {e.utilisateurs.map((u) => (
              <li key={u.id}>
                <span className="pro-pat-av">{u.initiales}</span>
                <span className="pro-v2-liste-texte"><strong>{u.nom}</strong><em>{u.fonction} · {u.email}</em></span>
                <span className="pastille p-info">{roles[u.role]}</span>
                <span className={`pastille ${u.actif ? 'p-ok' : 'p-critique'}`}>{u.actif ? 'Actif' : 'Bloqué'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {onglet === 'matrice' && (
        <section className="carte pro-bloc">
          <div className="pro-table-scroll">
            <table className="pro-table pro-matrice">
              <thead><tr><th>Action</th><th>Médecin</th><th>Sage-femme</th><th>Administration</th><th>Patiente</th></tr></thead>
              <tbody>{matrice.map(([a, d, r]) => <tr key={a}><td><strong>{a}</strong><span className="pro-id">{d}</span></td>{(['medecin', 'sagefemme', 'admin', 'patiente'] as const).map((k) => <td key={k}><Case v={r[k]} /></td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="pro-muet">Principe : l’administration gère les comptes mais n’a jamais accès, par défaut, au contenu des dossiers médicaux.</p>
        </section>
      )}
    </main>
  );
}

/* ---------------- Paramètres ---------------- */
export function Parametres({ signaler }: { signaler: (m: string) => void }) {
  const e = useStore();
  const [prefs, setPrefs] = useState({ rappels: true, sms: true, whatsapp: false, deconnexion: true });
  const Interrupteur = ({ k, lib }: { k: keyof typeof prefs; lib: string }) => (
    <li><span>{lib}</span><button role="switch" aria-checked={prefs[k]} className={`pro-switch${prefs[k] ? ' on' : ''}`} onClick={() => setPrefs({ ...prefs, [k]: !prefs[k] })}><span /></button></li>
  );
  return (
    <main className="pro-zone pro-v2">
      <Tete titre="Paramètres" sous="Établissement, profil de démonstration et préférences" />
      <div className="pro-v2-deux">
        <section className="carte pro-bloc">
          <div className="pro-bloc-titre"><h2><Building2 size={16} /> Établissement</h2></div>
          <dl className="pro-dl"><div><dt>Nom</dt><dd>{etablissement.nom} (fictif)</dd></div><div><dt>Ville</dt><dd>{etablissement.ville}</dd></div><div><dt>Services</dt><dd>Consultation obstétrique, maïeutique, pédiatrie, laboratoire</dd></div><div><dt>Hébergement des données</dt><dd>Serveur sécurisé, formalités auprès de la CDP (loi n° 2008-12)</dd></div></dl>
        </section>
        <section className="carte pro-bloc">
          <div className="pro-bloc-titre"><h2>Profil de démonstration</h2><span className="pro-muet">Pour tester les droits d’accès</span></div>
          <ul className="pro-profils">
            {e.utilisateurs.map((u) => (
              <li key={u.id}><button className={e.profil === u.id ? 'actif' : ''} onClick={() => { actions.changerProfil(u.id).then(() => signaler(`Connecté en tant que ${u.nom} (${roles[u.role as Role]})`)).catch((x: Error) => signaler(x.message)); }}>
                <span className="pro-pat-av">{u.initiales}</span><span className="pro-v2-liste-texte"><strong>{u.nom}</strong><em>{roles[u.role as Role]}</em></span>{e.profil === u.id && <Check size={16} />}
              </button></li>
            ))}
          </ul>
        </section>
        <section className="carte pro-bloc">
          <div className="pro-bloc-titre"><h2>Rappels et sécurité</h2></div>
          <ul className="pro-interrupteurs">
            <Interrupteur k="rappels" lib="Rappels automatiques aux patientes la veille" />
            <Interrupteur k="sms" lib="Envoi des rappels par SMS" />
            <Interrupteur k="whatsapp" lib="Envoi des rappels par WhatsApp" />
            <Interrupteur k="deconnexion" lib="Déconnexion après 15 minutes d’inactivité" />
          </ul>
        </section>
        <section className="carte pro-bloc">
          <div className="pro-bloc-titre"><h2>Démonstration</h2></div>
          <p className="pro-muet">Remet tous les dossiers, rendez-vous, consultations et le journal dans leur état initial.</p>
          <button className="btn btn-discret btn-sm" onClick={() => { actions.reinitialiser().then(() => signaler('Démonstration réinitialisée')).catch((x: Error) => signaler(x.message)); }}><RotateCcw size={16} />Réinitialiser la démo</button>
        </section>
      </div>
      <p className="pro-muet pro-fictif">Connecté en tant que {profilActif(e).nom}.</p>
    </main>
  );
}
