# Échec de compilation Hostinger — Que faire

## Si l’erreur dit que « package.json » est manquant ou null

Souvent, Hostinger ne trouve pas `package.json` parce que le **Répertoire racine** (Root directory) ne pointe pas vers le bon dossier.

- **Vous avez zippé tout le dossier du projet** (ex. « Nouveau dossier ») → dans Hostinger, **Paramètres et redéploiement** → **Répertoire racine** = le nom de ce dossier (ex. `Nouveau dossier` ou `eatforeat`). C’est ce dossier qui contient `package.json`, `index.html`, `vite.config.js`.
- **Vous avez zippé le contenu** (fichiers à la racine du zip) → laissez **Répertoire racine** vide ou mettez `.`.

Voir aussi **HOSTINGER_ZIP_INSTRUCTIONS.txt** à la racine du projet.

## Correction appliquée (compatible Node 18)

Le projet est configuré pour **Node 18** (comme sur Hostinger) :

1. **Node 18** : `package.json` (engines) et `.nvmrc` = **18**. Dans Hostinger, **Version Node** = **18**.
2. **Vite 6** : compatible Node 18.
3. **package.json** : valide, en format lisible, avec `build` et `start`, et le nom du projet `eatforeat`.
4. **vite.config.js** : présent à la racine.
5. Sortie du build : **`dist`**.

**À faire sur Hostinger (Paramètres et redéploiement) :**
- **Version Node** = **18**.
- **Package Manager** = **npm** (pas yarn ni pnpm).
- **Output Directory** = **dist** (si le champ existe).
- **Entry File** = laisser vide (null).
- **Répertoire racine** = dossier qui contient `package.json` (voir ci‑dessus).
- Zip avec un nom de dossier **sans espace** (ex. `eatforeat`) puis redéployer.

## Si le déploiement depuis les sources échoue encore

**Méthode fiable :** construire en local puis déployer uniquement les fichiers générés :

1. Sur votre ordinateur : `npm install` puis `npm run build`.
2. Un dossier **`dist`** est créé à la racine du projet.
3. Dans Hostinger (hPanel → Gestionnaire de fichiers), allez dans **`public_html`**.
4. Uploadez **tout le contenu** du dossier **`dist`** dans **`public_html`** (`index.html`, dossier `assets/`, `.htaccess`, etc.).

Le site fonctionnera sans compilation côté Hostinger.
