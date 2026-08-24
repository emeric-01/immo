# Données locales DVF, IRIS et quartiers

## Contrat permanent de l'historique des prix

Cette section est la référence fonctionnelle de tous les graphiques « Évolution des prix ». Elle s'applique aux pages prix, agences, estimations, contenus éditoriaux, au formulaire d'estimation, au dossier administrateur et aux PDF.

1. La vue longue couvre 2014–2025 tant qu'une nouvelle année complète n'a pas été contrôlée et publiée. La vue « 5 ans » correspond aux cinq dernières années calendaires, actuellement 2021–2025.
2. Les années 2014–2020 viennent des données Immo Data déjà stockées. À partir de 2021, DVF est prioritaire séparément pour les appartements et les maisons ; une valeur Immo Data déjà stockée complète uniquement la typologie DVF manquante.
3. Le rendu et le pipeline ne contactent ni l'API Immo Data ni Cerema pour récupérer cet historique.
4. Chaque valeur conserve sa provenance (`apartmentSource` ou `houseSource`). Le jeu publié conserve également `historySource` et `historyCoverage`.
5. Une période inconnue reste présente sur l'axe comme une lacune explicite. Elle n'est jamais supprimée, remplacée par zéro, interpolée, estimée ou reliée artificiellement à la période suivante.
6. Si DVF et la donnée Immo Data stockée manquent tous les deux, la publication est interrompue avec la ville, la typologie et la période concernées. L'interface signale également cette lacune sans la masquer.
7. Toutes les interfaces React utilisent le composant partagé `CityMarketChart` avec `historySource` et `historyCoverage`. Les rendus administrateur et PDF utilisent la même série normalisée.

Ces invariants sont protégés par les types et les tests de `src/lib/price-history.test.ts`, `scripts/dvf/market-statistics.test.ts` et `src/app/(public)/prix-immobilier/[city]/city-market-chart.test.ts`. Toute évolution volontaire de ce contrat doit modifier ensemble le pipeline, tous les consommateurs, cette documentation et les tests.

## Périmètre

Le référentiel local couvre 41 villes des Bouches-du-Rhône et du Var. Marseille est publiée comme une seule ville ; ses 16 codes d’arrondissement sont uniquement des codes sources internes.

Chaque ville dispose d’un jeu préparé comprenant :

- un historique annuel depuis 2014, restauré depuis les snapshots Immo Data déjà stockés et complété par les médianes DVF disponibles ;
- les polygones IRIS officiels INSEE/IGN ;
- les noms de quartiers, lotissements et lieux-dits habités issus de la BD TOPO de l’IGN ;
- les médianes appartement et maison, les quartiles, les volumes, la tendance annuelle et les 20 dernières ventes ;
- les statistiques par IRIS avec extension de la période lorsque l’échantillon récent est insuffisant.

Les prix courants, fourchettes, volumes, cartes et ventes proviennent du référentiel DVF préparé. Pour l'historique, DVF est prioritaire à partir de 2021 ; lorsqu'une typologie DVF est insuffisante, la valeur Immo Data déjà stockée est conservée avec sa provenance. Aucun appel Immo Data ou Cerema n'est nécessaire.

## Règles de nommage

- `officialName` conserve le nom IRIS publié par l’INSEE.
- `name` est le libellé public. Il peut corriger une graphie locale sans modifier le périmètre statistique, par exemple `Baudinard` (IRIS) devient `Beaudinard` à l’écran.
- `allNeighborhoodNames` conserve tous les noms IGN rattachés spatialement pour l’audit.
- `includedNeighborhoods` contient au maximum six noms pertinents pour l’interface. Les résidences et immeubles ne sont pas utilisés comme quartiers principaux.
- Chaque nom conserve ses sources dans `namingSources`.

Un quartier vécu et un IRIS ne désignent pas nécessairement la même géographie. Le site ne doit donc jamais présenter un nom IGN comme une limite de prix officielle.

## Communes avec un seul IRIS

Lorsqu’une commune ne possède qu’un IRIS, elle ne reçoit qu’un seul prix statistique infra-communal. Les quartiers et lieux-dits vérifiés peuvent enrichir le contenu et la recherche locale, mais ils ne doivent pas recevoir artificiellement des médianes différentes.

## Commandes

```bash
pnpm dvf:refresh
pnpm dvf:stage
pnpm dvf:persist-staged
```

- `dvf:refresh` recalcule les données sans les publier.
- `dvf:stage` écrit les fichiers de contrôle dans `.local/dvf-market-staging/`.
- `dvf:persist-staged` injecte le staging déjà contrôlé dans Supabase, sans télécharger à nouveau les sources. Cette commande exige `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`.
- `--city=aubagne` limite chacune de ces commandes à une ville.
- `--refresh-downloads` force le renouvellement des fichiers sources.

## Pages à maintenir ensemble

Une actualisation validée doit mettre à jour le snapshot partagé avant de contrôler :

1. `/prix-immobilier/[ville]` : prix, historique, carte IRIS, quartiers et dernières ventes ;
2. `/agence-immobiliere/[ville]` : repères de prix, carte locale et 20 ventes récentes ;
3. les FAQ et blocs de maillage utilisant les quartiers de la ville ;
4. le sitemap et son `lastmod`, calculé depuis la date réelle du snapshot publié.

Les pages publiques lisent les snapshots stockés. Elles ne contactent ni DVF, ni l’IGN, ni l’INSEE à chaque visite.

Les années absentes ne sont jamais supprimées de l'axe et ne deviennent jamais des prix nuls. Le pipeline cherche d'abord la valeur DVF, puis la valeur Immo Data déjà stockée. Si les deux manquent, la publication est interrompue avec la ville, la typologie et l'année concernées ; l'interface affiche explicitement la période inconnue au lieu de relier artificiellement la courbe.
