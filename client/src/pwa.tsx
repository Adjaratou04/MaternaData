import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ubuntu/latin-400.css';
import '@fontsource/ubuntu/latin-500.css';
import '@fontsource/ubuntu/latin-700.css';
import '@fontsource/ubuntu/latin-400-italic.css';
import '@fontsource/arimo/latin-400.css';
import '@fontsource/arimo/latin-500.css';
import '@fontsource/arimo/latin-600.css';
import '@fontsource/arimo/latin-700.css';
import './design/tokens.css';
import './design/ecrans.css';
import './design/patiente.css';
import './design/pro.css';
import './design/pwa.css';
import { ConnexionUnique } from './screens/ConnexionUnique';
import { AppPatiente, majMoi } from './screens/patiente/AppPatiente';
import { ProTableauDeBord } from './screens/Pro';
import { LogoComplet } from './components/Logo';
import { api } from './data/api';
import { charger, remplirEtat, viderEtat, convPatiente, convConsultation, convExamen, convRdv, convEntree } from './data/store';
import { hydraterPatiente } from './data/patiente';

type Route = 'logo' | 'bienvenue' | 'connexion' | 'patiente' | 'pro' | 'inscription';
type Session = { espace: 'pro' | 'patiente' | null; relie?: boolean };

/** Charge le carnet de la patiente connectée et prépare les écrans de l'application. */
async function chargerCarnet(silencieux = false) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = await api.get<any>(`/moi/carnet${silencieux ? '?silencieux=1' : ''}`);
  hydraterPatiente(c);
  remplirEtat({
    patientes: [convPatiente(c.patiente)], consultations: c.consultations.map(convConsultation), examens: c.examens.map(convExamen),
    rdv: c.rdv.map(convRdv), journal: c.journal.map(convEntree), utilisateurs: [], profil: '',
  });
  majMoi();
}

/** Téléphone, tablette, ou application installée sur l'écran d'accueil. */
const surMobile = () =>
  window.matchMedia('(max-width: 820px)').matches || window.matchMedia('(pointer: coarse)').matches ||
  window.matchMedia('(display-mode: standalone)').matches;

/** Écran de lancement : le logo, avant l'accueil. */
function EcranLogo() {
  return (
    <div className="pwa-logo">
      <div className="pwa-logo-centre">
        <LogoComplet largeur={210} />
        <p>Votre carnet de santé mère-enfant</p>
      </div>
      <span className="pwa-logo-barre"><i /></span>
    </div>
  );
}

function Pwa() {
  const [route, setRoute] = useState<Route>('logo');
  const [etapeIns, setEtapeIns] = useState(0);
  const [toast, setToast] = useState<string | undefined>();
  const [version, setVersion] = useState(0);
  const depart = (): Route => (surMobile() ? 'bienvenue' : 'connexion');

  const aller = (r: Route) => {
    window.location.hash = r === 'logo' || r === 'bienvenue' || r === 'connexion' ? '#/' : `#/${r}`;
    setRoute(r);
  };

  /** Ouvre l'espace correspondant à la session qui vient d'être ouverte. */
  const ouvrir = useCallback(async (s: Session) => {
    try {
      if (s.espace === 'pro') { await charger(); aller('pro'); return; }
      if (s.espace === 'patiente') {
        if (s.relie) { await chargerCarnet(); setVersion((v) => v + 1); aller('patiente'); }
        else { setEtapeIns(1); aller('inscription'); }
        return;
      }
    } catch { /* session expirée ou serveur indisponible */ }
    setEtapeIns(0);
    aller(depart());
  }, []);

  // Lancement : écran du logo, puis accueil. Le carnet d'une patiente ne s'ouvre JAMAIS sans nouvelle connexion.
  useEffect(() => {
    const minimum = new Promise((r) => setTimeout(r, 1800));
    const session = api.get<Session>('/auth/moi').catch(() => ({ espace: null } as Session));
    Promise.all([minimum, session]).then(async ([, s]) => {
      if (s.espace === 'patiente') await api.post('/auth/deconnexion').catch(() => {});
      if (s.espace === 'pro' && !surMobile()) return ouvrir(s); // le logiciel des soignants reprend la session en cours
      setEtapeIns(0);
      aller(window.location.hash === '#/inscription' ? 'inscription' : depart());
    });
  }, [ouvrir]);

  // Actualisation régulière : la patiente voit les consultations saisies par la clinique, et inversement.
  useEffect(() => {
    if (route !== 'pro' && route !== 'patiente') return;
    const id = setInterval(() => { (route === 'pro' ? charger() : chargerCarnet(true)).catch(() => {}); }, 20000);
    return () => clearInterval(id);
  }, [route]);

  useEffect(() => {
    const patiente = route === 'inscription' || route === 'bienvenue' || route === 'patiente';
    document.documentElement.dataset.espace = patiente ? 'patiente' : route;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', route === 'pro' ? '#570D22' : '#FFFFFF');
  }, [route]);

  const deconnexion = async () => {
    await api.post('/auth/deconnexion').catch(() => {});
    viderEtat(); setEtapeIns(0); setToast(undefined); setVersion((v) => v + 1); aller(depart());
  };

  if (route === 'logo') return <EcranLogo />;
  if (route === 'patiente' || route === 'inscription' || route === 'bienvenue') return (
    <div className="pwa-patiente">
      <div className="pwa-patiente-cadre">
        <AppPatiente
          key={`${route}-${version}`}
          ecranInitial={route === 'inscription' ? 'inscription' : route === 'bienvenue' ? 'bienvenue' : 'accueil'}
          etapeInscription={etapeIns}
          toastInitial={route === 'patiente' ? toast : undefined}
          onConnecte={(s) => ouvrir(s)}
          onChangerEspace={surMobile() ? undefined : () => aller('connexion')}
          onDeconnexion={deconnexion}
          onCarnetRelie={async () => { setToast('Carnet relié à votre clinique'); await ouvrir({ espace: 'patiente', relie: true }); }}
        />
      </div>
      <p className="pwa-note-mobile">L’espace patiente est une application mobile : aperçu au format téléphone.</p>
    </div>
  );
  if (route === 'pro') return <div className="pwa-pro"><ProTableauDeBord onDeconnexion={deconnexion} /></div>;
  return <ConnexionUnique onConnecte={(s) => ouvrir(s)} onInscription={() => { setEtapeIns(0); aller('inscription'); }} />;
}

createRoot(document.getElementById('root')!).render(<StrictMode><Pwa /></StrictMode>);

// Rend l'application installable sur le téléphone (« Installer l'application » / « Sur l'écran d'accueil »)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}
