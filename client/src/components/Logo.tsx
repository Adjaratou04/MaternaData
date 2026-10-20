// Logo Materna Data, piste A : un « M » dont la seconde arche, plus ample, évoque le ventre
// arrondi de la grossesse, avec un point bordeaux pour l'enfant à naître.
// Version vectorielle (nette à toutes les tailles). L'ancien logo de la charte reste dans src/assets/.
import { useId } from 'react';

const TRACE = 'M14 82 V46 Q14 28 29 28 Q43 28 43 46 V82 M43 50 Q43 26 64 26 Q88 26 88 56 V82';

/** Symbole seul. `inverse` : version blanche pour fond foncé. */
export function Symbole({ taille = 34, inverse = false }: { taille?: number; inverse?: boolean }) {
  const g = useId().replace(/:/g, '');
  const epais = taille < 24 ? 13 : taille < 40 ? 12 : 11;
  return (
    <svg width={taille} height={taille} viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <defs><linearGradient id={g} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF758F" /><stop offset="1" stopColor="#C81849" /></linearGradient></defs>
      <path d={TRACE} fill="none" stroke={inverse ? '#FFFFFF' : `url(#${g})`} strokeWidth={epais} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="65" cy="58" r={taille < 24 ? 10 : 8.5} fill={inverse ? '#FF90A3' : '#570D22'} />
    </svg>
  );
}

function Nom({ taille, inverse }: { taille: number; inverse: boolean }) {
  return (
    <span style={{ fontFamily: 'Ubuntu, system-ui, sans-serif', fontSize: taille, lineHeight: 1, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
      <span style={{ fontWeight: 500, color: inverse ? '#FFFFFF' : '#570D22' }}>Materna</span>
      <span style={{ fontWeight: 400, color: inverse ? '#FFB0BE' : '#C81849' }}> Data</span>
    </span>
  );
}

/** Version horizontale : symbole + nom. */
export function Logo({ hauteur = 34, avecIcone = true, inverse = false }: { hauteur?: number; avecIcone?: boolean; inverse?: boolean }) {
  return (
    <span className="logo" role="img" aria-label="Materna Data" style={{ display: 'inline-flex', alignItems: 'center', gap: hauteur * 0.28 }}>
      {avecIcone && <Symbole taille={hauteur} inverse={inverse} />}
      <Nom taille={hauteur * 0.62} inverse={inverse} />
    </span>
  );
}

/** Version empilée (écrans d'accueil) : symbole au-dessus du nom. */
export function LogoComplet({ largeur = 180, inverse = false }: { largeur?: number; inverse?: boolean }) {
  return (
    <span className="logo" role="img" aria-label="Materna Data" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: largeur * 0.06 }}>
      <Symbole taille={largeur * 0.46} inverse={inverse} />
      <Nom taille={largeur * 0.155} inverse={inverse} />
    </span>
  );
}

/** Icône d'application : symbole blanc sur fond dégradé. */
export function IconeApp({ taille = 60 }: { taille?: number; fond?: string }) {
  return (
    <span style={{ width: taille, height: taille, borderRadius: taille * 0.26, background: 'linear-gradient(135deg, #FF758F, #C81849)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(87,13,34,.18)' }}>
      <Symbole taille={taille * 0.66} inverse />
    </span>
  );
}
