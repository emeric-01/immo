# Consignes permanentes du dépôt

## Graphiques « Évolution des prix »

Le comportement décrit dans `docs/dvf-market-data.md`, section « Contrat permanent de l'historique des prix », est une règle métier du produit. Toute modification touchant un historique de prix, un graphique de marché, une estimation ou un PDF doit la respecter.

- L'historique long attendu est 2014–2025 tant qu'une nouvelle année complète n'a pas été validée et publiée.
- Utiliser les données Immo Data déjà stockées pour 2014–2020.
- À partir de 2021, préférer DVF pour chaque typologie ; si DVF manque pour une typologie et une année, conserver la valeur Immo Data déjà stockée.
- Ne jamais appeler l'API Immo Data ou Cerema pour afficher ou reconstruire ce graphique.
- Ne jamais supprimer une période inconnue, la convertir en zéro, inventer une valeur, interpoler une courbe ou relier visuellement une lacune.
- Si les deux sources manquent, interrompre la publication et afficher explicitement la typologie et la période inconnues.
- Conserver la provenance par valeur (`apartmentSource`, `houseSource`), la provenance globale (`historySource`) et la couverture (`historyCoverage`).
- Le bouton « 5 ans » montre les cinq dernières années calendaires ; « Depuis 2014 » montre tout l'historique disponible depuis 2014.
- Toutes les surfaces doivent rester cohérentes : pages prix, agences, estimations, contenus éditoriaux, formulaire d'estimation, dossier administrateur et PDF.
- Passer systématiquement `historySource` et `historyCoverage` au composant partagé `CityMarketChart`.

Avant de livrer une modification dans ce périmètre, exécuter au minimum :

```bash
pnpm test -- src/lib/price-history.test.ts scripts/dvf/market-statistics.test.ts 'src/app/(public)/prix-immobilier/[city]/city-market-chart.test.ts'
pnpm typecheck
```

Une modification volontaire de ce contrat exige une demande explicite du propriétaire du projet et une mise à jour simultanée de cette consigne, de la documentation et des tests.
