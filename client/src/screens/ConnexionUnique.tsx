// Page de connexion unique : un seul formulaire, l'espace ouvert dépend du compte (patiente ou soignant).
import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, ShieldCheck, HeartPulse, CalendarDays, Stethoscope, ChevronRight } from 'lucide-react';
import { LogoComplet, Logo } from '../components/Logo';
import { api, ErreurApi } from '../data/api';

const MDP = 'Demo2026!';
// Comptes de démonstration (fictifs) créés par le script de remplissage de la base
const COMPTES = [
  { email: 'mariama.sow@demo.sn', nom: 'Mariama Sow', role: 'Patiente' },
  { email: 'a.diop@sutura.exemple.sn', nom: 'Dr Aminata Diop', role: 'Médecin' },
  { email: 'a.sarr@sutura.exemple.sn', nom: 'Awa Sarr', role: 'Sage-femme' },
  { email: 'f.mbaye@sutura.exemple.sn', nom: 'Dr Fatou Mbaye', role: 'Médecin' },
  { email: 'c.ndiaye@sutura.exemple.sn', nom: 'Cheikh Ndiaye', role: 'Administration' },
  { email: 'externe@exemple.sn', nom: 'Compte externe', role: 'Non accrédité' },
];
type Session = { espace: 'pro' | 'patiente' | null; relie?: boolean };

export function ConnexionUnique({ onConnecte, onInscription }: { onConnecte: (s: Session) => void; onInscription: () => void }) {
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [voir, setVoir] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  const comptes = COMPTES;

  const remplir = (e: string) => { setEmail(e); setMdp(MDP); setErreur(null); };
  const valider = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const id = email.trim().toLowerCase();
    if (!id || !mdp) return setErreur('Renseignez votre adresse e-mail (ou téléphone) et votre mot de passe.');
    setErreur(null); setCharge(true);
    try {
      const s = await api.post<Session>('/auth/connexion', { identifiant: id, mdp });
      onConnecte(s);
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : 'Le serveur ne répond pas. Réessayez.');
      setCharge(false);
    }
  };

  return (
    <main className="cx">
      <aside className="cx-marque">
        <Logo hauteur={34} inverse />
        <div className="cx-marque-texte">
          <h2>Le suivi de la grossesse et de l’enfant, partagé entre la patiente et ses soignants.</h2>
          <ul>
            <li><HeartPulse size={18} />Carnet de grossesse et calendrier des 4 CPN</li>
            <li><CalendarDays size={18} />Rendez-vous et rappels</li>
            <li><Stethoscope size={18} />Dossier partagé avec la sage-femme et le médecin</li>
          </ul>
        </div>
        <p className="cx-marque-pied"><ShieldCheck size={15} />Projet académique : patientes, soignants et Clinique Sutura sont fictifs.</p>
      </aside>

      <section className="cx-zone">
        <form className="cx-form" onSubmit={valider} noValidate>
          <div className="cx-logo-mobile"><LogoComplet largeur={128} /></div>
          <h1>Connexion</h1>
          <p className="cx-sous">Un seul accès : les patientes depuis l’application mobile, les soignants depuis leur ordinateur. L’espace s’ouvre selon votre compte.</p>
          <label className="cx-champ"><span>Adresse e-mail ou téléphone</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="nom@exemple.sn" aria-invalid={!!erreur} />
          </label>
          <label className="cx-champ"><span>Mot de passe</span>
            <div className="cx-mdp">
              <input type={voir ? 'text' : 'password'} value={mdp} onChange={(e) => setMdp(e.target.value)} autoComplete="current-password" aria-invalid={!!erreur} />
              <button type="button" onClick={() => setVoir(!voir)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{voir ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>
          {erreur && <p className="pa-erreur" role="alert"><AlertTriangle size={15} />{erreur}</p>}
          <button className="btn btn-primaire btn-bloc cx-btn" disabled={charge}>{charge ? <span className="pa-spinner" /> : 'Se connecter'}</button>
          <p className="cx-creer">Nouvelle patiente ? <button type="button" className="pa-lien" onClick={onInscription}>Créer mon compte</button></p>

          <div className="cx-demo">
            <p>Comptes de démonstration <span>mot de passe {MDP}</span></p>
            <ul>
              {comptes.map((c) => (
                <li key={c.email}><button type="button" onClick={() => remplir(c.email)}><strong>{c.nom}</strong><em>{c.role}</em><ChevronRight size={15} /></button></li>
              ))}
            </ul>
          </div>
        </form>
      </section>
    </main>
  );
}
