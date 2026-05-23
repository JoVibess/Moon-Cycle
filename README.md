# Moon Cycle

Moon Cycle est un site one-page immersif autour des cycles lunaires.

Le projet repose sur :
- `Vite` pour le build et le serveur de développement
- `Bootstrap` pour une partie de la structure responsive
- `GSAP` pour la navigation et les animations
- `Three.js` pour le rendu 3D de la lune et le fond liquid du footer
- `IPGeolocation Astronomy API` pour les données lunaires dynamiques, via un proxy serveur pour ne pas exposer la clé publiquement

## Lancer le projet en local

### Prérequis

- `Node.js` recommandé : `20.19+`
- `npm`

Le projet peut parfois tourner avec une version plus ancienne de Node, mais `Vite 7` recommande `Node 20.19+` ou `22.12+`.

### Installation

Depuis la racine du projet :

```bash
npm install
```

### Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
IPGEOLOCATION_API_KEY=your_api_key_here
```

Un exemple est fourni dans :
- [.env.example](/Users/jdx/Documents/MDS/B3/Ergonomie et Framework CSS/moonCycle/.env.example)

Sans clé API, certaines données lunaires affichées dans le hero peuvent ne pas être disponibles correctement.

En local, cette même variable est utilisée par le serveur de développement Vite pour répondre à `/api/astronomy`, sans exposer la clé dans le navigateur.

## Commandes utiles

### Lancer le serveur de développement

```bash
npm run dev
```

Le projet sera ensuite accessible en local via l'URL affichée par Vite, généralement :

```bash
http://localhost:5173
```

Les données lunaires live restent disponibles en développement tant que `IPGEOLOCATION_API_KEY` est définie dans `.env`.

### Générer le build de production

```bash
npm run build
```

Le build est généré dans le dossier :
- [dist](/Users/jdx/Documents/MDS/B3/Ergonomie et Framework CSS/moonCycle/dist)

### Prévisualiser le build front

```bash
npm run preview
```

### Lancer le serveur de production local

Le projet utilise un petit serveur Node pour :
- servir le build `dist`
- exposer l'endpoint `/api/astronomy`
- garder la clé API côté serveur
- gérer les routes `/`, `/en` et `/fr` sans erreur 404

```bash
npm run build
npm start
```

Le site sera ensuite accessible par défaut sur :

```bash
http://localhost:3000
```

## Structure rapide

Les fichiers principaux du projet :

- [src/index.html](/Users/jdx/Documents/MDS/B3/Ergonomie et Framework CSS/moonCycle/src/index.html) : structure du site
- [src/css/style.css](/Users/jdx/Documents/MDS/B3/Ergonomie et Framework CSS/moonCycle/src/css/style.css) : styles globaux
- [src/js/main.js](/Users/jdx/Documents/MDS/B3/Ergonomie et Framework CSS/moonCycle/src/js/main.js) : initialisation principale
- [src/js/features](/Users/jdx/Documents/MDS/B3/Ergonomie et Framework CSS/moonCycle/src/js/features) : modules dédiés aux fonctionnalités
- [src/assets](/Users/jdx/Documents/MDS/B3/Ergonomie et Framework CSS/moonCycle/src/assets) : images, fonts, modèle 3D

## Fonctionnalités actuelles

- navigation horizontale entre les trois premières sections
- section footer en scroll vertical
- lune 3D affichée avec `Three.js`
- fond liquid interactif dans le footer
- données lunaires injectées dynamiquement dans le hero
- routage neutre sur `/` avec variantes accessibles sur `/en` et `/fr`

## Déploiement Coolify

Configuration recommandée :

- version Node : `20.19+`
- install command : `npm ci`
- build command : `npm run build`
- start command : `npm start`
- variable d'environnement : `IPGEOLOCATION_API_KEY`

Le serveur Node intégré sert le build Vite et protège la clé API en la conservant uniquement côté VPS.

## Remarque

Si tu modifies le fichier `.env`, pense à redémarrer le serveur concerné :

```bash
npm run dev
```
