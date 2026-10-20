import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Square, Trash2, Languages, X, Info } from 'lucide-react';

/* ------------------------------------------------------------------
   Messages vocaux de l'assistant.
   Réel : l'enregistrement par le micro (si le navigateur l'autorise), la forme d'onde,
   la durée et la réécoute du vocal.
   Simulé : la transcription wolof et la traduction en français. En production, un modèle
   de reconnaissance vocale entraîné sur le wolof serait branché ici.
------------------------------------------------------------------- */

export type Langue = 'wolof' | 'francais';
export type ExempleVocal = { id: string; langue: Langue; original: string; francais: string; duree: number };

// Phrases de démonstration (à faire relire par une locutrice wolof avant la soutenance).
export const exemplesVocaux: ExempleVocal[] = [
  { id: 'v1', langue: 'wolof', original: 'Dama am metit ci sama biir, ndax normal la ?', francais: 'J’ai mal au ventre, est-ce normal ?', duree: 4 },
  { id: 'v2', langue: 'wolof', original: 'Lan laa wara lekk ngir am fer bu doy ?', francais: 'Que dois-je manger pour avoir assez de fer ?', duree: 4 },
  { id: 'v3', langue: 'wolof', original: 'Kañ la sama rendez-vous bi ci topp ?', francais: 'Quand est mon prochain rendez-vous ?', duree: 3 },
  { id: 'v4', langue: 'wolof', original: 'Dama gis deret, lan laa wara def ?', francais: 'J’ai vu du sang, que dois-je faire ?', duree: 3 },
  { id: 'v5', langue: 'francais', original: 'Est-ce que je peux continuer à travailler au marché ?', francais: 'Est-ce que je peux continuer à travailler au marché ?', duree: 5 },
];

const NB_BARRES = 34;
const formeAleatoire = (graine: number) => Array.from({ length: NB_BARRES }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + graine) * Math.cos(i * 0.6 + graine * 2)));
export const fmtDuree = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;

/* Enregistreur : micro réel si disponible, sinon simulation visible */
export function useEnregistreur() {
  const [actif, setActif] = useState(false);
  const [simule, setSimule] = useState(false);
  const [niveaux, setNiveaux] = useState<number[]>([]);
  const [duree, setDuree] = useState(0);
  const rec = useRef<{ flux?: MediaStream; ctx?: AudioContext; mr?: MediaRecorder; morceaux: Blob[]; raf?: number; debut: number; tic?: number }>({ morceaux: [], debut: 0 });

  const arreterTout = () => {
    const r = rec.current;
    if (r.raf) cancelAnimationFrame(r.raf);
    if (r.tic) clearInterval(r.tic);
    r.flux?.getTracks().forEach((t) => t.stop());
    r.ctx?.close().catch(() => {});
  };
  useEffect(() => arreterTout, []);

  const demarrer = async () => {
    const r = rec.current;
    r.morceaux = []; r.debut = performance.now();
    setNiveaux([]); setDuree(0); setActif(true);
    r.tic = window.setInterval(() => setDuree((performance.now() - r.debut) / 1000), 200);
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      r.flux = flux;
      const ctx = new AudioContext(); r.ctx = ctx;
      const an = ctx.createAnalyser(); an.fftSize = 512;
      ctx.createMediaStreamSource(flux).connect(an);
      const buf = new Uint8Array(an.fftSize);
      let dernier = 0;
      const boucle = (t: number) => {
        an.getByteTimeDomainData(buf);
        let s = 0; for (const v of buf) s += ((v - 128) / 128) ** 2;
        if (t - dernier > 90) { dernier = t; setNiveaux((n) => [...n.slice(-(NB_BARRES - 1)), Math.min(1, Math.sqrt(s / buf.length) * 4 + 0.08)]); }
        r.raf = requestAnimationFrame(boucle);
      };
      r.raf = requestAnimationFrame(boucle);
      if (typeof MediaRecorder !== 'undefined') {
        const mr = new MediaRecorder(flux); r.mr = mr;
        mr.ondataavailable = (e) => e.data.size && r.morceaux.push(e.data);
        mr.start();
      }
      setSimule(false);
    } catch {
      // Micro refusé ou indisponible (page intégrée) : onde simulée, clairement signalée
      setSimule(true);
      let k = 0;
      const boucle = () => { k++; setNiveaux((n) => [...n.slice(-(NB_BARRES - 1)), 0.2 + 0.8 * Math.abs(Math.sin(k * 0.9) * Math.sin(k * 0.37))]); r.raf = window.setTimeout(boucle, 110) as unknown as number; };
      boucle();
    }
  };

  const terminer = (): Promise<{ url: string | null; duree: number; forme: number[] }> => new Promise((ok) => {
    const r = rec.current;
    const d = (performance.now() - r.debut) / 1000;
    const forme = niveaux.length ? [...Array(Math.max(0, NB_BARRES - niveaux.length)).fill(0.15), ...niveaux].slice(-NB_BARRES) : formeAleatoire(d);
    const fin = (url: string | null) => { if (simule) clearTimeout(r.raf); arreterTout(); setActif(false); ok({ url, duree: Math.max(1, d), forme }); };
    if (r.mr && r.mr.state !== 'inactive') {
      r.mr.onstop = () => fin(r.morceaux.length ? URL.createObjectURL(new Blob(r.morceaux, { type: r.mr!.mimeType })) : null);
      r.mr.stop();
    } else fin(null);
  });

  const annuler = () => { const r = rec.current; if (r.mr && r.mr.state !== 'inactive') r.mr.stop(); if (simule) clearTimeout(r.raf); arreterTout(); setActif(false); };

  return { actif, simule, niveaux, duree, demarrer, terminer, annuler };
}

/* Barre affichée pendant l'enregistrement, à la place du champ de saisie */
export function BarreEnregistrement({ niveaux, duree, simule, langue, setLangue, onAnnuler, onEnvoyer }: {
  niveaux: number[]; duree: number; simule: boolean; langue: Langue; setLangue: (l: Langue) => void; onAnnuler: () => void; onEnvoyer: () => void;
}) {
  const barres = [...Array(Math.max(0, NB_BARRES - niveaux.length)).fill(0.08), ...niveaux].slice(-NB_BARRES);
  return (
    <div className="pa-rec">
      <div className="pa-rec-haut">
        <span className="pa-rec-point" /><span className="pa-rec-temps chiffres">{fmtDuree(duree)}</span>
        <div className="pa-rec-langues" role="radiogroup" aria-label="Langue du vocal">
          {(['wolof', 'francais'] as Langue[]).map((l) => (
            <button key={l} role="radio" aria-checked={langue === l} className={langue === l ? 'actif' : ''} onClick={() => setLangue(l)}>{l === 'wolof' ? 'Wolof' : 'Français'}</button>
          ))}
        </div>
      </div>
      <div className="pa-rec-onde" aria-hidden="true">{barres.map((v, i) => <i key={i} style={{ height: `${Math.round(6 + v * 30)}px` }} />)}</div>
      {simule && <p className="pa-rec-note"><Info size={12} />Micro non disponible dans cette page : enregistrement simulé.</p>}
      <div className="pa-rec-actions">
        <button className="pa-rec-annuler" onClick={onAnnuler} aria-label="Supprimer le vocal"><Trash2 size={18} /></button>
        <span className="pa-rec-aide">Parlez en wolof ou en français</span>
        <button className="pa-rec-envoyer" onClick={onEnvoyer} aria-label="Arrêter et envoyer"><Square size={15} fill="currentColor" /></button>
      </div>
    </div>
  );
}

/* Bulle d'un message vocal, avec réécoute et transcription */
export function BulleVocale({ url, duree, forme, exemple, enCours }: { url: string | null; duree: number; forme: number[]; exemple?: ExempleVocal; enCours?: boolean }) {
  const [lecture, setLecture] = useState(false);
  const [progres, setProgres] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const tic = useRef<number>();
  useEffect(() => () => { audio.current?.pause(); clearInterval(tic.current); }, []);
  const basculer = () => {
    if (lecture) { audio.current?.pause(); clearInterval(tic.current); setLecture(false); return; }
    setLecture(true);
    if (url) {
      if (!audio.current) { audio.current = new Audio(url); audio.current.onended = () => { setLecture(false); setProgres(0); }; audio.current.ontimeupdate = () => setProgres(audio.current!.currentTime / (audio.current!.duration || duree)); }
      audio.current.play().catch(() => setLecture(false));
    } else {
      const debut = performance.now() - progres * duree * 1000;
      tic.current = window.setInterval(() => {
        const p = (performance.now() - debut) / (duree * 1000);
        if (p >= 1) { clearInterval(tic.current); setLecture(false); setProgres(0); } else setProgres(p);
      }, 60);
    }
  };
  return (
    <div className="pa-vocal">
      <div className="pa-vocal-lecteur">
        <button onClick={basculer} aria-label={lecture ? 'Mettre en pause' : 'Écouter le vocal'}>{lecture ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button>
        <span className="pa-vocal-onde" aria-hidden="true">{forme.map((v, i) => <i key={i} className={i / forme.length <= progres ? 'lu' : ''} style={{ height: `${Math.round(4 + v * 20)}px` }} />)}</span>
        <span className="pa-vocal-duree chiffres">{fmtDuree(duree)}</span>
      </div>
      {enCours && <p className="pa-vocal-analyse"><Languages size={13} /><span>Transcription en cours…</span></p>}
      {exemple && (
        <div className="pa-vocal-transcription">
          <p className="pa-vocal-lang"><Languages size={12} />{exemple.langue === 'wolof' ? 'Wolof détecté' : 'Français détecté'}<span>Transcription simulée</span></p>
          <p className="pa-vocal-original">« {exemple.original} »</p>
          {exemple.langue === 'wolof' && <p className="pa-vocal-trad">En français : {exemple.francais}</p>}
        </div>
      )}
    </div>
  );
}

/* Feuille de démonstration : la transcription n'étant pas branchée, on choisit ce que dit le vocal */
export function FeuilleTranscription({ langue, onChoisir, onFermer }: { langue: Langue; onChoisir: (e: ExempleVocal) => void; onFermer: () => void }) {
  const liste = [...exemplesVocaux].sort((a, b) => Number(b.langue === langue) - Number(a.langue === langue));
  return (
    <div className="pa-feuille-fond" onClick={onFermer}>
      <div className="pa-feuille" role="dialog" aria-label="Choisir le contenu du vocal" onClick={(e) => e.stopPropagation()}>
        <span className="pa-feuille-poignee" />
        <div className="pa-feuille-tete"><h2>Que dit votre vocal ?</h2><button className="pa-feuille-fermer" onClick={onFermer} aria-label="Fermer"><X size={18} /></button></div>
        <p className="pa-feuille-note"><Info size={14} />Démonstration : la reconnaissance vocale wolof n’est pas encore branchée. Choisissez la phrase prononcée pour voir la suite du parcours.</p>
        <div className="pa-choix-vocal">
          {liste.map((e) => (
            <button key={e.id} onClick={() => onChoisir(e)}>
              <span className="pa-choix-tag">{e.langue === 'wolof' ? 'Wolof' : 'Français'}</span>
              <strong>{e.original}</strong>
              {e.langue === 'wolof' && <em>{e.francais}</em>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


export const formeExemple = (e: ExempleVocal) => formeAleatoire(e.id.charCodeAt(1));
