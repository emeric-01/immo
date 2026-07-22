# Migration des URL agenceasm.com

Inventaire realise le 22 juillet 2026 depuis `sitemap_index.xml`.

## Perimetre analyse

- 73 pages WordPress
- 24 annonces immobilières
- 7 articles
- 10 archives de villes
- 12 archives de types de biens
- 4 archives geographiques
- 4 fiches agence ou agent

Les redirections actives sont definies dans
`src/lib/seo/agence-asm-redirects.ts`. Elles sont permanentes (`308` emis par
Next.js, equivalent SEO d'une redirection permanente) et ne deviennent utiles
que lorsque le domaine `agenceasm.com` pointe vers la nouvelle application.

## Regles retenues

1. Une page service est redirigee vers le meme service du nouveau site.
2. Une annonce n'est redirigee vers une fiche bien que si cette fiche a
   effectivement ete migree.
3. Une archive de ville est redirigee vers sa page de prix uniquement si cette
   ville existe dans le nouveau referentiel.
4. Les pages de demonstration Houzez, tunnels de paiement, espaces membres et
   anciens programmes neufs sans equivalent ne sont pas rediriges vers
   l'accueil. Ils doivent retourner `404` apres la bascule pour eviter les
   soft 404.

## Annonces avec redirection exacte

- Maisons T4 et T2 avec piscine a Gemenos
- Appartement T3 Les Solans a Aubagne
- Appartement T2 Les Hesperides du Prado a Marseille 8e
- Maison T4 avec jardin au Castellet
- Appartement T2 Villa Medicis a Marseille 5e
- Terrain constructible a Gemenos

## URL a reprendre avant d'ajouter une redirection

Les contenus suivants n'ont pas encore de destination equivalente suffisamment
proche :

- anciens programmes immobiliers neufs de Toulouse, Colomiers et Beauzelle ;
- annonces non migrees de Toulouse, Nice, Vitrolles, Risoul et Marseille ;
- pages villes Toulouse, Beauzelle, Risoul et Vitrolles ;
- article ancien sur la defiscalisation immobiliere ;
- fiche agence promoteur Urbat ;
- archives `area/*` sans page regionale equivalente.

Pour ces URL, creer d'abord une page utile ou migrer le contenu. Une redirection
vers l'accueil, `/biens` ou `/contenus` sans equivalence editoriale ferait perdre
le signal SEO de l'ancienne page.

## Controle avant bascule du domaine

1. Exporter les URL qui recoivent encore des clics depuis Google Search Console.
2. Completer la liste avec les URL absentes du sitemap mais encore visitees.
3. Tester chaque ancienne URL et verifier une seule redirection vers une page en
   `200`, sans chaine intermediaire.
4. Conserver le domaine et les redirections au moins douze mois apres la bascule.
5. Envoyer le nouveau sitemap dans Search Console apres changement de domaine.
