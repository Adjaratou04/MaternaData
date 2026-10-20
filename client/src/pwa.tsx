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
import { api } from './data/api';
import { charger, remplirEtat, viderEtat, convPatiente, convConsultation, convExamen, convRdv, convEntree } from './data/store';
import { hydraterPatiente } from './data/patiente';

type Route = 'chargement' | 'connexion' | 'patiente' | 'pro' | 'inscription';
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

function Pwa() {
  const [route, setRoute] = useState<Route>('chargement');
  const [etapeIns, setEtapeIns] = useState(0);
  const [toast, setToast] = useState<string | undefined>();
  const [version, setVersion] = useState(0);

  const aller = (r: Route) => {
    window.location.hash = r === 'connexion' || r === 'chargement' ? '#/' : `#/${r}`;
    setRoute(r);
  };

  /** Ouvre l'espace correspondant à la session ouverte côté serveur. */
  const ouvrir = useCallback(async (s: Session) => {
    try {
      if (s.espace === 'pro') { await charger(); aller('pro'); return; }
      if (s.espace === 'patiente') {
        if (s.relie) { await chargerCarnet(); setVersion((v) => v + 1); aller('patiente'); }
        else { setEtapeIns(1); aller('inscription'); }
        return;
      }
    } catch { /* session expirée ou serveur indisponible */ }
    const demande = window.location.hash.replace('#/', '');
    setEtapeIns(0);
    aller(demande === 'inscription' ? 'inscription' : 'connexion');
  }, []);

  useEffect(() => { api.get<Session>('/auth/moi').then(ouvrir).catch(() => aller('connexion')); }, [ouvrir]);

  // Actualisation régulière : la patiente voit les consultations saisies par la clinique, et inversement.
  useEffect(() => {
    if (route !== 'pro' && route !== 'patiente') return;
    const id = setInterval(() => { (route === 'pro' ? charger() : chargerCarnet(true)).catch(() => {}); }, 20000);
    return () => clearInterval(id);
  }, [route]);

  useEffect(() => {
    document.documentElement.dataset.espace = route === 'inscription' ? 'patiente' : route;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', route === 'pro' ? '#570D22' : '#FFFFFF');
  }, [route]);

  const deconnexion = async () => {
    await api.post('/auth/deconnexion').catch(() => {});
    viderEtat(); setEtapeIns(0); setToast(undefined); aller('connexion');
  };

  if (route === 'chargement') return <div className="pwa-chargement"><span className="pa-spinner" /></div>;
  if (route === 'patiente' || route === 'inscription') return (
    <div className="pwa-patiente">
      <div className="pwa-patiente-cadre">
        <AppPatiente
          key={`${route}-${version}`}
          ecranInitial={route === 'inscription' ? 'inscription' : 'accueil'}
          etapeInscription={etapeIns}
          toastInitial={toast}
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
