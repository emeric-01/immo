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
