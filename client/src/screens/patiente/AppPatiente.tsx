import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Bell, BookHeart, Bot, CalendarDays, ChevronLeft, ChevronRight, Clock, Eye, EyeOff, Home, MapPin,
  Search, Send, ShieldCheck, Sparkles, User, Baby, Lightbulb, ThumbsUp, ThumbsDown, FileText, Stethoscope,
  History, HeartPulse, ClipboardList, LogOut, BellRing, Languages, HelpCircle, Info, FlaskConical, CheckCircle2,
  CircleDashed, AlertTriangle, CalendarClock, X, Syringe, Ruler, Hospital, UserRound, KeyRound, CheckCheck, Activity, ArrowUpRight, Download, Mic, Volume2, Square, CalendarPlus, Phone,
} from 'lucide-react';
import { useStore } from '../../data/store';
import { useEnregistreur, BarreEnregistrement, BulleVocale, FeuilleTranscription, exemplesVocaux, formeExemple, type ExempleVocal, type Langue } from './Vocal';
import { Logo, LogoComplet } from '../../components/Logo';
import {
  IconeFruit, CouvertureArticle, EtatVide,
} from '../../components/Illustrations';
import { IconeBebe } from '../../components/IconeBebe';
import { Inscription } from './Inscription';
import { photoAccueil, imageFoetus, photoArticle } from '../../components/Medias';

function VisuelArticle({ id, type, hauteur }: { id: string; type: Parameters<typeof CouvertureArticle>[0]['type']; hauteur: number }) {
  const src = photoArticle(id);
  return src ? <img className="pa-visuel" src={src} alt="" style={{ height: hauteur }} /> : <CouvertureArticle type={type} hauteur={hauteur} />;
}
import { suiviGrossesse, formatDate, joursEntre, aujourdhui, etablissement, ajouterJours } from '../../data/apercu';
import { api } from '../../data/api';
import { articles, conseilDuJour, etapePourSA, semaines, type Categorie } from '../../data/contenus';
import { dossierP001, rdvP001, notificationsP001, enfantP005, moi, type Notification, type RdvPatiente } from '../../data/patiente';

export type NomEcran =
  | 'bienvenue' | 'connexion' | 'inscription' | 'accueil' | 'grossesse' | 'carnet' | 'rdv' | 'enfant'
  | 'assistant' | 'notifications' | 'profil' | 'conseils' | 'article';
type Ecran = { nom: NomEcran; sa?: number; id?: string; section?: string };
type Aller = (e: Ecran) => void;

// Patiente connectée : mise à jour après le chargement du carnet (voir majMoi, appelé par pwa.tsx)
let P = moi;
let G = suiviGrossesse(moi.ddr ?? aujourdhui());
let PRENOM = '';
export function majMoi() { P = moi; G = suiviGrossesse(moi.ddr ?? aujourdhui()); PRENOM = moi.nom.split(' ')[0]; }
const fmtLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtJourMois = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
const fmtCourt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const prochainRdv = () => rdvP001.filter((r) => joursEntre(aujourdhui(), r.date) >= 0 && r.statut !== 'annule').sort((a, b) => a.date.getTime() - b.date.getTime());

export function AppPatiente({ ecranInitial = 'bienvenue', onChangerEspace, onDeconnexion, onCarnetRelie, onConnecte, etapeInscription, toastInitial }: { ecranInitial?: NomEcran; onChangerEspace?: () => void; onDeconnexion?: () => void; onCarnetRelie?: () => void; onConnecte?: (s: { espace: 'pro' | 'patiente' | null; relie?: boolean }) => void; etapeInscription?: number; toastInitial?: string }) {
  const [ecran, setEcran] = useState<Ecran>({ nom: ecranInitial });
  const [notifs, setNotifs] = useState<Notification[]>(() => [...notificationsP001]);
  const [toast, setToast] = useState<string | null>(toastInitial ?? null);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 2600); return () => clearTimeout(id); }, [toast]);

  const aller: Aller = (e) => setEcran(e);
  const ongletActif: Record<NomEcran, string> = {
    bienvenue: '', connexion: '', inscription: '', accueil: 'accueil', grossesse: 'grossesse', conseils: 'accueil', article: 'accueil', notifications: 'accueil',
    carnet: 'carnet', rdv: 'rdv', enfant: 'enfant', assistant: 'assistant', profil: 'profil',
  };
  const onglet = ongletActif[ecran.nom];

  return (
    <div className="pa">
      <div className="pa-vue" key={ecran.nom + (ecran.id ?? '') + (ecran.sa ?? '')}>
        {ecran.nom === 'bienvenue' && <Bienvenue aller={aller} onChangerEspace={onChangerEspace} />}
        {ecran.nom === 'connexion' && <Connexion aller={aller} onConnecte={onConnecte} />}
        {ecran.nom === 'inscription' && <Inscription etapeInitiale={etapeInscription} retour={() => (etapeInscription && onDeconnexion ? onDeconnexion() : aller({ nom: 'bienvenue' }))} terminer={() => { if (onCarnetRelie) onCarnetRelie(); else { aller({ nom: 'accueil' }); setToast('Carnet relié'); } }} />}
        {ecran.nom === 'accueil' && <Accueil aller={aller} notifs={notifs} signaler={setToast} />}
        {ecran.nom === 'grossesse' && <Grossesse aller={aller} saInitiale={ecran.sa} />}
        {ecran.nom === 'carnet' && <Carnet aller={aller} section={ecran.section} />}
        {ecran.nom === 'rdv' && <RendezVous signaler={setToast} />}
        {ecran.nom === 'enfant' && (ecran.id === 'exemple' ? <Enfant aller={aller} /> : <EnfantAVenir aller={aller} />)}
        {ecran.nom === 'assistant' && <Assistant />}
        {ecran.nom === 'notifications' && <Notifications aller={aller} notifs={notifs} setNotifs={setNotifs} />}
        {ecran.nom === 'profil' && <Profil aller={aller} onDeconnexion={onDeconnexion} />}
        {ecran.nom === 'conseils' && <Conseils aller={aller} />}
        {ecran.nom === 'article' && <LectureArticle id={ecran.id!} aller={aller} />}
      </div>
      {onglet && (
        <nav className="pa-nav" aria-label="Navigation principale">
          <span className="pa-nav-logo"><Logo hauteur={30} /></span>
          {([
            ['accueil', 'Accueil', Home], ['grossesse', 'Grossesse', HeartPulse], ['carnet', 'Carnet', BookHeart],
            ['rdv', 'Rendez-vous', CalendarDays], ['enfant', 'Mon enfant', Baby],
          ] as const).map(([id, txt, Icone]) => (
            <button key={id} className={onglet === id ? 'actif' : ''} onClick={() => aller({ nom: id })} aria-current={onglet === id ? 'page' : undefined}>
              <span className="pa-nav-icone"><Icone size={20} strokeWidth={onglet === id ? 2.3 : 1.8} /></span><span className="pa-nav-txt">{txt}</span>
            </button>
          ))}
          <button className={`pa-nav-assist${onglet === 'assistant' ? ' actif' : ''}`} onClick={() => aller({ nom: 'assistant' })}><span className="pa-nav-icone"><Bot size={20} /></span><span className="pa-nav-txt">Assistant</span></button>
          <button className={`pa-nav-profil${onglet === 'profil' ? ' actif' : ''}`} onClick={() => aller({ nom: 'profil' })}><span className="pa-nav-avatar">MS</span><span className="pa-nav-txt">{P.nom}<em>Mon profil</em></span></button>
        </nav>
      )}
      {onglet && ecran.nom !== 'assistant' && (
        <button className="pa-fab" onClick={() => aller({ nom: 'assistant' })} aria-label="Ouvrir l’assistant"><Bot size={22} /><span>Assistant</span></button>
      )}
      {toast && <div className="pa-toast" role="status"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  );
}

/* ================================================================== */
function Bienvenue({ aller, onChangerEspace }: { aller: Aller; onChangerEspace?: () => void }) {
  return (
    <div className="pa-bv4">
      <div className="pa-bv4-centre">
        <LogoComplet largeur={150} />
        <h1>Suivez votre grossesse et la santé de votre enfant</h1>
        <p>Votre carnet de santé mère-enfant, partagé avec vos soignants.</p>
      </div>
      <div className="pa-bv4-actions">
        <button className="btn btn-primaire btn-bloc pa-btn-xl" onClick={() => aller({ nom: 'connexion' })}>Se connecter</button>
        <button className="btn btn-secondaire btn-bloc pa-btn-xl" onClick={() => aller({ nom: 'inscription' })}>Créer un compte</button>
        {onChangerEspace && <button className="pa-bv4-lien" onClick={onChangerEspace}>Vous êtes soignant ? Espace professionnel</button>}
      </div>
    </div>
  );
}

/* ================================================================== */
function Connexion({ aller, onConnecte }: { aller: Aller; onConnecte?: (s: { espace: 'pro' | 'patiente' | null; relie?: boolean }) => void }) {
  const [voir, setVoir] = useState(false);
  const [ident, setIdent] = useState('');
  const [mdp, setMdp] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const valider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ident.trim() || !mdp) { setErreur('Renseignez votre identifiant et votre mot de passe.'); return; }
    setErreur(null); setChargement(true);
    try {
      const s = await api.post<{ espace: 'pro' | 'patiente' | null; relie?: boolean }>('/auth/connexion', { identifiant: ident.trim(), mdp });
      if (onConnecte) onConnecte(s); else aller({ nom: 'accueil' });
    } catch (x) {
      setErreur((x as Error).message || 'Le serveur ne répond pas. Réessayez.');
      setChargement(false);
    }
  };
  return (
    <form className="pa-cnx" onSubmit={valider} noValidate>
      <button type="button" className="pa-retour" onClick={() => aller({ nom: 'bienvenue' })} aria-label="Retour"><ChevronLeft size={22} /></button>
      <div className="pa-cnx-tete">
        <Logo hauteur={34} />
        <h1>Heureuse de vous revoir</h1>
        <p>Connectez-vous pour retrouver votre carnet.</p>
      </div>
      <label className="pa-champ" htmlFor="cnx-id">
        <span>Téléphone ou adresse e-mail</span>
        <input id="cnx-id" value={ident} onChange={(e) => setIdent(e.target.value)} autoComplete="username" aria-invalid={!!erreur && !ident} />
      </label>
      <label className="pa-champ" htmlFor="cnx-mdp">
        <span>Mot de passe</span>
        <div className="pa-champ-mdp">
          <input id="cnx-mdp" type={voir ? 'text' : 'password'} value={mdp} onChange={(e) => setMdp(e.target.value)} autoComplete="current-password" aria-invalid={!!erreur} />
          <button type="button" onClick={() => setVoir(!voir)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{voir ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
      </label>
      {erreur && <p className="pa-erreur" role="alert"><AlertTriangle size={15} />{erreur}</p>}
      <button type="button" className="pa-lien pa-oubli">Mot de passe oublié ?</button>
      <div className="pa-demo-note"><Info size={15} /><span>Démonstration : <button type="button" className="pa-lien" onClick={() => { setIdent('mariama.sow@demo.sn'); setMdp('Demo2026!'); setErreur(null); }}>utiliser le compte fictif de Mariama Sow</button></span></div>
      <button className="btn btn-primaire btn-bloc pa-btn-xl" disabled={chargement}>{chargement ? <span className="pa-spinner" /> : 'Se connecter'}</button>
    </form>
  );
}

/* ================================================================== */
/** Anneau de la grossesse (non utilisé) : trois trimestres, une graduation par semaine, position du jour. */
function OrbiteGrossesse({ sa, j, taille = 256, children }: { sa: number; j: number; taille?: number; children: React.ReactNode }) {
  const c = taille / 2, r = c - 16, TOTAL = 41;
  const ang = (s: number) => -90 + (s / TOTAL) * 360;
  const pt = (s: number, rr = r) => { const a = (ang(s) * Math.PI) / 180; return [c + rr * Math.cos(a), c + rr * Math.sin(a)]; };
  const arc = (s1: number, s2: number, rr = r) => { const [x1, y1] = pt(s1, rr), [x2, y2] = pt(s2, rr); return `M${x1} ${y1} A${rr} ${rr} 0 ${s2 - s1 > TOTAL / 2 ? 1 : 0} 1 ${x2} ${y2}`; };
  const actuel = Math.min(TOTAL, sa + j / 7);
  const [mx, my] = pt(actuel);
  const longueur = 2 * Math.PI * r * (actuel / TOTAL);
  return (
    <div className="pa-orbite" style={{ width: taille, height: taille }}>
      <svg viewBox={`0 0 ${taille} ${taille}`} width={taille} height={taille} aria-hidden="true">
        <defs>
          <linearGradient id="orb-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffb0be" /><stop offset=".5" stopColor="#ff758f" /><stop offset="1" stopColor="#c81849" /></linearGradient>
          <radialGradient id="orb-c" cx=".5" cy=".42" r=".6"><stop offset="0" stopColor="#fff" /><stop offset=".75" stopColor="#FFF1F4" /><stop offset="1" stopColor="#FFE1E8" /></radialGradient>
          <filter id="orb-o" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        <circle cx={c} cy={c} r={r - 20} fill="url(#orb-c)" />
        {[[0, 14.7], [15.3, 28.7], [29.3, TOTAL - .3]].map(([a, b], k) => <path key={k} d={arc(a, b)} stroke="#fff" strokeOpacity=".85" strokeWidth="12" fill="none" strokeLinecap="round" />)}
        <path d={arc(0, Math.max(.01, actuel))} stroke="url(#orb-g)" strokeWidth="12" fill="none" strokeLinecap="round" className="pa-orbite-arc" style={{ ['--l' as string]: longueur }} strokeDasharray={longueur} />
        {Array.from({ length: TOTAL + 1 }, (_, s) => { const [x1, y1] = pt(s, r - 13); const [x2, y2] = pt(s, r - (s % 4 === 0 ? 19 : 16)); return <line key={s} x1={x1} y1={y1} x2={x2} y2={y2} stroke={s <= sa ? '#ff758f' : '#E9C3CC'} strokeWidth={s % 4 === 0 ? 1.6 : 1} strokeLinecap="round" />; })}
        {[15, 29].map((s) => { const [x, y] = pt(s, r + 0); return <circle key={s} cx={x} cy={y} r="2.2" fill="#fff" stroke="#E9C3CC" />; })}
        <circle cx={mx} cy={my} r="13" fill="#ff758f" opacity=".45" filter="url(#orb-o)" className="pa-orbite-halo" />
        <circle cx={mx} cy={my} r="9" fill="#fff" />
        <circle cx={mx} cy={my} r="5" fill="#c81849" />
      </svg>
      <div className="pa-orbite-centre">{children}</div>
    </div>
  );
}

function Accueil({ aller, notifs, signaler }: { aller: Aller; notifs: Notification[]; signaler: (m: string) => void }) {
  const t = aujourdhui();
  const etape = etapePourSA(G.sa);
  const jRestants = joursEntre(t, G.dpa);
  const semRestantes = `${Math.floor(jRestants / 7)} semaines${jRestants % 7 ? ` et ${jRestants % 7} jour${jRestants % 7 > 1 ? 's' : ''}` : ''}`;
  const rdv = prochainRdv()[0];
  const importantes = notifs.filter((n) => !n.lue && n.type !== 'rdv').slice(0, 3);
  const pourVous = articles.filter((a) => a.trimestres.includes(G.trimestre)).slice(0, 4);
  const nonLues = notifs.filter((n) => !n.lue).length;
  const etat = useStore();
  const dc = etat.consultations.filter((c) => c.patiente === P.id).sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  const derniere = [{ valeur: dc?.poids ? `${dc.poids} kg` : '—' }, { valeur: dc?.ta ? `${dc.ta[0]}/${dc.ta[1]}` : '—' }];

  return (
    <div className="pa-ecran pa-accueil">
      <header className="pa-acc2-tete">
        <button className="pa-acc2-avatar" onClick={() => aller({ nom: 'profil' })} aria-label="Ouvrir mon profil">{P.initiales}</button>
        <div className="pa-acc2-salut"><h1>Bonjour, {PRENOM}</h1><p>{fmtLong.format(t)}</p></div>
        <button className="pa-rond" onClick={() => aller({ nom: 'notifications' })} aria-label={`Notifications, ${nonLues} non lues`}>
          <Bell size={20} />{nonLues > 0 && <span className="pa-rond-pastille">{nonLues}</span>}
        </button>
      </header>

      <button className="pa-acc2-grossesse" onClick={() => aller({ nom: 'grossesse' })} aria-label="Ouvrir le suivi de grossesse">
        <span className="pa-acc2-haut">
          <span className="pa-acc2-sa">
            <span className="pa-acc2-lib">Aujourd’hui</span>
            <strong className="chiffres">{G.sa} SA <em>+ {G.j} j</em></strong>
            <span className="pa-acc2-sous">{G.trimestre === 1 ? '1er' : `${G.trimestre}e`} trimestre · {G.sg} semaines de grossesse</span>
          </span>
          {imageFoetus(G.sa) && <span className="pa-acc2-photo"><img src={imageFoetus(G.sa)!} alt={`Illustration pédagogique d’un fœtus, ${G.sa} SA`} /></span>}
        </span>
        <span className="pa-acc2-frise" aria-hidden="true">
          <span className="pa-acc2-tri"><i>T1</i><i>T2</i><i>T3</i></span>
          <span className="pa-acc2-barre">
            <span className="pa-acc2-rempli" style={{ width: `${Math.min(100, ((G.sa + G.j / 7) / 40) * 100)}%` }} />
            <span className="pa-acc2-sep" style={{ left: `${(15 / 40) * 100}%` }} />
            <span className="pa-acc2-sep" style={{ left: `${(29 / 40) * 100}%` }} />
            <span className="pa-acc2-curseur" style={{ left: `${Math.min(100, ((G.sa + G.j / 7) / 40) * 100)}%` }} />
          </span>
          <span className="pa-acc2-bornes chiffres"><i>0</i><i>Terme 40 SA</i></span>
        </span>
        <span className="pa-acc2-bas">
          <span><span className="pa-acc2-lib">Terme prévu</span><b>{formatDate(G.dpa)}</b><em>dans {semRestantes}</em></span>
          <span><span className="pa-acc2-lib">Bébé, en moyenne</span><b className="chiffres">{etape.taille} · {etape.poids}</b><em>comme {etape.comparaison}</em></span>
          <ChevronRight size={18} className="pa-acc2-go" />
        </span>
        <span className="pa-acc2-note">SA : semaines d’aménorrhée, comptées depuis vos dernières règles ({formatDate(P.ddr!)}).</span>
      </button>

      {rdv && (
        <section className="pa-bloc">
          <div className="pa-bloc-titre"><h2>Prochain rendez-vous</h2></div>
          <button className="pa-prochain" onClick={() => aller({ nom: 'rdv' })}>
            <span className="pa-prochain-date"><strong className="chiffres">{rdv.date.getDate()}</strong><em>{fmtCourt.format(rdv.date).split(' ')[1]}</em></span>
            <span className="pa-prochain-texte">
              <strong>{rdv.motif}</strong>
              <span><Clock size={13} />{rdv.heure} · {joursEntre(t, rdv.date) === 0 ? 'aujourd’hui' : `dans ${joursEntre(t, rdv.date)} jours`}</span>
              <span><MapPin size={13} />{rdv.lieu}</span>
            </span>
            <ChevronRight size={18} className="pa-prochain-go" />
          </button>
          <div className="pa-acc2-actions">
            <button onClick={() => signaler('Ajouté à votre agenda (démonstration)')}><CalendarPlus size={16} />Ajouter à l’agenda</button>
            <button onClick={() => signaler('Appel du secrétariat de la Clinique Sutura (démonstration)')}><Phone size={16} />Appeler</button>
          </div>
        </section>
      )}

      {importantes.length > 0 && (
        <section className="pa-bloc">
          <div className="pa-bloc-titre"><h2>À ne pas manquer</h2><button className="pa-lien" onClick={() => aller({ nom: 'notifications' })}>Tout voir</button></div>
          <div className="pa-alertes">
            {importantes.map((n) => (
              <button key={n.id} className="pa-alerte" onClick={() => aller({ nom: 'notifications' })}>
                <IconeNotif type={n.type} />
                <span><strong>{n.titre}</strong><span>{n.texte}</span></span>
              </button>
            ))}
          </div>
        </section>
      )}

      <button className="pa-mesures" onClick={() => aller({ nom: 'carnet', section: 'consultations' })}>
        <span className="pa-mesures-titre">Dernières mesures</span>
        <span className="pa-mesure"><Activity size={15} /><b className="chiffres">{derniere[1].valeur}</b><em>tension</em></span>
        <span className="pa-mesure"><Ruler size={15} /><b className="chiffres">{derniere[0].valeur}</b><em>poids</em></span>
        <ChevronRight size={16} className="pa-mesures-go" />
      </button>

      <section className="pa-bloc">
        <div className="pa-bloc-titre"><h2>Conseils pour votre trimestre</h2><button className="pa-lien" onClick={() => aller({ nom: 'conseils' })}>Tout voir</button></div>
        <section className="pa-conseil">
          <div className="pa-conseil-icone"><Sparkles size={18} /></div>
          <div>
            <p className="pa-conseil-titre">Le conseil du jour</p>
            <p className="pa-conseil-texte">{conseilDuJour.texte}</p>
            <button className="pa-lien" onClick={() => aller({ nom: 'article', id: conseilDuJour.articleId })}>Lire l’article</button>
          </div>
        </section>
        <div className="pa-carrousel">
          {pourVous.map((a) => (
            <button key={a.id} className="pa-carte-article" onClick={() => aller({ nom: 'article', id: a.id })}>
              <VisuelArticle id={a.id} type={a.couverture} hauteur={92} />
              <span className="pa-ca-corps"><span className="pa-ca-cat">{a.categorie} · {a.minutes} min</span><span className="pa-ca-titre">{a.titre}</span></span>
            </button>
          ))}
        </div>
      </section>
      <p className="pa-mention">Patiente et données fictives · prototype académique</p>
    </div>
  );
}

function IconeNotif({ type }: { type: Notification['type'] }) {
  const m = { rdv: [CalendarClock, 'n-rdv'], examen: [FlaskConical, 'n-examen'], carnet: [FileText, 'n-carnet'], important: [AlertTriangle, 'n-important'] } as const;
  const [I, c] = m[type];
  return <span className={`pa-notif-icone ${c}`}><I size={17} /></span>;
}

/* ================================================================== */
function EnTeteRetour({ titre, onRetour, droite }: { titre: string; onRetour: () => void; droite?: React.ReactNode }) {
  return (
    <header className="pa-tete-retour">
      <button className="pa-retour" onClick={onRetour} aria-label="Retour"><ChevronLeft size={22} /></button>
      <h1>{titre}</h1>
      <span className="pa-tete-droite">{droite}</span>
    </header>
  );
}

function Grossesse({ aller, saInitiale }: { aller: Aller; saInitiale?: number }) {
  const min = 8, max = 40;
  const [sa, setSa] = useState(Math.min(max, Math.max(min, saInitiale ?? G.sa)));
  const etape = etapePourSA(sa);
  const echelle = 0.42 + ((sa - min) / (max - min)) * 0.58;
  const trimestre = sa < 15 ? 1 : sa < 29 ? 2 : 3;
  const saDe = (d: Date) => Math.floor(joursEntre(P.ddr!, d) / 7);

  // Calendrier des 4 CPN (protocole national) : réalisées d'après le carnet, sinon rendez-vous prévu, sinon repère indicatif.
  const st = useStore();
  const faites = st.consultations.filter((c) => c.patiente === P.id).sort((a, b) => a.date.getTime() - b.date.getTime());
  const examensFaits = st.examens.filter((x) => x.patiente === P.id && x.type === 'Échographie');
  const reperesCPN: [string, number, string][] = [['CPN 1', 12, 'Au 1er trimestre'], ['CPN 2', 26, 'Entre 24 et 28 SA'], ['CPN 3', 32, 'Vers 32 SA'], ['CPN 4', 36, 'Vers 36 SA, préparation de l’accouchement']];
  const cpn = reperesCPN.map(([nom, saRep, quand]) => {
    const c = faites.find((x) => x.type === nom);
    const r = prochainRdv().find((x) => x.motif.includes(`(${nom})`));
    return { nom, quand, c, r, saRep };
  });
  const nbCPN = cpn.filter((x) => x.c).length;
  const frise = [
    ...faites.map((c) => ({ sa: saDe(c.date), titre: /^CPN/.test(c.type) ? `Consultation prénatale (${c.type})` : c.type, detail: `${fmtCourt.format(c.date)} · ${c.par}`, statut: 'fait' as const })),
    ...examensFaits.map((x) => ({ sa: saDe(x.date), titre: x.titre, detail: 'Compte rendu disponible dans le carnet', statut: 'fait' as const })),
    { sa: G.sa, titre: 'Aujourd’hui', detail: `${G.sa} SA + ${G.j} jours`, statut: 'ici' as const },
    ...prochainRdv().map((r) => ({ sa: saDe(r.date), titre: r.motif, detail: `${fmtCourt.format(r.date)} à ${r.heure}`, statut: 'prevu' as const })),
    ...cpn.filter((x) => !x.c && !x.r).map((x) => ({ sa: x.saRep, titre: `Consultation prénatale (${x.nom})`, detail: `${x.quand} · repère du calendrier national`, statut: 'repere' as const })),
    { sa: 32, titre: 'Échographie du 3e trimestre', detail: 'Repère indicatif, à programmer avec votre soignant', statut: 'repere' as const },
    { sa: 40, titre: 'Terme prévu (40 SA)', detail: `${formatDate(G.dpa)} · dernières règles + 280 jours`, statut: 'repere' as const },
  ].sort((a, b) => a.sa - b.sa);

  return (
    <div className="pa-ecran pa-grossesse">
      <header className="pa-tete"><div><p className="pa-date">{G.sa} SA + {G.j} j · terme prévu le {fmtJourMois.format(G.dpa)}</p><h1 className="pa-titre">Ma grossesse</h1></div></header>

      <section className="pa-explo">
        <p className="pa-explo-sem"><span className="chiffres">{sa}</span> SA</p>
        <p className="pa-explo-sous">{sa === G.sa ? 'Vous êtes ici' : sa < G.sa ? 'Semaine passée' : 'À venir'} · {trimestre}e trimestre</p>
        <div className="pa-explo-scene">
          {imageFoetus(sa) ? (
            <>
              <div className="pa-explo-photo" style={{ ['--e' as string]: echelle }}><img src={imageFoetus(sa)!} alt={`Illustration pédagogique d’un fœtus, ${sa} SA`} /></div>
              <div className="pa-explo-fruit"><IconeFruit fruit={etape.fruit} taille={50} /></div>
            </>
          ) : (
            <div className="pa-comparateur" style={{ ['--e' as string]: echelle }}>
              <span className="pa-comparateur-halo" />
              <span className="pa-comparateur-fruit"><IconeFruit fruit={etape.fruit} taille={128} /></span>
              <span className="pa-comparateur-regle chiffres">{etape.taille}</span>
            </div>
          )}
        </div>
        <p className="pa-explo-comp">Environ la taille d’<strong>{etape.comparaison}</strong></p>
        <div className="pa-explo-mesures">
          <div><span>Taille</span><strong className="chiffres">{etape.taille}</strong></div>
          <div><span>Poids</span><strong className="chiffres">{etape.poids}</strong></div>
        </div>
        <label className="pa-curseur" htmlFor="curseur-sa">
          <span className="sr">Choisir une semaine d’aménorrhée</span>
          <input id="curseur-sa" type="range" min={min} max={max} value={sa} onChange={(e) => setSa(Number(e.target.value))}
            style={{ ['--p' as string]: `${((sa - min) / (max - min)) * 100}%` }} />
          <span className="pa-curseur-reperes chiffres">{semaines.map((s) => <span key={s.sa}>{s.sa}</span>)}</span>
        </label>
        <div className="pa-duo">
          <article><h3><Baby size={15} />Bébé</h3><p>{etape.bebe}</p></article>
          <article><h3><HeartPulse size={15} />Vous</h3><p>{etape.maman}</p></article>
        </div>
        <p className="pa-avert"><Info size={13} /> Illustration et comparaison pédagogiques, ordres de grandeur indicatifs : ce ne sont pas des images ni des données de votre bébé.</p>
      </section>

      <section className="pa-bloc">
        <div className="pa-bloc-titre"><h2>Mes 4 consultations prénatales</h2><span className="pa-cpn-compte chiffres">{nbCPN} sur 4</span></div>
        <ol className="pa-cpn">
          {cpn.map((x) => (
            <li key={x.nom} className={x.c ? 'fait' : x.r ? 'prevu' : ''}>
              <span className="pa-cpn-rond">{x.c ? <CheckCircle2 size={18} /> : x.nom.slice(-1)}</span>
              <span className="pa-cpn-txt"><strong>{x.nom}</strong><em>{x.quand}</em></span>
              <span className="pa-cpn-etat">{x.c ? `Faite le ${fmtCourt.format(x.c.date)}` : x.r ? `Prévue le ${fmtCourt.format(x.r.date)}` : 'À programmer'}</span>
            </li>
          ))}
        </ol>
        <p className="pa-avert"><Info size={13} /> Calendrier national (au moins 4 CPN). Votre soignant peut prévoir d’autres consultations.</p>
      </section>

      <section className="pa-bloc">
        <div className="pa-bloc-titre"><h2>Frise de votre grossesse</h2></div>
        <ol className="pa-frise">
          {frise.map((f, k) => (
            <li key={k} className={`pa-frise-${f.statut}`}>
              <span className="pa-frise-sa chiffres">{f.sa} SA</span>
              <span className="pa-frise-point">{f.statut === 'fait' ? <CheckCircle2 size={16} /> : f.statut === 'ici' ? <HeartPulse size={14} /> : <CircleDashed size={16} />}</span>
              <span className="pa-frise-texte"><strong>{f.titre}</strong><span>{f.detail}</span></span>
            </li>
          ))}
        </ol>
      </section>

      <section className="pa-bloc">
        <div className="pa-bloc-titre"><h2>Documents récents</h2><button className="pa-lien" onClick={() => aller({ nom: 'carnet', section: 'resultats' })}>Carnet</button></div>
        <div className="pa-docs">
          {dossierP001.examens.filter((e) => e.statut === 'resultat').map((e) => (
            <div key={e.nom} className="pa-doc">
              <span className="pa-doc-vignette"><FileText size={20} /></span>
              <span className="pa-doc-texte"><strong>{e.nom}</strong><span><em>{saDe(e.date)} SA</em><em>PDF</em></span></span>
              <button className="pa-doc-dl" aria-label={`Télécharger ${e.nom} (démonstration)`}><Download size={17} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="pa-bloc">
        <div className="pa-bloc-titre"><h2>Enregistré par vos soignants</h2></div>
        <div className="pa-mesures">
          {dossierP001.mesures.map((m) => (
            <div key={m.libelle}><span>{m.libelle}</span><strong className="chiffres">{m.valeur}</strong><em>{fmtCourt.format(m.date)}</em></div>
          ))}
        </div>
        <p className="pa-source-ligne">Dernière consultation · {dossierP001.consultations[0]?.par ?? '—'} · valeurs fictives</p>
      </section>

      <section className="pa-dpa">
        <div className="pa-dpa-haut">
          <div><p className="pa-dpa-etiquette">Date prévue d’accouchement</p><p className="pa-dpa-date">{formatDate(G.dpa)}</p></div>
          <span className="pa-dpa-badge">Calcul réel</span>
        </div>
        <dl className="pa-dpa-details">
          <div><dt>Dernières règles</dt><dd>{formatDate(P.ddr!)}</dd></div>
          <div><dt>Méthode</dt><dd>Dernières règles + 280 jours</dd></div>
          <div><dt>Hypothèse</dt><dd>Cycle régulier de 28 jours</dd></div>
        </dl>
        <p className="pa-dpa-limite">C’est une estimation : seule une petite partie des naissances a lieu à la date prévue. La datation par échographie réalisée par votre soignant fait référence.</p>
      </section>
    </div>
  );
}

/* ================================================================== */
function Carnet({ aller, section }: { aller: Aller; section?: string }) {
  const e = useStore();
  const moi = e.patientes.find((p) => p.id === P.id)!;
  const visites = e.consultations.filter((c) => c.patiente === P.id).sort((a, b) => b.date.getTime() - a.date.getTime());
  const examens = e.examens.filter((x) => x.patiente === P.id && (x.statut ?? 'resultat') === 'resultat').sort((a, b) => b.date.getTime() - a.date.getTime());
  const prescrits = dossierP001.examens.filter((x) => x.statut !== 'resultat');
  const [onglet, setOnglet] = useState<'visites' | 'examens' | 'sante'>(section === 'examens' || section === 'resultats' ? 'examens' : section === 'infos' ? 'sante' : 'visites');
  const [ouvert, setOuvert] = useState<string>(visites[0]?.id ?? '');
  const sa = (d: Date) => { const s = suiviGrossesse(moi.ddr!, d); return `${s.sa} SA + ${s.j} j`; };
  return (
    <div className="pa-ecran pa-carnet2">
      <header className="pa-tete"><div><p className="pa-date">Dossier {moi.id} · {etablissement.nom}</p><h1 className="pa-titre">Mon carnet</h1></div></header>
      <div className="pa-segment" role="tablist" aria-label="Sections du carnet">
        {([['visites', 'Visites', visites.length], ['examens', 'Examens', examens.length + prescrits.length], ['sante', 'Ma santé']] as [typeof onglet, string, number?][]).map(([id, l, n]) => (
          <button key={id} role="tab" aria-selected={onglet === id} className={onglet === id ? 'actif' : ''} onClick={() => setOnglet(id)}>{l}{n !== undefined && <span className="pa-seg-n">{n}</span>}</button>
        ))}
      </div>

      {onglet === 'visites' && (
        <div className="pa-c2-liste">
          {visites.map((c) => (
            <div key={c.id} className={`pa-c2-carte${ouvert === c.id ? ' ouvert' : ''}`}>
              <button className="pa-c2-tete" onClick={() => setOuvert(ouvert === c.id ? '' : c.id)} aria-expanded={ouvert === c.id}>
                <span className="pa-c2-tag">{c.type}</span>
                <span className="pa-c2-titre"><strong>{formatDate(c.date)}</strong><em>{sa(c.date)} · {c.par}</em></span>
                <ChevronRight size={18} className="pa-acc-chevron" />
              </button>
              {ouvert === c.id && (
                <div className="pa-c2-corps">
                  <dl className="pa-c2-mesures">
                    {c.ta && <div><dt>Tension</dt><dd>{c.ta[0]}/{c.ta[1]} mmHg</dd></div>}
                    {c.poids && <div><dt>Poids</dt><dd>{c.poids} kg</dd></div>}
                    {c.bdcf && <div><dt>Cœur du bébé</dt><dd>{c.bdcf} battements/min</dd></div>}
                    {c.hu && <div><dt>Hauteur utérine</dt><dd>{c.hu} cm</dd></div>}
                  </dl>
                  <p className="pa-c2-lib">Ce qu’il faut retenir</p>
                  <p className="pa-c2-texte">{c.conduite}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {onglet === 'examens' && (
        <div className="pa-c2-liste">
          {prescrits.map((x) => (
            <div key={x.nom} className="pa-c2-carte pa-c2-prescrit">
              <div className="pa-c2-tete"><span className="pa-c2-tag pa-c2-tag-alerte">{x.statut === 'prescrit' ? 'À réaliser' : 'À programmer'}</span><span className="pa-c2-titre"><strong>{x.nom}</strong><em>{x.statut === 'prescrit' ? `Prévu le ${formatDate(x.date)}` : 'Date à fixer avec votre soignant'} · {x.resultat}</em></span></div>
            </div>
          ))}
          {examens.map((x) => (
            <div key={x.id} className="pa-c2-carte">
              <div className="pa-c2-corps pa-c2-corps-seul">
                <div className="pa-c2-ligne"><span className={`pa-c2-tag ${x.type === 'Échographie' ? 'pa-c2-tag-echo' : ''}`}>{x.type}</span><em>{formatDate(x.date)} · {sa(x.date)}</em></div>
                <strong className="pa-c2-nom">{x.titre}</strong>
                <p className="pa-c2-texte">{x.resume}</p>
                <table className="pa-c2-valeurs"><tbody>{x.valeurs.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody></table>
              </div>
            </div>
          ))}
        </div>
      )}

      {onglet === 'sante' && (
        <div className="pa-c2-liste">
          <div className="pa-c2-carte"><div className="pa-c2-corps pa-c2-corps-seul">
            <dl className="pa-c2-mesures">
              <div><dt>Groupe sanguin</dt><dd>{moi.groupe}</dd></div>
              <div><dt>Grossesses</dt><dd>{moi.gestite} (dont celle-ci)</dd></div>
              <div><dt>Accouchements</dt><dd>{moi.parite}</dd></div>
              <div><dt>Césariennes</dt><dd>{moi.cesariennes}</dd></div>
            </dl>
            <p className="pa-c2-lib">Allergies</p><p className="pa-c2-texte">{moi.allergies}</p>
            <p className="pa-c2-lib">Antécédents médicaux</p><p className="pa-c2-texte">{moi.antecedentsMed}</p>
            <p className="pa-c2-lib">Antécédents chirurgicaux</p><p className="pa-c2-texte">{moi.antecedentsChir}</p>
          </div></div>
          <div className="pa-c2-carte"><div className="pa-c2-corps pa-c2-corps-seul">
            <p className="pa-c2-lib">Accouchement</p>
            <p className="pa-c2-texte">{dossierP001.accouchement.maternite}. {dossierP001.accouchement.projet}.</p>
          </div></div>
          <button className="pa-c2-carte pa-c2-lien" onClick={() => aller({ nom: 'enfant', id: 'exemple' })}><span className="pa-c2-titre"><strong>Suivi de l’enfant</strong><em>Créé par votre soignant à la naissance. Voir un exemple (compte P005)</em></span><ChevronRight size={18} /></button>
        </div>
      )}
      <p className="pa-carnet-note"><ShieldCheck size={14} />Informations validées et partagées par vos soignants. Données fictives.</p>
    </div>
  );
}

/* ================================================================== */
function RendezVous({ signaler }: { signaler: (s: string) => void }) {
  const t = aujourdhui();
  const [mois, setMois] = useState(new Date(t.getFullYear(), t.getMonth(), 1));
  const [detail, setDetail] = useState<RdvPatiente | null>(null);
  const [rappels, setRappels] = useState<Record<string, boolean>>({ r1: true, r2: true, r3: false });
  const aVenir = prochainRdv();
  const passes = rdvP001.filter((r) => joursEntre(t, r.date) < 0).sort((a, b) => b.date.getTime() - a.date.getTime());
  const debut = (mois.getDay() + 6) % 7;
  const nbJours = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate();
  const cases = [...Array(debut).fill(null), ...Array.from({ length: nbJours }, (_, i) => new Date(mois.getFullYear(), mois.getMonth(), i + 1))];
  const rdvDuJour = (d: Date) => rdvP001.filter((r) => joursEntre(r.date, d) === 0);

  return (
    <div className="pa-ecran pa-ecran-statique">
      <header className="pa-tete"><div><p className="pa-date">{aVenir.length} rendez-vous à venir</p><h1 className="pa-titre">Rendez-vous</h1></div></header>

      <section className="pa-calendrier" aria-label="Calendrier">
        <div className="pa-cal-tete">
          <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))} aria-label="Mois précédent"><ChevronLeft size={18} /></button>
          <strong>{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(mois)}</strong>
          <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))} aria-label="Mois suivant"><ChevronRight size={18} /></button>
        </div>
        <div className="pa-cal-grille">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j, k) => <span key={k} className="pa-cal-jsem">{j}</span>)}
          {cases.map((d, k) => {
            if (!d) return <span key={k} />;
            const r = rdvDuJour(d);
            const auj = joursEntre(d, t) === 0;
            return (
              <button key={k} className={`pa-cal-jour${auj ? ' auj' : ''}${r.length ? ' avec' : ''}${r.some((x) => x.statut === 'honore') ? ' passe' : ''}`}
                onClick={() => r[0] && setDetail(r[0])} disabled={!r.length} aria-label={`${fmtJourMois.format(d)}${r.length ? `, ${r[0].motif}` : ''}`}>
                <span className="chiffres">{d.getDate()}</span>{r.length > 0 && <i />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="pa-bloc">
        <div className="pa-bloc-titre"><h2>À venir</h2></div>
        {aVenir.length === 0 ? <div className="pa-vide"><EtatVide taille={96} /><p>Aucun rendez-vous à venir. Votre soignant les ajoute après chaque consultation.</p></div> : (
          <div className="pa-rdv-liste">
            {aVenir.map((r) => (
              <button key={r.id} className="pa-rdv-carte" onClick={() => setDetail(r)}>
                <span className="pa-rdv-carte-date chiffres"><strong>{r.date.getDate()}</strong>{new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(r.date).replace('.', '')}</span>
                <span className="pa-rdv-carte-texte"><strong>{r.motif}</strong><span>{r.heure} · {r.avec}</span></span>
                <span className={`pastille ${r.statut === 'confirme' ? 'p-ok' : 'p-alerte'}`}>{r.statut === 'confirme' ? 'Confirmé' : 'À confirmer'}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="pa-bloc">
        <div className="pa-bloc-titre"><h2>Historique</h2></div>
        <div className="pa-rdv-liste">
          {passes.map((r) => (
            <div key={r.id} className="pa-rdv-carte passe">
              <span className="pa-rdv-carte-date chiffres"><strong>{r.date.getDate()}</strong>{new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(r.date).replace('.', '')}</span>
              <span className="pa-rdv-carte-texte"><strong>{r.motif}</strong><span>{r.avec}</span></span>
              <span className="pastille p-info">Honoré</span>
            </div>
          ))}
        </div>
      </section>

      {detail && (
        <div className="pa-feuille-fond" onClick={() => setDetail(null)}>
          <div className="pa-feuille" role="dialog" aria-label="Détail du rendez-vous" onClick={(e) => e.stopPropagation()}>
            <span className="pa-feuille-poignee" />
            <div className="pa-feuille-tete">
              <span className={`pastille ${detail.statut === 'confirme' ? 'p-ok' : detail.statut === 'honore' ? 'p-info' : 'p-alerte'}`}>{detail.statut === 'confirme' ? 'Confirmé par la clinique' : detail.statut === 'honore' ? 'Honoré' : 'En attente de confirmation'}</span>
              <button className="pa-feuille-fermer" onClick={() => setDetail(null)} aria-label="Fermer"><X size={18} /></button>
            </div>
            <h2>{detail.motif}</h2>
            <ul className="pa-feuille-infos">
              <li><CalendarDays size={17} />{formatDate(detail.date)} à {detail.heure}</li>
              <li><MapPin size={17} />{detail.lieu}</li>
              <li><UserRound size={17} />{detail.avec}</li>
            </ul>
            {detail.preparer && <div className="pa-preparer"><Info size={16} /><p><strong>À préparer : </strong>{detail.preparer}</p></div>}
            {detail.statut !== 'honore' && (
              <>
                <div className="pa-feuille-rappel">
                  <BellRing size={18} /><span>Rappel {detail.rappel ? `(${detail.rappel.toLowerCase()})` : 'la veille'}</span>
                  <button role="switch" aria-checked={!!rappels[detail.id]} className={`pa-switch${rappels[detail.id] ? ' on' : ''}`} onClick={() => setRappels({ ...rappels, [detail.id]: !rappels[detail.id] })}><span /></button>
                </div>
                <button className="btn btn-discret btn-bloc" onClick={() => { setDetail(null); signaler('Demande de modification envoyée (simulation)'); }}>Demander une modification</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/** Onglet « Mon enfant » pendant la grossesse : le carnet de l'enfant est créé par le soignant à la naissance. */
function EnfantAVenir({ aller }: { aller: Aller }) {
  return (
    <div className="pa-ecran">
      <header className="pa-tete"><div><p className="pa-date">Après la naissance</p><h1 className="pa-titre">Mon enfant</h1></div></header>
      <section className="pa-enfant-avenir">
        <IconeBebe taille={88} />
        <h2>Le carnet de votre bébé arrivera ici</h2>
        <p>À la naissance, votre sage-femme crée le carnet de votre enfant et le relie au vôtre. Vous y retrouverez sa croissance, ses vaccins et ses consultations.</p>
        <ul>
          <li><Ruler size={17} />Courbe de poids et de taille</li>
          <li><Syringe size={17} />Calendrier vaccinal national et rappels</li>
          <li><Stethoscope size={17} />Consultations et conseils de l’âge</li>
        </ul>
        <button className="btn btn-secondaire btn-bloc" onClick={() => aller({ nom: 'enfant', id: 'exemple' })}>Voir un exemple de carnet</button>
      </section>
    </div>
  );
}

function Enfant({ aller }: { aller: Aller }) {
  const e = enfantP005;
  const ageJ = joursEntre(e.naissance, aujourdhui());
  const prochain = e.vaccins.find((v) => v.statut === 'prochain');
  // Graphique de croissance (poids selon l'âge), à l'échelle
  const W = 300, H = 150, pad = { g: 34, d: 12, h: 12, b: 26 };
  const maxJ = 42, minP = 2.5, maxP = 4.5;
  const x = (j: number) => pad.g + (j / maxJ) * (W - pad.g - pad.d);
  const y = (p: number) => H - pad.b - ((p - minP) / (maxP - minP)) * (H - pad.h - pad.b);
  const ligne = e.croissance.map((m, k) => `${k ? 'L' : 'M'}${x(m.jours)} ${y(m.poids)}`).join(' ');
  const dernier = e.croissance[e.croissance.length - 1];

  return (
    <div className="pa-ecran">
      <EnTeteRetour titre="Exemple de carnet" onRetour={() => aller({ nom: 'enfant' })} droite={<span className="badge-demo">Compte P005</span>} />
      <section className="pa-enfant-carte">
        <IconeBebe sexe={e.sexe} taille={76} />
        <div>
          <h2>{e.prenom} {e.nom}</h2>
          <p>{Math.floor(ageJ / 7)} semaines · {e.sexe === 'F' ? 'fille' : 'fils'} de {e.mere}</p>
          <span className="pastille p-ok">Suivi à jour</span>
        </div>
      </section>

      {prochain && (
        <div className="pa-echeance">
          <span className="pa-echeance-icone"><Syringe size={18} /></span>
          <div><strong>Vaccins des {prochain.age} prévus le {fmtJourMois.format(prochain.date)}</strong><span>{prochain.vaccins}</span></div>
        </div>
      )}

      <section className="pa-bloc">
        <div className="pa-bloc-titre"><h2>Naissance</h2></div>
        <div className="pa-grille-infos">{e.naissanceInfos.map((i) => <div key={i.libelle}><span>{i.libelle}</span><strong>{i.valeur}</strong></div>)}</div>
      </section>

      <section className="pa-bloc">
        <div className="pa-bloc-titre"><h2>Croissance</h2><span className="pa-texte-doux"><Ruler size={13} /> {dernier.poids.toString().replace('.', ',')} kg · {dernier.taille.toString().replace('.', ',')} cm</span></div>
        <div className="pa-graph-carte">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Évolution du poids de l'enfant depuis la naissance">
            {[2.5, 3, 3.5, 4, 4.5].map((p) => (
              <g key={p}><line x1={pad.g} x2={W - pad.d} y1={y(p)} y2={y(p)} stroke="#F8ECEF" /><text x={pad.g - 6} y={y(p) + 3} textAnchor="end" fontSize="9" fill="#7D5F68">{p.toString().replace('.', ',')}</text></g>
            ))}
            {[0, 14, 28, 42].map((j) => <text key={j} x={x(j)} y={H - 8} textAnchor="middle" fontSize="9" fill="#7D5F68">{j === 0 ? 'Naissance' : `${j / 7} sem.`}</text>)}
            <path d={`${ligne} L${x(dernier.jours)} ${H - pad.b} L${x(0)} ${H - pad.b} Z`} fill="#ff758f" opacity=".12" />
            <path d={ligne} fill="none" stroke="#c81849" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {e.croissance.map((m) => <circle key={m.jours} cx={x(m.jours)} cy={y(m.poids)} r={m === dernier ? 5 : 3.5} fill={m === dernier ? '#c81849' : '#fff'} stroke="#c81849" strokeWidth="2" />)}
          </svg>
          <p className="pa-avert"><Info size={13} /> Poids en kg, mesures fictives. Les courbes de référence de l’OMS seront ajoutées dans une version ultérieure.</p>
        </div>
      </section>

      <section className="pa-bloc">
        <div className="pa-bloc-titre"><h2>Vaccinations</h2></div>
        <ol className="pa-vaccins">
          {e.vaccins.map((v) => (
            <li key={v.age} className={v.statut}>
              <span className="pa-vaccin-point">{v.statut === 'fait' ? <CheckCircle2 size={16} /> : v.statut === 'prochain' ? <Syringe size={14} /> : <CircleDashed size={16} />}</span>
              <div><strong>{v.age}</strong><span>{v.vaccins}</span><em>{v.statut === 'fait' ? `Fait le ${fmtCourt.format(v.date)}` : `Prévu vers le ${fmtCourt.format(v.date)}`}</em></div>
            </li>
          ))}
        </ol>
        <p className="pa-avert"><Info size={13} /> D’après le calendrier vaccinal national, à confirmer par votre soignant.</p>
      </section>

      <section className="pa-bloc">
        <div className="pa-bloc-titre"><h2>Consultations</h2></div>
        <ul className="pa-liste-simple pa-carte-liste">{e.consultations.map((c) => <li key={c.type}><strong>{c.type}</strong><span>{formatDate(c.date)} · {c.par}</span><p>{c.notes}</p></li>)}</ul>
      </section>
    </div>
  );
}

/* ================================================================== */
const URGENCE = /(saign|sang|fièvre|fievre|convuls|perte des eaux|ne bouge plus|bouge moins|vision trouble|douleur (forte|intense))/i;

function Assistant() {
  type Vocal = { url: string | null; duree: number; forme: number[]; exemple?: ExempleVocal; enCours?: boolean };
  type Msg = { de: 'moi' | 'ia'; texte: string; sources?: string[]; urgence?: boolean; vocal?: Vocal };
  const [messages, setMessages] = useState<Msg[]>([
    { de: 'ia', texte: `Bonjour ${PRENOM}. Je réponds à vos questions générales sur la grossesse, votre carnet et le suivi de votre bébé, à l’écrit ou en message vocal, en français ou en wolof. Je ne pose pas de diagnostic et je vous oriente vers un soignant si nécessaire.` },
    { de: 'moi', texte: 'Est-ce normal d’avoir mal au dos à 24 semaines ?' },
    { de: 'ia', texte: 'Les douleurs de dos sont fréquentes au 2e trimestre : le ventre grandit et la posture change. Une marche douce, de bonnes positions et du repos aident souvent. Si la douleur est forte, s’accompagne de fièvre ou de contractions, consultez rapidement.', sources: ['OMS, soins prénatals, 2016'] },
  ]);
  const [saisie, setSaisie] = useState('');
  const [ecrit, setEcrit] = useState(false);
  const [langue, setLangue] = useState<Langue>('wolof');
  const [choixVocal, setChoixVocal] = useState<number | null>(null);
  const [parle, setParle] = useState<number | null>(null);
  const enr = useEnregistreur();
  const fil = useRef<HTMLDivElement>(null);
  useEffect(() => { fil.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, ecrit]);
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);
  const suggestions = ['Que manger pour avoir assez de fer ?', 'Quand est mon prochain rendez-vous ?', 'J’ai des saignements, que faire ?'];

  const repondre = (texte: string) => {
    setEcrit(true);
    setTimeout(() => {
      setEcrit(false);
      const r = prochainRdv()[0];
      const rep: Msg = URGENCE.test(texte)
        ? { de: 'ia', urgence: true, texte: 'Ce que vous décrivez peut nécessiter une évaluation rapide. Rendez-vous sans attendre à la maternité ou dans la structure de santé la plus proche, ou appelez votre clinique.' }
        : /rendez|rdv/i.test(texte) && r
          ? { de: 'ia', texte: `D’après votre carnet, votre prochain rendez-vous est « ${r.motif} » le ${formatDate(r.date)} à ${r.heure}, ${r.lieu}.`, sources: ['Votre carnet Materna Data'] }
          : /fer|manger|aliment/i.test(texte)
            ? { de: 'ia', texte: 'Pour le fer : poisson, viande, foie, œufs, niébé et lentilles, feuilles vertes. Un fruit riche en vitamine C (orange, goyave, bouye) au même repas aide à mieux l’absorber ; le thé et le café pendant le repas la freinent. Le comprimé de fer et d’acide folique prescrit reste indispensable.', sources: ['OMS, soins prénatals, 2016'] }
            : /ventre|mal\b/i.test(texte)
              ? { de: 'ia', texte: 'De légers tiraillements sont fréquents : l’utérus grandit et les ligaments s’étirent. Reposez-vous et hydratez-vous. Consultez rapidement si la douleur est forte ou dure, ou si elle s’accompagne de saignements, de fièvre, de contractions régulières ou de pertes de liquide.', sources: ['OMS, soins prénatals, 2016'] }
              : { de: 'ia', texte: 'Mode démonstration : la recherche dans la base documentaire validée sera branchée dans la version suivante. Aucune réponse médicale n’est générée ici. Vous pouvez poser cette question à votre sage-femme lors du prochain rendez-vous.' };
      setMessages((m) => [...m, rep]);
    }, 1000);
  };
  const envoyer = (texte: string) => {
    if (!texte.trim()) return;
    setMessages((m) => [...m, { de: 'moi', texte }]);
    setSaisie('');
    repondre(texte);
  };
  const finirVocal = async () => {
    const v = await enr.terminer();
    setMessages((m) => { setChoixVocal(m.length); return [...m, { de: 'moi', texte: '', vocal: { ...v, enCours: true } }]; });
  };
  const transcrire = (index: number, e: ExempleVocal) => {
    setChoixVocal(null);
    setTimeout(() => {
      setMessages((m) => m.map((x, k) => (k === index && x.vocal ? { ...x, texte: e.francais, vocal: { ...x.vocal, enCours: false, exemple: e } } : x)));
      repondre(e.francais);
    }, 900);
  };
  const exempleWolof = () => {
    const e = exemplesVocaux[1];
    let idx = 0;
    setMessages((m) => { idx = m.length; return [...m, { de: 'moi', texte: '', vocal: { url: null, duree: e.duree, forme: formeExemple(e), enCours: true } }]; });
    setTimeout(() => transcrire(idx, e), 300);
  };
  const ecouter = (k: number, texte: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (parle === k) { synth.cancel(); setParle(null); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(texte); u.lang = 'fr-FR'; u.rate = 1;
    u.onend = () => setParle(null); u.onerror = () => setParle(null);
    setParle(k); synth.speak(u);
  };

  return (
    <div className="pa-ecran pa-assistant pa-ecran-statique">
      <header className="pa-tete">
        <div className="pa-ia-tete"><span className="pa-ia-avatar"><Bot size={20} /></span><div><h1 className="pa-ia-nom">Assistant Materna</h1><p className="pa-date">Français · Wolof, à l’écrit ou en vocal</p></div></div>
        <span className="badge-demo">Simulation</span>
      </header>
      <div className="pa-fil" ref={fil}>
        {messages.map((m, k) => (
          <div key={k} className={`pa-bulle ${m.de}${m.urgence ? ' urgence' : ''}${m.vocal ? ' a-vocal' : ''}`}>
            {m.urgence && <p className="pa-bulle-urgence"><AlertTriangle size={15} />Orientation vers un professionnel</p>}
            {m.vocal ? <BulleVocale {...m.vocal} /> : <p>{m.texte}</p>}
            {m.sources && <p className="pa-bulle-source"><FileText size={12} />{m.sources.join(' · ')}</p>}
            {m.de === 'ia' && k > 0 && (
              <button className={`pa-ecouter${parle === k ? ' actif' : ''}`} onClick={() => ecouter(k, m.texte)}>
                {parle === k ? <><Square size={11} fill="currentColor" />Arrêter</> : <><Volume2 size={13} />Écouter la réponse</>}
              </button>
            )}
          </div>
        ))}
        {ecrit && <div className="pa-bulle ia pa-ecrit" aria-label="L'assistant écrit"><i /><i /><i /></div>}
      </div>
      <div className="pa-assist-bas">
      {!enr.actif && (
        <div className="pa-suggestions">
          <button className="pa-sugg-vocal" onClick={exempleWolof}><Mic size={13} />Exemple de vocal en wolof</button>
          {suggestions.map((s) => <button key={s} onClick={() => envoyer(s)}>{s}</button>)}
        </div>
      )}
      {enr.actif ? (
        <BarreEnregistrement niveaux={enr.niveaux} duree={enr.duree} simule={enr.simule} langue={langue} setLangue={setLangue} onAnnuler={enr.annuler} onEnvoyer={finirVocal} />
      ) : (
        <form className="pa-saisie" onSubmit={(e) => { e.preventDefault(); envoyer(saisie); }}>
          <input id="saisie-assistant" placeholder="Écrivez ou envoyez un vocal" value={saisie} onChange={(e) => setSaisie(e.target.value)} />
          {saisie.trim()
            ? <button aria-label="Envoyer"><Send size={18} /></button>
            : <button type="button" className="pa-micro" aria-label="Enregistrer un message vocal" onClick={enr.demarrer}><Mic size={19} /></button>}
        </form>
      )}
      <p className="pa-ia-limite">L’assistant ne remplace pas une consultation. En cas d’urgence, rendez-vous dans la structure de santé la plus proche.</p>
      </div>
      {choixVocal !== null && <FeuilleTranscription langue={langue} onChoisir={(e) => transcrire(choixVocal, e)} onFermer={() => transcrire(choixVocal, exemplesVocaux.find((x) => x.langue === langue)!)} />}
    </div>
  );
}

/* ================================================================== */
function Notifications({ aller, notifs, setNotifs }: { aller: Aller; notifs: Notification[]; setNotifs: (n: Notification[]) => void }) {
  const [filtre, setFiltre] = useState<'toutes' | 'nonlues'>('toutes');
  const t = aujourdhui();
  const liste = notifs.filter((n) => filtre === 'toutes' || !n.lue);
  const groupe = (n: Notification) => { const d = joursEntre(n.date, t); return d === 0 ? 'Aujourd’hui' : d <= 7 ? 'Cette semaine' : 'Plus tôt'; };
  const groupes = ['Aujourd’hui', 'Cette semaine', 'Plus tôt'].map((g) => ({ g, items: liste.filter((n) => groupe(n) === g) })).filter((x) => x.items.length);
  return (
    <div className="pa-ecran">
      <EnTeteRetour titre="Notifications" onRetour={() => aller({ nom: 'accueil' })}
        droite={notifs.some((n) => !n.lue) ? <button className="pa-icone-btn" onClick={() => { setNotifs(notifs.map((n) => ({ ...n, lue: true }))); api.post('/moi/notifications/tout-lu').catch(() => {}); }} aria-label="Tout marquer comme lu"><CheckCheck size={19} /></button> : null} />
      <div className="pa-segment" role="tablist">
        <button role="tab" aria-selected={filtre === 'toutes'} className={filtre === 'toutes' ? 'actif' : ''} onClick={() => setFiltre('toutes')}>Toutes</button>
        <button role="tab" aria-selected={filtre === 'nonlues'} className={filtre === 'nonlues' ? 'actif' : ''} onClick={() => setFiltre('nonlues')}>Non lues · {notifs.filter((n) => !n.lue).length}</button>
      </div>
      {groupes.length === 0 && <div className="pa-vide"><EtatVide /><p>Vous avez tout lu. Les prochains rappels apparaîtront ici.</p></div>}
      {groupes.map(({ g, items }) => (
        <section key={g} className="pa-bloc">
          <h2 className="pa-groupe">{g}</h2>
          <div className="pa-notifs">
            {items.map((n) => (
              <button key={n.id} className={`pa-notif${n.lue ? '' : ' nonlue'}`} onClick={() => { setNotifs(notifs.map((x) => (x.id === n.id ? { ...x, lue: true } : x))); if (!n.lue) api.post(`/moi/notifications/${n.id}/lue`).catch(() => {}); }}>
                <IconeNotif type={n.type} />
                <span className="pa-notif-texte"><strong>{n.titre}</strong><span>{n.texte}</span><em>{joursEntre(n.date, t) === 0 ? 'Aujourd’hui' : fmtCourt.format(n.date)}</em></span>
                {!n.lue && <i className="pa-notif-point" aria-label="Non lue" />}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ================================================================== */
function Profil({ aller, onDeconnexion }: { aller: Aller; onDeconnexion?: () => void }) {
  const [prefs, setPrefs] = useState({ rdv: true, examens: true, conseils: false });
  const [histo, setHisto] = useState(false);
  const retirer = async () => {
    if (!window.confirm('Retirer votre consentement ? Votre carnet ne sera plus visible dans l’application. Vous pourrez le relier à nouveau avec votre code de liaison.')) return;
    await api.post('/moi/consentement/retirer').catch(() => {});
    if (onDeconnexion) onDeconnexion();
  };
  const Switch = ({ k }: { k: keyof typeof prefs }) => (
    <button role="switch" aria-checked={prefs[k]} className={`pa-switch${prefs[k] ? ' on' : ''}`} onClick={() => setPrefs({ ...prefs, [k]: !prefs[k] })}><span /></button>
  );
  return (
    <div className="pa-ecran">
      <header className="pa-tete"><h1 className="pa-titre">Profil</h1></header>
      <div className="pa-profil-carte">
        <span className="pa-profil-avatar">{P.initiales}</span>
        <div><strong>{P.nom}</strong><span>Carnet relié à {P.etablissement}</span><span>Patiente fictive · {P.id}</span></div>
      </div>

      <h2 className="pa-groupe">Notifications</h2>
      <ul className="pa-reglages">
        <li><CalendarClock size={18} /><span>Rappels de rendez-vous</span><Switch k="rdv" /></li>
        <li><FlaskConical size={18} /><span>Examens à réaliser</span><Switch k="examens" /></li>
        <li><Lightbulb size={18} /><span>Conseils de la semaine</span><Switch k="conseils" /></li>
      </ul>

      <h2 className="pa-groupe">Accès à mon dossier</h2>
      <ul className="pa-reglages">
        <li><Hospital size={18} /><span>{P.etablissement}<small>Médecins et sages-femmes habilités de la clinique</small></span><span className="pastille p-ok">Autorisé</span></li>
        <li><button type="button" className="pa-reglage-btn" onClick={() => setHisto(!histo)}><Activity size={18} /><span>Historique des accès<small>Dernier accès d’un soignant : {dossierP001.dernierAcces}</small></span><ChevronRight size={17} className="pa-chevron" style={{ transform: histo ? 'rotate(90deg)' : undefined }} /></button></li>
        {histo && dossierP001.historique.map((h, i) => <li key={i} className="pa-histo"><span>{h.texte}<small>{fmtCourt.format(h.date)} à {h.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small></span></li>)}
        <li><button type="button" className="pa-reglage-btn" onClick={retirer}><ShieldCheck size={18} /><span>Retirer mon consentement<small>Votre carnet ne sera plus accessible depuis l’application (loi n° 2008-12)</small></span></button></li>
      </ul>

      <h2 className="pa-groupe">Compte</h2>
      <ul className="pa-reglages">
        <li><Languages size={18} /><span>Langue</span><em>Français</em></li>
        <li><KeyRound size={18} /><span>Mot de passe et sécurité</span><ChevronRight size={17} className="pa-chevron" /></li>
        <li><ShieldCheck size={18} /><span>Confidentialité</span><ChevronRight size={17} className="pa-chevron" /></li>
        <li><HelpCircle size={18} /><span>Aide</span><ChevronRight size={17} className="pa-chevron" /></li>
      </ul>
      <button className="btn btn-discret btn-bloc" onClick={() => (onDeconnexion ? onDeconnexion() : aller({ nom: 'bienvenue' }))}><LogOut size={17} />Se déconnecter</button>
    </div>
  );
}

/* ================================================================== */
function Conseils({ aller }: { aller: Aller }) {
  const cats: ('Tous' | Categorie)[] = ['Tous', 'Nutrition', 'Consultations', 'Bien-être', 'Accouchement', 'Allaitement'];
  const [cat, setCat] = useState<(typeof cats)[number]>('Tous');
  const [q, setQ] = useState('');
  const liste = useMemo(() => articles.filter((a) => (cat === 'Tous' || a.categorie === cat) && (q === '' || (a.titre + a.resume + a.paragraphes.map((p) => p.texte).join(' ')).toLowerCase().includes(q.toLowerCase()))), [cat, q]);
  const [une, ...autres] = liste;
  return (
    <div className="pa-ecran">
      <EnTeteRetour titre="Conseils" onRetour={() => aller({ nom: 'accueil' })} />
      <label className="pa-recherche" htmlFor="recherche-conseils"><Search size={17} /><input id="recherche-conseils" placeholder="Rechercher un conseil" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <div className="pa-puces" role="tablist" aria-label="Catégories">
        {cats.map((c) => <button key={c} role="tab" aria-selected={c === cat} className={c === cat ? 'actif' : ''} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      {!une && <div className="pa-vide"><Lightbulb size={28} /><p>Aucun article ne correspond à « {q} ». Essayez « fer » ou « sac ».</p></div>}
      {une && (
        <button className="pa-une" onClick={() => aller({ nom: 'article', id: une.id })}>
          <VisuelArticle id={une.id} type={une.couverture} hauteur={146} />
          <span className="pa-une-corps"><span className="pa-ca-cat">{une.categorie} · {une.minutes} min de lecture</span><span className="pa-une-titre">{une.titre}</span><span className="pa-une-resume">{une.resume}</span></span>
        </button>
      )}
      <div className="pa-liste-articles">
        {autres.map((a) => (
          <button key={a.id} className="pa-ligne-article" onClick={() => aller({ nom: 'article', id: a.id })}>
            <span className="pa-la-vignette"><VisuelArticle id={a.id} type={a.couverture} hauteur={72} /></span>
            <span className="pa-la-texte"><span className="pa-ca-cat">{a.categorie} · {a.minutes} min</span><span className="pa-la-titre">{a.titre}</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LectureArticle({ id, aller }: { id: string; aller: Aller }) {
  const a = articles.find((x) => x.id === id)!;
  const [avis, setAvis] = useState<null | 'oui' | 'non'>(null);
  return (
    <div className="pa-ecran pa-article">
      <div className="pa-article-couv">
        <VisuelArticle id={a.id} type={a.couverture} hauteur={200} />
        <button className="pa-retour pa-retour-flottant" onClick={() => aller({ nom: 'conseils' })} aria-label="Retour aux conseils"><ChevronLeft size={22} /></button>
      </div>
      <div className="pa-article-corps">
        <p className="pa-ca-cat">{a.categorie} · {a.minutes} min de lecture</p>
        <h1 className="pa-titre">{a.titre}</h1>
        <p className="pa-article-chapo">{a.resume}</p>
        {a.paragraphes.map((p, k) => <div key={k} className="pa-article-par">{p.titre && <h2>{p.titre}</h2>}<p>{p.texte}</p></div>)}
        <div className="pa-source"><FileText size={15} /><div><strong>Source</strong><span>{a.source}</span></div></div>
        {a.id === 'a3' && <p className="pa-credit">Photo : Queen_Naya</p>}
        <p className="pa-avert">Contenu pédagogique de démonstration. Il ne remplace pas l’avis de votre sage-femme ou de votre médecin.</p>
        <div className="pa-avis">
          <span>Cet article vous a-t-il aidée ?</span>
          <div>
            <button className={avis === 'oui' ? 'actif' : ''} onClick={() => setAvis('oui')} aria-label="Oui"><ThumbsUp size={16} /></button>
            <button className={avis === 'non' ? 'actif' : ''} onClick={() => setAvis('non')} aria-label="Non"><ThumbsDown size={16} /></button>
          </div>
        </div>
        {avis && <p className="pa-merci">Merci, votre avis nous aide à améliorer les conseils.</p>}
      </div>
    </div>
  );
}
