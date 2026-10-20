import { useMemo, useState } from 'react';
import {
  Sparkles, AlertTriangle, Database, CheckCircle2, CircleDashed, ShieldCheck, Search, FileText, MessageSquarePlus,
  ClipboardCheck, BookOpen, TrendingUp, TrendingDown, Minus, Info, CalendarHeart,
} from 'lucide-react';
import { patientes, suiviGrossesse, formatDate, professionnelConnecte } from '../data/apercu';
import { articles } from '../data/contenus';

/* ------------------------------------------------------------------ */
/* Données FICTIVES utilisées par l'interface du module prédictif      */
/* ------------------------------------------------------------------ */
type Niveau = 'faible' | 'modere' | 'eleve';
interface Variable { libelle: string; valeur: string | null; source: string }
interface Facteur { libelle: string; effet: 'hausse' | 'baisse' | 'neutre'; poids: number }
interface Profil { id: string; variables: Variable[]; niveau: Niveau | null; facteurs: Facteur[] }

const profils: Profil[] = [
  { id: 'P001', niveau: 'faible',
    variables: [
      { libelle: 'Âge', valeur: '29 ans', source: 'Dossier' },
      { libelle: 'Parité', valeur: '1 accouchement par voie basse', source: 'Antécédents' },
      { libelle: 'Antécédent de césarienne', valeur: 'Non', source: 'Antécédents' },
      { libelle: 'IMC avant grossesse', valeur: '24,6', source: 'CPN 1' },
      { libelle: 'Tension artérielle', valeur: '11/7', source: 'CPN 2' },
      { libelle: 'Hauteur utérine', valeur: '23 cm', source: 'CPN 2' },
      { libelle: 'Glycémie à jeun', valeur: null, source: 'Examen prescrit' },
      { libelle: 'Présentation fœtale', valeur: null, source: 'Évaluée après 36 SA' },
    ],
    facteurs: [
      { libelle: 'Accouchement antérieur par voie basse', effet: 'baisse', poids: 0.8 },
      { libelle: 'Tension artérielle dans les normes', effet: 'baisse', poids: 0.4 },
      { libelle: 'IMC dans les normes', effet: 'baisse', poids: 0.3 },
      { libelle: 'Glycémie non encore disponible', effet: 'neutre', poids: 0.2 },
    ] },
  { id: 'P003', niveau: 'modere',
    variables: [
      { libelle: 'Âge', valeur: '33 ans', source: 'Dossier' },
      { libelle: 'Parité', valeur: 'Première grossesse', source: 'Antécédents' },
      { libelle: 'Antécédent de césarienne', valeur: 'Non', source: 'Antécédents' },
      { libelle: 'IMC avant grossesse', valeur: '29,1', source: 'CPN 1' },
      { libelle: 'Tension artérielle', valeur: '14/9 · à vérifier', source: 'Consultation récente' },
      { libelle: 'Hauteur utérine', valeur: '29 cm', source: 'Consultation récente' },
      { libelle: 'Glycémie à jeun', valeur: '0,88 g/L', source: 'Bilan' },
      { libelle: 'Présentation fœtale', valeur: null, source: 'Évaluée après 36 SA' },
    ],
    facteurs: [
      { libelle: 'Tension artérielle élevée, à contrôler', effet: 'hausse', poids: 0.9 },
      { libelle: 'Première grossesse', effet: 'hausse', poids: 0.5 },
      { libelle: 'IMC en surpoids', effet: 'hausse', poids: 0.4 },
      { libelle: 'Glycémie dans les normes', effet: 'baisse', poids: 0.3 },
    ] },
  { id: 'P004', niveau: 'eleve',
    variables: [
      { libelle: 'Âge', valeur: '31 ans', source: 'Dossier' },
      { libelle: 'Parité', valeur: '1 accouchement', source: 'Antécédents' },
      { libelle: 'Antécédent de césarienne', valeur: 'Oui, 1 césarienne (2023)', source: 'Antécédents' },
      { libelle: 'IMC avant grossesse', valeur: '27,0', source: 'CPN 1' },
      { libelle: 'Tension artérielle', valeur: '12/8', source: 'Consultation récente' },
      { libelle: 'Hauteur utérine', valeur: '34 cm', source: 'Consultation récente' },
      { libelle: 'Glycémie à jeun', valeur: '0,85 g/L', source: 'Bilan' },
      { libelle: 'Présentation fœtale', valeur: 'Céphalique', source: 'Échographie' },
    ],
    facteurs: [
      { libelle: 'Antécédent de césarienne', effet: 'hausse', poids: 1 },
      { libelle: 'IMC en surpoids', effet: 'hausse', poids: 0.35 },
      { libelle: 'Présentation céphalique', effet: 'baisse', poids: 0.5 },
      { libelle: 'Tension artérielle dans les normes', effet: 'baisse', poids: 0.3 },
    ] },
  { id: 'P002', niveau: null,
    variables: [
      { libelle: 'Âge', valeur: '24 ans', source: 'Dossier' },
      { libelle: 'Parité', valeur: null, source: 'Antécédents' },
      { libelle: 'Antécédent de césarienne', valeur: null, source: 'Antécédents' },
      { libelle: 'IMC avant grossesse', valeur: null, source: 'CPN 1' },
      { libelle: 'Tension artérielle', valeur: '11/7', source: 'Première consultation' },
      { libelle: 'Hauteur utérine', valeur: null, source: '' },
      { libelle: 'Glycémie à jeun', valeur: null, source: '' },
      { libelle: 'Présentation fœtale', valeur: null, source: '' },
    ],
    facteurs: [] },
];

const libNiveau: Record<Niveau, string> = { faible: 'Attention faible', modere: 'Attention modérée', eleve: 'Attention renforcée' };

/* ------------------------------------------------------------------ */
export function EspaceIA() {
  const [onglet, setOnglet] = useState<'predictif' | 'documentaire'>('predictif');
  return (
    <main className="pro-zone">
      <div className="pro-titre">
        <div>
          <p className="pro-date">Outils d’aide à la décision</p>
          <h1>Espace IA</h1>
        </div>
        <div className="ia-onglets" role="tablist">
          <button role="tab" aria-selected={onglet === 'predictif'} className={onglet === 'predictif' ? 'actif' : ''} onClick={() => setOnglet('predictif')}><Sparkles size={16} />Module prédictif</button>
          <button role="tab" aria-selected={onglet === 'documentaire'} className={onglet === 'documentaire' ? 'actif' : ''} onClick={() => setOnglet('documentaire')}><BookOpen size={16} />Assistant documentaire</button>
        </div>
      </div>
      {onglet === 'predictif' ? <ModulePredictif /> : <AssistantDocumentaire />}
    </main>
  );
}

/* ------------------------------------------------------------------ */
function Jauge({ niveau }: { niveau: Niveau }) {
  // Jauge qualitative à trois zones, sans valeur chiffrée
  const angle = { faible: -60, modere: 0, eleve: 60 }[niveau];
  const arc = (a0: number, a1: number) => {
    const r = 80, cx = 100, cy = 100, rad = (a: number) => ((a - 90) * Math.PI) / 180;
    const p = (a: number) => `${cx + r * Math.cos(rad(a))} ${cy + r * Math.sin(rad(a))}`;
    return `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`;
  };
  return (
    <svg viewBox="0 0 200 118" width="100%" style={{ maxWidth: 260 }} role="img" aria-label={`${libNiveau[niveau]} (simulation)`}>
      <path d={arc(-90, -32)} stroke="#9FD6B9" strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d={arc(-28, 28)} stroke="#F8D08A" strokeWidth="16" fill="none" />
      <path d={arc(32, 90)} stroke="#F39AAE" strokeWidth="16" fill="none" strokeLinecap="round" />
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px', transition: 'transform .7s cubic-bezier(.2,.8,.2,1)' }}>
        <path d="M100 32 L106 100 L94 100 Z" fill="#570D22" />
      </g>
      <circle cx="100" cy="100" r="10" fill="#570D22" />
      <circle cx="100" cy="100" r="4" fill="#fff" />
      <text x="22" y="116" fontSize="9" fill="#7D5F68">Faible</text>
      <text x="100" y="12" fontSize="9" fill="#7D5F68" textAnchor="middle">Modérée</text>
      <text x="178" y="116" fontSize="9" fill="#7D5F68" textAnchor="end">Renforcée</text>
    </svg>
  );
}

/** Aide IA d'une patiente (onglet du dossier). */
export function AideIA({ pid }: { pid: string }) {
  if (!profils.some((p) => p.id === pid)) return (
    <section className="carte pro-bloc"><p className="pro-muet">Pas d’estimation pour ce dossier : le module concerne les grossesses en cours.</p></section>
  );
  return <ModulePredictif pidFixe={pid} />;
}

/** Page Recommandations : recherche dans la base de contenus validés. */
export function Recommandations() {
  return (
    <main className="pro-zone">
      <div className="pro-titre"><div><p className="pro-date">Base documentaire validée</p><h1>Recommandations</h1></div></div>
      <AssistantDocumentaire />
    </main>
  );
}

function ModulePredictif({ pidFixe }: { pidFixe?: string } = {}) {
  const [selIdLibre, setSelId] = useState('P004');
  const selId = pidFixe ?? selIdLibre;
  const [revues, setRevues] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const pr = profils.find((p) => p.id === selId)!;
  const pat = patientes.find((p) => p.id === selId)!;
  const g = pat.ddr ? suiviGrossesse(pat.ddr) : null;
  const renseignees = pr.variables.filter((v) => v.valeur).length;
  const completude = Math.round((renseignees / pr.variables.length) * 100);
  const maxPoids = Math.max(1, ...pr.facteurs.map((f) => f.poids));

  return (
    <>
      <div className="ia-bandeau" role="note">
        <AlertTriangle size={18} />
        <p><strong>Simulation, non clinique.</strong> Aucun modèle validé n’est connecté. Les niveaux et facteurs affichés sont des scénarios de démonstration qui illustrent l’interface prévue ; ils ne doivent pas guider une décision médicale.</p>
      </div>

      <div className={`ia-grille${pidFixe ? ' ia-grille-fiche' : ''}`}>
        {/* Liste des patientes */}
        {!pidFixe && <section className="carte pro-bloc ia-liste">
          <div className="pro-bloc-titre"><h2>Patientes</h2><span className="pro-muet">{profils.length} dossiers</span></div>
          <ul>
            {profils.map((p) => {
              const pa = patientes.find((x) => x.id === p.id)!;
              const c = Math.round((p.variables.filter((v) => v.valeur).length / p.variables.length) * 100);
              return (
                <li key={p.id}>
                  <button className={selId === p.id ? 'actif' : ''} onClick={() => { setSelId(p.id); setNote(''); }}>
                    <span className="pro-pat-av">{pa.nom.split(' ').map((m) => m[0]).join('')}</span>
                    <span className="ia-liste-texte"><strong>{pa.nom}</strong><span>{p.id} · données {c} %</span>
                    {p.niveau ? <span className={`ia-niveau n-${p.niveau}`}>{p.niveau === 'faible' ? 'Faible' : p.niveau === 'modere' ? 'Modérée' : 'Renforcée'}</span> : <span className="ia-niveau n-vide">Incomplet</span>}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>}

        {/* Résultat */}
        <section className="carte pro-bloc ia-resultat">
          <div className="ia-resultat-tete">
            <div><p className="pro-muet">Estimation du risque de césarienne</p><h2>{pat.nom} <span className="pro-muet">· {pat.id}</span></h2></div>
            <span className="badge-demo">Simulation, non clinique</span>
          </div>

          {pr.niveau ? (
            <div className="ia-jauge-zone">
              <Jauge niveau={pr.niveau} />
              <div className="ia-jauge-texte">
                <strong className={`ia-niveau-grand n-${pr.niveau}`}>{libNiveau[pr.niveau]}</strong>
                <p>Niveau qualitatif simulé, sans pourcentage : un modèle réel devra être entraîné et validé avant d’afficher une probabilité.</p>
                <p className="ia-incertitude"><Info size={14} />Incertitude : non mesurable sans modèle évalué.</p>
              </div>
            </div>
          ) : (
            <div className="ia-insuffisant"><Database size={22} /><div><strong>Données insuffisantes</strong><p>L’estimation n’est pas lancée : {pr.variables.length - renseignees} variables essentielles manquent. Complétez le dossier pour activer le module.</p></div></div>
          )}

          {pr.facteurs.length > 0 && (
            <div className="ia-facteurs">
              <h3>Facteurs pris en compte</h3>
              {pr.facteurs.map((f) => (
                <div key={f.libelle} className={`ia-facteur ${f.effet}`}>
                  <span className="ia-facteur-icone">{f.effet === 'hausse' ? <TrendingUp size={15} /> : f.effet === 'baisse' ? <TrendingDown size={15} /> : <Minus size={15} />}</span>
                  <span className="ia-facteur-lib">{f.libelle}</span>
                  <span className="ia-facteur-barre"><i style={{ width: `${(f.poids / maxPoids) * 100}%` }} /></span>
                </div>
              ))}
              <p className="pro-muet">Contributions illustratives : la longueur des barres ne correspond à aucun calcul réel.</p>
            </div>
          )}

          {g && (
            <div className="ia-dpa">
              <CalendarHeart size={18} />
              <div><strong>Date prévue d’accouchement : {formatDate(g.dpa)}</strong><span>Calcul réel · dernières règles + 280 jours · {g.sa} SA + {g.j} j aujourd’hui</span></div>
              <span className="pastille p-ok">Calcul réel</span>
            </div>
          )}

          <div className="ia-revue">
            {revues[selId] ? (
              <p className="ia-revue-ok"><ClipboardCheck size={16} />{revues[selId]}</p>
            ) : (
              <>
                <label htmlFor="ia-note" className="sr">Commentaire clinique</label>
                <input id="ia-note" placeholder="Ajouter un commentaire clinique (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} />
                <button className="btn btn-bordeaux btn-sm" onClick={() => setRevues({ ...revues, [selId]: `Revu par ${professionnelConnecte.nom} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}${note ? ` · « ${note} »` : ''} · enregistré dans le journal` })}><MessageSquarePlus size={15} />Marquer comme revu</button>
              </>
            )}
          </div>
        </section>

        {/* Données utilisées + fiche du modèle */}
        <div className="ia-colonne">
          <section className="carte pro-bloc">
            <div className="pro-bloc-titre"><h2>Données utilisées</h2><span className="pro-muet">{completude} %</span></div>
            <div className="ia-completude"><i style={{ width: `${completude}%` }} /></div>
            <ul className="ia-variables">
              {pr.variables.map((v) => (
                <li key={v.libelle} className={v.valeur ? '' : 'manque'}>
                  {v.valeur ? <CheckCircle2 size={15} /> : <CircleDashed size={15} />}
                  <span><strong>{v.libelle}</strong><em>{v.valeur ?? 'Manquante'}{v.source ? ` · ${v.source}` : ''}</em></span>
                </li>
              ))}
            </ul>
          </section>
          <section className="carte pro-bloc ia-fiche">
            <div className="pro-bloc-titre"><h2><ShieldCheck size={16} /> Fiche du modèle</h2></div>
            <dl>
              <div><dt>Statut</dt><dd>Non entraîné · interface de démonstration</dd></div>
              <div><dt>Données nécessaires</dt><dd>Dossiers obstétricaux anonymisés, avec issue de l’accouchement</dd></div>
              <div><dt>Méthode envisagée</dt><dd>Régression logistique (modèle de référence), puis Random Forest et XGBoost, comparés</dd></div>
              <div><dt>Évaluation</dt><dd>Discrimination (AUC), calibration, analyse par sous-groupes</dd></div>
              <div><dt>Avant tout usage</dt><dd>Validation rétrospective puis prospective, avis éthique, déclaration CDP</dd></div>
              <div><dt>Étude de faisabilité</dt><dd>Protocole testé sur un jeu public (Maternal Health Risk, UCI, 451 relevés, Bangladesh, cible « niveau de risque » et non césarienne). Random Forest retenu : rappel du risque élevé 0,79, AUC 0,80 sur le jeu de test. Résultats de méthode, sans valeur clinique.</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Recherche documentaire RÉELLE dans la base de contenus (sans génération) */
function AssistantDocumentaire() {
  const [q, setQ] = useState('fer acide folique');
  const passages = useMemo(() => {
    const mots = q.toLowerCase().split(/[^a-zàâçéèêëîïôûùüÿœ]+/).filter((m) => m.length > 2);
    if (!mots.length) return [];
    return articles.flatMap((a) => a.paragraphes.map((p) => ({ a, p, score: mots.reduce((s, m) => s + ((p.titre ?? '') + ' ' + p.texte).toLowerCase().split(m).length - 1, 0) })))
      .filter((x) => x.score > 0).sort((x, y) => y.score - x.score).slice(0, 4);
  }, [q]);
  return (
    <>
      <div className="ia-bandeau ia-bandeau-info" role="note">
        <Info size={18} />
        <p><strong>Recherche documentaire réelle, génération non connectée.</strong> Les passages ci-dessous proviennent de la base de contenus de démonstration ; aucun modèle de langage ne reformule les réponses à ce stade.</p>
      </div>
      <section className="carte pro-bloc">
        <label className="pro-recherche ia-recherche"><Search size={16} /><input id="ia-doc" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans les documents de référence" /></label>
        <div className="ia-suggestions">{['fer acide folique', 'signes consulter', 'allaitement', 'consultations prénatales'].map((s) => <button key={s} onClick={() => setQ(s)}>{s}</button>)}</div>
        {passages.length === 0 ? <p className="pro-muet">Aucun passage ne correspond. Essayez « allaitement » ou « fer ».</p> : (
          <ul className="ia-passages">
            {passages.map(({ a, p }, k) => (
              <li key={k}>
                <span className="ia-passage-icone"><FileText size={16} /></span>
                <div><strong>{a.titre}{p.titre ? ` · ${p.titre}` : ''}</strong><p>{p.texte}</p><em>Source : {a.source}</em></div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
