/**
 * Redirections permanentes issues du sitemap public d'agenceasm.com.
 *
 * Une URL n'est redirigee que lorsqu'une destination conserve la meme intention.
 * Les anciens templates Houzez et programmes neufs sans equivalent sont exclus
 * afin d'eviter les redirections generiques assimilees a des soft 404.
 */
export const legacyAgenceAsmRedirects = [
  // Pages et services principaux
  { source: "/estimation-immobiliere-en-ligne", destination: "/estimation", permanent: true },
  { source: "/honoraires-baremes", destination: "/honoraires", permanent: true },
  { source: "/estimation-immobiliere-gemenos", destination: "/estimation-immobiliere/gemenos", permanent: true },
  { source: "/estimation-immobiliere-la-ciotat", destination: "/estimation-immobiliere/la-ciotat", permanent: true },
  { source: "/estimation-immobiliere-aubagne", destination: "/estimation-immobiliere/aubagne", permanent: true },
  { source: "/biens-immobiliers-a-la-vente", destination: "/biens", permanent: true },
  { source: "/offres-emplois", destination: "/nous-rejoindre", permanent: true },
  { source: "/estimation-immobiliere-avec-un-expert", destination: "/estimation", permanent: true },
  { source: "/services-agence-immobiliere", destination: "/agence-immobiliere", permanent: true },
  { source: "/parrainage-immobilier", destination: "/parrainage", permanent: true },
  { source: "/politique-de-confidentialite", destination: "/mentions-legales", permanent: true },
  { source: "/prendre-rdv-en-ligne", destination: "/estimation", permanent: true },
  { source: "/frequently-asked-questions", destination: "/qui-sommes-nous", permanent: true },
  { source: "/agencies", destination: "/agence-immobiliere", permanent: true },
  { source: "/agents-2", destination: "/qui-sommes-nous", permanent: true },
  { source: "/agent/agence-asm", destination: "/qui-sommes-nous", permanent: true },
  { source: "/privacy", destination: "/mentions-legales", permanent: true },
  { source: "/terms-and-conditions", destination: "/mentions-legales", permanent: true },
  { source: "/search-results", destination: "/biens", permanent: true },
  { source: "/compare-properties", destination: "/biens", permanent: true },
  { source: "/saved-search", destination: "/client", permanent: true },
  { source: "/favorite-properties", destination: "/client", permanent: true },
  { source: "/my-properties", destination: "/client", permanent: true },
  { source: "/my-profile", destination: "/client", permanent: true },

  // Articles et contenus locaux
  { source: "/blog", destination: "/contenus", permanent: true },
  { source: "/prix-immobilier-a-gemenos-13420", destination: "/prix-m2/gemenos", permanent: true },
  { source: "/prix-immobilier-a-aubagne-13400", destination: "/prix-m2/aubagne", permanent: true },
  { source: "/pourquoi-faire-appel-a-une-agence-immobiliere-locale", destination: "/agence-immobiliere", permanent: true },
  { source: "/primo-accedants-nos-conseils-pour-bien-acheter-son-logement", destination: "/recherche", permanent: true },
  { source: "/dynamiques-record-sur-le-marche-de-limmobilier", destination: "/prix-m2", permanent: true },

  // Annonces reprises dans le nouveau catalogue
  { source: "/bien", destination: "/biens", permanent: true },
  { source: "/bien/maisons-t4-et-t2-independants-en-exclusivite-avec-piscine-et-garages-a-gemenos-2", destination: "/biens/maisons-t4-t2-piscine-garages-gemenos", permanent: true },
  { source: "/bien/appartement-t3-aubagne-de-57-m2-au-pied-du-garlaban-les-solans", destination: "/biens/appartement-t3-les-solans-aubagne", permanent: true },
  { source: "/bien/charmant-t2-renove-proche-mer-dans-la-residence-senioriale-les-hesperides-du-prado-marseille-8", destination: "/biens/appartement-t2-hesperides-prado-marseille-8", permanent: true },
  { source: "/bien/maison-recente-t4-94-m%C2%B2-avec-jardin-le-castellet", destination: "/biens/maison-recente-t4-jardin-le-castellet", permanent: true },
  { source: "/bien/appartement-t2-marseille-5-proche-la-timone-villa-medicis", destination: "/biens/appartement-t2-villa-medicis-la-timone-marseille-5", permanent: true },
  { source: "/bien/terrain-constructible-a-gemenos-1700m2", destination: "/biens/terrain-constructible-1100-m2-gemenos", permanent: true },

  // Types de biens
  { source: "/type-de-bien/maison", destination: "/biens?type=house", permanent: true },
  { source: "/type-de-bien/appartement", destination: "/biens?type=apartment", permanent: true },
  { source: "/type-de-bien/t2-appart", destination: "/biens?type=apartment", permanent: true },
  { source: "/type-de-bien/t3-appart", destination: "/biens?type=apartment", permanent: true },
  { source: "/type-de-bien/t4-appart", destination: "/biens?type=apartment", permanent: true },
  { source: "/type-de-bien/t5-appart", destination: "/biens?type=apartment", permanent: true },
  { source: "/type-de-bien/t2-maison", destination: "/biens?type=house", permanent: true },
  { source: "/type-de-bien/t4-maison", destination: "/biens?type=house", permanent: true },
  { source: "/type-de-bien/villa", destination: "/biens?type=house", permanent: true },
  { source: "/type-de-bien/3-pieces", destination: "/biens", permanent: true },
  { source: "/type-de-bien/4pieces", destination: "/biens", permanent: true },
  { source: "/type-de-bien/terrain-constructible", destination: "/biens?type=land", permanent: true },

  // Villes disposant deja d'une page locale dans le nouveau site
  { source: "/ville/marseille", destination: "/prix-m2/marseille", permanent: true },
  { source: "/ville/nice", destination: "/prix-m2/nice", permanent: true },
  { source: "/ville/perpignan", destination: "/prix-m2/perpignan", permanent: true },
  { source: "/ville/gemenos", destination: "/prix-m2/gemenos", permanent: true },
  { source: "/ville/aix-en-provence", destination: "/prix-m2/aix-en-provence", permanent: true },
  { source: "/ville/aubagne", destination: "/prix-m2/aubagne", permanent: true },
] as const;
