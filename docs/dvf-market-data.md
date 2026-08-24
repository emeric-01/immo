# Données locales DVF, IRIS et quartiers

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
