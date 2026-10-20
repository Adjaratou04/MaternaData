// Emplacements pour les vraies images (photo d'accueil, rendus du fœtus par semaine).
// Il suffit de déposer les fichiers dans src/assets/photos/ et src/assets/foetus/ :
//   photos/accueil.jpg (ou .webp, .png)       → écran de bienvenue
//   foetus/8.png, foetus/12.png … foetus/40.png → rendu du fœtus pour la semaine (SA)
// Sans fichier, l'interface affiche sa version typographique, sans illustration approximative.

const photos = import.meta.glob('../assets/photos/accueil.{jpg,jpeg,webp,png}', { eager: true, import: 'default' }) as Record<string, string>;
const foetus = import.meta.glob('../assets/foetus/*.{png,webp,jpg}', { eager: true, import: 'default' }) as Record<string, string>;

export const photoAccueil: string | null = Object.values(photos)[0] ?? null;

const parSA = Object.entries(foetus)
  .map(([chemin, url]) => ({ sa: Number(chemin.match(/(\d+)\.\w+$/)?.[1]), url }))
  .filter((f) => !Number.isNaN(f.sa))
  .sort((a, b) => a.sa - b.sa);

/** Image du fœtus la plus proche (sans dépasser) de la semaine demandée, ou null. */
export function imageFoetus(sa: number): string | null {
  if (!parSA.length) return null;
  let choisi = parSA[0];
  for (const f of parSA) if (f.sa <= sa) choisi = f;
  return choisi.url;
}

// Photos des articles de conseils : src/assets/articles/<id de l'article>.jpg
const photosArticles = import.meta.glob('../assets/articles/*.{jpg,jpeg,webp,png}', { eager: true, import: 'default' }) as Record<string, string>;
export const photoArticle = (id: string): string | null =>
  Object.entries(photosArticles).find(([chemin]) => chemin.match(/\/([^/]+)\.\w+$/)?.[1] === id)?.[1] ?? null;
