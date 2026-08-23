# Déploiement des pages « prix au m² »

Ce document décrit le processus à suivre après la publication d’Aubagne pour
éviter qu’une même ville affiche des prix différents selon la page consultée.

## Source publiée commune

Les composants publics doivent lire `published-city-market.ts`, qui applique
dans cet ordre :

1. le socle local validé (ventes DVF, historique, fourchettes et zones) ;
2. le signal des annonces professionnelles déjà synchronisées en back-office ;
3. le cache historique existant pour les villes qui n’ont pas encore été
   migrées vers la nouvelle méthodologie.

Une indisponibilité d’Interkab ne doit jamais déclencher un appel distant lors
du rendu public : le socle DVF reste affiché. Le prix demandé d’une annonce ne
doit jamais être présenté comme un prix vendu.

## Pages publiques à synchroniser

Lorsqu’une ville est activée, vérifier systématiquement les consommateurs
suivants :

- `/prix-m2/[ville]` : page canonique, carte, historique, FAQ et JSON-LD ;
- `/agence-immobiliere/[ville]` : cartes appartement/maison, graphique,
  découpage local vérifié et ventes récentes ;
- `/estimation-immobiliere/[ville]` : repères de marché et ventes récentes ;
- `/prix-m2` : annuaire des villes ;
- `/` : villes mises en avant sur l’accueil ;
- `/contenus/[slug]` : graphique des articles rattachés à la ville ;
- liens internes, villes voisines, sitemap prix et métadonnées canoniques.

Les calculs métier du formulaire d’estimation, l’API d’estimation, le scoring
des biens et les écrans du back-office ne sont pas modifiés automatiquement.
Toute évolution de ces calculs exige une validation métier distincte.

## Checklist pour une nouvelle ville

1. Vérifier le code INSEE, le code postal, les limites communales et les noms
   des quartiers/IRIS avec des sources officielles et locales.
2. Construire le socle DVF en séparant appartements et maisons, en excluant
   terrains, viagers, locaux, doublons et mutations incomplètes.
3. Publier médiane, quartiles, volumes et période d’observation ; utiliser un
   repli communal clairement libellé lorsque l’échantillon local est trop
   faible.
4. Vérifier l’historique annuel, la tendance sur un an et la date de la dernière
   mutation disponible.
5. Contrôler les annonces professionnelles stockées : typologie, commune,
   surface, prix, doublons et date de synchronisation.
6. Ajouter le snapshot validé au registre local. Cette activation doit rendre
   la nouvelle source disponible à tous les consommateurs publics ci-dessus.
7. Adapter les contenus locaux : quartiers, analyse, FAQ, maillage vers
   estimation/agence et villes voisines.
8. Comparer les valeurs sur les pages prix, agence, estimation, annuaire et
   accueil. Elles doivent être identiques au même instant.
9. Sur la page agence de la ville, remplacer l’ancienne carte ponctuelle par
   la carte découpée en quartiers/zones IRIS validés et y afficher les 20
   dernières ventes DVF comparables. Conserver ces données dans le snapshot
   local afin d’éviter tout appel API au chargement.
10. Vérifier desktop/mobile, liens CTA, carte Mapbox, données structurées,
   canonical, `index,follow`, sitemap et absence de débordement.
11. Déployer d’abord une prévisualisation `noindex`, valider, puis activer la
    page canonique et contrôler la production après déploiement.

## Contrôle de fraîcheur

- conserver séparément la date de calcul et la dernière mutation DVF ;
- afficher le mois et l’année du calcul lorsque le jour n’apporte rien ;
- surveiller la date de synchronisation des annonces stockées ;
- laisser le sitemap calculer `lastmod` à partir de la date la plus récente
  entre le modèle de page versionné dans Git, le cache du marché et la dernière
  synchronisation des annonces ; ne jamais utiliser la date de consultation ;
- exposer la même date dans le `dateModified` du JSON-LD `WebPage` ;
- relancer la génération seulement lorsqu’un nouveau millésime DVF ou un
  échantillon suffisamment significatif justifie une mise à jour.
