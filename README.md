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
