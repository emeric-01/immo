/**
 * Redirections permanentes validées depuis le sitemap WordPress de jumellesimmo.fr.
 *
 * Les anciennes URL sans équivalent suffisamment proche restent volontairement
 * absentes : elles doivent être migrées avant la bascule du domaine afin d'éviter
 * les redirections génériques assimilables à des soft 404.
 */
export const legacyWordPressRedirects = [
  { source: "/prix-au-m2-aubagne-2", destination: "/prix-m2/aubagne", statusCode: 301 },
  { source: "/prix-au-m2-aubagne-2-2", destination: "/estimation", statusCode: 301 },
  { source: "/actualite-du-marche-immobilier-et-expertise-de-notre-agence", destination: "/contenus", statusCode: 301 },
  { source: "/honoraires-agence", destination: "/honoraires", statusCode: 301 },
  { source: "/politique-de-confidentialite", destination: "/mentions-legales", statusCode: 301 },
  { source: "/architecte-interieur-nos-realisations", destination: "/biens", statusCode: 301 },
  { source: "/les-jumelles-immo", destination: "/qui-sommes-nous", statusCode: 301 },
  { source: "/home", destination: "/qui-sommes-nous", statusCode: 301 },
  { source: "/nos-inspirations-deco", destination: "/contenus", statusCode: 301 },

  { source: "/lurbanism-lallie-cache-pour-bien-acheter-ou-bien-vendre", destination: "/contenus/acheter-maison-verifications-urbanisme-avant-signature", statusCode: 301 },
  { source: "/evolution-des-prix-au-m2-a-gemenos-entre-2024-et-2025", destination: "/prix-m2/gemenos", statusCode: 301 },
  { source: "/evolution-des-prix-au-m2-a-aubagne-entre-2024-et-2025", destination: "/prix-m2/aubagne", statusCode: 301 },
  { source: "/home-staging-vs-renovation-quelle-strategie-choisir-pour-vendre-vite", destination: "/contenus/home-staging-architecture-interieure-valoriser-bien", statusCode: 301 },
  { source: "/comment-calculer-le-potentiel-dun-terrain-constructible-selon-le-plan-local-durbanisme-plu", destination: "/contenus/plu-extension-potentiel-constructible-valeur-bien", statusCode: 301 },
  { source: "/tout-savoir-sur-la-division-parcellaire-demarches-contraintes-et-couts", destination: "/contenus/division-parcellaire-immobilier-valoriser-terrain", statusCode: 301 },

  { source: "/appartement-t3-4-avec-vue-mer-panoramique-a-la-ciotat", destination: "/biens/appartement-t3-4-avec-vue-mer-panoramique-la-ciotat-212627", statusCode: 301 },
  { source: "/rez-de-villa-98m2-avec-jardin-a-aubagne-335-000-e", destination: "/biens/rez-de-villa-98m2-avec-jardin-a-aubagne-aubagne-164388", statusCode: 301 },
  { source: "/haut-de-villa-avec-garage-et-jardin-de-580-m2-a-aubagne-455-000-e", destination: "/biens/haut-de-villa-avec-garage-et-jardin-aubagne-139509", statusCode: 301 },
  { source: "/terrain-constructible-a-gemenos-1100m2-450-000-e", destination: "/biens/terrain-constructible-1100-m2-gemenos", statusCode: 301 },
  { source: "/appartement-t2-marseille-5-proche-la-timone-villa-medicis-205-000-e", destination: "/biens/appartement-t2-villa-medicis-la-timone-marseille-5", statusCode: 301 },
  { source: "/charmant-t2-renove-proche-mer-dans-la-residence-senioriale-les-hesperides-du-prado-marseille-8-198-000-e", destination: "/biens/appartement-t2-hesperides-prado-marseille-8", statusCode: 301 },
  { source: "/appartement-t3-aubagne-de-57-m2-au-pied-du-garlaban-les-solans", destination: "/biens/appartement-t3-les-solans-aubagne", statusCode: 301 },
  { source: "/maison-recente-castellet-t4-94-m%C2%B2-avec-jardin-440-000-e", destination: "/biens/maison-recente-t4-jardin-le-castellet", statusCode: 301 },
  { source: "/maisons-t4-et-t2-independants-en-exclusivite-avec-piscine-et-garages-a-gemenos-1-260-000e", destination: "/biens/maisons-t4-t2-piscine-garages-gemenos", statusCode: 301 },
] as const;
