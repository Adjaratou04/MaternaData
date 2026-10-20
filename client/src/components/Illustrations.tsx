// Illustrations vectorielles originales Materna Data.
// Aplats doux, formes organiques, palette de marque et tons de peau chauds.
import type { Couverture, Fruit } from '../data/contenus';

const PEAU = '#7A4A35';
const PEAU_OMBRE = '#5E3626';
const PEAU_CLAIRE = '#9A6248';
const CANARD = '#570d22'; // bordeaux profond
const CANARD_2 = '#7A1733';
const FRAMBOISE = '#c81849'; // carmin
const CORAIL = '#ff758f';
const DOUX = '#ffb0be';
const ROSE_2 = '#ffb0be';
const POUDRE = '#FFE3E9';
const OR = '#E9B949';

/* ------------------------------------------------------------------ */
/* Femme enceinte (bienvenue)                                          */
/* ------------------------------------------------------------------ */
export function FemmeEnceinte({ largeur = 260 }: { largeur?: number }) {
  return (
    <svg width={largeur} viewBox="0 0 300 320" role="img" aria-label="Illustration d'une femme enceinte">
      <defs>
        <radialGradient id="fe-halo" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FCEFF4" />
          <stop offset="100%" stopColor={POUDRE} />
        </radialGradient>
        <pattern id="fe-motif" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="4" cy="4" r="1.6" fill="#fff" opacity=".22" />
          <rect x="10" y="0" width="1.4" height="16" fill="#fff" opacity=".08" />
        </pattern>
      </defs>
      <path d="M44 166 C30 92 96 34 170 40 C246 46 284 118 268 186 C252 252 190 296 124 286 C68 276 54 226 44 166 Z" fill="url(#fe-halo)" />
      {/* feuillages */}
      <path d="M250 98 C266 72 284 66 294 62 C290 86 276 104 250 98 Z" fill={CANARD} opacity=".16" />
      <path d="M244 116 C262 106 276 108 286 112 C274 126 258 130 244 116 Z" fill={CANARD} opacity=".1" />
      <path d="M40 232 C24 214 20 196 22 182 C40 190 50 208 40 232 Z" fill={CANARD} opacity=".16" />
      <ellipse cx="156" cy="298" rx="70" ry="8" fill={CANARD} opacity=".1" />
      {/* robe */}
      <path d="M140 108 C118 116 110 144 112 186 C113 222 106 258 100 292 L212 292 C206 270 200 252 198 236 C220 214 224 170 194 142 C182 131 176 120 162 109 Z" fill={FRAMBOISE} />
      <path d="M140 108 C118 116 110 144 112 186 C113 222 106 258 100 292 L212 292 C206 270 200 252 198 236 C220 214 224 170 194 142 C182 131 176 120 162 109 Z" fill="url(#fe-motif)" />
      <path d="M196 158 C210 178 211 206 198 226" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="5" strokeLinecap="round" />
      <path d="M103 274 L209 274 L212 292 L100 292 Z" fill={CANARD} />
      <path d="M103 274 L209 274" stroke={OR} strokeWidth="2" opacity=".8" />
      {/* cou */}
      <path d="M143 88 L160 88 L163 112 L141 112 Z" fill={PEAU_OMBRE} />
      {/* tête de profil */}
      <path d="M134 66 C133 48 146 40 159 43 C170 46 176 56 175 66 L180 73 L175 76 C175 86 168 94 157 94 C143 94 135 82 134 66 Z" fill={PEAU} />
      <path d="M174 79 C171 81 168 81 166 80" stroke={PEAU_OMBRE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* foulard */}
      <path d="M128 72 C120 42 146 26 170 36 C182 42 184 54 178 60 C162 50 142 54 134 80 Z" fill={CANARD} />
      <path d="M132 50 C140 40 156 36 168 40" stroke={OR} strokeWidth="2" fill="none" opacity=".7" strokeLinecap="round" />
      <ellipse cx="125" cy="48" rx="13" ry="11" fill={CANARD_2} />
      <ellipse cx="118" cy="38" rx="7" ry="6" fill={CANARD} />
      <circle cx="148" cy="90" r="2.8" fill={OR} />
      {/* bras et main sur le ventre */}
      <path d="M154 120 C156 152 166 176 188 190" fill="none" stroke={PEAU} strokeWidth="14" strokeLinecap="round" />
      <path d="M186 184 C194 182 202 188 200 196 C198 202 190 202 184 198 Z" fill={PEAU_CLAIRE} />
      {/* repères de suivi */}
      <g transform="translate(232 128)">
        <circle r="17" fill="#fff" />
        <path d="M-7 0 L-2 5 L8 -6" fill="none" stroke={CANARD} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="translate(78 110)">
        <circle r="14" fill="#fff" />
        <path d="M-6 -1 c0-4 6-6 6-1 c0-5 6-3 6 1 c0 4-6 8-6 8 s-6-4-6-8 z" fill={FRAMBOISE} />
      </g>
      <path d="M92 124 C100 136 112 140 116 142" stroke={FRAMBOISE} strokeDasharray="2 5" strokeLinecap="round" strokeWidth="2" fill="none" opacity=".5" />
      <path d="M216 140 C208 150 204 156 202 164" stroke={CANARD} strokeDasharray="2 5" strokeLinecap="round" strokeWidth="2" fill="none" opacity=".5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Carnet connecté (onboarding 2)                                      */
/* ------------------------------------------------------------------ */
export function CarnetConnecte({ largeur = 250 }: { largeur?: number }) {
  return (
    <svg width={largeur} viewBox="0 0 300 300" role="img" aria-label="Illustration du carnet de santé numérique">
      <circle cx="150" cy="150" r="124" fill={POUDRE} />
      <circle cx="150" cy="150" r="96" fill="none" stroke={FRAMBOISE} strokeOpacity=".2" strokeDasharray="3 7" strokeWidth="2" />
      {/* téléphone */}
      <rect x="104" y="58" width="92" height="180" rx="18" fill={CANARD} />
      <rect x="111" y="70" width="78" height="156" rx="11" fill="#fff" />
      <rect x="120" y="82" width="38" height="6" rx="3" fill={CANARD} opacity=".9" />
      <rect x="120" y="96" width="60" height="44" rx="9" fill={FRAMBOISE} />
      <circle cx="166" cy="118" r="11" fill="#fff" opacity=".35" />
      <rect x="127" y="106" width="24" height="5" rx="2.5" fill="#fff" />
      <rect x="127" y="116" width="16" height="10" rx="2" fill="#fff" opacity=".85" />
      <rect x="120" y="148" width="60" height="18" rx="6" fill={POUDRE} />
      <rect x="120" y="172" width="60" height="18" rx="6" fill="#E3EEEE" />
      <rect x="120" y="196" width="40" height="18" rx="6" fill={POUDRE} />
      {/* bulles reliées */}
      <g transform="translate(56 110)"><circle r="24" fill="#fff" /><path d="M-9 -7 h18 v14 h-18 z M-9 -2 h18 M-3 -11 v6 M3 -11 v6" stroke={CANARD} strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" /></g>
      <g transform="translate(246 96)"><circle r="22" fill="#fff" /><path d="M-8 2 l5 5 l11 -12" stroke={FRAMBOISE} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
      <g transform="translate(240 206)"><circle r="24" fill="#fff" /><path d="M-10 0 h5 l3 -7 l5 13 l3 -6 h5" stroke={CANARD} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
      <g transform="translate(64 206)"><circle r="20" fill="#fff" /><path d="M0 -8 a8 8 0 1 1 0 16 a8 8 0 1 1 0 -16 M0 -3 v4 l3 2" stroke={FRAMBOISE} strokeWidth="2.4" fill="none" strokeLinecap="round" /></g>
      <path d="M80 112 H104 M196 100 H224 M196 200 H216 M84 204 H104" stroke={CANARD} strokeOpacity=".3" strokeWidth="2" strokeDasharray="2 4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Mère et nouveau-né (onboarding 3, suivi de l'enfant)                */
/* ------------------------------------------------------------------ */
export function MereBebe({ largeur = 250 }: { largeur?: number }) {
  return (
    <svg width={largeur} viewBox="0 0 300 300" role="img" aria-label="Illustration d'une mère tenant son nouveau-né">
      <path d="M40 160 C34 90 100 40 166 46 C236 52 272 112 262 172 C252 236 196 274 132 268 C76 262 46 220 40 160 Z" fill={POUDRE} />
      <circle cx="232" cy="78" r="18" fill={OR} opacity=".35" />
      {/* corps */}
      <path d="M96 268 C96 210 108 178 150 172 C192 178 206 210 206 268 Z" fill={CANARD} />
      <path d="M118 268 C122 228 132 204 150 196 C168 204 180 228 184 268" fill={CANARD_2} opacity=".6" />
      {/* cou + tête */}
      <path d="M140 150 h20 l2 26 h-24 z" fill={PEAU_OMBRE} />
      <ellipse cx="150" cy="122" rx="27" ry="31" fill={PEAU} />
      {/* foulard */}
      <path d="M121 124 C114 86 140 76 160 80 C184 86 186 108 180 120 C170 100 140 98 126 132 Z" fill={FRAMBOISE} />
      <path d="M176 92 C192 92 198 104 194 114 C188 108 182 106 178 108 Z" fill={FRAMBOISE} />
      <path d="M128 96 C140 86 158 84 172 90" stroke={OR} strokeWidth="2" fill="none" opacity=".7" strokeLinecap="round" />
      {/* yeux fermés, sourire */}
      <path d="M138 124 q5 3 10 0 M156 124 q5 3 10 0" stroke={PEAU_OMBRE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M144 138 q6 5 12 0" stroke={PEAU_OMBRE} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* bébé emmailloté */}
      <path d="M104 214 C110 192 140 186 168 194 C196 202 206 220 196 236 C184 252 128 250 110 238 C100 231 100 222 104 214 Z" fill="#fff" />
      <path d="M118 230 C140 238 170 238 192 226" stroke={ROSE_2} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="122" cy="208" r="17" fill={PEAU_CLAIRE} />
      <path d="M114 210 q4 2 7 0 M126 210 q4 2 7 0" stroke={PEAU_OMBRE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M106 200 C106 186 136 184 138 200 C128 194 116 194 106 200 Z" fill={ROSE_2} />
      {/* bras de la mère */}
      <path d="M100 226 C96 246 118 256 150 252" stroke={PEAU} strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d="M204 222 C206 240 192 248 174 246" stroke={PEAU} strokeWidth="13" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Fœtus pédagogique                                                    */
/* ------------------------------------------------------------------ */
export function FoetusPedagogique({ echelle = 1, taille = 120, fond = true }: { echelle?: number; taille?: number; fond?: boolean }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 120 120" role="img" aria-label="Représentation pédagogique du fœtus">
      {fond && <circle cx="60" cy="60" r="56" fill={POUDRE} />}
      <g style={{ transform: `scale(${echelle})`, transformOrigin: '60px 62px', transition: 'transform .5s cubic-bezier(.2,.8,.2,1)' }}>
        <path d="M52 36 C74 30 90 46 88 66 C86 84 70 94 56 88 C44 83 44 72 52 68 C58 65 62 70 60 74" fill="#FFA3B4" />
        <path d="M78 70 C80 80 74 88 66 88" stroke="#F5899E" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="47" cy="44" r="17" fill="#FFB8C5" />
        <path d="M41 44 q3 2 6 0" stroke="#E06A84" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M58 56 C64 58 66 64 62 69" stroke="#F5899E" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M70 74 C80 80 88 90 98 92" stroke={FRAMBOISE} strokeOpacity=".45" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Fruits de comparaison (repères locaux)                              */
/* ------------------------------------------------------------------ */
export function IconeFruit({ fruit, taille = 44 }: { fruit: Fruit; taille?: number }) {
  const s = { width: taille, height: taille, viewBox: '0 0 48 48', role: 'img' as const, 'aria-hidden': true };
  switch (fruit) {
    case 'arachide':
      return <svg {...s}><path d="M18 10 c8-4 14 2 12 9 c-1 4 3 6 4 11 c2 8-6 13-13 9 c-5-3-5-8-3-12 c2-4-1-6-3-9 c-2-3-1-7 3-8z" fill="#D9A866" /><path d="M20 15 l2 2 M26 25 l2 2 M22 33 l2 2" stroke="#B9844A" strokeWidth="1.6" strokeLinecap="round" /></svg>;
    case 'citron':
      return <svg {...s}><ellipse cx="24" cy="26" rx="14" ry="12" fill="#8BC34A" /><ellipse cx="20" cy="22" rx="4" ry="2.4" fill="#fff" opacity=".35" /><path d="M24 14 c2-4 6-5 9-4 c-2 3-5 4-9 4z" fill="#4E8C2E" /></svg>;
    case 'mangue':
      return <svg {...s}><path d="M14 30 c-2-12 8-20 18-18 c8 2 10 12 6 20 c-4 8-12 10-17 8 c-4-1-6-5-7-10z" fill="#F4A23A" /><path d="M30 14 c6-6 10-4 11-3 c-4 4-7 5-11 3z" fill="#4E8C2E" /><path d="M18 30 c0-8 6-13 12-13" stroke="#E2453C" strokeWidth="5" opacity=".35" fill="none" strokeLinecap="round" /></svg>;
    case 'plantain':
      return <svg {...s}><path d="M8 34 c10 6 24 4 32-10 c2-4 1-8-1-10 c-2 8-10 16-28 16 c-3 0-4 2-3 4z" fill="#E8C547" /><path d="M39 14 l2-4" stroke="#6B5A2E" strokeWidth="3" strokeLinecap="round" /><path d="M14 33 c10 2 20-2 25-12" stroke="#C9A332" strokeWidth="1.6" fill="none" /></svg>;
    case 'mais':
      return <svg {...s}><path d="M24 6 c6 4 8 14 6 24 c-1 6-4 10-6 10 s-5-4-6-10 c-2-10 0-20 6-24z" fill="#F2C94C" /><path d="M20 12 v24 M24 9 v30 M28 12 v24 M18 18 h12 M18 24 h12 M18 30 h12" stroke="#D9A82E" strokeWidth="1.2" /><path d="M24 42 c-6-2-12-8-12-18 c4 4 8 8 12 18z M24 42 c6-2 12-8 12-18 c-4 4-8 8-12 18z" fill="#6FA24A" /></svg>;
    case 'coco':
      return <svg {...s}><circle cx="24" cy="25" r="15" fill="#8B5A3C" /><circle cx="24" cy="25" r="15" fill="none" stroke="#6E4329" strokeWidth="2" strokeDasharray="3 4" /><circle cx="19" cy="20" r="2" fill="#4A2C1A" /><circle cx="27" cy="19" r="2" fill="#4A2C1A" /><circle cx="23" cy="26" r="2" fill="#4A2C1A" /></svg>;
    case 'papaye':
      return <svg {...s}><path d="M24 6 c10 0 14 12 14 22 c0 9-6 14-14 14 s-14-5-14-14 c0-10 4-22 14-22z" fill="#F08A3C" /><path d="M24 12 c5 0 8 8 8 15 c0 6-3 9-8 9 s-8-3-8-9 c0-7 3-15 8-15z" fill="#F7B267" /><circle cx="22" cy="24" r="1.4" fill="#2E2E2E" /><circle cx="26" cy="27" r="1.4" fill="#2E2E2E" /><circle cx="23" cy="30" r="1.4" fill="#2E2E2E" /></svg>;
    case 'corossol':
      return <svg {...s}><path d="M24 7 c10 2 16 12 14 22 c-2 9-8 13-14 13 s-12-4-14-13 c-2-10 4-20 14-22z" fill="#5E9E48" /><path d="M16 16 l2 2 M28 14 l2 2 M20 24 l2 2 M30 24 l2 2 M16 32 l2 2 M26 34 l2 2" stroke="#3F7330" strokeWidth="2" strokeLinecap="round" /><path d="M24 7 c0-3 2-4 3-4" stroke="#6B5A2E" strokeWidth="2.4" strokeLinecap="round" fill="none" /></svg>;
    case 'pasteque':
      return <svg {...s}><ellipse cx="24" cy="26" rx="17" ry="14" fill="#3E8E4A" /><path d="M12 18 c4 4 4 12 0 16 M20 13 c4 6 4 20 0 26 M28 13 c-4 6-4 20 0 26 M36 18 c-4 4-4 12 0 16" stroke="#2A6A35" strokeWidth="2" fill="none" /></svg>;
  }
}

/* ------------------------------------------------------------------ */
/* Couvertures d'articles                                               */
/* ------------------------------------------------------------------ */
export function CouvertureArticle({ type, hauteur = 120 }: { type: Couverture; hauteur?: number }) {
  const fonds: Record<Couverture, string> = {
    nutrition: '#FFE7DB', bienetre: '#FFEFF2', consultations: POUDRE, accouchement: '#F8E6EE', allaitement: '#FFE9EC', bebe: '#FFF1D6',
  };
  return (
    <svg width="100%" height={hauteur} viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true" style={{ display: 'block', background: fonds[type] }}>
      {type === 'nutrition' && (
        <g>
          <circle cx="196" cy="22" r="34" fill="#FFCDB8" />
          <ellipse cx="120" cy="92" rx="66" ry="14" fill="#F5B9A6" />
          <path d="M58 78 h124 c0 24-28 38-62 38 s-62-14-62-38z" fill={CANARD} />
          <path d="M64 80 c20-26 40-30 56-18 c14-14 36-12 56 18z" fill="#F4A23A" />
          <circle cx="98" cy="70" r="10" fill="#8BC34A" /><circle cx="140" cy="66" r="11" fill={FRAMBOISE} /><circle cx="120" cy="74" r="8" fill="#F2C94C" />
          <path d="M150 50 c6-10 14-12 18-12 c-2 8-8 12-18 12z" fill="#4E8C2E" />
        </g>
      )}
      {type === 'bienetre' && (
        <g>
          <circle cx="60" cy="30" r="40" fill="#FFD3DC" />
          <path d="M0 104 c40-18 80-18 120-4 s80 14 120-6 v26 h-240z" fill="#FFC2CE" />
          <circle cx="140" cy="38" r="11" fill={PEAU} />
          <path d="M131 34 c0-12 18-14 20-2 c-6-4-14-4-20 2z" fill={CANARD} />
          <path d="M140 50 c-10 4-12 24-8 40 l18 0 c6-10 8-26-2-38z" fill={FRAMBOISE} />
          <path d="M134 60 l-22 -12 M146 60 l22 -12" stroke={PEAU} strokeWidth="6" strokeLinecap="round" />
          <path d="M134 90 l-6 22 M148 90 l8 22" stroke={PEAU} strokeWidth="6" strokeLinecap="round" />
        </g>
      )}
      {type === 'consultations' && (
        <g>
          <circle cx="40" cy="100" r="50" fill="#FFC9D4" />
          <rect x="84" y="20" width="76" height="90" rx="10" fill="#fff" />
          <rect x="96" y="34" width="40" height="6" rx="3" fill={CANARD} />
          <rect x="96" y="48" width="52" height="5" rx="2.5" fill="#F2DCE1" />
          <rect x="96" y="60" width="44" height="5" rx="2.5" fill="#F2DCE1" />
          <path d="M98 84 h10 l5 -10 l7 18 l5 -8 h12" stroke={FRAMBOISE} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="180" cy="44" r="18" fill={CANARD} />
          <path d="M172 44 l5 5 l11 -11" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {type === 'accouchement' && (
        <g>
          <circle cx="200" cy="96" r="48" fill="#F3C9DA" />
          <rect x="78" y="48" width="92" height="62" rx="14" fill={CANARD} />
          <path d="M104 48 v-10 c0-8 6-12 20-12 s20 4 20 12 v10" stroke={CANARD} strokeWidth="6" fill="none" />
          <rect x="78" y="66" width="92" height="8" fill={FRAMBOISE} />
          <circle cx="124" cy="92" r="8" fill={OR} />
          <path d="M44 30 l4 8 l8 4 l-8 4 l-4 8 l-4 -8 l-8 -4 l8 -4z" fill={FRAMBOISE} opacity=".6" />
        </g>
      )}
      {type === 'allaitement' && (
        <g>
          <circle cx="180" cy="24" r="40" fill="#FFC9D4" />
          <path d="M70 120 c0-40 16-60 50-62 c34 2 50 22 50 62z" fill={FRAMBOISE} />
          <circle cx="120" cy="40" r="18" fill={PEAU} />
          <path d="M100 40 c-4-24 18-30 30-24 c10 6 10 16 6 20 c-8-10-24-10-36 4z" fill={CANARD} />
          <path d="M86 92 c10-16 40-20 62-8 c12 8 6 22-8 24 c-20 4-46 0-54-16z" fill="#fff" />
          <circle cx="98" cy="88" r="11" fill={PEAU_CLAIRE} />
        </g>
      )}
      {type === 'bebe' && (
        <g>
          <circle cx="120" cy="64" r="44" fill="#FBE0A8" />
          <circle cx="120" cy="64" r="22" fill={PEAU_CLAIRE} />
          <path d="M112 64 q3 2 6 0 M124 64 q3 2 6 0" stroke={PEAU_OMBRE} strokeWidth="1.6" fill="none" />
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Bienvenue : future maman dans une arche fleurie                      */
/* ------------------------------------------------------------------ */
export function ArcheMaternite({ largeur = 280 }: { largeur?: number }) {
  return (
    <svg width={largeur} viewBox="0 0 300 330" role="img" aria-label="Illustration d'une future maman, main posée sur son ventre">
      <defs>
        <linearGradient id="am-arche" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD3DC" />
          <stop offset="1" stopColor="#FFEFF2" />
        </linearGradient>
        <linearGradient id="am-robe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={CORAIL} />
          <stop offset="1" stopColor={FRAMBOISE} />
        </linearGradient>
        <pattern id="am-motif" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="4" cy="4" r="1.4" fill="#fff" opacity=".28" />
        </pattern>
      </defs>
      {/* arche */}
      <path d="M60 318 V150 C60 82 100 36 150 36 C200 36 240 82 240 150 V318 Z" fill="url(#am-arche)" />
      <path d="M72 318 V152 C72 92 106 50 150 50 C194 50 228 92 228 152 V318" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2" />
      {/* soleil doux */}
      <circle cx="196" cy="98" r="22" fill="#FFE1C7" opacity=".9" />
      {/* branches fleuries */}
      <g opacity=".95">
        <path d="M40 300 C46 250 40 210 26 176" stroke={CANARD_2} strokeOpacity=".35" strokeWidth="2" fill="none" />
        <ellipse cx="30" cy="196" rx="9" ry="16" transform="rotate(-25 30 196)" fill={DOUX} />
        <ellipse cx="48" cy="228" rx="9" ry="17" transform="rotate(20 48 228)" fill="#FFC8D2" />
        <ellipse cx="32" cy="258" rx="9" ry="16" transform="rotate(-30 32 258)" fill={DOUX} />
        <circle cx="26" cy="174" r="6" fill={CORAIL} />
        <path d="M262 300 C256 256 262 222 276 194" stroke={CANARD_2} strokeOpacity=".35" strokeWidth="2" fill="none" />
        <ellipse cx="272" cy="214" rx="8" ry="15" transform="rotate(25 272 214)" fill="#FFC8D2" />
        <ellipse cx="254" cy="246" rx="8" ry="16" transform="rotate(-20 254 246)" fill={DOUX} />
        <circle cx="276" cy="192" r="5" fill={FRAMBOISE} opacity=".7" />
      </g>
      <ellipse cx="152" cy="316" rx="64" ry="7" fill={CANARD} opacity=".1" />
      {/* robe */}
      <path d="M140 118 C118 126 110 154 112 196 C113 232 106 268 100 312 L212 312 C206 284 200 266 198 248 C220 226 224 182 194 152 C182 141 176 130 162 119 Z" fill="url(#am-robe)" />
      <path d="M140 118 C118 126 110 154 112 196 C113 232 106 268 100 312 L212 312 C206 284 200 266 198 248 C220 226 224 182 194 152 C182 141 176 130 162 119 Z" fill="url(#am-motif)" />
      <path d="M197 170 C211 190 212 218 199 238" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="5" strokeLinecap="round" />
      <path d="M103 296 L209 296 L212 312 L100 312 Z" fill={CANARD} />
      <path d="M103 296 L209 296" stroke={OR} strokeWidth="2" opacity=".85" />
      {/* cou, tête */}
      <path d="M143 98 L160 98 L163 122 L141 122 Z" fill={PEAU_OMBRE} />
      <path d="M134 76 C133 58 146 50 159 53 C170 56 176 66 175 76 L180 83 L175 86 C175 96 168 104 157 104 C143 104 135 92 134 76 Z" fill={PEAU} />
      <path d="M174 89 C171 91 168 91 166 90" stroke={PEAU_OMBRE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M160 74 q4 -2 8 0" stroke={PEAU_OMBRE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* foulard */}
      <path d="M128 82 C120 52 146 36 170 46 C182 52 184 64 178 70 C162 60 142 64 134 90 Z" fill={FRAMBOISE} />
      <path d="M132 60 C140 50 156 46 168 50" stroke={OR} strokeWidth="2" fill="none" opacity=".8" strokeLinecap="round" />
      <ellipse cx="125" cy="58" rx="13" ry="11" fill={CANARD_2} />
      <ellipse cx="118" cy="48" rx="7" ry="6" fill={FRAMBOISE} />
      <circle cx="148" cy="100" r="2.8" fill={OR} />
      {/* bras, main */}
      <path d="M154 130 C156 162 166 186 188 200" fill="none" stroke={PEAU} strokeWidth="14" strokeLinecap="round" />
      <path d="M186 194 C194 192 202 198 200 206 C198 212 190 212 184 208 Z" fill={PEAU_CLAIRE} />
      {/* petit cœur */}
      <path d="M226 136 c0-5 7-7 8-1 c1-6 8-4 8 1 c0 5-8 10-8 10 s-8-5-8-10 z" fill={FRAMBOISE} opacity=".85" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Bébé (profil enfant)                                                 */
/* ------------------------------------------------------------------ */
export function BebeProfil({ taille = 72 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 80 80" role="img" aria-label="Illustration d'un bébé">
      <circle cx="40" cy="40" r="40" fill="#FFE3E9" />
      <path d="M14 80 C16 60 26 52 40 52 C54 52 64 60 66 80 Z" fill="#fff" />
      <path d="M22 66 C32 70 48 70 58 66" stroke={DOUX} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="36" r="17" fill={PEAU_CLAIRE} />
      <path d="M24 32 C24 16 56 16 56 32 C48 25 32 25 24 32 Z" fill={DOUX} />
      <circle cx="40" cy="16" r="4" fill={CORAIL} />
      <path d="M32 37 q3 2 6 0 M42 37 q3 2 6 0" stroke={PEAU_OMBRE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M36 44 q4 3 8 0" stroke={PEAU_OMBRE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="42" r="2.4" fill={CORAIL} opacity=".35" />
      <circle cx="50" cy="42" r="2.4" fill={CORAIL} opacity=".35" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* État vide (aucune notification, aucun rendez-vous)                   */
/* ------------------------------------------------------------------ */
export function EtatVide({ taille = 120 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <circle cx="60" cy="60" r="52" fill="#FFEBEF" />
      <rect x="32" y="36" width="56" height="50" rx="10" fill="#fff" stroke={DOUX} strokeWidth="2" />
      <rect x="32" y="36" width="56" height="14" rx="7" fill={DOUX} />
      <path d="M44 30 v10 M76 30 v10" stroke={CANARD} strokeWidth="3" strokeLinecap="round" />
      <path d="M50 68 l7 7 l14 -14" stroke={FRAMBOISE} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="92" cy="30" r="5" fill={CORAIL} opacity=".6" />
      <circle cx="24" cy="86" r="4" fill={CORAIL} opacity=".4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Fœtus en volume (représentation pédagogique, style doux et modelé)   */
/* ------------------------------------------------------------------ */
export function FoetusVolume({ taille = 220, echelle = 1 }: { taille?: number; echelle?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 240 240" role="img" aria-label="Représentation pédagogique du fœtus">
      <defs>
        <radialGradient id="fv-sac" cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" />
          <stop offset=".45" stopColor="#FFE1E8" stopOpacity=".85" />
          <stop offset="1" stopColor="#FFB3C3" stopOpacity=".55" />
        </radialGradient>
        <radialGradient id="fv-peau" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#FFE3E2" />
          <stop offset=".55" stopColor="#FBB8B9" />
          <stop offset="1" stopColor="#E98C95" />
        </radialGradient>
        <radialGradient id="fv-tete" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#FFEAE8" />
          <stop offset=".6" stopColor="#FBC0BF" />
          <stop offset="1" stopColor="#EC9AA0" />
        </radialGradient>
        <linearGradient id="fv-cordon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F7A1B4" />
          <stop offset="1" stopColor="#D9577A" />
        </linearGradient>
        <filter id="fv-flou" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <circle cx="120" cy="120" r="108" fill="url(#fv-sac)" />
      <ellipse cx="88" cy="70" rx="38" ry="20" fill="#fff" opacity=".55" filter="url(#fv-flou)" />
      <g style={{ transform: `scale(${echelle})`, transformOrigin: '120px 126px', transition: 'transform .55s cubic-bezier(.2,.8,.2,1)' }}>
        <ellipse cx="124" cy="196" rx="54" ry="8" fill="#C8576F" opacity=".12" />
        {/* cordon */}
        <path d="M134 150 C160 160 176 178 196 176 C206 175 212 168 214 160" fill="none" stroke="url(#fv-cordon)" strokeWidth="6" strokeLinecap="round" />
        {/* dos et corps enroulé */}
        <path d="M100 92 C134 72 176 92 178 132 C180 168 150 190 120 186 C96 183 84 166 90 150 C95 138 110 136 118 144" fill="url(#fv-peau)" />
        {/* jambe repliée */}
        <path d="M150 170 C164 168 172 156 168 144 C164 132 150 132 142 140" fill="url(#fv-peau)" />
        <ellipse cx="141" cy="174" rx="14" ry="8" transform="rotate(-20 141 174)" fill="#F4A9AE" />
        {/* tête */}
        <circle cx="92" cy="100" r="40" fill="url(#fv-tete)" />
        <ellipse cx="80" cy="86" rx="14" ry="9" fill="#fff" opacity=".45" />
        {/* oreille, œil, nez */}
        <path d="M104 104 c6 -2 9 4 6 9 c-2 4 -7 3 -8 0" fill="none" stroke="#DE8790" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M70 102 q6 4 12 0" stroke="#C9707B" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M60 112 c-3 2 -3 6 0 7" stroke="#D88089" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* bras et main près du visage */}
        <path d="M112 132 C100 136 88 132 80 124" fill="none" stroke="#F3A8AD" strokeWidth="11" strokeLinecap="round" />
        <circle cx="78" cy="122" r="7.5" fill="#F7B6B8" />
      </g>
      <circle cx="120" cy="120" r="108" fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="2" />
    </svg>
  );
}


/* ------------------------------------------------------------------ */
/* Future maman de profil (écran de bienvenue)                         */
/* ------------------------------------------------------------------ */
export function FemmeProfil({ largeur = 280 }: { largeur?: number }) {
  return (
    <svg width={largeur} viewBox="10 40 310 320" role="img" aria-label="Illustration d'une future maman, les yeux fermés, tenant son ventre">

  <defs>
    <linearGradient id="fp-peau" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#A46C51"/><stop offset="1" stopColor="#7C4C36"/></linearGradient>
    <linearGradient id="fp-peauBras" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8E5A42"/><stop offset=".6" stopColor="#A46C51"/><stop offset="1" stopColor="#93604A"/></linearGradient>
    <linearGradient id="fp-haut" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FABCCD"/><stop offset="1" stopColor="#EC8CAB"/></linearGradient>
    <linearGradient id="fp-foulard" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FAB8CB"/><stop offset="1" stopColor="#EA87A8"/></linearGradient>
    <radialGradient id="fp-fond" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFFFFF"/><stop offset="1" stopColor="#FFE4EB" stopOpacity="0"/></radialGradient>
  </defs>
  <circle cx="168" cy="196" r="156" fill="url(#fp-fond)"/>
  {/* feuillages */}
  <g>
    <path d="M62 340 C66 296 58 258 38 222" fill="none" stroke="#F2A0B9" strokeWidth="2.6"/>
    <path d="M38 222 C26 234 26 252 38 260 C48 248 48 234 38 222Z" fill="#F7B3C7"/>
    <path d="M47 252 C32 252 22 264 24 276 C40 276 48 266 47 252Z" fill="#F5A6BE"/>
    <path d="M47 254 C58 242 72 242 78 250 C68 262 56 262 47 254Z" fill="#F9C7D5"/>
    <path d="M55 286 C40 288 32 300 34 312 C50 310 58 300 55 286Z" fill="#F7B3C7"/>
    <path d="M56 288 C68 278 82 280 86 290 C76 300 64 298 56 288Z" fill="#F9C7D5"/>
    <path d="M60 318 C48 322 42 332 44 342 C58 340 64 330 60 318Z" fill="#F5A6BE"/>
    <path d="M282 340 C278 298 288 262 308 228" fill="none" stroke="#F2A0B9" strokeWidth="2.6"/>
    <path d="M308 228 C318 242 316 258 304 266 C296 252 298 238 308 228Z" fill="#F7B3C7"/>
    <path d="M298 260 C312 262 320 274 316 286 C302 284 296 274 298 260Z" fill="#F5A6BE"/>
    <path d="M296 262 C286 250 272 250 266 258 C276 270 288 270 296 262Z" fill="#F9C7D5"/>
    <path d="M290 292 C304 296 310 308 306 320 C292 316 286 306 290 292Z" fill="#F7B3C7"/>
    <path d="M288 294 C278 284 264 286 260 294 C270 304 282 302 288 294Z" fill="#F9C7D5"/>
  </g>
  {/* cœurs */}
  <path d="M256 120 c0-13 17-17 21-4 c4-13 21-9 21 4 c0 15-21 28-21 28 s-21-13-21-28z" fill="#F6A3BD"/>
  <path d="M244 168 c0-5 6-6 8-2 c2-4 8-3 8 2 c0 5-8 10-8 10 s-8-5-8-10z" fill="#FBD0DC"/>
  {/* tresse */}
  <g fill="#1E1416">
    <ellipse cx="136" cy="152" rx="15" ry="18"/>
    <ellipse cx="131" cy="178" rx="13" ry="16"/>
    <ellipse cx="128" cy="204" rx="12" ry="15"/>
    <ellipse cx="126" cy="230" rx="11" ry="14"/>
    <ellipse cx="126" cy="255" rx="10" ry="13"/>
    <ellipse cx="128" cy="278" rx="9" ry="12"/>
    <path d="M126 288 C122 302 124 314 132 320 C134 310 134 300 130 290Z"/>
  </g>
  <g stroke="#43303A" strokeWidth="1.5" fill="none" opacity=".75">
    <path d="M123 170 q8 8 17 4"/><path d="M119 196 q8 8 17 4"/><path d="M116 222 q8 8 16 4"/><path d="M116 247 q8 8 15 4"/><path d="M119 270 q6 7 13 4"/>
  </g>
  {/* épaules et cou */}
  <path d="M166 172 C170 184 172 194 172 204 C156 206 138 212 128 224 C122 232 122 242 126 250 L208 250 L206 204 C202 196 198 184 196 172Z" fill="url(#fp-peau)"/>
  <path d="M170 178 C178 188 188 190 198 186 L198 196 C188 200 178 198 172 192Z" fill="#6B3F2B" opacity=".45"/>
  {/* haut rose et ventre */}
  <path d="M128 232 C142 222 160 220 174 222 C186 214 200 216 208 224 C218 236 216 250 212 258 C218 262 226 266 234 272 C266 294 270 334 242 352 C232 358 214 360 194 360 L128 360 C124 334 122 304 124 278 C125 262 126 246 128 232Z" fill="url(#fp-haut)"/>
  <path d="M178 222 C180 214 182 208 182 202" stroke="#F09DB7" strokeWidth="5" strokeLinecap="round"/>
  <path d="M176 262 C190 266 202 266 214 260" fill="none" stroke="#DE7798" strokeWidth="2" opacity=".55"/>
  <path d="M242 292 C256 308 258 330 248 346" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="5" strokeLinecap="round"/>
  {/* bras et main sous le ventre */}
  <path d="M136 228 C127 252 127 282 135 306 C138 320 152 326 170 328 L234 342 C244 344 252 340 252 332 C252 324 244 320 236 320 L178 306 C168 304 162 296 162 282 L162 238 C160 228 142 220 132 226Z" fill="url(#fp-peauBras)"/>
  <path d="M160 246 C158 264 158 284 164 298" fill="none" stroke="#6B3F2B" strokeWidth="1.6" opacity=".35"/>
  <path d="M236 322 C244 316 254 318 258 326 C256 334 248 336 240 334Z" fill="#9A6449"/>
  <path d="M240 326 C246 324 252 326 254 330 M238 334 C244 334 248 336 249 339" fill="none" stroke="#6B3F2B" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
  {/* tête */}
  <g transform="translate(-22 10) scale(1.12)">
    <ellipse cx="150" cy="104" rx="22" ry="24" fill="#1E1416"/>
    <path d="M152 92 C152 70 170 56 192 58 C208 60 218 72 218 86 C218 92 220 98 224 104 C228 110 232 116 230 120 C228 124 223 124 221 125 C223 128 223 132 220 134 C222 137 221 141 217 143 C216 149 212 154 204 157 C196 160 186 158 180 152 C166 148 156 136 154 120 C152 110 152 100 152 92Z" fill="url(#fp-peau)"/>
    <path d="M170 106 C164 102 160 110 164 116 C166 120 170 120 172 118" fill="#8F5C44"/>
    <path d="M200 102 Q207 107 214 102" fill="none" stroke="#2A1A1A" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M203 105 l-1.5 3.5 M207 106 l-.5 3.8 M211 105 l1 3.5" stroke="#2A1A1A" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M198 92 Q207 88 216 92" fill="none" stroke="#2A1A1A" strokeWidth="2.3" strokeLinecap="round"/>
    <path d="M221 133 C217 133 214 134 212 136 C215 137 219 137 220 135Z" fill="#A35A5E"/>
    <path d="M219 137 C216 138 213 139 212 137" stroke="#8C4A4F" strokeWidth="1.1" fill="none"/>
    <ellipse cx="200" cy="122" rx="8" ry="5" fill="#E58C8C" opacity=".28"/>
    <path d="M148 104 C140 70 160 42 194 44 C214 46 228 58 226 78 C226 82 224 86 220 88 C210 76 194 72 180 74 C166 76 158 86 156 102 C154 106 150 108 148 104Z" fill="url(#fp-foulard)"/>
    <path d="M150 70 C136 62 130 74 136 84 C142 92 150 90 152 84Z" fill="#EC8CAB"/>
    <path d="M146 74 C136 76 132 90 140 98 C146 102 152 98 152 92Z" fill="#F6A9C0"/>
    <path d="M152 84 C168 64 196 58 220 70" fill="none" stroke="#FCD3DF" strokeWidth="2.4" strokeLinecap="round"/>
    <path d="M150 96 C166 78 194 72 222 82" fill="none" stroke="#E07A9C" strokeWidth="1.8" strokeLinecap="round" opacity=".7"/>
    <path d="M158 62 C172 52 196 48 214 55" fill="none" stroke="#E07A9C" strokeWidth="1.8" strokeLinecap="round" opacity=".55"/>
  </g>
  <path d="M100 360 Q170 344 280 360 Z" fill="#F6C1D0" opacity=".55"/>


    </svg>
  );
}
