# Migration SEO depuis WordPress

Inventaire réalisé le 22 juillet 2026 depuis le sitemap Rank Math public de `jumellesimmo.fr`.

## Périmètre

- `post-sitemap.xml` : 23 URL (annonces et articles mélangés)
- `page-sitemap.xml` : 15 URL
- `local-sitemap.xml` : 1 URL technique KML
- Total : 39 URL

Le détail exhaustif et la destination proposée se trouvent dans `wordpress-url-inventory.csv`.

## Résultat du rapprochement

- 24 redirections permanentes sont suffisamment précises et sont préparées dans `src/lib/seo/legacy-redirects.ts`.
- 1 URL (`/`) est conservée sans redirection.
- 12 URL doivent être recréées, fusionnées ou remises en ligne avant la bascule du domaine.
- 2 URL techniques peuvent être retirées ou répondre en 410 après validation.

## À migrer avant la bascule

### Pages

- Mentions légales et politique de confidentialité
- Contact
- Nos prestations d’architecture intérieure
- Atelier Les Jumelles

### Articles

- Prêt immobilier : séduire son banquier
- Peinture murale : réussir des arrondis parfaits
- DIY : tête de lit avec niche et éclairage LED

### Biens sans fiche publiée équivalente

- Appartement T3 traversant avec vue Sainte-Victoire à Aix-en-Provence
- Grande maison familiale de 280 m² à Aubagne
- Villa de 212 m² avec terrain constructible à La Ciotat
- Grand T2 avec terrasse à Gémenos
- Maison T3 à Gémenos

Pour une annonce vendue, la meilleure solution est de recréer une fiche publique marquée « Vendue par Les Jumelles », puis de rediriger l’ancienne URL vers cette fiche. Une redirection vers `/biens` risquerait d’être interprétée comme une soft 404.

## Procédure de bascule recommandée

1. Traiter les 12 URL en attente et compléter leur destination dans le CSV.
2. Vérifier toutes les destinations en production (réponse 200, canonical correcte, indexabilité).
3. Brancher `jumellesimmo.fr` sur le nouveau projet.
4. Déployer les redirections permanentes au même moment.
5. Soumettre le nouveau `/sitemap.xml` dans Google Search Console et Bing Webmaster Tools.
6. Contrôler les 404, les redirections et la couverture d’index pendant 8 à 12 semaines.
7. Conserver les redirections au minimum 12 mois, idéalement sans date de suppression.
