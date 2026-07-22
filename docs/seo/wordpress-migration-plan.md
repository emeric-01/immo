# Migration SEO depuis WordPress

Inventaire réalisé le 22 juillet 2026 depuis le sitemap Rank Math public de `jumellesimmo.fr`.

## Périmètre

- `post-sitemap.xml` : 23 URL (annonces et articles mélangés)
- `page-sitemap.xml` : 15 URL
- `local-sitemap.xml` : 1 URL technique KML
- Total : 39 URL

Le détail exhaustif et la destination proposée se trouvent dans `wordpress-url-inventory.csv`.

## Résultat du rapprochement

- 37 redirections permanentes sont préparées dans `src/lib/seo/legacy-redirects.ts`.
- 2 URL (`/` et `/estimation-immobiliere/`) sont conservées sans redirection.
- Toutes les anciennes URL disposent désormais d’un traitement explicite.
- Par arbitrage, les 11 URL éditoriales ou annonces sans équivalent ainsi que les 2 URL techniques renvoient vers l’accueil.

## Arbitrage des URL sans équivalent

Les anciennes pages, annonces et contenus sans équivalent direct sont redirigés en 301 vers l’accueil conformément à la décision du 23 juillet 2026. Cette solution évite les erreurs 404, avec un risque assumé que certains moteurs interprètent ces redirections génériques comme des soft 404.

## Procédure de bascule recommandée

1. Vérifier toutes les destinations en production (réponse 200, canonical correcte, indexabilité).
2. Brancher `jumellesimmo.fr` sur le nouveau projet.
3. Déployer les redirections permanentes au même moment.
4. Soumettre le nouveau `/sitemap.xml` dans Google Search Console et Bing Webmaster Tools.
5. Contrôler les 404, les redirections et la couverture d’index pendant 8 à 12 semaines.
6. Conserver les redirections au minimum 12 mois, idéalement sans date de suppression.
