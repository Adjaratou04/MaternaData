// Création du compte patiente puis liaison au dossier médical, via l'API.
// Principe : le compte seul ne donne accès à rien. L'accès au carnet exige
// 1) le code de liaison remis par la sage-femme, 2) un code SMS envoyé au numéro enregistré
// DANS LE DOSSIER de la clinique, 3) le consentement explicite au partage.
import { useState } from 'react';
import { ChevronLeft, Eye, EyeOff, AlertTriangle, Info, KeyRound, MessageSquareText, ShieldCheck, CheckCircle2, Hospital, Lock, UserRound, RotateCcw } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { api, ErreurApi, versDate } from '../../data/api';
import { suiviGrossesse } from '../../data/apercu';

const CODE_DEMO = 'MATERNA-DKR-9042';
const etapes = ['Compte', 'Code', 'Vérification', 'Consentement'];

type Envoi = { telephoneMasque: string; fournisseur: string; codeDemo?: string };
type Dossier = { id: string; nom: string; ddr: string | null; etablissement: string };

export function Inscription({ retour, terminer, etapeInitiale = 0 }: { retour: () => void; terminer: () => void; etapeInitiale?: number }) {
  const [etape, setEtape] = useState(etapeInitiale);
  const [erreur, setErreur] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  const [compte, setCompte] = useState({ nom: 'Aïssatou Ba', tel: '+221 77 000 00 03', mdp: 'Demo2026!', cgu: false });
  const [voir, setVoir] = useState(false);
  const [code, setCode] = useState('');
  const [envoi, setEnvoi] = useState<Envoi | null>(null);
  const [sms, setSms] = useState('');
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [consent, setConsent] = useState({ soins: false, recherche: false });
  const [info, setInfo] = useState<string | null>(null);

  const suivant = () => { setErreur(null); setInfo(null); setEtape(etape + 1); };
  const precedent = () => { setErreur(null); etape === 0 || (etape === 1 && etapeInitiale === 1) ? retour() : setEtape(etape - 1); };
  const appeler = async (f: () => Promise<void>) => {
    setCharge(true); setErreur(null);
    try { await f(); } catch (e) { setErreur(e instanceof ErreurApi ? e.message : 'Le serveur ne répond pas. Vérifiez votre connexion.'); }
    finally { setCharge(false); }
  };

  const validerCompte = () => {
    if (compte.nom.trim().split(/\s+/).length < 2) return setErreur('Indiquez votre prénom et votre nom.');
    if (!/^\+?[\d ]{9,}$/.test(compte.tel.trim())) return setErreur('Numéro de téléphone invalide.');
    if (compte.mdp.length < 8) return setErreur('Le mot de passe doit contenir au moins 8 caractères.');
    if (!compte.cgu) return setErreur('Acceptez les conditions d’utilisation pour continuer.');
    appeler(async () => { await api.post('/inscription/compte', { nom: compte.nom.trim(), telephone: compte.tel.trim(), mdp: compte.mdp, cgu: true }); suivant(); });
  };
  const validerCode = () => appeler(async () => {
    const r = await api.post<Envoi>('/inscription/code', { code });
    setEnvoi(r); setSms(''); suivant();
  });
  const renvoyer = () => appeler(async () => {
    const r = await api.post<Envoi>('/inscription/sms/renvoyer');
    setEnvoi(r); setInfo('Un nouveau code vient d’être envoyé.');
  });
  const validerSms = () => {
    if (sms.length !== 6) return setErreur('Saisissez les 6 chiffres reçus par SMS.');
    appeler(async () => { const r = await api.post<{ dossier: Dossier }>('/inscription/sms/verifier', { code: sms }); setDossier(r.dossier); suivant(); });
  };
  const validerConsentement = () => {
    if (!consent.soins) return setErreur('Sans ce consentement, vos soignants ne pourront pas partager votre carnet avec vous.');
    appeler(async () => { await api.post('/inscription/consentement', consent); terminer(); });
  };

  const ddr = dossier?.ddr ? versDate(dossier.ddr) : null;
  const g = ddr ? suiviGrossesse(ddr) : null;

  return (
    <div className="pa-cnx pa-ins">
      <div className="pa-ins-haut">
        <button type="button" className="pa-retour" onClick={precedent} aria-label="Retour"><ChevronLeft size={22} /></button>
        <ol className="pa-ins-etapes" aria-label={`Étape ${etape + 1} sur 4`}>
          {etapes.map((e, i) => <li key={e} className={i < etape ? 'fait' : i === etape ? 'actif' : ''}><span />{e}</li>)}
        </ol>
      </div>

      {etape === 0 && (
        <form className="pa-ins-corps" onSubmit={(e) => { e.preventDefault(); validerCompte(); }} noValidate>
          <div className="pa-cnx-tete"><Logo hauteur={30} /><h1>Créer mon compte</h1><p>Votre compte vous identifie. Il ne donne encore accès à aucun dossier médical.</p></div>
          <label className="pa-champ"><span>Prénom et nom</span><input value={compte.nom} onChange={(e) => setCompte({ ...compte, nom: e.target.value })} autoComplete="name" /></label>
          <label className="pa-champ"><span>Téléphone</span><input value={compte.tel} onChange={(e) => setCompte({ ...compte, tel: e.target.value })} inputMode="tel" autoComplete="tel" /></label>
          <label className="pa-champ"><span>Mot de passe (8 caractères minimum)</span>
            <div className="pa-champ-mdp">
              <input type={voir ? 'text' : 'password'} value={compte.mdp} onChange={(e) => setCompte({ ...compte, mdp: e.target.value })} autoComplete="new-password" />
              <button type="button" onClick={() => setVoir(!voir)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{voir ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>
          <label className="pa-ins-case">
            <input type="checkbox" checked={compte.cgu} onChange={(e) => setCompte({ ...compte, cgu: e.target.checked })} />
            <span>J’accepte les conditions d’utilisation et la politique de confidentialité de Materna Data.</span>
          </label>
          {erreur && <p className="pa-erreur" role="alert"><AlertTriangle size={15} />{erreur}</p>}
          <div className="pa-demo-note"><Info size={15} /><span>Champs pré-remplis pour la démonstration (patiente fictive Aïssatou Ba).</span></div>
          <button className="btn btn-primaire btn-bloc pa-btn-xl" disabled={charge}>{charge ? <span className="pa-spinner" /> : 'Créer mon compte'}</button>
        </form>
      )}

      {etape === 1 && (
        <form className="pa-ins-corps" onSubmit={(e) => { e.preventDefault(); validerCode(); }} noValidate>
          <div className="pa-cnx-tete"><span className="pa-ins-pic"><KeyRound size={24} /></span><h1>Relier mon carnet</h1><p>Saisissez le code de liaison remis par votre sage-femme ou votre médecin lors de votre première consultation.</p></div>
          <label className="pa-champ"><span>Code de liaison</span>
            <input className="pa-ins-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="MATERNA-DKR-0000" autoCapitalize="characters" spellCheck={false} aria-invalid={!!erreur} />
          </label>
          <div className="pa-ins-fiche">
            <Hospital size={18} />
            <span><strong>Où trouver ce code ?</strong> Sur la fiche de liaison imprimée par la clinique, ou dans votre carnet papier. Le soignant peut aussi le retrouver dans votre dossier.</span>
          </div>
          {erreur && <p className="pa-erreur" role="alert"><AlertTriangle size={15} />{erreur}</p>}
          <div className="pa-demo-note"><Info size={15} /><span>Code de démonstration : <button type="button" className="pa-lien" onClick={() => setCode(CODE_DEMO)}>{CODE_DEMO}</button></span></div>
          <button className="btn btn-primaire btn-bloc pa-btn-xl" disabled={charge}>{charge ? <span className="pa-spinner" /> : 'Vérifier le code'}</button>
        </form>
      )}

      {etape === 2 && envoi && (
        <form className="pa-ins-corps" onSubmit={(e) => { e.preventDefault(); validerSms(); }} noValidate>
          <div className="pa-cnx-tete"><span className="pa-ins-pic"><MessageSquareText size={24} /></span><h1>Confirmer que c’est bien vous</h1>
            <p>Un code à 6 chiffres a été envoyé par SMS au <strong className="chiffres">{envoi.telephoneMasque}</strong>, le numéro enregistré dans votre dossier à la clinique.</p></div>
          <label className="pa-champ"><span>Code reçu par SMS</span>
            <input className="pa-ins-sms chiffres" value={sms} onChange={(e) => setSms(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="······" aria-invalid={!!erreur} />
          </label>
          <p className="pa-ins-aide"><Lock size={14} />Cette étape empêche une autre personne d’ouvrir votre carnet, même si elle connaît votre code de liaison. Le code expire au bout de 10 minutes.</p>
          {erreur && <p className="pa-erreur" role="alert"><AlertTriangle size={15} />{erreur}</p>}
          {info && <p className="pa-ins-aide"><CheckCircle2 size={14} />{info}</p>}
          {envoi.codeDemo
            ? <div className="pa-demo-note"><Info size={15} /><span>Mode démonstration : aucun fournisseur SMS n’est configuré sur le serveur. Code : <button type="button" className="pa-lien" onClick={() => setSms(envoi.codeDemo!)}>{envoi.codeDemo}</button></span></div>
            : <button type="button" className="pa-lien pa-ins-renvoi" onClick={renvoyer} disabled={charge}><RotateCcw size={14} /> Je n’ai rien reçu : renvoyer le code</button>}
          <button className="btn btn-primaire btn-bloc pa-btn-xl" disabled={charge}>{charge ? <span className="pa-spinner" /> : 'Valider'}</button>
        </form>
      )}

      {etape === 3 && dossier && (
        <form className="pa-ins-corps" onSubmit={(e) => { e.preventDefault(); validerConsentement(); }} noValidate>
          <div className="pa-cnx-tete"><span className="pa-ins-pic"><ShieldCheck size={24} /></span><h1>Votre accord</h1><p>Dossier trouvé. Avant de l’ouvrir, choisissez ce que vous acceptez.</p></div>
          <div className="pa-ins-dossier">
            <UserRound size={20} />
            <span><strong>{dossier.nom}</strong><small>{dossier.etablissement}, Dakar{g ? ` · ${g.sa} SA` : ''}</small></span>
            <CheckCircle2 size={20} className="pa-ins-ok" />
          </div>
          <label className="pa-ins-case pa-ins-carte">
            <input type="checkbox" checked={consent.soins} onChange={(e) => { setErreur(null); setConsent({ ...consent, soins: e.target.checked }); }} />
            <span><strong>Partage avec mes soignants (obligatoire)</strong>Les médecins et sages-femmes habilités de {dossier.etablissement} peuvent consulter et compléter mon carnet, et je le consulte dans l’application.</span>
          </label>
          <label className="pa-ins-case pa-ins-carte">
            <input type="checkbox" checked={consent.recherche} onChange={(e) => setConsent({ ...consent, recherche: e.target.checked })} />
            <span><strong>Amélioration de l’outil (facultatif)</strong>Mes données, rendues anonymes, peuvent servir à améliorer l’aide au suivi. Refuser ne change rien à mes soins.</span>
          </label>
          <ul className="pa-ins-garanties">
            <li>L’administration de la clinique n’a pas accès au contenu médical.</li>
            <li>Chaque consultation de votre dossier est enregistrée et visible dans « Historique des accès ».</li>
            <li>Vous pouvez retirer votre accord à tout moment depuis votre profil (loi sénégalaise n° 2008-12 sur les données personnelles).</li>
          </ul>
          {erreur && <p className="pa-erreur" role="alert"><AlertTriangle size={15} />{erreur}</p>}
          <button className="btn btn-primaire btn-bloc pa-btn-xl" disabled={charge}>{charge ? <span className="pa-spinner" /> : 'Ouvrir mon carnet'}</button>
        </form>
      )}
    </div>
  );
}
