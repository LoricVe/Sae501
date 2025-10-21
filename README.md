# 🎨 React + Vite + Pixi.js + GSAP

Environnement moderne et performant pour créer des expériences graphiques interactives (BD numériques, visualisations, animations).

## 🚀 Démarrage rapide

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev

# Build pour la production
npm run build

# Prévisualisation du build
npm run preview
```

## 📦 Technologies

- **Vite.js** : Build ultra-rapide avec hot-reload
- **React.js** : Framework UI avec composants modulaires
- **Pixi.js** : Moteur de rendu 2D WebGL haute performance
- **GSAP** : Animation professionnelle et fluide

## 📂 Structure du projet

```
src/
├── components/       # Composants React réutilisables
│   └── PixiCanvas.jsx  # Canvas Pixi.js avec animations GSAP
├── pixi/            # Logique et scènes Pixi.js
├── utils/           # Fonctions utilitaires
├── styles/          # Styles CSS / modules CSS
├── assets/
│   └── images/      # Vos images (JPG, PNG, SVG, etc.)
└── App.jsx          # Point d'entrée principal
```

## 🎯 Utilisation

### Ajouter vos propres images

1. Placez vos images dans `src/assets/images/`
2. Modifiez le chemin dans `App.jsx` :

```jsx
<PixiCanvas
  imagePath="/src/assets/images/votre-image.jpg"
  width={800}
  height={600}
/>
```

### Personnaliser l'animation

Éditez `src/components/PixiCanvas.jsx` pour modifier :
- Les effets GSAP (fade, zoom, rotation, mouvement)
- Les timings et easing
- Les interactions utilisateur

### Créer de nouvelles scènes Pixi

Ajoutez vos scènes dans `src/pixi/` et importez-les dans vos composants React.

## 📖 Documentation

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [Pixi.js](https://pixijs.com/)
- [GSAP](https://gsap.com/)

## ✨ Fonctionnalités

✅ Hot-reload instantané
✅ Rendu 2D haute performance (WebGL)
✅ Animations fluides et précises
✅ Structure modulaire et extensible
✅ Prêt pour la production
