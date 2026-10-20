/** Icône minimaliste d'un bébé (trait fin, couleurs de la charte), avec un symbole selon le sexe
 *  renseigné dans le dossier : ♀ pour une fille, ♂ pour un garçon. Aucune photo ni illustration. */
export function IconeBebe({ sexe, taille = 76 }: { sexe?: 'F' | 'M'; taille?: number }) {
  const fille = sexe === 'F';
  return (
    <span className="ic-bebe" style={{ width: taille, height: taille }} role="img" aria-label={!sexe ? 'Enfant' : fille ? 'Enfant, fille' : 'Enfant, garçon'}>
      <svg viewBox="0 0 76 76" width={taille} height={taille} aria-hidden="true">
        <defs>
          <linearGradient id="icb-fond" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#FFE4EA" /></linearGradient>
        </defs>
        <circle cx="38" cy="38" r="36" fill="url(#icb-fond)" stroke="#ffccd5" strokeWidth="1.5" />
        <g fill="none" stroke="#570d22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* tête et oreilles */}
          <circle cx="38" cy="40" r="17" />
          <path d="M21.2 38.5a3.2 3.2 0 0 0 0 6.2M54.8 38.5a3.2 3.2 0 0 1 0 6.2" />
          {/* mèche */}
          <path d="M36 23.3c-1.6-3.8 2.6-6.4 5-4.2 1.7 1.6-.2 4-2 3" />
          {/* yeux fermés et sourire */}
          <path d="M30.5 40.5q2.5 2.2 5 0M40.5 40.5q2.5 2.2 5 0" />
          <path d="M34.5 47q3.5 3 7 0" />
        </g>
        <circle cx="29" cy="45" r="2.4" fill="#ff90a3" opacity=".45" />
        <circle cx="47" cy="45" r="2.4" fill="#ff90a3" opacity=".45" />
      </svg>
      {sexe && (<span className={`ic-bebe-sexe ${fille ? 'f' : 'm'}`} aria-hidden="true">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
          {fille
            ? <><circle cx="8" cy="6" r="3.6" /><path d="M8 9.6V15M5.6 12.6h4.8" /></>
            : <><circle cx="6.5" cy="9.5" r="3.6" /><path d="M9.1 6.9 14 2M10.2 2H14v3.8" /></>}
        </svg>
      </span>)}
    </span>
  );
}
