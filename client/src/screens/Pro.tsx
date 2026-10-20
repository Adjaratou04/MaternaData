import { Fragment, useEffect, useState } from 'react';
import { EspaceIA, Recommandations } from './ProIA';
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope, HeartPulse, Baby, Sparkles, BarChart3, ShieldCheck,
  Search, Plus, ClipboardPlus, CalendarPlus, Bell, ChevronDown, Building2, ArrowUpRight, AlertTriangle,
  FileWarning, CalendarCheck, Settings, Clock, ChevronRight, MoreHorizontal,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { etablissement, aujourdhui, joursEntre, formatJour, formatDate, suiviGrossesse, type Statut } from '../data/apercu';
import { useStore, actions, profilActif, peutLireDossier, pointsAttention, roles, type Utilisateur } from '../data/store';
import { NouveauDossier, NouvelleConsultation, NouveauRdv, Confirmation } from './pro/Formulaires';
import { FichePatiente, AccesRefuse } from './pro/Fiche';
import { Agenda, Consultations, SuiviGrossesse, SuiviEnfant, Rapports, Acces, Parametres } from './pro/Ecrans';

const salutation = (u: Utilisateur) => (u.nom.startsWith('Dr ') ? `Dr ${u.nom.split(' ').slice(-1)[0]}` : u.nom.split(' ')[0]);

const libelleStatut: Record<Statut, { texte: string; classe: string }> = {
  regulier: { texte: 'Suivi régulier', classe: 'p-ok' },
  incomplet: { texte: 'Dossier incomplet', classe: 'p-alerte' },
  verifier: { texte: 'Valeur à vérifier', classe: 'p-critique' },
  terme: { texte: 'Terme proche', classe: 'p-rose' },
  postnatal: { texte: 'Suivi postnatal', classe: 'p-info' },
};

const enMinutes = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const initiales = (nom: string) => nom.split(' ').map((m) => m[0]).join('');
const SA_MAX = 42;

/* Frise de cohorte : chaque patiente placée à son terme actuel, sur 40 semaines */
function VueCohorte({ rdvAujourdhui, onOuvrir }: { rdvAujourdhui: Set<string>; onOuvrir: (pid: string) => void }) {
  const { patientes } = useStore();
  const enCours = patientes.filter((p) => p.ddr).map((p) => ({ p, g: suiviGrossesse(p.ddr!) })).sort((a, b) => a.g.sa - b.g.sa);
  const sansTerme = patientes.filter((p) => !p.ddr && !p.postnatal);
  const postnatal = patientes.filter((p) => p.statut === 'postnatal');
  const pos = (sa: number) => `${(sa / SA_MAX) * 100}%`;
  const Pin = ({ id, nom, statut, sous, style, bas }: { id: string; nom: string; statut: Statut; sous: string; style?: React.CSSProperties; bas?: boolean }) => (
    <button className={`co-pin co-${statut} ${bas ? 'co-bas' : ''}`} style={style} title={`${nom} · ${sous}`} onClick={() => onOuvrir(id)}>
      <span className="co-av">{initiales(nom)}{rdvAujourdhui.has(id) && <i className="co-rdv" aria-label="Rendez-vous aujourd’hui"><CalendarDays size={9} strokeWidth={3} /></i>}</span>
      <span className="co-tige" />
      <span className="co-etiquette"><strong>{nom.split(' ')[0]}</strong><em className="chiffres">{sous}</em></span>
    </button>
  );
  return (
    <div className="co">
      <div className="co-cote co-cote-g">
        <span className="co-cote-titre">Terme à renseigner</span>
        {sansTerme.map((p) => <Pin key={p.id} id={p.id} nom={p.nom} statut={p.statut} sous="DDR manquante" />)}
      </div>
      <div className="co-piste">
        <div className="co-trimestres">
          <span style={{ left: 0, width: pos(15) }}>1<sup>er</sup> trimestre</span>
          <span style={{ left: pos(15), width: `calc(${pos(29)} - ${pos(15)})` }}>2<sup>e</sup> trimestre</span>
          <span style={{ left: pos(29), width: `calc(100% - ${pos(29)})` }}>3<sup>e</sup> trimestre</span>
        </div>
        <div className="co-rail">
          <span className="co-ligne-terme" style={{ left: pos(40) }}><em>Terme 40 SA</em></span>
          {enCours.map(({ p, g }, k) => (
            <Pin key={p.id} id={p.id} nom={p.nom} statut={p.statut} sous={`${g.sa} SA + ${g.j} j`} bas={k % 2 === 1} style={{ left: pos(g.sa + g.j / 7) }} />
          ))}
        </div>
        <div className="co-graduations chiffres">
          {Array.from({ length: 11 }, (_, i) => i * 4).map((s) => <span key={s} style={{ left: pos(s) }}>{s}</span>)}
          <span className="co-unite" style={{ left: '100%' }}>SA</span>
        </div>
      </div>
      <div className="co-cote co-cote-d">
        <span className="co-cote-titre">Après l’accouchement</span>
        {postnatal.map((p) => <Pin key={p.id} id={p.id} nom={p.nom} statut={p.statut} sous="Mère et enfant" />)}
      </div>
    </div>
  );
}

export function ProTableauDeBord({ onChangerEspace, onDeconnexion }: { onChangerEspace?: () => void; onDeconnexion?: () => void } = {}) {
  const e = useStore();
  const u = profilActif(e);
  const { patientes, consultations } = e;
  const rendezVous = e.rdv;
  const nomPatiente = (id: string) => patientes.find((p) => p.id === id)?.nom ?? id;
  const [page, setPageBrut] = useState<string>(() => (profilActif().role === 'admin' ? 'admin' : 'tableau'));
  const [adminOnglet, setAdminOnglet] = useState<'acces' | 'parametres'>('acces');
  const [ficheId, setFicheId] = useState<string | null>(null);
  const [modale, setModale] = useState<{ type: 'dossier' | 'consultation' | 'rdv'; pid?: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [menu, setMenu] = useState(false);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 2800); return () => clearTimeout(id); }, [toast]);
  const setPage = (p: string) => { setPageBrut(p); setMenu(false); window.scrollTo?.({ top: 0 }); };
  const ouvrir = (pid: string) => { setFicheId(pid); setPage('fiche'); };
  const t = aujourdhui();
  const maintenant = new Date();
  const minNow = maintenant.getHours() * 60 + maintenant.getMinutes();
  const rdvDuJour = rendezVous.filter((r) => joursEntre(t, r.date) === 0).sort((a, b) => a.heure.localeCompare(b.heure));
  const idxProchain = rdvDuJour.findIndex((r) => enMinutes(r.heure) >= minNow);
  const aTraiter = [
    ...patientes.flatMap((p) => { const pts = pointsAttention(p, consultations).filter((x) => x.niveau !== 'info'); if (!pts.length) return []; const top = pts.find((x) => x.niveau === 'critique') ?? pts[0]; return [{ id: p.id, classe: top.niveau, titre: pts.map((x) => x.texte).join(' · '), detail: /règles/.test(top.texte) ? 'Dossier à compléter' : top.niveau === 'critique' ? 'Contrôle à programmer rapidement' : 'À surveiller' }]; }),
    ...rdvDuJour.filter((r) => r.statut === 'a-confirmer').map((r) => ({ id: r.patiente, classe: 'info' as const, titre: 'Rendez-vous à confirmer', detail: `${r.motif} à ${r.heure} aujourd’hui` })),
  ];
  const enCours = patientes.filter((p) => p.ddr);
  const postnatal = patientes.filter((p) => p.postnatal).length;
  const aSurveiller = patientes.filter((p) => p.statut === 'verifier');
  const termesProches = enCours.map((p) => ({ p, g: suiviGrossesse(p.ddr!) })).filter(({ g }) => joursEntre(t, g.dpa) <= 30);
  const rdv7j = rendezVous.filter((r) => joursEntre(t, r.date) >= 0 && joursEntre(t, r.date) <= 7).sort((a, b) => a.date.getTime() - b.date.getTime() || a.heure.localeCompare(b.heure));
  const medical = ['tableau', 'patientes', 'fiche', 'consultations', 'grossesse', 'enfant', 'ia', 'docs'];
  const bloque = medical.includes(page) && !peutLireDossier(u);
  const changerProfil = async (id: string) => {
    const nu = e.utilisateurs.find((x) => x.id === id)!;
    setMenu(false);
    try { await actions.changerProfil(id); } catch (x) { setToast((x as Error).message); return; }
    setToast(`Connecté en tant que ${nu.nom} (${roles[nu.role]})`);
    if (!peutLireDossier(nu) && medical.includes(page)) setPageBrut(nu.role === 'admin' ? 'admin' : page);
  };

  return (
    <div className="pro">
      <aside className="pro-barre">
        <div className="pro-logo"><Logo hauteur={30} inverse /></div>
        <nav aria-label="Menu professionnel">
          {([
            ['tableau', 'Aujourd’hui', LayoutDashboard], ['patientes', 'Patientes', Users, patientes.length],
            ['rdv', 'Agenda', CalendarDays, rdvDuJour.length], ['rapports', 'Rapports', BarChart3], ['admin', 'Administration', ShieldCheck],
          ] as [string, string, typeof Users, number?][]).map(([id, lib, Icone, n]) => (
            <button key={id} className={page === id || (id === 'patientes' && page === 'fiche') ? 'actif' : ''} onClick={() => setPage(id)}><Icone size={18} />{lib}{n !== undefined && <span className="pro-compteur">{n}</span>}</button>))}
        </nav>
        {onChangerEspace && <button className="pro-changer" onClick={onChangerEspace}>Changer d’espace</button>}
        <div className="pro-barre-pied">
          <Building2 size={16} />
          <div><strong>{etablissement.nom}</strong><span>Établissement fictif, Dakar</span></div>
        </div>
      </aside>

      <div className="pro-principal">
        <header className="pro-haut">
          <label className="pro-recherche">
            <Search size={16} />
            <input id="recherche-patiente" placeholder="Rechercher une patiente par nom ou identifiant" value={recherche} onChange={(ev) => { setRecherche(ev.target.value); if (page !== 'patientes') setPage('patientes'); }} />
            <kbd>Ctrl K</kbd>
          </label>
          <div className="pro-haut-droite">
            <button className="pro-icone" aria-label="Notifications, 3 nouvelles"><Bell size={18} /><span className="pro-icone-pastille" /></button>
            <div className="pro-menu-profil">
              <button className="pro-utilisateur" onClick={() => setMenu(!menu)} aria-expanded={menu}>
                <span className="pro-avatar">{u.initiales}</span>
                <div><strong>{u.nom}</strong><span>{u.fonction}</span></div>
                <ChevronDown size={16} />
              </button>
              {menu && (
                <div className="pro-menu" role="menu">
                  <p className="pro-menu-titre">Changer de profil (démonstration)</p>
                  {e.utilisateurs.map((x) => <button key={x.id} role="menuitem" className={x.id === u.id ? 'actif' : ''} onClick={() => changerProfil(x.id)}><span>{x.nom}</span><em>{roles[x.role]}</em></button>)}
                  <button role="menuitem" className="pro-menu-reset" onClick={() => { setMenu(false); actions.reinitialiser().then(() => { setPage('tableau'); setToast('Démonstration réinitialisée'); }).catch((x: Error) => setToast(x.message)); }}>Réinitialiser la démo</button>
                  {onDeconnexion && <button role="menuitem" className="pro-menu-reset" onClick={() => { setMenu(false); onDeconnexion(); }}>Se déconnecter</button>}
                </div>
              )}
            </div>
          </div>
        </header>

        {page === 'tableau' && !bloque && (
        <main className="pro-zone pro-v2">
          <section className="pro-v2-tete" aria-label="Accueil">
            <div>
              <p className="pro-date">{new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(t)}</p>
              <h1>Bonjour {salutation(u)}</h1>
              <p className="pro-v2-resume">{rdvDuJour.length} patientes vous attendent aujourd’hui · {aTraiter.length} points à traiter</p>
            </div>
            <div className="pro-actions">
              <button className="btn btn-discret btn-sm" onClick={() => setModale({ type: 'rdv' })}><CalendarPlus size={16} />Rendez-vous</button>
              <button className="btn btn-discret btn-sm" onClick={() => setModale({ type: 'consultation' })}><ClipboardPlus size={16} />Consultation</button>
              <button className="btn btn-primaire btn-sm" onClick={() => setModale({ type: 'dossier' })}><Plus size={16} />Nouveau dossier</button>
            </div>
          </section>

          <section className="pro-v2-kpi" aria-label="Indicateurs">
            <div className="carte pro-v2-indic"><span>Grossesses suivies</span><strong className="chiffres">{enCours.length}</strong><em>{postnatal} en post-partum</em></div>
            <div className="carte pro-v2-indic pro-v2-indic-alerte"><span><i />À surveiller</span><strong className="chiffres">{aSurveiller.length}</strong><em>{aSurveiller.map((p) => p.nom).join(', ') || 'Aucune'}</em></div>
            <div className="carte pro-v2-indic"><span>Rendez-vous aujourd’hui</span><strong className="chiffres">{rdvDuJour.length}</strong><em>{idxProchain >= 0 ? `Prochaine : ${nomPatiente(rdvDuJour[idxProchain].patiente)} à ${rdvDuJour[idxProchain].heure}` : 'Journée terminée'}</em></div>
            <div className="carte pro-v2-indic"><span>Terme sous 30 jours</span><strong className="chiffres">{termesProches.length}</strong><em>{termesProches.map(({ p }) => p.nom).join(', ') || 'Aucune'}</em></div>
          </section>

          <section className="carte pro-v2-cohorte" aria-label="Patientes sur 40 semaines">
            <div className="pro-bloc-titre">
              <h2>Vos patientes sur 40 semaines</h2>
              <span className="pro-legende pro-legende-clair">
                <span><i className="l-ok" />Suivi régulier</span><span><i className="l-verifier" />À vérifier</span>
                <span><i className="l-terme" />Terme proche</span><span><i className="l-rdv"><CalendarDays size={8} strokeWidth={3} /></i>Vue aujourd’hui</span>
              </span>
            </div>
            <div className="co-clair"><VueCohorte rdvAujourdhui={new Set(rdvDuJour.map((r) => r.patiente))} onOuvrir={ouvrir} /></div>
          </section>

          <div className="pro-v2-deux">
            <section className="carte pro-bloc">
              <div className="pro-bloc-titre"><h2>Vigilances</h2><span className="pro-muet">Calculées à partir des derniers relevés du dossier</span></div>
              <ul className="pro-v2-liste">
                {aTraiter.map((a) => (
                  <li key={a.id + a.titre}>
                    <span className="pro-pat-av">{initiales(nomPatiente(a.id))}</span>
                    <button className="pro-v2-liste-texte pro-lien-ligne" onClick={() => ouvrir(a.id)}><strong>{nomPatiente(a.id)}</strong><em>{a.titre} · {a.detail}</em></button>
                    <span className={`pastille ${a.classe === 'critique' ? 'p-critique' : a.classe === 'alerte' ? 'p-alerte' : 'p-info'}`}>{a.classe === 'critique' ? 'À vérifier' : a.classe === 'alerte' ? (/règles/.test(a.titre) ? 'Incomplet' : 'À surveiller') : 'À confirmer'}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="carte pro-bloc pro-agenda">
              <div className="pro-bloc-titre"><h2>Ma journée</h2><span className="pro-muet">{rdvDuJour.length} rendez-vous</span></div>
              <ol>
                {rdvDuJour.map((r, k) => {
                  const p = patientes.find((x) => x.id === r.patiente)!;
                  const passe = enMinutes(r.heure) < minNow;
                  return (
                    <Fragment key={r.id}>
                      {k === idxProchain && <li className="pro-agenda-maintenant"><span className="chiffres">{maintenant.toTimeString().slice(0, 5)}</span><i /></li>}
                      <li className={`pro-agenda-rdv ${passe ? 'passe' : ''} ${k === idxProchain ? 'prochain' : ''}`}>
                        <span className="pro-agenda-heure chiffres">{r.heure}</span>
                        <span className="pro-agenda-corps">
                          <button className="pro-lien-ligne" onClick={() => ouvrir(p.id)}><strong>{p.nom}</strong></button><em>{r.motif}</em>
                          {k === idxProchain && <span className="pro-agenda-tag"><Clock size={12} />Prochaine patiente</span>}
                        </span>
                        <span className={`pastille ${r.statut === 'confirme' ? 'p-ok' : 'p-alerte'}`}>{r.statut === 'confirme' ? 'Confirmé' : 'À confirmer'}</span>
                      </li>
                    </Fragment>
                  );
                })}
                {idxProchain === -1 && <li className="pro-agenda-maintenant"><span className="chiffres">{maintenant.toTimeString().slice(0, 5)}</span><i /></li>}
              </ol>
            </section>
          </div>

          <div className="pro-v2-deux">
            <section className="carte pro-bloc">
              <div className="pro-bloc-titre"><h2>Prochains rendez-vous</h2><span className="pro-muet">7 prochains jours</span></div>
              <ul className="pro-v2-rdv">
                {rdv7j.map((r) => (
                  <li key={r.id}>
                    <span className="pro-v2-jour"><em>{new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(r.date).replace('.', '')}</em><strong className="chiffres">{r.date.getDate()}</strong></span>
                    <button className="pro-v2-liste-texte pro-lien-ligne" onClick={() => ouvrir(r.patiente)}><strong>{nomPatiente(r.patiente)}</strong><em>{r.motif}</em></button>
                    <span className="chiffres pro-muet">{r.heure}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="pro-colonne">
              <section className="carte pro-bloc">
                <div className="pro-bloc-titre"><h2>Termes proches</h2><span className="pro-muet">Date prévue dans les 30 jours</span></div>
                <ul className="pro-v2-liste">
                  {termesProches.map(({ p, g }) => (
                    <li key={p.id}>
                      <span className="pro-pat-av">{initiales(p.nom)}</span>
                      <button className="pro-v2-liste-texte pro-lien-ligne" onClick={() => ouvrir(p.id)}><strong>{p.nom}</strong><em>Date prévue le {formatDate(g.dpa)} · {g.sa} SA + {g.j} j</em></button>
                      <span className="pastille p-rose chiffres">J-{joursEntre(t, g.dpa)}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="carte pro-bloc pro-ia">
                <div className="pro-bloc-titre"><h2><Sparkles size={16} /> Recommandations</h2></div>
                <p className="pro-v2-ia-texte">Retrouvez une recommandation validée (CPN, supplémentation, signes d’alerte). L’aide IA sur le risque de césarienne se trouve dans chaque dossier, onglet « Aide IA ».</p>
                <button className="btn btn-primaire btn-sm" onClick={() => setPage('docs')}><Sparkles size={15} />Rechercher une recommandation</button>
              </section>
            </div>
          </div>
        </main>
        )}
        {bloque && <AccesRefuse dossier={page === 'fiche' && ficheId ? ficheId : 'tous'} onRetour={() => setPage('admin')} />}
        {page === 'ia' && !bloque && <EspaceIA />}
        {page === 'docs' && !bloque && <Recommandations />}
        {page === 'patientes' && !bloque && <ListePatientes q={recherche} setQ={setRecherche} onOuvrir={ouvrir} onNouveau={() => setModale({ type: 'dossier' })} />}
        {page === 'fiche' && ficheId && !bloque && <FichePatiente pid={ficheId} onRetour={() => setPage('patientes')} onConsultation={() => setModale({ type: 'consultation', pid: ficheId })} onRdv={() => setModale({ type: 'rdv', pid: ficheId })} />}
        {page === 'rdv' && <Agenda ouvrir={ouvrir} nouveau={() => setModale({ type: 'rdv' })} />}
        {page === 'consultations' && !bloque && <Consultations ouvrir={ouvrir} nouvelle={() => setModale({ type: 'consultation' })} />}
        {page === 'grossesse' && !bloque && <SuiviGrossesse ouvrir={ouvrir} />}
        {page === 'enfant' && !bloque && <SuiviEnfant ouvrirMere={ouvrir} />}
        {page === 'rapports' && <Rapports signaler={setToast} />}
        {page === 'admin' && (<>
          <div className="pro-admin-onglets" role="tablist" aria-label="Administration">
            <button role="tab" aria-selected={adminOnglet === 'acces'} className={adminOnglet === 'acces' ? 'actif' : ''} onClick={() => setAdminOnglet('acces')}>Comptes et journal des accès</button>
            <button role="tab" aria-selected={adminOnglet === 'parametres'} className={adminOnglet === 'parametres' ? 'actif' : ''} onClick={() => setAdminOnglet('parametres')}>Paramètres</button>
          </div>
          {adminOnglet === 'acces' ? <Acces /> : <Parametres signaler={setToast} />}
        </>)}
        {page === 'plus' && (
          <main className="pro-zone">
            <h1 className="pro-v2-titre">Plus</h1>
            <div className="carte pro-v2-plus">
              {([['consultations', 'Consultations', Stethoscope], ['grossesse', 'Suivi de grossesse', HeartPulse], ['enfant', 'Suivi de l’enfant', Baby], ['rapports', 'Rapports', BarChart3], ['journal', 'Utilisateurs et journal', ShieldCheck], ['parametres', 'Paramètres', Settings]] as [string, string, typeof Users][]).map(([id, lib, Icone]) => (
                <button key={id} onClick={() => setPage(id)}><Icone size={18} />{lib}<ChevronRight size={16} /></button>
              ))}
              {onChangerEspace && <button onClick={onChangerEspace}><Building2 size={18} />Changer d’espace<ChevronRight size={16} /></button>}
            </div>
          </main>
        )}
        {modale?.type === 'dossier' && <NouveauDossier onFermer={() => setModale(null)} onCree={(p) => { setModale(null); setToast(`Dossier ${p.id} créé · code de liaison ${p.code}`); ouvrir(p.id); }} />}
        {modale?.type === 'consultation' && <NouvelleConsultation patienteId={modale.pid} onFermer={() => setModale(null)} onEnregistre={(pid) => { setModale(null); setToast('Consultation enregistrée et signée'); ouvrir(pid); }} />}
        {modale?.type === 'rdv' && <NouveauRdv patienteId={modale.pid} onFermer={() => setModale(null)} onEnregistre={() => { setModale(null); setToast('Rendez-vous programmé, rappel prévu la veille'); }} />}
        {toast && <Confirmation texte={toast} />}
        <nav className="pro-nav-mobile" aria-label="Navigation">
          {([['tableau', 'Aujourd’hui', LayoutDashboard], ['patientes', 'Patientes', Users], ['rdv', 'Agenda', CalendarDays], ['rapports', 'Rapports', BarChart3], ['admin', 'Admin', ShieldCheck]] as [string, string, typeof Users][]).map(([id, lib, Icone]) => (
            <button key={id} className={page === id || (id === 'patientes' && page === 'fiche') ? 'actif' : ''} onClick={() => setPage(id)}><Icone size={20} /><span>{lib}</span></button>
          ))}
        </nav>
      </div>
    </div>
  );
}


/* Liste des patientes : onglets par situation, recherche et tri */
function ListePatientes({ q, setQ, onOuvrir, onNouveau }: { q: string; setQ: (v: string) => void; onOuvrir: (pid: string) => void; onNouveau: () => void }) {
  const { patientes, rdv: rendezVous } = useStore();
  const t = aujourdhui();
  const [filtre, setFiltre] = useState('toutes');
  const lignes = patientes.map((p) => {
    const g = p.ddr ? suiviGrossesse(p.ddr) : null;
    const r = rendezVous.filter((x) => x.patiente === p.id && joursEntre(t, x.date) >= 0).sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    return { p, g, r };
  });
  const filtres: [string, string, (l: typeof lignes[number]) => boolean][] = [
    ['toutes', 'Toutes', () => true],
    ['surveiller', 'À surveiller', (l) => l.p.statut === 'verifier'],
    ['incomplet', 'Dossier incomplet', (l) => l.p.statut === 'incomplet'],
    ['t1', 'T1', (l) => l.g?.trimestre === 1],
    ['t2', 'T2', (l) => l.g?.trimestre === 2],
    ['t3', 'T3', (l) => l.g?.trimestre === 3],
    ['post', 'Post-partum', (l) => l.p.statut === 'postnatal'],
  ];
  const actif = filtres.find((f) => f[0] === filtre)!;
  const visibles = lignes.filter(actif[2]).filter((l) => !q.trim() || `${l.p.nom} ${l.p.id}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <main className="pro-zone pro-v2">
      <div className="pro-v2-tete">
        <div><h1>Patientes</h1><p className="pro-v2-resume">{patientes.length} dossiers actifs · {etablissement.nom}</p></div>
        <div className="pro-actions"><button className="btn btn-primaire btn-sm" onClick={onNouveau}><Plus size={16} />Nouveau dossier</button></div>
      </div>
      <div className="pro-v2-filtres" role="tablist" aria-label="Filtrer les patientes">
        {filtres.map(([id, lib, f]) => (
          <button key={id} role="tab" aria-selected={filtre === id} className={filtre === id ? 'actif' : ''} onClick={() => setFiltre(id)}>{lib}<span className="chiffres">{lignes.filter(f).length}</span></button>
        ))}
      </div>
      <label className="pro-recherche pro-v2-recherche"><Search size={16} /><input placeholder="Nom ou numéro de dossier" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <section className="carte pro-bloc">
        {visibles.length === 0 ? <p className="pro-muet">Aucune patiente ne correspond. Modifiez le filtre ou la recherche.</p> : (
        <div className="pro-table-scroll">
          <table className="pro-table">
            <thead><tr><th>Patiente</th><th>Avancement de la grossesse</th><th>Date prévue</th><th>Statut</th><th>Prochain rendez-vous</th></tr></thead>
            <tbody>
              {visibles.map(({ p, g, r }) => (
                <tr key={p.id} onClick={() => onOuvrir(p.id)} tabIndex={0} onKeyDown={(ev) => { if (ev.key === 'Enter') onOuvrir(p.id); }}>
                  <td><div className="pro-pat"><span className="pro-pat-av">{initiales(p.nom)}</span><div><span className="pro-patiente">{p.nom}</span><span className="pro-id">{p.id} · {p.age} ans</span></div></div></td>
                  <td>{g ? (<div className="pro-avancement"><div className="pro-avancement-barre"><span className={`t${g.trimestre}`} style={{ width: `${Math.min(100, (g.sa / 40) * 100)}%` }} /></div><span className="chiffres">{g.sa} SA + {g.j} j</span></div>) : <span className="pro-muet">{p.statut === 'postnatal' ? 'Accouchée, enfant suivi' : 'Terme à renseigner'}</span>}</td>
                  <td className="chiffres pro-muet">{g ? formatDate(g.dpa) : '—'}</td>
                  <td><span className={`pastille ${libelleStatut[p.statut].classe}`}>{libelleStatut[p.statut].texte}</span></td>
                  <td className="chiffres pro-muet">{r ? (joursEntre(t, r.date) === 0 ? `Aujourd’hui, ${r.heure}` : formatJour(r.date)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>)}
      </section>
    </main>
  );
}
