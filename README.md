# Immo Backoffice

Projet local isole pour l'activite immo.

## Isolation

- Dossier separe de la laverie : `immo-backoffice`
- Repo Git separe
- Variables d'environnement separees
- Port local dedie : `3001`
- Aucun import ou lien direct vers `laverie-backoffice`

## Demarrage local

Dans l'environnement Codex actuel, Node n'est pas dans le `PATH` global. Utilise le runtime fourni :

```bash
export PATH="/Users/emeric/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/emeric/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin:$PATH"
pnpm install
pnpm dev
```

Puis ouvre :

```text
http://localhost:3001
```

Routes utiles :

```text
http://localhost:3001/                      # module d'estimation existant
http://localhost:3001/recherche             # formulaire public de recherche acheteurs
http://localhost:3001/recherche-acheteurs   # demo Phase 1 du design system acheteurs
http://localhost:3001/admin/recherches      # espace admin des recherches acheteurs
```

## Recherche acheteurs

Le module public de recherche acheteurs est disponible sur `/recherche`.
Cette premiere version reste volontairement front-only : aucune authentification,
aucune base distante et aucun back-office ne sont branches.

Fonctionnalites incluses :

- formulaire public complet en 8 etapes ;
- progression, retour et navigation fluide sans rechargement complet ;
- validation Zod par etape ;
- persistance du brouillon dans `localStorage` ;
- soumission locale via `submitBuyerSearch(data)` ;
- page de confirmation `/recherche/confirmation` ;
- rendu responsive inspire des maquettes desktop/mobile fournies.

Structure principale :

```text
src/app/recherche/page.tsx
src/app/recherche/confirmation/page.tsx
src/components/buyer-search/wizard/
src/lib/buyer-search/
```

Modele de donnees central :

```text
BuyerSearchFormData
```

Il se trouve dans :

```text
src/lib/buyer-search/types.ts
```

Points prevus pour Supabase en phase suivante :

- `submitBuyerSearch` appelle maintenant `POST /api/buyer-searches` ;
- la migration `supabase/migrations/20260713170000_create_buyer_searches.sql`
  cree les tables `buyer_searches`, `buyer_search_locations`,
  `buyer_search_priorities` et `buyer_search_consents` ;
- si Supabase n'est pas configure, la confirmation reste disponible via
  le stockage local du navigateur ;
- remplacer le stockage local par un brouillon authentifie ;
- ajouter l'espace client.

## Espace admin recherches

L'espace admin est disponible sur `/admin/recherches`.

Variables necessaires :

```env
ADMIN_ACCESS_TOKEN=""
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
```

`ADMIN_ACCESS_TOKEN` protege l'acces par cookie HTTP-only.
`SUPABASE_SERVICE_ROLE_KEY` est utilisee uniquement cote serveur pour lire
les formulaires et ne doit jamais etre exposee avec le prefixe `NEXT_PUBLIC_`.

Commandes de verification locales :

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Deploiement Vercel :

```bash
pnpm build
vercel deploy --prod
```

## Variables

Les variables locales sont dans `.env.local`.

Le fichier `.env.example` sert de modele partageable, sans secrets.

## Brancher les API plus tard

Ajoute les URLs et cles dans `.env.local`, puis cree les clients API dans un dossier dedie, par exemple :

```text
src/lib/
  immo-api.ts
  supabase.ts
```

## Estimation Immo Data

Le front doit appeler notre route interne :

```text
POST /api/estimations
```

Si `IMMO_DATA_BASE_URL` et `IMMO_DATA_API_KEY` sont absents, la route renvoie une estimation mockee.
Quand les acces fournisseur sont disponibles, renseigne :

```env
IMMO_DATA_BASE_URL="https://api.immo-data.fr"
IMMO_DATA_API_KEY=""
```

Le flux conforme a la documentation officielle est :

```text
GET /v1/geocode?q=...&geoLevel=address&limit=1
GET /v1/valuation?longitude=...&latitude=...&realtyType=...&nbRooms=...&livingArea=...
```
