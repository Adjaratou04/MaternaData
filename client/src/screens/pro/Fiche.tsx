import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ClipboardPlus, CalendarPlus, Sparkles, Phone, ShieldX, KeyRound, AlertTriangle, Info, CircleAlert, CheckCircle2, CircleDashed, CalendarClock, Check, X } from 'lucide-react';
import { AideIA } from '../ProIA';
import { CarnetEnfantContenu } from './Ecrans';
import { useStore, profilActif, peutLireDossier, actions, pointsAttention, consultationsDe, saA, roles } from '../../data/store';
import { aujourdhui, joursEntre, formatDate, formatJour, suiviGrossesse } from '../../data/apercu';

const initiales = (n: string) => n.split(' ').map((m) => m[0]).join('').slice(0, 2);
const libStatut: Record<string, [string, string]> = { regulier: ['Suivi régulier', 'p-ok'], incomplet: ['Dossier incomplet', 'p-alerte'], verifier: ['Valeur à vérifier', 'p-critique'], terme: ['Terme proche', 'p-rose'], postnatal: ['Suivi postnatal', 'p-info'] };
const fmtCourt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

export function AccesRefuse({ dossier, onRetour }: { dossier: string; onRetour: () => void }) {
  const u = profilActif();
  const fait = useRef(false);
  useEffect(() => { if (!fait.current) { fait.current = true; actions.journaliser('Tentative d’ouverture du dossier', dossier, 'refuse'); } }, [dossier]);
  return (
    <main className="pro-zone pro-v2">
      <div className="carte pro-refus">
        <span className="pro-refus-icone"><ShieldX size={30} /></span>
        <h1>Accès non autorisé</h1>
        <p>Le profil <strong>{u.nom}</strong> ({roles[u.role]}) n’a pas accès au contenu des dossiers médicaux. Les dossiers sont couverts par le secret médical : cette tentative a été enregistrée dans le journal d’accès.</p>
        <p className="pro-muet">Pour la démonstration, changez de profil depuis le menu en haut à droite.</p>
        <button className="btn btn-discret btn-sm" onClick={onRetour}><ArrowLeft size={16} />Retour</button>
      </div>
    </main>
  );
}

type Onglet = 'synthese' | 'grossesse' | 'consultations' | 'examens' | 'antecedents' | 'enfant' | 'ia' | 'acces';

export function FichePatiente({ pid, onRetour, onConsultation, onRdv }: { pid: string; onRetour: () => void; onConsultation: () => void; onRdv: () => void }) {
  const e = useStore();
  const u = profilActif(e);
  const p = e.patientes.find((x) => x.id === pid);
  const [onglet, setOnglet] = useState<Onglet>('synthese');
  const lu = useRef('');
  useEffect(() => { if (p && peutLireDossier(u) && lu.current !== pid + u.id) { lu.current = pid + u.id; actions.journaliser('Consultation du dossier', pid); } }, [pid, u.id]);
  if (!p) return null;
  if (!peutLireDossier(u)) return <AccesRefuse dossier={pid} onRetour={onRetour} />;

  const t = aujourdhui();
  const g = p.ddr ? suiviGrossesse(p.ddr) : null;
  const cs = consultationsDe(p.id, e.consultations);
  const dern = cs[cs.length - 1];
  const exs = e.examens.filter((x) => x.patiente === p.id).sort((a, b) => b.date.getTime() - a.date.getTime());
  const pts = pointsAttention(p, e.consultations);
  const rdv = e.rdv.filter((r) => r.patiente === p.id && joursEntre(t, r.date) >= 0).sort((a, b) => a.date.getTime() - b.date.getTime() || a.heure.localeCompare(b.heure))[0];
  const [lib, cls] = libStatut[p.statut];
  const iaDispo = ['P001', 'P002', 'P003', 'P004'].includes(p.id);

  return (
    <main className="pro-zone pro-v2">
      <button className="pro-retour" onClick={onRetour}><ArrowLeft size={16} />Patientes</button>
      <section className="carte pro-fiche-tete">
        <span className="pro-fiche-av">{initiales(p.nom)}</span>
        <div className="pro-fiche-id">
          <h1>{p.nom}</h1>
          <p>{p.id} · {p.age} ans · {p.profession}</p>
          <div className="pro-fiche-badges">
            <span className={`pastille ${cls}`}>{lib}</span>
            {g && <span className="pro-fiche-sa chiffres">{g.sa} SA + {g.j} j · {g.trimestre === 1 ? '1er' : `${g.trimestre}e`} trimestre</span>}
            {g && <span className="pro-muet">Date prévue : {formatDate(g.dpa)}</span>}
            {!g && !p.postnatal && <span className="pro-muet">Date des dernières règles manquante</span>}
          </div>
        </div>
        <div className="pro-actions">
          <button className="btn btn-primaire btn-sm" onClick={onConsultation}><ClipboardPlus size={16} />Nouvelle consultation</button>
          <button className="btn btn-discret btn-sm" onClick={onRdv}><CalendarPlus size={16} />Rendez-vous</button>
          {iaDispo && <button className="btn btn-discret btn-sm" onClick={() => setOnglet('ia')}><Sparkles size={16} />Aide IA</button>}
        </div>
      </section>

      <div className="pro-v2-filtres" role="tablist" aria-label="Sections du dossier">
        {([['synthese', 'Synthèse'], ...(g ? [['grossesse', 'Grossesse']] : []), ['consultations', `Consultations`, cs.length], ['examens', 'Examens', exs.length], ['antecedents', 'Antécédents'], ...(p.postnatal ? [['enfant', 'Enfant']] : []), ...(iaDispo ? [['ia', 'Aide IA']] : []), ['acces', 'Accès']] as [Onglet, string, number?][]).map(([id, l, n]) => (
          <button key={id} role="tab" aria-selected={onglet === id} className={onglet === id ? 'actif' : ''} onClick={() => setOnglet(id)}>{l}{n !== undefined && <span className="chiffres">{n}</span>}</button>
        ))}
      </div>

      {onglet === 'synthese' && (
        <div className="pro-fiche-grille">
          <section className="carte pro-bloc pro-fiche-large">
            <div className="pro-bloc-titre"><h2>Feuille de surveillance</h2><span className="pro-muet">{cs.length} consultation{cs.length > 1 ? 's' : ''} · SA recalculées depuis la date des dernières règles</span></div>
            {cs.length === 0 ? <p className="pro-muet">Aucune consultation enregistrée. Saisissez la première avec « Nouvelle consultation ».</p> : (
            <div className="pro-table-scroll">
              <table className="pro-table pro-surv">
                <thead><tr><th>Date</th><th>Type</th><th>SA</th><th>TA</th><th>Poids</th><th>HU</th><th>BDCF</th><th>Bandelette</th></tr></thead>
                <tbody>
                  {[...cs].reverse().map((c) => { const s = saA(p, c.date); const haute = c.ta && (c.ta[0] >= 135 || c.ta[1] >= 85); return (
                    <tr key={c.id}>
                      <td className="chiffres">{fmtCourt.format(c.date)}</td><td><span className="pro-type">{c.type}</span></td>
                      <td className="chiffres">{s ? `${s.sa} SA` : '—'}</td>
                      <td className={`chiffres ${haute ? 'pro-haute' : ''}`}>{c.ta ? `${c.ta[0]}/${c.ta[1]}` : '—'}</td>
                      <td className="chiffres">{c.poids ? `${c.poids} kg` : '—'}</td><td className="chiffres">{c.hu ? `${c.hu} cm` : '—'}</td>
                      <td className="chiffres">{c.bdcf ?? '—'}</td><td className={c.bandelette && /prot/i.test(c.bandelette) ? 'pro-haute' : ''}>{c.bandelette ?? '—'}</td>
                    </tr>); })}
                </tbody>
              </table>
            </div>)}
          </section>

          <section className="carte pro-bloc">
            <div className="pro-bloc-titre"><h2>Points d’attention</h2><span className="pro-muet">Calculés automatiquement</span></div>
            {pts.length === 0 ? <p className="pro-muet">Aucun point d’attention sur les dernières valeurs.</p> : (
              <ul className="pro-points">{pts.map((x) => <li key={x.texte} className={x.niveau}>{x.niveau === 'critique' ? <CircleAlert size={16} /> : x.niveau === 'alerte' ? <AlertTriangle size={16} /> : <Info size={16} />}{x.texte}</li>)}</ul>)}
          </section>

          <section className="carte pro-bloc">
            <div className="pro-bloc-titre"><h2>Prochain rendez-vous</h2></div>
            {rdv ? (<div className="pro-fiche-rdv"><strong>{joursEntre(t, rdv.date) === 0 ? 'Aujourd’hui' : formatJour(rdv.date)} · {rdv.heure}</strong><span>{rdv.motif}</span><em>{rdv.avec} · {rdv.lieu}</em></div>)
              : <p className="pro-muet">Aucun rendez-vous programmé.</p>}
          </section>

          {dern && (
            <section className="carte pro-bloc">
              <div className="pro-bloc-titre"><h2>Conduite à tenir</h2><span className="pro-muet">{dern.type} du {fmtCourt.format(dern.date)}</span></div>
              <p className="pro-fiche-texte">{dern.conduite}</p>
              <p className="pro-muet">{dern.par}</p>
            </section>
          )}

          <section className="carte pro-bloc">
            <div className="pro-bloc-titre"><h2>Coordonnées</h2></div>
            <dl className="pro-dl">
              <div><dt>Téléphone</dt><dd className="chiffres">{p.telephone}</dd></div>
              <div><dt>Adresse</dt><dd>{p.adresse}</dd></div>
              <div><dt>Personne à prévenir</dt><dd>{p.urgence.nom}{p.urgence.lien ? ` · ${p.urgence.lien}` : ''}{p.urgence.tel && <span className="pro-appel"><Phone size={13} />{p.urgence.tel}</span>}</dd></div>
              <div><dt>Code de liaison mobile</dt><dd className="pro-code"><KeyRound size={14} />{p.code}</dd></div>
            </dl>
          </section>
        </div>
      )}

      {onglet === 'consultations' && (
        <div className="pro-cartes">
          {cs.length === 0 && <p className="pro-muet">Aucune consultation enregistrée.</p>}
          {[...cs].reverse().map((c) => { const s = saA(p, c.date); return (
            <section key={c.id} className="carte pro-bloc">
              <div className="pro-bloc-titre"><h2><span className="pro-type">{c.type}</span> {fmtCourt.format(c.date)}{s ? ` · ${s.sa} SA + ${s.j} j` : ''}</h2><span className="pro-muet">{c.par}</span></div>
              <dl className="pro-dl pro-dl-ligne">
                <div><dt>Tension</dt><dd className="chiffres">{c.ta ? `${c.ta[0]}/${c.ta[1]} mmHg` : '—'}</dd></div>
                <div><dt>Poids</dt><dd className="chiffres">{c.poids ? `${c.poids} kg` : '—'}</dd></div>
                <div><dt>Hauteur utérine</dt><dd className="chiffres">{c.hu ? `${c.hu} cm` : '—'}</dd></div>
                <div><dt>BDCF</dt><dd className="chiffres">{c.bdcf ? `${c.bdcf} bpm` : '—'}</dd></div>
                <div><dt>Bandelette</dt><dd>{c.bandelette ?? '—'}</dd></div>
              </dl>
              <p className="pro-fiche-texte"><strong>Observations : </strong>{c.notes}</p>
              <p className="pro-fiche-texte"><strong>Conduite à tenir : </strong>{c.conduite}</p>
            </section>); })}
        </div>
      )}

      {onglet === 'examens' && (
        <div className="pro-cartes">
          {exs.length === 0 && <p className="pro-muet">Aucun examen enregistré.</p>}
          {exs.map((x) => (
            <section key={x.id} className="carte pro-bloc">
              <div className="pro-bloc-titre"><h2><span className={`pro-type ${x.type === 'Échographie' ? 'echo' : ''}`}>{x.type}</span> {x.titre}</h2><span className="pro-muet">{fmtCourt.format(x.date)}{saA(p, x.date) ? ` · ${saA(p, x.date)!.sa} SA` : ''}</span></div>
              <p className="pro-fiche-texte">{x.resume}</p>
              <table className="pro-valeurs"><tbody>{x.valeurs.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody></table>
            </section>
          ))}
        </div>
      )}

      {onglet === 'antecedents' && (
        <section className="carte pro-bloc">
          <dl className="pro-dl pro-dl-ligne">
            <div><dt>Groupe sanguin</dt><dd>{p.groupe}</dd></div>
            <div><dt>Gestité</dt><dd>{p.gestite}</dd></div>
            <div><dt>Parité</dt><dd>{p.parite}</dd></div>
            <div><dt>Césariennes</dt><dd>{p.cesariennes}</dd></div>
          </dl>
          <dl className="pro-dl">
            <div><dt>Allergies</dt><dd>{p.allergies}</dd></div>
            <div><dt>Antécédents médicaux</dt><dd>{p.antecedentsMed}</dd></div>
            <div><dt>Antécédents chirurgicaux</dt><dd>{p.antecedentsChir}</dd></div>
          </dl>
        </section>
      )}
      {onglet === 'grossesse' && g && <GrossessePro pid={p.id} />}
      {onglet === 'enfant' && <CarnetEnfantContenu />}
      {onglet === 'ia' && <AideIA pid={p.id} />}
      {onglet === 'acces' && <AccesDossier pid={p.id} code={p.code} />}
      <p className="pro-muet pro-fictif">Patiente et données entièrement fictives · prototype académique.</p>
    </main>
  );
}

/* ---------- Onglet Grossesse : terme, trimestres et calendrier national des 4 CPN ---------- */
const REPERES_CPN: [string, string][] = [['CPN 1', 'Au 1er trimestre (avant 16 SA)'], ['CPN 2', 'Entre 24 et 28 SA'], ['CPN 3', 'Vers 32 SA'], ['CPN 4', 'Vers 36 SA']];

function GrossessePro({ pid }: { pid: string }) {
  const e = useStore();
  const p = e.patientes.find((x) => x.id === pid)!;
  const g = suiviGrossesse(p.ddr!);
  const t = aujourdhui();
  const cs = consultationsDe(pid, e.consultations);
  const rdvs = e.rdv.filter((r) => r.patiente === pid && joursEntre(t, r.date) >= 0);
  const echos = e.examens.filter((x) => x.patiente === pid && x.type === 'Échographie');
  const pos = (sa: number) => `${Math.min(100, (sa / 40) * 100)}%`;
  return (
    <div className="pro-fiche-grille">
      <section className="carte pro-bloc pro-fiche-large">
        <div className="pro-bloc-titre"><h2>Avancement</h2><span className="pro-muet">Calcul réel : dernières règles le {formatDate(p.ddr!)} + 280 jours</span></div>
        <div className="pro-gro-chiffres">
          <div><span>Âge gestationnel</span><strong className="chiffres">{g.sa} SA + {g.j} j</strong><em>{g.sg} semaines de grossesse</em></div>
          <div><span>Trimestre</span><strong>{g.trimestre === 1 ? '1er' : `${g.trimestre}e`}</strong><em>T1 &lt; 15 SA · T2 &lt; 29 SA</em></div>
          <div><span>Date prévue</span><strong className="chiffres">{formatDate(g.dpa)}</strong><em>dans {joursEntre(t, g.dpa)} jours</em></div>
        </div>
        <div className="pro-gro-barre" aria-hidden="true">
          <span className="pro-gro-rempli" style={{ width: pos(g.sa + g.j / 7) }} />
          <i style={{ left: pos(15) }} /><i style={{ left: pos(29) }} />
          {REPERES_CPN.map(([n], k) => <b key={n} style={{ left: pos([14, 26, 32, 36][k]) }} title={n}>{k + 1}</b>)}
        </div>
        <div className="pro-gro-graduations chiffres"><span>0</span><span>15 SA</span><span>29 SA</span><span>Terme 40 SA</span></div>
      </section>

      <section className="carte pro-bloc pro-fiche-large">
        <div className="pro-bloc-titre"><h2>Calendrier des 4 CPN</h2><span className="pro-muet">Protocole national · {cs.filter((c) => /^CPN/.test(c.type)).length} sur 4 réalisées</span></div>
        <div className="pro-table-scroll">
          <table className="pro-table">
            <thead><tr><th>Consultation</th><th>Période recommandée</th><th>État</th><th>Réalisée par</th></tr></thead>
            <tbody>
              {REPERES_CPN.map(([nom, quand]) => {
                const c = cs.find((x) => x.type === nom);
                const r = rdvs.find((x) => x.motif.includes(`(${nom})`));
                const s = c ? saA(p, c.date) : null;
                return (
                  <tr key={nom}>
                    <td><strong>{nom}</strong></td>
                    <td className="pro-muet">{quand}</td>
                    <td>{c ? <span className="pro-cpn-etat ok"><CheckCircle2 size={15} />Faite le {fmtCourt.format(c.date)}{s ? ` (${s.sa} SA)` : ''}</span>
                      : r ? <span className="pro-cpn-etat prevu"><CalendarClock size={15} />Prévue le {fmtCourt.format(r.date)}</span>
                      : <span className="pro-cpn-etat"><CircleDashed size={15} />À programmer</span>}</td>
                    <td className="pro-muet">{c?.par ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {cs.some((c) => !/^CPN/.test(c.type)) && <p className="pro-muet">Consultations de suivi en plus : {cs.filter((c) => !/^CPN/.test(c.type)).map((c) => fmtCourt.format(c.date)).join(', ')}.</p>}
      </section>

      <section className="carte pro-bloc">
        <div className="pro-bloc-titre"><h2>Échographies</h2></div>
        {echos.length === 0 ? <p className="pro-muet">Aucune échographie enregistrée.</p> : (
          <ul className="pro-v2-liste">{echos.map((x) => <li key={x.id}><span className="pro-v2-liste-texte"><strong>{x.titre}</strong><em>{fmtCourt.format(x.date)} · {x.resume}</em></span></li>)}</ul>)}
      </section>
      <section className="carte pro-bloc">
        <div className="pro-bloc-titre"><h2>Prochains rendez-vous</h2></div>
        {rdvs.length === 0 ? <p className="pro-muet">Aucun rendez-vous programmé.</p> : (
          <ul className="pro-v2-liste">{[...rdvs].sort((a, b) => a.date.getTime() - b.date.getTime()).map((r) => <li key={r.id}><span className="pro-v2-liste-texte"><strong>{r.motif}</strong><em>{formatJour(r.date)} à {r.heure} · {r.avec}</em></span><span className={`pastille ${r.statut === 'confirme' ? 'p-ok' : 'p-alerte'}`}>{r.statut === 'confirme' ? 'Confirmé' : 'À confirmer'}</span></li>)}</ul>)}
      </section>
    </div>
  );
}

/* ---------- Onglet Accès : qui a consulté ce dossier ---------- */
function AccesDossier({ pid, code }: { pid: string; code: string }) {
  const { journal } = useStore();
  const lignes = journal.filter((j) => j.dossier === pid);
  const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return (
    <div className="pro-fiche-grille">
      <section className="carte pro-bloc pro-fiche-large">
        <div className="pro-bloc-titre"><h2>Journal des accès à ce dossier</h2><span className="pro-muet">{lignes.length} entrée{lignes.length > 1 ? 's' : ''} · non modifiable</span></div>
        <div className="pro-table-scroll">
          <table className="pro-table">
            <thead><tr><th>Date</th><th>Personne</th><th>Rôle</th><th>Action</th><th>Résultat</th></tr></thead>
            <tbody>{lignes.map((j) => (
              <tr key={j.id}><td className="chiffres pro-muet">{fmt.format(j.date)}</td><td>{j.utilisateur}</td><td className="pro-muet">{roles[j.role]}</td><td>{j.action}</td>
                <td>{j.resultat === 'ok' ? <span className="pastille p-ok"><Check size={12} />Autorisé</span> : <span className="pastille p-critique"><X size={12} />Refusé</span>}</td></tr>))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="carte pro-bloc">
        <div className="pro-bloc-titre"><h2>Accès de la patiente</h2></div>
        <dl className="pro-dl">
          <div><dt>Code de liaison à remettre</dt><dd className="pro-code"><KeyRound size={14} />{code}</dd></div>
          <div><dt>Contrôles avant ouverture</dt><dd>Code de liaison, code SMS au numéro du dossier, consentement de la patiente</dd></div>
        </dl>
      </section>
      <section className="carte pro-bloc">
        <div className="pro-bloc-titre"><h2>Qui peut lire ce dossier</h2></div>
        <dl className="pro-dl">
          <div><dt>Médecins et sages-femmes de l’établissement</dt><dd>Lecture et saisie</dd></div>
          <div><dt>Administration</dt><dd>Aucun accès au contenu médical</dd></div>
          <div><dt>La patiente</dt><dd>Lecture de son carnet, après consentement</dd></div>
        </dl>
      </section>
    </div>
  );
}
