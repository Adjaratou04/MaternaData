// Contenus pédagogiques de DÉMONSTRATION.
// Ordres de grandeur indicatifs (taille talon-tête, poids) couramment utilisés à des fins pédagogiques.
// Ils devront être validés par des professionnels de santé avant toute utilisation réelle.

export type Fruit =
  | 'arachide' | 'citron' | 'mangue' | 'plantain' | 'mais' | 'coco' | 'papaye' | 'corossol' | 'pasteque';

export interface EtapeSemaine {
  sa: number;
  taille: string;
  poids: string;
  fruit: Fruit;
  comparaison: string;
  bebe: string;
  maman: string;
}

export const semaines: EtapeSemaine[] = [
  { sa: 8, taille: '1,6 cm', poids: '1 g', fruit: 'arachide', comparaison: 'une arachide',
    bebe: 'Le cœur bat déjà et les ébauches des bras et des jambes apparaissent.',
    maman: 'Fatigue et nausées sont fréquentes. C’est le moment de la première consultation prénatale.' },
  { sa: 12, taille: '6 cm', poids: '14 g', fruit: 'citron', comparaison: 'un citron vert',
    bebe: 'Les principaux organes sont en place ; ils vont maintenant grandir et mûrir.',
    maman: 'Les nausées diminuent souvent. L’échographie du 1er trimestre permet de dater la grossesse.' },
  { sa: 16, taille: '12 cm', poids: '100 g', fruit: 'mangue', comparaison: 'une petite mangue',
    bebe: 'Bébé bouge beaucoup, même si vous ne le sentez pas encore.',
    maman: 'Le ventre commence à s’arrondir. L’énergie revient souvent au 2e trimestre.' },
  { sa: 20, taille: '25 cm', poids: '300 g', fruit: 'plantain', comparaison: 'une banane plantain',
    bebe: 'Les premiers mouvements peuvent être ressentis, comme de légers papillons.',
    maman: 'Pensez à bien vous hydrater et à poursuivre votre supplémentation en fer et acide folique.' },
  { sa: 24, taille: '30 cm', poids: '600 g', fruit: 'mais', comparaison: 'un épi de maïs',
    bebe: 'Bébé entend les sons extérieurs et reconnaît peu à peu votre voix.',
    maman: 'Des douleurs de dos peuvent apparaître. Une marche douce chaque jour aide beaucoup.' },
  { sa: 28, taille: '37 cm', poids: '1 kg', fruit: 'coco', comparaison: 'une noix de coco',
    bebe: 'Les paupières s’ouvrent et bébé alterne périodes d’éveil et de sommeil.',
    maman: 'Le 3e trimestre approche. Repérez les mouvements de bébé au quotidien.' },
  { sa: 32, taille: '42 cm', poids: '1,7 kg', fruit: 'papaye', comparaison: 'une papaye',
    bebe: 'Bébé prend du poids et se place peu à peu tête en bas.',
    maman: 'Préparez votre sac pour la maternité et votre plan de transport le jour J.' },
  { sa: 36, taille: '47 cm', poids: '2,6 kg', fruit: 'corossol', comparaison: 'un gros corossol',
    bebe: 'Les poumons terminent leur maturation.',
    maman: 'Reposez-vous dès que possible et gardez votre carnet toujours à portée de main.' },
  { sa: 40, taille: '50 cm', poids: '3,4 kg', fruit: 'pasteque', comparaison: 'une petite pastèque',
    bebe: 'Terme : bébé est prêt à naître.',
    maman: 'Contractions régulières, perte des eaux ou saignement : rendez-vous à la maternité.' },
];

export function etapePourSA(sa: number): EtapeSemaine {
  let choix = semaines[0];
  for (const s of semaines) if (s.sa <= sa) choix = s;
  return choix;
}

export type Categorie = 'Nutrition' | 'Bien-être' | 'Consultations' | 'Accouchement' | 'Allaitement' | 'Bébé';
export type Couverture = 'nutrition' | 'bienetre' | 'consultations' | 'accouchement' | 'allaitement' | 'bebe';

export interface Article {
  id: string;
  titre: string;
  resume: string;
  categorie: Categorie;
  couverture: Couverture;
  minutes: number;
  trimestres: (1 | 2 | 3 | 'apres')[];
  paragraphes: { titre?: string; texte: string }[];
  source: string;
}

const CPN_SN =
  'Ministère de la Santé et de l’Action sociale du Sénégal, consultations prénatales recentrées (au moins 4 CPN). L’OMS recommande depuis 2016 au moins 8 contacts.';

const OMS_CPN =
  'OMS, Recommandations concernant les soins prénatals pour que la grossesse soit une expérience positive, 2016';

export const articles: Article[] = [
  {
    id: 'a1', titre: 'Bien manger quand on attend un bébé', categorie: 'Nutrition', couverture: 'nutrition', minutes: 4,
    resume: 'Une assiette variée, du fer et de l’acide folique : les bases pour vous et votre bébé.', trimestres: [1, 2, 3],
    paragraphes: [
      { texte: 'Pendant la grossesse, il ne s’agit pas de manger pour deux, mais de manger mieux. Une alimentation variée apporte l’énergie et les nutriments dont vous et votre bébé avez besoin.' },
      { titre: 'Le fer et l’acide folique', texte: 'L’OMS recommande une supplémentation quotidienne en fer et en acide folique pendant toute la grossesse. Votre sage-femme ou votre médecin vous indique le dosage adapté.' },
      { titre: 'Dans votre assiette', texte: 'Céréales, légumineuses comme le niébé, légumes verts, poisson bien cuit et fruits de saison : misez sur la diversité et sur des repas réguliers.' },
      { titre: 'À éviter', texte: 'Les viandes, poissons et œufs crus ou mal cuits, ainsi que l’alcool. Lavez soigneusement fruits et légumes.' },
    ],
    source: OMS_CPN,
  },
  {
    id: 'a2', titre: 'Vos quatre consultations prénatales', categorie: 'Consultations', couverture: 'consultations', minutes: 3,
    resume: 'Quand ont lieu les CPN, pourquoi chacune compte, et comment bien les préparer.', trimestres: [1, 2, 3],
    paragraphes: [
      { texte: 'Au Sénégal, le suivi de la grossesse repose sur au moins quatre consultations prénatales (CPN). Votre sage-femme ou votre médecin peut en prévoir davantage selon votre situation.' },
      { titre: 'Le calendrier habituel', texte: 'CPN 1 dès que la grossesse est connue, idéalement au premier trimestre. CPN 2 entre 24 et 28 semaines d’aménorrhée (SA). CPN 3 vers 32 SA. CPN 4 vers 36 SA, pour préparer l’accouchement.' },
      { titre: 'Avant le rendez-vous', texte: 'Notez vos questions, apportez vos résultats d’examens et votre carnet. Materna Data garde tout au même endroit.' },
      { titre: 'Pendant le rendez-vous', texte: 'Tension artérielle, poids, hauteur utérine, examens et échanges sur vos ressentis : n’hésitez pas à parler de ce qui vous inquiète.' },
    ],
    source: CPN_SN,
  },
  {
    id: 'a3', titre: 'Les signes qui doivent vous faire consulter', categorie: 'Consultations', couverture: 'bienetre', minutes: 2,
    resume: 'Certains symptômes ne doivent jamais attendre le prochain rendez-vous.', trimestres: [1, 2, 3],
    paragraphes: [
      { texte: 'Rendez-vous sans attendre dans une structure de santé en cas de saignement, de forte fièvre, de maux de tête intenses avec vision trouble, de gonflement brutal du visage ou des mains, de douleurs abdominales fortes, de perte de liquide ou si bébé bouge beaucoup moins.' },
      { titre: 'En cas de doute', texte: 'Il vaut toujours mieux consulter pour rien que d’attendre. L’assistant Materna vous orientera aussi vers un professionnel dans ces situations.' },
    ],
    source: OMS_CPN,
  },
  {
    id: 'a4', titre: 'Bouger en douceur pendant la grossesse', categorie: 'Bien-être', couverture: 'bienetre', minutes: 3,
    resume: 'Marche, étirements, respiration : rester active aide le corps et le moral.', trimestres: [2, 3],
    paragraphes: [
      { texte: 'Sauf contre-indication de votre soignant, une activité physique modérée est bénéfique : elle limite les douleurs de dos, améliore le sommeil et prépare le corps à l’accouchement.' },
      { titre: 'Les bons réflexes', texte: 'Privilégiez la marche, buvez régulièrement, évitez les fortes chaleurs et arrêtez-vous en cas de douleur ou de malaise.' },
    ],
    source: OMS_CPN,
  },
  {
    id: 'a5', titre: 'Préparer son sac pour la maternité', categorie: 'Accouchement', couverture: 'accouchement', minutes: 3,
    resume: 'La liste essentielle à préparer dès le 8e mois, pour vous et pour bébé.', trimestres: [3],
    paragraphes: [
      { texte: 'Préparez votre sac vers 32 à 34 semaines d’aménorrhée, pour partir sereinement le moment venu.' },
      { titre: 'Pour vous', texte: 'Votre carnet de santé, vos pièces d’identité, vos résultats d’examens, des vêtements amples, des serviettes hygiéniques et vos affaires de toilette.' },
      { titre: 'Pour bébé', texte: 'Quelques bodies, un bonnet, des chaussettes, des couches et un pagne ou une couverture.' },
    ],
    source: 'Contenu de démonstration Materna Data, à valider par une sage-femme',
  },
  {
    id: 'a6', titre: 'Les premiers jours de l’allaitement', categorie: 'Allaitement', couverture: 'allaitement', minutes: 4,
    resume: 'Mise au sein précoce, positions, rythme : bien démarrer l’allaitement.', trimestres: [3, 'apres'],
    paragraphes: [
      { texte: 'L’OMS recommande de mettre bébé au sein dans l’heure qui suit la naissance et un allaitement exclusif pendant les six premiers mois.' },
      { titre: 'Trouver son rythme', texte: 'Les tétées sont fréquentes au début : c’est normal. Une bonne position évite les douleurs. N’hésitez pas à demander de l’aide à la sage-femme.' },
    ],
    source: 'OMS, Recommandations sur l’allaitement maternel',
  },
];

export const conseilDuJour = {
  texte: 'Une marche de 20 minutes à la fraîche, le matin ou en fin de journée, soulage le dos et améliore le sommeil.',
  articleId: 'a4',
};
