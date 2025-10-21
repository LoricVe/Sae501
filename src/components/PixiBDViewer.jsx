import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import './PixiBDViewer.css';

/**
 * Composant de visualisation de BD interactive
 * Affiche 21 images avec navigation fluide et transitions GSAP
 */
const PixiBDViewer = () => {
  // Références React
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const spritesRef = useRef([]);
  const animationLayerRef = useRef(null); // Container pour les animations (au-dessus des pages)
  const currentPageRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const titleRef = useRef(null);

  // États React pour l'UI
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [showTitle, setShowTitle] = useState(true);
  const [showPage2Text, setShowPage2Text] = useState(false);
  const [showPage3Text, setShowPage3Text] = useState(false);
  const [showPage4Text, setShowPage4Text] = useState(false);
  const [showPage7Text, setShowPage7Text] = useState(false);
  const [showPage8Text, setShowPage8Text] = useState(false);
  const [showPage9Text, setShowPage9Text] = useState(false);
  const [showPage10Text, setShowPage10Text] = useState(false);
  const [showPage11Text, setShowPage11Text] = useState(false);
  const page2TextRef = useRef(null);
  const page3TextRef = useRef(null);
  const page4TextRef = useRef(null);
  const page7TextRef = useRef(null);
  const page8TextRef = useRef(null);
  const page9TextRef = useRef(null);
  const page10TextRef = useRef(null);
  const page11TextRef = useRef(null);

  // Liste des pages disponibles (toutes les 21 pages)
  const AVAILABLE_PAGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const TOTAL_PAGES = AVAILABLE_PAGES.length;

  useEffect(() => {
    // Création de l'application Pixi.js
    const app = new PIXI.Application();

    // Initialisation asynchrone
    const initPixi = async () => {
      await app.init({
        backgroundAlpha: 0, // Fond transparent (au lieu de '#1a1a1a')
        resizeTo: window,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      // Ajout du canvas au DOM
      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }

      appRef.current = app;

      // Préchargement des 21 images
      await loadImages(app);
    };

    initPixi();

    // Nettoyage au démontage du composant
    return () => {
      if (appRef.current) {
        // Nettoyage des sprites
        spritesRef.current.forEach(sprite => {
          if (sprite && sprite.texture) {
            sprite.destroy({ children: true, texture: false, baseTexture: false });
          }
        });
        spritesRef.current = [];

        // Destruction de l'application
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
    };
  }, []);

  /**
   * Précharge toutes les images via PIXI.Assets
   */
  const loadImages = async (app) => {
    try {
      const sprites = [];

      // Chargement progressif des images disponibles
      for (let i = 0; i < AVAILABLE_PAGES.length; i++) {
        const pageNum = AVAILABLE_PAGES[i];
        // Chemin correct pour Vite : /assets au lieu de /src/assets
        const imagePath = `/assets/images/page${pageNum}.png`;

        // Charger la texture
        const texture = await PIXI.Assets.load(imagePath);

        // Créer le sprite
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.alpha = i === 0 ? 1 : 0; // Seule la première image est visible

        // Ajout à la scène
        app.stage.addChild(sprite);
        sprites.push(sprite);

        // Mise à jour de la progression
        setLoadProgress(Math.round(((i + 1) / TOTAL_PAGES) * 100));
      }

      spritesRef.current = sprites;

      // Créer un container pour les animations (au-dessus des pages)
      const animationLayer = new PIXI.Container();
      app.stage.addChild(animationLayer);
      animationLayerRef.current = animationLayer;
      console.log('✅ Animation layer créé au-dessus des pages');

      // Positionnement initial
      resizeSprites(app);

      // Fin du chargement
      setIsLoading(false);

      // Démarrer l'animation de la page 1 après un court délai
      setTimeout(() => {
        playPage1Animation();
      }, 300);

      // Gestion du redimensionnement de la fenêtre avec debounce
      let resizeTimeout;
      let previousDeviceType = getDeviceType();

      const handleResize = () => {
        // Debounce: attendre 150ms après le dernier resize avant de recalculer
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const currentDeviceType = getDeviceType();

          // Détection du changement de type d'appareil (ex: rotation tablette)
          if (currentDeviceType !== previousDeviceType) {
            console.log(`Changement de mode: ${previousDeviceType} → ${currentDeviceType}`);
            previousDeviceType = currentDeviceType;
          }

          resizeSprites(app);

          console.log('Recentrage après resize terminé');
        }, 150);
      };

      // Gestion spécifique du changement d'orientation
      const handleOrientationChange = () => {
        setTimeout(() => {
          resizeSprites(app);
          console.log('Recentrage après changement d\'orientation');
        }, 200);
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleOrientationChange);
    } catch (error) {
      console.error('Erreur lors du chargement des images:', error);
      setIsLoading(false);
    }
  };

  /**
   * Détecte le type d'appareil selon la taille de l'écran
   */
  const getDeviceType = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    if (width >= 1024) {
      return 'desktop';
    } else if (width >= 768 && isLandscape) {
      return 'tablet-landscape';
    }
    return 'other';
  };

  /**
   * Récupère les paramètres responsive selon le type d'appareil
   */
  const getResponsiveParams = () => {
    const deviceType = getDeviceType();

    switch (deviceType) {
      case 'desktop':
        return {
          padding: 0, // Aucun padding pour un affichage plein écran
          maxScale: 1.0, // Échelle maximale (100% de la taille originale)
          transitionDuration: 0.4, // Durée des transitions en secondes
        };
      case 'tablet-landscape':
        return {
          padding: 0, // Aucun padding pour tablette
          maxScale: 1.0, // Échelle maximale pour remplir l'écran
          transitionDuration: 0.5, // Transitions un peu plus lentes
        };
      default:
        return {
          padding: 0,
          maxScale: 1.0,
          transitionDuration: 0.5,
        };
    }
  };

  /**
   * Ajuste la taille et la position des sprites pour un affichage responsive
   * Mode "cover" : remplit tout l'écran (peut couper les bords)
   */
  const resizeSprites = (app) => {
    const sprites = spritesRef.current;
    if (!sprites.length) return;

    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;

    sprites.forEach(sprite => {
      if (!sprite || !sprite.texture) return;

      const textureWidth = sprite.texture.width;
      const textureHeight = sprite.texture.height;

      // Calcul du ratio pour REMPLIR l'écran (mode cover)
      const scaleX = screenWidth / textureWidth;
      const scaleY = screenHeight / textureHeight;

      // Prendre le MAX pour couvrir tout l'écran (au lieu de MIN)
      let scale = Math.max(scaleX, scaleY);

      // Application de l'échelle
      sprite.scale.set(scale);

      // Centrage horizontal et vertical
      sprite.x = screenWidth / 2;
      sprite.y = screenHeight / 2;
    });

    console.log(`Resize: ${getDeviceType()} - ${screenWidth}x${screenHeight} - Mode COVER`);
  };

  /**
   * Animation spécifique pour la page 1 : zoom progressif sur la tour dans la fenêtre + carré rouge
   * Cette animation crée un effet cinématique d'introduction
   */
  const playPage1Animation = () => {
    const sprite = spritesRef.current[0]; // Sprite de la page 1
    if (!sprite || currentPageRef.current !== 0) return;

    const app = appRef.current;
    if (!app) return;

    // Sauvegarder la position initiale
    const initialX = sprite.x;
    const initialY = sprite.y;
    const initialScaleX = sprite.scale.x;
    const initialScaleY = sprite.scale.y;

    // Configuration du zoom
    // ⚠️ AJUSTEZ CES VALEURS pour cibler la tour dans votre image
    const zoomConfig = {
      targetScale: 1.2,        // Niveau de zoom (1.4 = 140% de la taille originale)
      offsetX: 80,           // Décalage horizontal (-150 = décale vers la droite pour centrer la tour)
      offsetY: 80,            // Décalage vertical (-80 = décale vers le haut pour centrer la tour)
      duration: 10,             // Durée de l'animation en secondes
      ease: 'power2.inOut'     // Type d'easing (smooth)
    };

    console.log('🎬 Démarrage animation page 1 - Zoom sur la tour');

    // Animation GSAP du zoom progressif
    gsap.to(sprite, {
      x: initialX + zoomConfig.offsetX,
      y: initialY + zoomConfig.offsetY,
      duration: zoomConfig.duration,
      ease: zoomConfig.ease
    });

    gsap.to(sprite.scale, {
      x: initialScaleX * zoomConfig.targetScale,
      y: initialScaleY * zoomConfig.targetScale,
      duration: zoomConfig.duration,
      ease: zoomConfig.ease,
      onComplete: () => {
        console.log('✅ Animation page 1 terminée');
        // Déclencher l'animation du titre après le zoom
        playTitleAnimation();
      }
    });
  };

  /**
   * Animation d'apparition du titre et des auteurs (page 1 uniquement)
   * S'affiche après l'animation de zoom
   */
  const playTitleAnimation = () => {
    if (!titleRef.current || currentPageRef.current !== 0) return;

    const titleElement = titleRef.current.querySelector('.title-text');
    const authorElement = titleRef.current.querySelector('.author-text');

    console.log('📝 Démarrage animation titre/auteurs');

    // Configuration de l'animation d'apparition
    const animConfig = {
      duration: 1.5,
      stagger: 0.3,  // Délai entre titre et auteur
      ease: 'power2.out'
    };

    // États initiaux (invisibles)
    gsap.set([titleElement, authorElement], {
      opacity: 0,
      y: 30,
      scale: 0.8
    });

    // Animation du titre
    gsap.to(titleElement, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: animConfig.duration,
      ease: animConfig.ease
    });

    // Animation de l'auteur (légèrement décalée)
    gsap.to(authorElement, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: animConfig.duration,
      ease: animConfig.ease,
      delay: animConfig.stagger,
      onComplete: () => {
        console.log('✅ Animation titre/auteurs terminée');
      }
    });
  };

  /**
   * Animation spécifique pour la page 2 : pluie + texte narratif
   */
  const playPage2Animation = () => {
    const app = appRef.current;
    if (!app || currentPageRef.current !== 1) {
      console.log('❌ Conditions non remplies:', { app: !!app, currentPage: currentPageRef.current });
      return;
    }

    console.log('🌧️ Démarrage animation page 2 - Pluie et texte');

    // FORCER la destruction si existe déjà
    if (appRef.current.page2Elements) {
      console.log('⚠️ Éléments page 2 existent déjà, suppression...');
      const { rainDrops, rainContainer, ticker } = appRef.current.page2Elements;

      // Arrêter le ticker de pluie
      if (ticker) {
        app.ticker.remove(ticker);
      }

      // Supprimer les gouttes
      if (rainDrops) {
        rainDrops.forEach(drop => drop.destroy());
      }

      // Supprimer le container
      if (rainContainer) {
        animationLayerRef.current.removeChild(rainContainer);
        rainContainer.destroy();
      }

      appRef.current.page2Elements = null;
    }

    // === CRÉATION DE LA PLUIE ===
    const rainContainer = new PIXI.Container();
    animationLayerRef.current.addChild(rainContainer);

    const rainDrops = [];
    const dropCount = 100; // Nombre de gouttes

    for (let i = 0; i < dropCount; i++) {
      // Créer une goutte (ligne verticale)
      const drop = new PIXI.Graphics();
      drop.moveTo(0, 0);
      drop.lineTo(0, 15); // Longueur de la goutte
      drop.stroke({ width: 1, color: 0xaaaaaa, alpha: 0.3 + Math.random() * 0.3 });

      // Position aléatoire
      drop.x = Math.random() * app.screen.width;
      drop.y = Math.random() * app.screen.height;

      // Vitesse aléatoire
      drop.speed = 3 + Math.random() * 5;

      rainContainer.addChild(drop);
      rainDrops.push(drop);
    }

    // Animation de la pluie avec ticker
    const rainTicker = () => {
      rainDrops.forEach(drop => {
        drop.y += drop.speed;

        // Réinitialiser si hors écran
        if (drop.y > app.screen.height) {
          drop.y = -20;
          drop.x = Math.random() * app.screen.width;
        }
      });
    };

    app.ticker.add(rainTicker);

    // Stocker les références pour nettoyage
    appRef.current.page2Elements = {
      rainDrops,
      rainContainer,
      ticker: rainTicker
    };

    console.log('✅ Pluie créée avec', dropCount, 'gouttes');

    // === AFFICHAGE DU TEXTE NARRATIF PAGE 2 ===
    // Masquer le texte au début, puis l'afficher après 0.5s avec animation
    setTimeout(() => {
      if (currentPageRef.current === 1) {
        setShowPage2Text(true);

        // Attendre que le DOM soit mis à jour avant d'animer
        requestAnimationFrame(() => {
          if (page2TextRef.current && currentPageRef.current === 1) {
            gsap.fromTo(
              page2TextRef.current,
              {
                opacity: 0,
                y: 20
              },
              {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: 'power2.out'
              }
            );
          }
        });
      }
    }, 500);
  };

  /**
   * Animation spécifique pour la page 3 : fleurs scintillantes + texte narratif
   */
  const playPage3Animation = () => {
    const app = appRef.current;
    if (!app || currentPageRef.current !== 2) {
      console.log('❌ Conditions non remplies:', { app: !!app, currentPage: currentPageRef.current });
      return;
    }

    console.log('🌸 Démarrage animation page 3 - Fleurs magiques');

    // FORCER la destruction si existe déjà
    if (appRef.current.page3Elements) {
      console.log('⚠️ Éléments page 3 existent déjà, suppression...');
      const { flowerSprites } = appRef.current.page3Elements;

      // Supprimer les animations et sprites
      if (flowerSprites) {
        flowerSprites.forEach(sprite => {
          gsap.killTweensOf(sprite);
          sprite.destroy();
        });
      }

      appRef.current.page3Elements = null;
    }

    // === CRÉATION DES FLEURS SCINTILLANTES ===
    const flowerSprites = [];

    // 🎨 POSITIONS DES ÉCLATS DE LUMIÈRE (3 points jaune clair)
    // Format: { x: position X en %, y: position Y en %, size: taille du halo }
    //
    // COMMENT AJUSTER LES POSITIONS :
    // - x: 0 = bord gauche, 0.5 = centre, 1 = bord droit
    // - y: 0 = haut de l'écran, 0.5 = centre, 1 = bas de l'écran
    // - size: taille du halo lumineux (50-150 recommandé)
    //
    // Exemple : { x: 0.3, y: 0.4, size: 80 } = à 30% de la largeur, 40% de la hauteur
    const flowerPositions = [
      { x: 0.32, y: 0.55, size: 40 },   // Fleur 1 - gauche centre
      { x: 0.49, y: 0.55, size: 40 },   // Fleur 2 - centre bas
      { x: 0.71, y: 0.55, size: 45 },   // Fleur 3 - droite centre
    ];

    flowerPositions.forEach((config, index) => {
      // === CRÉER LE CERCLE CENTRAL LUMINEUX ===
      const glow = new PIXI.Graphics();
      glow.circle(0, 0, config.size);
      glow.fill({ color: 0xFFFFE0, alpha: 0.55 }); // Plus opaque (0.4 → 0.7)

      // Position en fonction de la taille de l'écran
      glow.x = app.screen.width * config.x;
      glow.y = app.screen.height * config.y;

      // Appliquer un filtre de flou pour effet de lueur
      const blurFilter = new PIXI.BlurFilter();
      blurFilter.blur = 20;
      glow.filters = [blurFilter];

      // Ajouter au layer d'animation
      animationLayerRef.current.addChild(glow);
      flowerSprites.push(glow);

      // === CRÉER LES TRAITS LUMINEUX AUTOUR (RAYONS) ===
      const rayCount = 8; // Nombre de traits
      const rayLength = config.size * 1.5; // Longueur des traits
      const rayWidth = 3; // Épaisseur des traits

      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 2 / rayCount) * i;

        const ray = new PIXI.Graphics();

        // Dessiner une ligne depuis le centre vers l'extérieur
        const startX = Math.cos(angle) * config.size * 0.6;
        const startY = Math.sin(angle) * config.size * 0.6;
        const endX = Math.cos(angle) * rayLength;
        const endY = Math.sin(angle) * rayLength;

        ray.moveTo(startX, startY);
        ray.lineTo(endX, endY);
        ray.stroke({ width: rayWidth, color: 0xFFFFE0, alpha: 0.6 });

        // Position identique au cercle
        ray.x = app.screen.width * config.x;
        ray.y = app.screen.height * config.y;

        // Filtre de flou pour les traits
        const rayBlur = new PIXI.BlurFilter();
        rayBlur.blur = 8;
        ray.filters = [rayBlur];

        // Ajouter au layer
        animationLayerRef.current.addChild(ray);
        flowerSprites.push(ray);

        // Animation de rotation des traits
        gsap.to(ray, {
          rotation: Math.PI * 2,
          duration: 8 + Math.random() * 4,
          repeat: -1,
          ease: 'none'
        });

        // Animation de l'opacité des traits
        gsap.to(ray, {
          alpha: 0.3,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: Math.random() * 0.5
        });
      }

      // === ANIMATIONS DU CERCLE CENTRAL ===
      const baseAlpha = 0.7;
      const duration = 1.5 + Math.random() * 1;
      const delay = Math.random() * 0.5;

      // Animation de l'opacité (scintillement plus intense)
      gsap.to(glow, {
        alpha: baseAlpha + 0.3, // Monte jusqu'à 1.0 (maximum)
        duration: duration,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: delay
      });

      // Animation de pulsation de la taille
      gsap.to(glow.scale, {
        x: 1.4,
        y: 1.4,
        duration: duration * 1.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: delay
      });

      console.log(`✨ Fleur ${index + 1} créée à (${(config.x * 100).toFixed(0)}%, ${(config.y * 100).toFixed(0)}%) avec ${rayCount} rayons`);
    });

    // Stocker les références
    appRef.current.page3Elements = {
      flowerSprites
    };

    console.log('✅ Fleurs magiques créées:', flowerSprites.length);

    // === AFFICHAGE DU TEXTE NARRATIF PAGE 3 ===
    setTimeout(() => {
      if (currentPageRef.current === 2) {
        setShowPage3Text(true);

        requestAnimationFrame(() => {
          if (page3TextRef.current && currentPageRef.current === 2) {
            gsap.fromTo(
              page3TextRef.current,
              {
                opacity: 0,
                y: 20
              },
              {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: 'power2.out'
              }
            );
          }
        });
      }
    }, 500);
  };

  /**
   * Animation spécifique pour la page 4 : zoom sur le visage + fondu + fleurs scintillantes
   */
  const playPage4Animation = () => {
    const app = appRef.current;
    if (!app || currentPageRef.current !== 3) {
      console.log('❌ Conditions non remplies:', { app: !!app, currentPage: currentPageRef.current });
      return;
    }

    console.log('😔 Démarrage animation page 4 - Zoom + visage triste + fleurs');

    const sprite = spritesRef.current[3]; // Sprite de la page 4
    if (!sprite) return;

    // Sauvegarder la position initiale
    const initialX = sprite.x;
    const initialY = sprite.y;
    const initialScaleX = sprite.scale.x;
    const initialScaleY = sprite.scale.y;

    // Configuration du zoom sur le visage
    // 🎨 AJUSTE CES VALEURS pour cibler le visage dans ton image
    const zoomConfig = {
      targetScale: 1.3,    // Niveau de zoom (1.3 = 130% de la taille)
      offsetX: 100,       // Décalage horizontal (négatif = vers la droite)
      offsetY: 50,         // Décalage vertical (positif = vers le bas)
      duration: 8,         // Durée de l'animation en secondes
      ease: 'power2.inOut' // Type d'easing (smooth)
    };

    console.log('🔍 Zoom progressif sur le visage...');

    // Animation GSAP du zoom progressif
    gsap.to(sprite, {
      x: initialX + zoomConfig.offsetX,
      y: initialY + zoomConfig.offsetY,
      duration: zoomConfig.duration,
      ease: zoomConfig.ease
    });

    gsap.to(sprite.scale, {
      x: initialScaleX * zoomConfig.targetScale,
      y: initialScaleY * zoomConfig.targetScale,
      duration: zoomConfig.duration,
      ease: zoomConfig.ease
    });

    // FORCER la destruction si existe déjà
    if (appRef.current.page4Elements) {
      console.log('⚠️ Éléments page 4 existent déjà, suppression...');
      const { flowerSprites, flowerContainer, faceOverlay, flowerUpdateTicker, tearDrops, tearTimers } = appRef.current.page4Elements;

      // Arrêter le ticker de mise à jour des fleurs
      if (flowerUpdateTicker) {
        app.ticker.remove(flowerUpdateTicker);
      }

      // Arrêter tous les timers de larmes
      if (tearTimers) {
        tearTimers.forEach(timer => clearTimeout(timer) || clearInterval(timer));
      }

      // Supprimer les larmes
      if (tearDrops) {
        tearDrops.forEach(tear => {
          gsap.killTweensOf(tear);
          tear.destroy();
        });
      }

      // Supprimer les animations et sprites des fleurs
      if (flowerSprites) {
        flowerSprites.forEach(sprite => {
          gsap.killTweensOf(sprite);
          gsap.killTweensOf(sprite.scale);
          sprite.destroy();
        });
      }

      // Supprimer le container des fleurs
      if (flowerContainer) {
        flowerContainer.destroy({ children: true });
      }

      // Supprimer l'overlay du visage
      if (faceOverlay) {
        gsap.killTweensOf(faceOverlay);
        animationLayerRef.current.removeChild(faceOverlay);
        faceOverlay.destroy();
      }

      appRef.current.page4Elements = null;
    }

    // === 1. CRÉER UN OVERLAY POUR LE FONDU DU VISAGE ===
    // 🎨 AJUSTE LA POSITION ET LA TAILLE ICI :
    // x: position horizontale (0 = gauche, 0.5 = centre, 1 = droite)
    // y: position verticale (0 = haut, 0.5 = centre, 1 = bas)
    // width/height: taille de la zone qui s'assombrit
    const faceConfig = {
      x: 0.8,      // Position actuelle (ajustée par toi)
      y: 0.4,      // Position actuelle
      width: 600,  // Largeur augmentée pour être plus visible
      height: 700  // Hauteur augmentée
    };

    const faceOverlay = new PIXI.Graphics();
    faceOverlay.rect(
      -faceConfig.width / 2,
      -faceConfig.height / 2,
      faceConfig.width,
      faceConfig.height
    );
    faceOverlay.fill({ color: 0x000000, alpha: 0 }); // Noir transparent au départ

    // Positionner l'overlay
    faceOverlay.x = app.screen.width * faceConfig.x;
    faceOverlay.y = app.screen.height * faceConfig.y;

    // Ajouter un flou pour un effet plus doux et visible
    const faceBlur = new PIXI.BlurFilter();
    faceBlur.blur = 40;
    faceOverlay.filters = [faceBlur];

    // Ajouter au layer d'animation
    animationLayerRef.current.addChild(faceOverlay);

    // Animation de fondu lent BEAUCOUP PLUS VISIBLE
    gsap.to(faceOverlay, {
      alpha: 0.7, // Augmenté de 0.25 à 0.7 pour être BIEN visible
      duration: 3, // Plus rapide (3s au lieu de 4s)
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    console.log('😔 Overlay du visage créé - Position:', `${(faceConfig.x*100).toFixed(0)}%`, `${(faceConfig.y*100).toFixed(0)}%`, '- Alpha max: 0.7');

    // === 2. CRÉER L'EFFET DE LARMES ===
    // 🎨 AJUSTE LA POSITION DE DÉPART DES LARMES ICI :
    const tearConfig = {
      x: 0.36,        // Position horizontale de départ (0 = gauche, 1 = droite)
      y: 0.52,        // Position verticale de départ (0 = haut, 1 = bas)
      count: 2,       // Nombre de larmes simultanées
      delayBetween: 2 // Délai en secondes entre chaque larme
    };

    const tearDrops = [];

    // Fonction pour créer une larme
    const createTear = (index) => {
      const tear = new PIXI.Graphics();

      // Dessiner une goutte (forme de larme)
      tear.moveTo(0, 0);
      tear.bezierCurveTo(5, 0, 8, 5, 8, 10);
      tear.lineTo(8, 15);
      tear.bezierCurveTo(8, 18, 5, 20, 0, 20);
      tear.bezierCurveTo(-5, 20, -8, 18, -8, 15);
      tear.lineTo(-8, 10);
      tear.bezierCurveTo(-8, 5, -5, 0, 0, 0);
      tear.fill({ color: 0x87CEEB, alpha: 0.7 }); // Bleu clair transparent

      // Position initiale relative au sprite
      const startX = sprite.x + (tearConfig.x - 0.5) * sprite.texture.width * sprite.scale.x;
      const startY = sprite.y + (tearConfig.y - 0.5) * sprite.texture.height * sprite.scale.y;

      tear.x = startX + (Math.random() - 0.5) * 30; // Légère variation horizontale
      tear.y = startY;
      tear.alpha = 0;

      // Ajouter un filtre de flou pour effet brillant
      const tearBlur = new PIXI.BlurFilter();
      tearBlur.blur = 3;
      tear.filters = [tearBlur];

      animationLayerRef.current.addChild(tear);
      tearDrops.push(tear);

      // Animation de la larme qui tombe
      const fallDistance = 200; // Distance de chute en pixels
      const duration = 3 + Math.random() * 2; // Durée entre 3 et 5 secondes

      gsap.fromTo(tear,
        { alpha: 0, y: startY },
        {
          alpha: 0.7,
          duration: 0.5,
          ease: 'power2.out'
        }
      );

      gsap.to(tear, {
        y: startY + fallDistance,
        duration: duration,
        ease: 'sine.in',
        delay: 0.3,
        onUpdate: () => {
          // Mettre à jour la position en fonction du zoom du sprite
          const currentStartX = sprite.x + (tearConfig.x - 0.5) * sprite.texture.width * sprite.scale.x;
          tear.x = currentStartX + (Math.random() - 0.5) * 5; // Légère ondulation
        },
        onComplete: () => {
          // Faire disparaître la larme
          gsap.to(tear, {
            alpha: 0,
            duration: 0.3,
            onComplete: () => {
              tear.destroy();
              const idx = tearDrops.indexOf(tear);
              if (idx > -1) tearDrops.splice(idx, 1);
            }
          });
        }
      });
    };

    // Créer les larmes avec un délai entre chacune
    let tearTimers = [];
    for (let i = 0; i < tearConfig.count; i++) {
      const timer = setTimeout(() => {
        if (currentPageRef.current === 3) {
          createTear(i);

          // Répéter la création de larmes toutes les 4-6 secondes
          const repeatInterval = setInterval(() => {
            if (currentPageRef.current === 3) {
              createTear(i);
            } else {
              clearInterval(repeatInterval);
            }
          }, (4 + Math.random() * 2) * 1000);

          tearTimers.push(repeatInterval);
        }
      }, i * tearConfig.delayBetween * 1000);

      tearTimers.push(timer);
    }

    console.log('💧 Effet de larmes créé - Position:', `${(tearConfig.x*100).toFixed(0)}%`, `${(tearConfig.y*100).toFixed(0)}%`);

    // === 3. CRÉER LES FLEURS SCINTILLANTES (fixes avec le zoom) ===
    const flowerSprites = [];

    // Créer un container pour les fleurs qui suivra le zoom du sprite
    const flowerContainer = new PIXI.Container();
    sprite.parent.addChild(flowerContainer);

    const flowerPositions = [
      { x: 0.25, y: 0.56, size: 35 },   // Fleur 1
      { x: 0.48, y: 0.58, size: 50 },   // Fleur 2
      { x: 0.75, y: 0.56, size: 48 },  // Fleur 3
    ];

    flowerPositions.forEach((config, index) => {
      // === CRÉER LE CERCLE CENTRAL LUMINEUX ===
      const glow = new PIXI.Graphics();
      glow.circle(0, 0, config.size);
      glow.fill({ color: 0xFFFFE0, alpha: 0.5 });

      // Position relative au sprite (pas à l'écran)
      glow.x = sprite.x + (config.x - 0.5) * sprite.texture.width * sprite.scale.x;
      glow.y = sprite.y + (config.y - 0.5) * sprite.texture.height * sprite.scale.y;

      const blurFilter = new PIXI.BlurFilter();
      blurFilter.blur = 20;
      glow.filters = [blurFilter];

      flowerContainer.addChild(glow);
      flowerSprites.push(glow);

      // === CRÉER LES TRAITS LUMINEUX AUTOUR (RAYONS) ===
      const rayCount = 8;
      const rayLength = config.size * 1.5;
      const rayWidth = 3;

      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 2 / rayCount) * i;

        const ray = new PIXI.Graphics();

        const startX = Math.cos(angle) * config.size * 0.6;
        const startY = Math.sin(angle) * config.size * 0.6;
        const endX = Math.cos(angle) * rayLength;
        const endY = Math.sin(angle) * rayLength;

        ray.moveTo(startX, startY);
        ray.lineTo(endX, endY);
        ray.stroke({ width: rayWidth, color: 0xFFFFE0, alpha: 0.6 });

        // Position relative au sprite (pas à l'écran)
        ray.x = sprite.x + (config.x - 0.5) * sprite.texture.width * sprite.scale.x;
        ray.y = sprite.y + (config.y - 0.5) * sprite.texture.height * sprite.scale.y;

        const rayBlur = new PIXI.BlurFilter();
        rayBlur.blur = 8;
        ray.filters = [rayBlur];

        flowerContainer.addChild(ray);
        flowerSprites.push(ray);

        // Animation de rotation
        gsap.to(ray, {
          rotation: Math.PI * 2,
          duration: 8 + Math.random() * 4,
          repeat: -1,
          ease: 'none'
        });

        // Animation de l'opacité
        gsap.to(ray, {
          alpha: 0.3,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: Math.random() * 0.5
        });
      }

      // === ANIMATIONS DU CERCLE CENTRAL ===
      const baseAlpha = 0.7;
      const duration = 1.5 + Math.random() * 1;
      const delay = Math.random() * 0.5;

      gsap.to(glow, {
        alpha: baseAlpha + 0.3,
        duration: duration,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: delay
      });

      gsap.to(glow.scale, {
        x: 1.4,
        y: 1.4,
        duration: duration * 1.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: delay
      });

      console.log(`✨ Fleur ${index + 1} créée à (${(config.x * 100).toFixed(0)}%, ${(config.y * 100).toFixed(0)}%)`);
    });

    // Fonction pour mettre à jour la position des fleurs en fonction du zoom
    const updateFlowerPositions = () => {
      flowerSprites.forEach((element, idx) => {
        const configIdx = Math.floor(idx / 9); // 9 éléments par fleur (1 cercle + 8 rayons)
        const config = flowerPositions[configIdx];

        element.x = sprite.x + (config.x - 0.5) * sprite.texture.width * sprite.scale.x;
        element.y = sprite.y + (config.y - 0.5) * sprite.texture.height * sprite.scale.y;
      });
    };

    // Mettre à jour les positions des fleurs pendant le zoom
    const flowerUpdateTicker = () => {
      updateFlowerPositions();
    };
    app.ticker.add(flowerUpdateTicker);

    // Stocker les références
    appRef.current.page4Elements = {
      flowerSprites,
      flowerContainer,
      faceOverlay,
      flowerUpdateTicker,
      tearDrops,
      tearTimers
    };

    console.log('✅ Page 4 complète: visage + larmes + fleurs créés (fleurs fixes avec le zoom)');

    // === AFFICHAGE DU TEXTE NARRATIF PAGE 4 ===
    setTimeout(() => {
      if (currentPageRef.current === 3) {
        setShowPage4Text(true);

        requestAnimationFrame(() => {
          if (page4TextRef.current && currentPageRef.current === 3) {
            gsap.fromTo(
              page4TextRef.current,
              {
                opacity: 0,
                y: 20
              },
              {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: 'power2.out'
              }
            );
          }
        });
      }
    }, 500);
  };

  /**
   * Animation spécifique pour la page 7 : apparition de la magicienne + texte narratif
   */
  const playPage7Animation = () => {
    const app = appRef.current;
    if (!app || currentPageRef.current !== 6) {
      console.log('❌ Conditions non remplies:', { app: !!app, currentPage: currentPageRef.current });
      return;
    }

    console.log('🧙‍♀️ Démarrage animation page 7 - Apparition de la magicienne');

    // FORCER la destruction si existe déjà
    if (appRef.current.page7Elements) {
      console.log('⚠️ Éléments page 7 existent déjà, suppression...');
      const { witchSprite, witchUpdateTicker, clouds, lightnings, lightningInterval } = appRef.current.page7Elements;

      // Arrêter le ticker
      if (witchUpdateTicker) {
        app.ticker.remove(witchUpdateTicker);
      }

      // Arrêter l'intervalle des éclairs
      if (lightningInterval) {
        clearInterval(lightningInterval);
      }

      // Supprimer les nuages
      if (clouds) {
        clouds.forEach(cloud => {
          gsap.killTweensOf(cloud);
          cloud.destroy();
        });
      }

      // Supprimer les éclairs
      if (lightnings) {
        lightnings.forEach(lightning => {
          gsap.killTweensOf(lightning);
          lightning.destroy();
        });
      }

      // Supprimer l'animation et le sprite
      if (witchSprite) {
        gsap.killTweensOf(witchSprite);
        gsap.killTweensOf(witchSprite.scale);
        witchSprite.destroy();
      }

      appRef.current.page7Elements = null;
    }

    // === CHARGEMENT ET APPARITION DE LA MAGICIENNE ===
    const loadWitch = async () => {
      try {
        // Charger l'image de la sorcière
        const witchTexture = await PIXI.Assets.load('/assets/images/sorciere1.png');
        const witchSprite = new PIXI.Sprite(witchTexture);

        // Configuration initiale
        witchSprite.anchor.set(0.5);
        witchSprite.alpha = 0; // Invisible au départ

        // 🎨 CONFIGURATION DE LA POSITION (en pourcentages pour rester fixe en responsive)
        const witchConfig = {
          xPercent: 0.63,     // Position X (0 = gauche, 0.5 = centre, 1 = droite)
          yPercent: 0.73,     // Position Y (0 = haut, 0.5 = centre, 1 = bas)
          heightPercent: 0.65 // Taille (0.3 = petit, 0.5 = moyen, 0.7 = grand)
        };

        // Appliquer la position
        witchSprite.x = app.screen.width * witchConfig.xPercent;
        witchSprite.y = app.screen.height * witchConfig.yPercent;

        // Ajuster l'échelle
        const targetHeight = app.screen.height * witchConfig.heightPercent;
        const scale = targetHeight / witchSprite.height;
        witchSprite.scale.set(scale);

        // Ajouter au layer d'animation
        animationLayerRef.current.addChild(witchSprite);

        // Animation d'apparition après 0.5s
        gsap.to(witchSprite, {
          alpha: 1,
          duration: 1,
          ease: 'power2.out',
          delay: 0.5
        });

        // Créer un ticker pour mettre à jour la position en temps réel
        const witchUpdateTicker = () => {
          if (!witchSprite || !witchSprite.destroyed) {
            witchSprite.x = app.screen.width * witchConfig.xPercent;
            witchSprite.y = app.screen.height * witchConfig.yPercent;

            const targetHeight = app.screen.height * witchConfig.heightPercent;
            const scale = targetHeight / witchSprite.texture.height;
            witchSprite.scale.set(scale);
          }
        };

        app.ticker.add(witchUpdateTicker);

        // Stocker la référence temporaire (sera complétée après les nuages)
        appRef.current.page7Elements = {
          witchSprite,
          witchConfig,
          witchUpdateTicker,
          clouds: [],
          lightnings: []
        };

        console.log('✅ Magicienne créée et apparition lancée');

        // Créer les nuages et éclairs après l'apparition de la magicienne
        setTimeout(() => {
          if (currentPageRef.current === 6) {
            createCloudsAndLightning();
          }
        }, 1500); // 1.5s après (0.5s délai + 1s apparition)

      } catch (error) {
        console.error('❌ Erreur lors du chargement de la sorcière:', error);
      }
    };

    loadWitch();

    // === FONCTION POUR CRÉER LES NUAGES ET ÉCLAIRS ===
    const createCloudsAndLightning = () => {
      if (!appRef.current || !appRef.current.page7Elements) return;

      console.log('⛈️ Création des nuages et éclairs');

      const clouds = [];
      const lightnings = [];

      // === CRÉER LES NUAGES SOMBRES ===
      const cloudCount = 20; // Nombre de nuages (augmenté de 5 à 10)

      for (let i = 0; i < cloudCount; i++) {
        const cloud = new PIXI.Graphics();

        // Créer une forme de nuage (plusieurs cercles qui se chevauchent)
        const cloudWidth = 150 + Math.random() * 100;
        const cloudHeight = 60 + Math.random() * 40;
        const circleCount = 5 + Math.floor(Math.random() * 3);

        for (let j = 0; j < circleCount; j++) {
          const radius = cloudHeight / 2 + Math.random() * 20;
          const offsetX = (j / circleCount) * cloudWidth - cloudWidth / 2;
          const offsetY = Math.random() * 10 - 5;

          cloud.circle(offsetX, offsetY, radius);
        }

        // Couleur sombre avec transparence
        cloud.fill({ color: 0x2a2a2a, alpha: 0.7 });

        // Position éparpillée sur TOUTE la largeur et plus en hauteur
        cloud.x = Math.random() * app.screen.width; // De 0% à 100% (toute la largeur)
        cloud.y = Math.random() * 0.3 * app.screen.height; // Dans les 30% du haut (au lieu de 15%)
        cloud.alpha = 0; // Invisible au départ

        // Ajouter un flou pour effet réaliste
        const blurFilter = new PIXI.BlurFilter();
        blurFilter.blur = 15;
        cloud.filters = [blurFilter];

        animationLayerRef.current.addChild(cloud);
        clouds.push(cloud);

        // Animation d'apparition progressive
        gsap.to(cloud, {
          alpha: 0.8,
          duration: 1.5,
          ease: 'power2.out',
          delay: i * 0.2 // Décalage entre chaque nuage
        });

        // Animation de mouvement lent horizontal
        gsap.to(cloud, {
          x: cloud.x + (Math.random() - 0.5) * 100,
          duration: 8 + Math.random() * 4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      }

      // === CRÉER LES ÉCLAIRS ===
      const createLightning = () => {
        if (currentPageRef.current !== 6) return;

        const lightning = new PIXI.Graphics();

        // Position de départ (dans un nuage aléatoire)
        const startX = Math.random() * app.screen.width;
        const startY = Math.random() * 0.2 * app.screen.height;

        // Dessiner un éclair en zigzag
        let currentX = startX;
        let currentY = startY;
        const segments = 8 + Math.floor(Math.random() * 5); // Nombre de segments

        lightning.moveTo(currentX, currentY);

        for (let i = 0; i < segments; i++) {
          currentX += (Math.random() - 0.5) * 60;
          currentY += (app.screen.height * 0.4) / segments;

          lightning.lineTo(currentX, currentY);
        }

        // Style de l'éclair
        lightning.stroke({ width: 3 + Math.random() * 2, color: 0xFFFFFF, alpha: 1 });

        // Effet de lueur
        const glowFilter = new PIXI.BlurFilter();
        glowFilter.blur = 5;
        lightning.filters = [glowFilter];

        animationLayerRef.current.addChild(lightning);
        lightnings.push(lightning);

        // Animation de l'éclair (flash rapide)
        gsap.fromTo(lightning,
          { alpha: 1 },
          {
            alpha: 0,
            duration: 0.1,
            repeat: 2,
            yoyo: true,
            onComplete: () => {
              // Supprimer l'éclair après l'animation
              animationLayerRef.current.removeChild(lightning);
              lightning.destroy();
              const idx = lightnings.indexOf(lightning);
              if (idx > -1) lightnings.splice(idx, 1);
            }
          }
        );
      };

      // Créer des éclairs aléatoirement
      const lightningInterval = setInterval(() => {
        if (currentPageRef.current === 6) {
          createLightning();
        } else {
          clearInterval(lightningInterval);
        }
      }, 2000 + Math.random() * 3000); // Entre 2 et 5 secondes

      // Mettre à jour la référence
      appRef.current.page7Elements.clouds = clouds;
      appRef.current.page7Elements.lightnings = lightnings;
      appRef.current.page7Elements.lightningInterval = lightningInterval;

      console.log('✅ Nuages et éclairs créés');
    };

    // === AFFICHAGE DU TEXTE NARRATIF PAGE 7 ===
    setTimeout(() => {
      if (currentPageRef.current === 6) {
        setShowPage7Text(true);

        requestAnimationFrame(() => {
          if (page7TextRef.current && currentPageRef.current === 6) {
            gsap.fromTo(
              page7TextRef.current,
              {
                opacity: 0,
                y: 20
              },
              {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: 'power2.out'
              }
            );
          }
        });
      }
    }, 500);
  };

  /**
   * Animation spécifique pour la page 8 : zoom dramatique sur le visage + texte narratif
   */
  const playPage8Animation = () => {
    const app = appRef.current;
    if (!app || currentPageRef.current !== 7) {
      console.log('❌ Conditions non remplies:', { app: !!app, currentPage: currentPageRef.current });
      return;
    }

    console.log('😰 Démarrage animation page 8 - Zoom dramatique + tension');

    const sprite = spritesRef.current[7]; // Sprite de la page 8
    if (!sprite) return;

    // Sauvegarder la position initiale
    const initialX = sprite.x;
    const initialY = sprite.y;
    const initialScaleX = sprite.scale.x;
    const initialScaleY = sprite.scale.y;

    // Configuration du zoom sur le visage du mari
    // 🎨 AJUSTE CES VALEURS pour cibler le visage dans ton image
    const zoomConfig = {
      targetScale: 1.4,    // Niveau de zoom intense (1.4 = 140%)
      offsetX: 80,        // Décalage horizontal
      offsetY: 0,          // Décalage vertical
      duration: 10,        // Durée du zoom lent (10 secondes)
      ease: 'power2.inOut' // Easing smooth
    };

    console.log('🔍 Zoom dramatique sur le visage du mari...');

    // Animation GSAP du zoom progressif
    gsap.to(sprite, {
      x: initialX + zoomConfig.offsetX,
      y: initialY + zoomConfig.offsetY,
      duration: zoomConfig.duration,
      ease: zoomConfig.ease
    });

    gsap.to(sprite.scale, {
      x: initialScaleX * zoomConfig.targetScale,
      y: initialScaleY * zoomConfig.targetScale,
      duration: zoomConfig.duration,
      ease: zoomConfig.ease,
      onComplete: () => {
        // Après le zoom, ajouter des tremblements légers pour la tension
        console.log('😨 Ajout de tremblements pour la tension...');

        // Tremblements subtils répétés
        gsap.to(sprite, {
          x: sprite.x + (Math.random() - 0.5) * 6,
          y: sprite.y + (Math.random() - 0.5) * 6,
          duration: 0.08,
          repeat: -1,
          yoyo: true,
          ease: 'none'
        });

        // === CRÉER L'EFFET DE BRILLANCE VIOLET MAGIQUE ===
        console.log('✨ Création de la brillance violette magique...');
        createMagicGlow();
      }
    });

    // Fonction pour créer l'effet de brillance violet avec rayons
    const createMagicGlow = () => {
      if (currentPageRef.current !== 7 || !appRef.current) return;

      const glowSprites = [];

      // 🎨 CONFIGURATION DE LA POSITION DE LA BRILLANCE
      // Position du pacte magique (centre de l'écran ou position spécifique)
      const glowConfig = {
        x: 0.54,      // Position X (0 = gauche, 0.5 = centre, 1 = droite)
        y: 0.30,      // Position Y (0 = haut, 0.5 = centre, 1 = bas)
        size: 80     // Taille du halo
      };

      // === CRÉER LE CERCLE CENTRAL VIOLET LUMINEUX ===
      const glow = new PIXI.Graphics();
      glow.circle(0, 0, glowConfig.size);
      glow.fill({ color: 0x9B30FF, alpha: 0.6 }); // Violet magique

      // Position
      glow.x = app.screen.width * glowConfig.x;
      glow.y = app.screen.height * glowConfig.y;

      // Appliquer un filtre de flou pour effet de lueur
      const blurFilter = new PIXI.BlurFilter();
      blurFilter.blur = 25;
      glow.filters = [blurFilter];

      // Ajouter au layer d'animation
      animationLayerRef.current.addChild(glow);
      glowSprites.push(glow);

      // === CRÉER LES TRAITS LUMINEUX VIOLETS AUTOUR (RAYONS) ===
      const rayCount = 12; // Nombre de traits
      const rayLength = glowConfig.size * 2; // Longueur des traits
      const rayWidth = 3; // Épaisseur des traits

      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 2 / rayCount) * i;

        const ray = new PIXI.Graphics();

        // Dessiner une ligne depuis le centre vers l'extérieur
        const startX = Math.cos(angle) * glowConfig.size * 0.7;
        const startY = Math.sin(angle) * glowConfig.size * 0.7;
        const endX = Math.cos(angle) * rayLength;
        const endY = Math.sin(angle) * rayLength;

        ray.moveTo(startX, startY);
        ray.lineTo(endX, endY);
        ray.stroke({ width: rayWidth, color: 0x9B30FF, alpha: 0.8 });

        // Position identique au cercle
        ray.x = app.screen.width * glowConfig.x;
        ray.y = app.screen.height * glowConfig.y;

        // Filtre de flou pour les traits
        const rayBlur = new PIXI.BlurFilter();
        rayBlur.blur = 10;
        ray.filters = [rayBlur];

        // Ajouter au layer
        animationLayerRef.current.addChild(ray);
        glowSprites.push(ray);

        // Animation de rotation des traits
        gsap.to(ray, {
          rotation: Math.PI * 2,
          duration: 6 + Math.random() * 3,
          repeat: -1,
          ease: 'none'
        });

        // Animation de l'opacité des traits (scintillement)
        gsap.to(ray, {
          alpha: 0.3,
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: Math.random() * 0.5
        });
      }

      // === ANIMATIONS DU CERCLE CENTRAL ===
      // Animation de l'opacité (scintillement intense)
      gsap.to(glow, {
        alpha: 0.9,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      // Animation de pulsation de la taille
      gsap.to(glow.scale, {
        x: 1.5,
        y: 1.5,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      // Stocker les références pour nettoyage
      appRef.current.page8MagicGlow = glowSprites;

      console.log('✨ Brillance violette créée avec', rayCount, 'rayons magiques');
    };

    // === AFFICHAGE DU TEXTE NARRATIF PAGE 8 ===
    setTimeout(() => {
      if (currentPageRef.current === 7) {
        setShowPage8Text(true);

        requestAnimationFrame(() => {
          if (page8TextRef.current && currentPageRef.current === 7) {
            gsap.fromTo(
              page8TextRef.current,
              {
                opacity: 0,
                y: 20
              },
              {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: 'power2.out'
              }
            );
          }
        });
      }
    }, 500);
  };

  /**
   * Animation spécifique pour la page 9 : zoom rapide + transition automatique vers page 10
   */
  const playPage9Animation = () => {
    const app = appRef.current;
    if (!app || currentPageRef.current !== 8) {
      console.log('❌ Conditions non remplies:', { app: !!app, currentPage: currentPageRef.current });
      return;
    }

    console.log('🏰 Démarrage animation page 9 - Zoom rapide + transition automatique');

    const sprite = spritesRef.current[8]; // Sprite de la page 9
    if (!sprite) return;

    // Sauvegarder la position initiale
    const initialX = sprite.x;
    const initialY = sprite.y;
    const initialScaleX = sprite.scale.x;
    const initialScaleY = sprite.scale.y;

    // Configuration du zoom rapide
    const zoomConfig = {
      targetScale: 2.0,    // Zoom intense (200%)
      offsetX: -500,          // Décalage horizontal
      offsetY: 0,          // Décalage vertical
      duration: 1.7,       // Durée rapide (1.5 secondes)
      ease: 'power2.in'    // Easing rapide
    };

    console.log('🔍 Attente de 5 secondes avant le zoom rapide...');

    // Attendre 5 secondes avant de lancer le zoom
    setTimeout(() => {
      if (currentPageRef.current !== 8) return; // Sécurité si on a changé de page

      console.log('🔍 Démarrage du zoom rapide...');

      // Animation GSAP du zoom rapide
      gsap.to(sprite, {
        x: initialX + zoomConfig.offsetX,
        y: initialY + zoomConfig.offsetY,
        duration: zoomConfig.duration,
        ease: zoomConfig.ease
      });

      gsap.to(sprite.scale, {
        x: initialScaleX * zoomConfig.targetScale,
        y: initialScaleY * zoomConfig.targetScale,
        duration: zoomConfig.duration,
        ease: zoomConfig.ease,
        onComplete: () => {
          // Après le zoom, transition automatique vers la page 10
          console.log('➡️ Transition automatique vers la page 10...');
          setTimeout(() => {
            if (currentPageRef.current === 8) {
              goToPage(9); // Aller à la page 10 (index 9)
            }
          }, 200); // Court délai avant la transition
        
        }
      });
    }, 9000); // Délai de 5 secondes avant le zoom

    // === AFFICHAGE DU TEXTE NARRATIF PAGE 9 ===
    setTimeout(() => {
      if (currentPageRef.current === 8) {
        setShowPage9Text(true);

        requestAnimationFrame(() => {
          if (page9TextRef.current && currentPageRef.current === 8) {
            gsap.fromTo(
              page9TextRef.current,
              {
                opacity: 0,
                y: 20
              },
              {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: 'power2.out'
              }
            );
          }
        });
      }
    }, 100); // Affichage rapide du texte (0.1s)
  };

  /**
   * Animation spécifique pour la page 10 : nuages clairs + oiseaux volants + texte narratif
   */
  const playPage10Animation = () => {
    const app = appRef.current;
    if (!app || currentPageRef.current !== 9) {
      console.log('❌ Conditions non remplies:', { app: !!app, currentPage: currentPageRef.current });
      return;
    }

    console.log('🌤️ Démarrage animation page 10 - Nuages clairs et oiseaux');

    // FORCER la destruction si existe déjà
    if (appRef.current.page10Elements) {
      console.log('⚠️ Éléments page 10 existent déjà, suppression...');
      const { clouds, birds, birdInterval } = appRef.current.page10Elements;

      // Arrêter l'intervalle des oiseaux
      if (birdInterval) {
        clearInterval(birdInterval);
      }

      // Supprimer les nuages
      if (clouds) {
        clouds.forEach(cloud => {
          gsap.killTweensOf(cloud);
          cloud.destroy();
        });
      }

      // Supprimer les oiseaux
      if (birds) {
        birds.forEach(bird => {
          gsap.killTweensOf(bird);
          bird.destroy();
        });
      }

      appRef.current.page10Elements = null;
    }

    const clouds = [];
    const birds = [];

    // === CRÉER LES NUAGES CLAIRS ===
    const cloudCount = 20; // Nombre de nuages

    for (let i = 0; i < cloudCount; i++) {
      const cloud = new PIXI.Graphics();

      // Créer une forme de nuage (plusieurs cercles qui se chevauchent)
      const cloudWidth = 120 + Math.random() * 80;
      const cloudHeight = 50 + Math.random() * 30;
      const circleCount = 4 + Math.floor(Math.random() * 3);

      for (let j = 0; j < circleCount; j++) {
        const radius = cloudHeight / 2 + Math.random() * 15;
        const offsetX = (j / circleCount) * cloudWidth - cloudWidth / 2;
        const offsetY = Math.random() * 8 - 4;

        cloud.circle(offsetX, offsetY, radius);
      }

      // Couleur claire (blanc/gris très clair)
      cloud.fill({ color: 0xFFFFFF, alpha: 0.5 }); // Blanc transparent

      // Position éparpillée en haut de l'écran
      cloud.x = Math.random() * app.screen.width;
      cloud.y = Math.random() * 0.35 * app.screen.height; // Dans les 25% du haut
      cloud.alpha = 0; // Invisible au départ

      // Ajouter un flou pour effet réaliste
      const blurFilter = new PIXI.BlurFilter();
      blurFilter.blur = 12;
      cloud.filters = [blurFilter];

      animationLayerRef.current.addChild(cloud);
      clouds.push(cloud);

      // Animation d'apparition progressive
      gsap.to(cloud, {
        alpha: 0.6,
        duration: 2,
        ease: 'power2.out',
        delay: i * 0.15
      });

      // Animation de mouvement lent horizontal
      gsap.to(cloud, {
        x: cloud.x + (Math.random() - 0.5) * 150,
        duration: 12 + Math.random() * 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }

    console.log('☁️ Nuages clairs créés:', cloudCount);

    // === CRÉER LES OISEAUX (avec spritesheet oiseau1.png) ===
    const createBird = async () => {
      if (currentPageRef.current !== 9) return;

      try {
        // Charger le spritesheet de l'oiseau
        const birdTexture = await PIXI.Assets.load('/assets/images/oiseau1.png');
        const bird = new PIXI.Sprite(birdTexture);

        // Configuration initiale
        bird.anchor.set(0.5);
        bird.alpha = 0;

        // Taille de l'oiseau (augmentée)
        const scale = 0.3 + Math.random() * 0.15; // Échelle entre 0.3 et 0.45 (beaucoup plus grand)
        bird.scale.set(scale);

        // Position de départ (à GAUCHE de l'écran, position Y aléatoire)
        bird.x = -50; // Juste à gauche de l'écran
        bird.y = Math.random() * app.screen.height * 0.6 + app.screen.height * 0.2; // Entre 20% et 80% de la hauteur

        animationLayerRef.current.addChild(bird);
        birds.push(bird);

        // Position cible (à DROITE de l'écran)
        const targetX = app.screen.width + 50; // À droite de l'écran
        const duration = 5 + Math.random() * 3; // Durée du vol (5-8 secondes)

        console.log('🕊️ Oiseau créé et envol lancé (gauche → droite)');

        // Animation d'apparition
        gsap.to(bird, {
          alpha: 0.8,
          duration: 0.5,
          ease: 'power2.out'
        });

        // Animation de vol horizontal (droite vers gauche)
        gsap.to(bird, {
          x: targetX,
          duration: duration,
          ease: 'none',
          onUpdate: () => {
            // Petit mouvement vertical pour simuler le battement d'ailes
            bird.y += Math.sin(bird.x * 0.02) * 0.5;
          },
          onComplete: () => {
            // Faire disparaître l'oiseau
            gsap.to(bird, {
              alpha: 0,
              duration: 0.3,
              onComplete: () => {
                if (bird.parent) {
                  animationLayerRef.current.removeChild(bird);
                }
                bird.destroy();
                const idx = birds.indexOf(bird);
                if (idx > -1) birds.splice(idx, 1);
              }
            });
          }
        });
      } catch (error) {
        console.error('❌ Erreur lors du chargement du spritesheet oiseau:', error);
      }
    };

    // Créer des oiseaux régulièrement
    const birdInterval = setInterval(() => {
      if (currentPageRef.current === 9) {
        createBird();
      } else {
        clearInterval(birdInterval);
      }
    }, 3000 + Math.random() * 4000); // Entre 3 et 7 secondes

    // Créer le premier oiseau après 1 seconde
    setTimeout(() => {
      if (currentPageRef.current === 9) {
        createBird();
      }
    }, 1000);

    // Stocker les références
    appRef.current.page10Elements = {
      clouds,
      birds,
      birdInterval
    };

    console.log('✅ Animation page 10 créée: nuages et oiseaux');

    // === AFFICHAGE DU TEXTE NARRATIF PAGE 10 ===
    setTimeout(() => {
      if (currentPageRef.current === 9) {
        setShowPage10Text(true);

        requestAnimationFrame(() => {
          if (page10TextRef.current && currentPageRef.current === 9) {
            gsap.fromTo(
              page10TextRef.current,
              {
                opacity: 0,
                y: 20
              },
              {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: 'power2.out'
              }
            );
          }
        });
      }
    }, 500);
  };

  /**
   * Animation spécifique pour la page 11 : notes de musique + particules dorées pour cheveux
   */
  const playPage11Animation = () => {
    const app = appRef.current;
    if (!app || currentPageRef.current !== 10) {
      console.log('❌ Conditions non remplies:', { app: !!app, currentPage: currentPageRef.current });
      return;
    }

    console.log('🎵 Démarrage animation page 11 - Notes de musique + particules dorées');

    // FORCER la destruction si existe déjà
    if (appRef.current.page11Elements) {
      console.log('⚠️ Éléments page 11 existent déjà, suppression...');
      const { musicNotes, goldenParticles, musicInterval, particleInterval } = appRef.current.page11Elements;

      // Arrêter les intervalles
      if (musicInterval) clearInterval(musicInterval);
      if (particleInterval) clearInterval(particleInterval);

      // Supprimer les notes
      if (musicNotes) {
        musicNotes.forEach(note => {
          gsap.killTweensOf(note);
          if (note.parent) animationLayerRef.current.removeChild(note);
          note.destroy();
        });
      }

      // Supprimer les particules
      if (goldenParticles) {
        goldenParticles.forEach(particle => {
          gsap.killTweensOf(particle);
          if (particle.parent) animationLayerRef.current.removeChild(particle);
          particle.destroy();
        });
      }

      appRef.current.page11Elements = null;
    }

    const musicNotes = [];
    const goldenParticles = [];

    // === CRÉER LES NOTES DE MUSIQUE ===
    const createMusicNote = () => {
      if (currentPageRef.current !== 10) return;

      const note = new PIXI.Graphics();

      // Symbole de note de musique (cercle + barre)
      // Cercle de la note
      note.circle(0, 0, 12);
      note.fill({ color: 0x000000, alpha: 0.8 });

      // Barre de la note
      note.rect(10, -30, 3, 30);
      note.fill({ color: 0x000000, alpha: 0.8 });

      // 🎨 POSITION DE DÉPART DES NOTES (bouche de Raiponce)
      // Tu pourras ajuster ces valeurs selon la position du visage
      const startConfig = {
        x: 0.50,  // Position X (0 = gauche, 1 = droite)
        y: 0.35   // Position Y (0 = haut, 1 = bas)
      };

      note.x = app.screen.width * startConfig.x;
      note.y = app.screen.height * startConfig.y;
      note.alpha = 0;

      // Taille aléatoire
      const scale = 0.8 + Math.random() * 0.4;
      note.scale.set(scale);

      animationLayerRef.current.addChild(note);
      musicNotes.push(note);

      // Animation de la note (monte en flottant)
      const targetY = note.y - 150 - Math.random() * 100;
      const targetX = note.x + (Math.random() - 0.5) * 100;
      const duration = 2 + Math.random() * 1.5;

      // Apparition
      gsap.to(note, {
        alpha: 0.8,
        duration: 0.3,
        ease: 'power2.out'
      });

      // Rotation douce
      gsap.to(note, {
        rotation: (Math.random() - 0.5) * 0.5,
        duration: duration,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });

      // Mouvement vertical et horizontal
      gsap.to(note, {
        x: targetX,
        y: targetY,
        duration: duration,
        ease: 'power1.out',
        onComplete: () => {
          // Disparition
          gsap.to(note, {
            alpha: 0,
            duration: 0.5,
            onComplete: () => {
              if (note.parent) animationLayerRef.current.removeChild(note);
              note.destroy();
              const idx = musicNotes.indexOf(note);
              if (idx > -1) musicNotes.splice(idx, 1);
            }
          });
        }
      });

      console.log('🎵 Note de musique créée');
    };

    // === CRÉER LES PARTICULES DORÉES (pour les cheveux) ===
    const createGoldenParticle = () => {
      if (currentPageRef.current !== 10) return;

      const particle = new PIXI.Graphics();

      // Particule dorée scintillante (étoile ou cercle)
      const type = Math.random() > 0.5 ? 'star' : 'circle';

      if (type === 'circle') {
        // Cercle doré
        particle.circle(0, 0, 3 + Math.random() * 4);
        particle.fill({ color: 0xFFD700, alpha: 0.9 }); // Or
      } else {
        // Étoile à 4 branches
        const size = 8 + Math.random() * 6;
        particle.moveTo(0, -size);
        particle.lineTo(size * 0.3, 0);
        particle.lineTo(size, 0);
        particle.lineTo(size * 0.3, size * 0.3);
        particle.lineTo(0, size);
        particle.lineTo(-size * 0.3, size * 0.3);
        particle.lineTo(-size, 0);
        particle.lineTo(-size * 0.3, 0);
        particle.closePath();
        particle.fill({ color: 0xFFD700, alpha: 0.9 });
      }

      // 🎨 POSITION DES PARTICULES DORÉES (cheveux de Raiponce)
      // Tu pourras ajuster ces valeurs selon la position des cheveux
      const hairConfig = {
        x: 0.50,  // Position X centrale
        y: 0.35,  // Position Y (haut de la tête)
        spread: 0.05  // Étalement horizontal (réduit pour être plus concentré)
      };

      particle.x = app.screen.width * (hairConfig.x + (Math.random() - 0.5) * hairConfig.spread);
      particle.y = app.screen.height * hairConfig.y + Math.random() * 40; // Réduit de 100 à 40 pour concentration verticale
      particle.alpha = 0;

      // Ajouter un flou pour effet brillant
      const blurFilter = new PIXI.BlurFilter();
      blurFilter.blur = 3;
      particle.filters = [blurFilter];

      animationLayerRef.current.addChild(particle);
      goldenParticles.push(particle);

      // Animation de la particule (monte doucement en scintillant)
      const targetY = particle.y - 80 - Math.random() * 60;
      const duration = 2 + Math.random() * 1.5;

      // Apparition
      gsap.to(particle, {
        alpha: 0.9,
        duration: 0.3,
        ease: 'power2.out'
      });

      // Scintillement
      gsap.to(particle, {
        alpha: 0.3,
        duration: 0.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });

      // Rotation
      gsap.to(particle, {
        rotation: Math.PI * 2,
        duration: duration * 0.8,
        ease: 'none',
        repeat: -1
      });

      // Mouvement vertical
      gsap.to(particle, {
        y: targetY,
        duration: duration,
        ease: 'sine.out',
        onComplete: () => {
          // Disparition
          gsap.to(particle, {
            alpha: 0,
            duration: 0.5,
            onComplete: () => {
              if (particle.parent) animationLayerRef.current.removeChild(particle);
              particle.destroy();
              const idx = goldenParticles.indexOf(particle);
              if (idx > -1) goldenParticles.splice(idx, 1);
            }
          });
        }
      });

      console.log('✨ Particule dorée créée');
    };

    // Créer des notes de musique régulièrement
    const musicInterval = setInterval(() => {
      if (currentPageRef.current === 10) {
        createMusicNote();
      } else {
        clearInterval(musicInterval);
      }
    }, 800); // Toutes les 0.8 secondes

    // Créer des particules dorées régulièrement
    const particleInterval = setInterval(() => {
      if (currentPageRef.current === 10) {
        createGoldenParticle();
      } else {
        clearInterval(particleInterval);
      }
    }, 300); // Toutes les 0.3 secondes (plus fréquent)

    // Créer quelques éléments immédiatement
    setTimeout(() => {
      if (currentPageRef.current === 10) {
        createMusicNote();
        createGoldenParticle();
      }
    }, 500);

    // Stocker les références
    appRef.current.page11Elements = {
      musicNotes,
      goldenParticles,
      musicInterval,
      particleInterval
    };

    console.log('✅ Animation page 11 créée: notes de musique + particules dorées');

    // === AFFICHAGE DU TEXTE NARRATIF PAGE 11 ===
    setTimeout(() => {
      if (currentPageRef.current === 10) {
        setShowPage11Text(true);

        requestAnimationFrame(() => {
          if (page11TextRef.current && currentPageRef.current === 10) {
            gsap.fromTo(
              page11TextRef.current,
              {
                opacity: 0,
                y: 20
              },
              {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: 'power2.out'
              }
            );
          }
        });
      }
    }, 500);
  };

  /**
   * Reset du zoom et de la position d'un sprite (utilisé lors du changement de page)
   * Mode "cover" : remplit tout l'écran
   */
  const resetSpriteTransform = (sprite) => {
    if (!sprite || !appRef.current) return;

    const app = appRef.current;
    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;

    const textureWidth = sprite.texture.width;
    const textureHeight = sprite.texture.height;

    // Recalcul de l'échelle en mode cover
    const scaleX = screenWidth / textureWidth;
    const scaleY = screenHeight / textureHeight;
    let scale = Math.max(scaleX, scaleY); // MAX pour couvrir tout l'écran

    // Reset immédiat (sans animation)
    sprite.scale.set(scale);
    sprite.x = screenWidth / 2;
    sprite.y = screenHeight / 2;
  };

  /**
   * Navigation vers une page spécifique avec animation GSAP
   * Les durées d'animation sont adaptées selon la taille de l'écran
   */
  const goToPage = (pageIndex) => {
    // Validation
    if (pageIndex < 0 || pageIndex >= TOTAL_PAGES || isAnimatingRef.current) {
      return;
    }

    if (pageIndex === currentPageRef.current) {
      return;
    }

    isAnimatingRef.current = true;

    const currentSprite = spritesRef.current[currentPageRef.current];
    const nextSprite = spritesRef.current[pageIndex];

    // Si on quitte la page 1, arrêter toutes les animations GSAP sur ce sprite et masquer le titre
    if (currentPageRef.current === 0) {
      gsap.killTweensOf(currentSprite);
      gsap.killTweensOf(currentSprite.scale);
      setShowTitle(false);
      console.log('🛑 Animation page 1 interrompue');
    }

    // Si on quitte la page 2, supprimer les éléments d'animation
    if (currentPageRef.current === 1 && appRef.current.page2Elements) {
      const { rainDrops, rainContainer, ticker } = appRef.current.page2Elements;

      // Arrêter le ticker
      if (ticker) {
        appRef.current.ticker.remove(ticker);
      }

      // Supprimer les gouttes
      if (rainDrops) {
        rainDrops.forEach(drop => drop.destroy());
      }

      // Supprimer le container
      if (rainContainer) {
        animationLayerRef.current.removeChild(rainContainer);
        rainContainer.destroy();
      }

      appRef.current.page2Elements = null;
      setShowPage2Text(false);
      console.log('🛑 Animation page 2 interrompue - Pluie supprimée');
    }

    // Si on quitte la page 3, supprimer les éléments d'animation
    if (currentPageRef.current === 2 && appRef.current.page3Elements) {
      const { flowerSprites } = appRef.current.page3Elements;

      // Arrêter les animations et supprimer les sprites
      if (flowerSprites) {
        flowerSprites.forEach(sprite => {
          gsap.killTweensOf(sprite);
          gsap.killTweensOf(sprite.scale);
          animationLayerRef.current.removeChild(sprite);
          sprite.destroy();
        });
      }

      appRef.current.page3Elements = null;
      setShowPage3Text(false);
      console.log('🛑 Animation page 3 interrompue - Fleurs supprimées');
    }

    // Si on quitte la page 7, supprimer les éléments d'animation
    if (currentPageRef.current === 6 && appRef.current.page7Elements) {
      const { witchSprite, witchUpdateTicker, clouds, lightnings, lightningInterval } = appRef.current.page7Elements;

      // Arrêter le ticker
      if (witchUpdateTicker) {
        appRef.current.ticker.remove(witchUpdateTicker);
      }

      // Arrêter l'intervalle des éclairs
      if (lightningInterval) {
        clearInterval(lightningInterval);
      }

      // Supprimer les nuages
      if (clouds) {
        clouds.forEach(cloud => {
          gsap.killTweensOf(cloud);
          animationLayerRef.current.removeChild(cloud);
          cloud.destroy();
        });
      }

      // Supprimer les éclairs restants
      if (lightnings) {
        lightnings.forEach(lightning => {
          gsap.killTweensOf(lightning);
          if (lightning.parent) {
            animationLayerRef.current.removeChild(lightning);
          }
          lightning.destroy();
        });
      }

      // Supprimer l'animation et le sprite de la magicienne
      if (witchSprite) {
        gsap.killTweensOf(witchSprite);
        gsap.killTweensOf(witchSprite.scale);
        animationLayerRef.current.removeChild(witchSprite);
        witchSprite.destroy();
      }

      appRef.current.page7Elements = null;
      setShowPage7Text(false);
      console.log('🛑 Animation page 7 interrompue - Magicienne, nuages et éclairs supprimés');
    }

    // Si on quitte la page 8, arrêter les animations
    if (currentPageRef.current === 7) {
      const sprite = spritesRef.current[7];
      if (sprite) {
        gsap.killTweensOf(sprite);
        gsap.killTweensOf(sprite.scale);
      }

      // Supprimer la brillance violette
      if (appRef.current.page8MagicGlow) {
        appRef.current.page8MagicGlow.forEach(glowSprite => {
          gsap.killTweensOf(glowSprite);
          gsap.killTweensOf(glowSprite.scale);
          animationLayerRef.current.removeChild(glowSprite);
          glowSprite.destroy();
        });
        appRef.current.page8MagicGlow = null;
      }

      setShowPage8Text(false);
      console.log('🛑 Animation page 8 interrompue - Zoom, tremblements et brillance arrêtés');
    }

    // Si on quitte la page 9, arrêter les animations
    if (currentPageRef.current === 8) {
      const sprite = spritesRef.current[8];
      if (sprite) {
        gsap.killTweensOf(sprite);
        gsap.killTweensOf(sprite.scale);
      }
      setShowPage9Text(false);
      console.log('🛑 Animation page 9 interrompue - Zoom rapide arrêté');
    }

    // Si on quitte la page 10, supprimer les éléments d'animation
    if (currentPageRef.current === 9 && appRef.current.page10Elements) {
      const { clouds, birds, birdInterval } = appRef.current.page10Elements;

      // Arrêter l'intervalle des oiseaux
      if (birdInterval) {
        clearInterval(birdInterval);
      }

      // Supprimer les nuages
      if (clouds) {
        clouds.forEach(cloud => {
          gsap.killTweensOf(cloud);
          animationLayerRef.current.removeChild(cloud);
          cloud.destroy();
        });
      }

      // Supprimer les oiseaux
      if (birds) {
        birds.forEach(bird => {
          gsap.killTweensOf(bird);
          if (bird.parent) {
            animationLayerRef.current.removeChild(bird);
          }
          bird.destroy();
        });
      }

      appRef.current.page10Elements = null;
      setShowPage10Text(false);
      console.log('🛑 Animation page 10 interrompue - Nuages et oiseaux supprimés');
    }

    // Si on quitte la page 11, supprimer les éléments d'animation
    if (currentPageRef.current === 10 && appRef.current.page11Elements) {
      const { musicNotes, goldenParticles, musicInterval, particleInterval } = appRef.current.page11Elements;

      // Arrêter les intervalles
      if (musicInterval) clearInterval(musicInterval);
      if (particleInterval) clearInterval(particleInterval);

      // Supprimer les notes
      if (musicNotes) {
        musicNotes.forEach(note => {
          gsap.killTweensOf(note);
          if (note.parent) animationLayerRef.current.removeChild(note);
          note.destroy();
        });
      }

      // Supprimer les particules
      if (goldenParticles) {
        goldenParticles.forEach(particle => {
          gsap.killTweensOf(particle);
          if (particle.parent) animationLayerRef.current.removeChild(particle);
          particle.destroy();
        });
      }

      appRef.current.page11Elements = null;
      setShowPage11Text(false);
      console.log('🛑 Animation page 11 interrompue - Notes et particules supprimées');
    }

    // Si on quitte la page 4, supprimer les éléments d'animation
    if (currentPageRef.current === 3 && appRef.current.page4Elements) {
      const { flowerSprites, flowerContainer, faceOverlay, flowerUpdateTicker, tearDrops, tearTimers } = appRef.current.page4Elements;

      // Arrêter le zoom sur le sprite de la page 4
      const sprite = spritesRef.current[3];
      if (sprite) {
        gsap.killTweensOf(sprite);
        gsap.killTweensOf(sprite.scale);
      }

      // Arrêter le ticker de mise à jour des fleurs
      if (flowerUpdateTicker) {
        appRef.current.ticker.remove(flowerUpdateTicker);
      }

      // Arrêter tous les timers de larmes
      if (tearTimers) {
        tearTimers.forEach(timer => clearTimeout(timer) || clearInterval(timer));
      }

      // Supprimer les larmes
      if (tearDrops) {
        tearDrops.forEach(tear => {
          gsap.killTweensOf(tear);
          tear.destroy();
        });
      }

      // Arrêter les animations et supprimer les sprites des fleurs
      if (flowerSprites) {
        flowerSprites.forEach(sprite => {
          gsap.killTweensOf(sprite);
          gsap.killTweensOf(sprite.scale);
          sprite.destroy();
        });
      }

      // Supprimer le container des fleurs
      if (flowerContainer) {
        flowerContainer.destroy({ children: true });
      }

      // Supprimer l'overlay du visage
      if (faceOverlay) {
        gsap.killTweensOf(faceOverlay);
        animationLayerRef.current.removeChild(faceOverlay);
        faceOverlay.destroy();
      }

      appRef.current.page4Elements = null;
      setShowPage4Text(false);
      console.log('🛑 Animation page 4 interrompue - Zoom, visage, larmes et fleurs arrêtés');
    }

    // Si on va vers la page 1, afficher le titre
    if (pageIndex === 0) {
      setShowTitle(true);
    }

    // Si on va vers la page 2, masquer le texte (il sera réaffiché par playPage2Animation)
    if (pageIndex === 1) {
      setShowPage2Text(false);
    }

    // Si on va vers la page 3, masquer le texte (il sera réaffiché par playPage3Animation)
    if (pageIndex === 2) {
      setShowPage3Text(false);
    }

    // Si on va vers la page 4, masquer le texte (il sera réaffiché par playPage4Animation)
    if (pageIndex === 3) {
      setShowPage4Text(false);
    }

    // Si on va vers la page 7, masquer le texte (il sera réaffiché par playPage7Animation)
    if (pageIndex === 6) {
      setShowPage7Text(false);
    }

    // Si on va vers la page 8, masquer le texte (il sera réaffiché par playPage8Animation)
    if (pageIndex === 7) {
      setShowPage8Text(false);
    }

    // Si on va vers la page 9, masquer le texte (il sera réaffiché par playPage9Animation)
    if (pageIndex === 8) {
      setShowPage9Text(false);
    }

    // Si on va vers la page 10, masquer le texte (il sera réaffiché par playPage10Animation)
    if (pageIndex === 9) {
      setShowPage10Text(false);
    }

    // Si on va vers la page 11, masquer le texte (il sera réaffiché par playPage11Animation)
    if (pageIndex === 10) {
      setShowPage11Text(false);
    }

    // Reset du sprite suivant avant de l'afficher (pour enlever tout zoom résiduel)
    resetSpriteTransform(nextSprite);

    // Récupération des paramètres responsive (durée adaptée)
    const params = getResponsiveParams();
    const duration = params.transitionDuration;

    // Animation de transition avec GSAP
    const timeline = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;

        // Si on arrive sur la page 1, démarrer l'animation de zoom
        if (pageIndex === 0) {
          playPage1Animation();
        }

        // Si on arrive sur la page 2, démarrer l'animation de la pluie
        if (pageIndex === 1) {
          playPage2Animation();
        }

        // Si on arrive sur la page 3, démarrer l'animation des fleurs
        if (pageIndex === 2) {
          playPage3Animation();
        }

        // Si on arrive sur la page 4, démarrer l'animation du visage + fleurs
        if (pageIndex === 3) {
          playPage4Animation();
        }

        // Si on arrive sur la page 7, démarrer l'animation de la magicienne
        if (pageIndex === 6) {
          playPage7Animation();
        }

        // Si on arrive sur la page 8, démarrer l'animation du zoom dramatique
        if (pageIndex === 7) {
          playPage8Animation();
        }

        // Si on arrive sur la page 9, démarrer l'animation du zoom rapide + transition
        if (pageIndex === 8) {
          playPage9Animation();
        }

        // Si on arrive sur la page 10, démarrer l'animation des nuages et oiseaux
        if (pageIndex === 9) {
          playPage10Animation();
        }

        // Si on arrive sur la page 11, démarrer l'animation des notes de musique et particules
        if (pageIndex === 10) {
          playPage11Animation();
        }
      }
    });

    // Fade out de l'image actuelle
    timeline.to(currentSprite, {
      alpha: 0,
      duration: duration,
      ease: 'power2.in'
    });

    // Fade in de la nouvelle image
    timeline.to(nextSprite, {
      alpha: 1,
      duration: duration,
      ease: 'power2.out'
    }, `-=${duration * 0.5}`); // Chevauchement de 50% pour une transition fluide

    // Mise à jour de l'état
    currentPageRef.current = pageIndex;
    setCurrentPage(AVAILABLE_PAGES[pageIndex]);
  };

  /**
   * Navigation page suivante
   */
  const nextPage = () => {
    if (currentPageRef.current < TOTAL_PAGES - 1) {
      goToPage(currentPageRef.current + 1);
    }
  };

  /**
   * Navigation page précédente
   */
  const prevPage = () => {
    if (currentPageRef.current > 0) {
      goToPage(currentPageRef.current - 1);
    }
  };

  /**
   * Retour au début
   */
  const resetToStart = () => {
    goToPage(0);
  };

  /**
   * Gestion des événements clavier
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextPage();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          prevPage();
          break;
        case 'r':
        case 'R':
          resetToStart();
          break;
        case 'Home':
          resetToStart();
          break;
        case 'End':
          goToPage(TOTAL_PAGES - 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Gestion du scroll (molette de la souris)
   */
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();

      // Détection du sens du scroll
      if (e.deltaY > 0 || e.deltaX > 0) {
        nextPage();
      } else if (e.deltaY < 0 || e.deltaX < 0) {
        prevPage();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  /**
   * Gestion des gestes tactiles (swipe) pour tablettes
   */
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const minSwipeDistance = 50; // Distance minimale pour détecter un swipe

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Déterminer si le swipe est horizontal ou vertical
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swipe horizontal
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            prevPage(); // Swipe vers la droite = page précédente
          } else {
            nextPage(); // Swipe vers la gauche = page suivante
          }
        }
      } else {
        // Swipe vertical
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            prevPage(); // Swipe vers le bas = page précédente
          } else {
            nextPage(); // Swipe vers le haut = page suivante
          }
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchend', handleTouchEnd);

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, []);

  return (
    <div className="pixi-bd-viewer">
      {/* Écran de chargement */}
      {isLoading && (
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Chargement des pages...</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${loadProgress}%` }}
              ></div>
            </div>
            <p className="progress-text">{loadProgress}%</p>
          </div>
        </div>
      )}

      {/* Canvas Pixi.js */}
      <div ref={containerRef} className="pixi-container" />

      {/* Titre et auteurs (page 1 uniquement) */}
      {!isLoading && showTitle && currentPageRef.current === 0 && (
        <div ref={titleRef} className="story-title-overlay">
          <h1 className="title-text">Raiponce</h1>
          <p className="author-text">Frères Grimm</p>
        </div>
      )}

      {/* Texte narratif (page 2 uniquement) */}
      {!isLoading && showPage2Text && currentPageRef.current === 1 && (
        <div ref={page2TextRef} className="page2-narrative-overlay">
          <div className="narrative-box">
            <p className="narrative-text">
              Il était une fois un mari et son épouse qui souhaitaient depuis longtemps avoir un enfant.
              Un jour enfin, la femme caressa l'espoir que le Bon Dieu exaucerait ses vœux.
            </p>
          </div>
        </div>
      )}

      {/* Texte narratif (page 3 uniquement) */}
      {!isLoading && showPage3Text && currentPageRef.current === 2 && (
        <div ref={page3TextRef} className="page3-narrative-overlay">
          <div className="narrative-box">
            <p className="narrative-text">
              Ces gens avaient à l'arrière de leur maison une petite fenêtre depuis laquelle ils pouvaient apercevoir un splendide jardin où poussaient les plus belles fleurs.
              Mais il était entouré d'un haut mur car il appartenait à une puissante magicienne que tous craignaient.
            </p>
          </div>
        </div>
      )}

      {/* Texte narratif (page 4 uniquement) */}
      {!isLoading && showPage4Text && currentPageRef.current === 3 && (
        <div ref={page4TextRef} className="page4-narrative-overlay">
          <div className="narrative-box">
            <p className="narrative-text">
              Un jour, la femme vit une plate-bande où poussaient de belles raiponces qui paraissaient si fraîches et vertes qu'elle eut une grande envie d'en manger.
              L'envie grandissait chaque jour et elle dépérissait, pâlissait et prenait un air de plus en plus misérable.
            </p>
          </div>
        </div>
      )}

      {/* Texte narratif (page 7 uniquement) */}
      {!isLoading && showPage7Text && currentPageRef.current === 6 && (
        <div ref={page7TextRef} className="page7-narrative-overlay">
          <div className="narrative-box">
            <p className="narrative-text">
              Il le fit à nouveau au crépuscule.
              Mais tandis qu'il grimpait au mur, il fut brusquement effrayé car il aperçut la magicienne qui se tenait devant lui.
              « Comment peux-tu te risquer à pénétrer dans mon jardin et à me voler mes raiponces comme un brigand ? » dit-elle avec courroux.
            </p>
          </div>
        </div>
      )}

      {/* Texte narratif (page 8 uniquement) */}
      {!isLoading && showPage8Text && currentPageRef.current === 7 && (
        <div ref={page8TextRef} className="page8-narrative-overlay">
          <div className="narrative-box">
            <p className="narrative-text">
              « Hélas, faites-moi grâce ! Mon épouse est enceinte et serait morte si elle n'avait pas pu en manger. »
              <br /><br />
              La magicienne laissa tomber son courroux :
              <br /><br />
              « Prends-en autant que tu voudras, mais tu dois me donner l'enfant que ta femme mettra au monde. »
            </p>
          </div>
        </div>
      )}

      {/* Texte narratif (page 9 uniquement) */}
      {!isLoading && showPage9Text && currentPageRef.current === 8 && (
        <div ref={page9TextRef} className="page9-narrative-overlay">
          <div className="narrative-box">
            <p className="narrative-text">
              L'homme par peur acquiesça à tout. Lorsque après quelques semaines sa femme accoucha, apparut immédiatement la magicienne, qui donna le nom de Raiponce à l'enfant et l'emmena avec elle.
            </p>
          </div>
        </div>
      )}

      {/* Texte narratif (page 10 uniquement) */}
      {!isLoading && showPage10Text && currentPageRef.current === 9 && (
        <div ref={page10TextRef} className="page10-narrative-overlay">
          <div className="narrative-box">
            <p className="narrative-text">
              Raiponce devint la plus belle enfant qui soit. Lorsqu'elle eut douze ans, la magicienne l'enferma dans une tour qui se dressait dans une forêt et qui ne possédait ni escalier ni porte ; seule tout en haut s'ouvrait une petite fenêtre.
            </p>
          </div>
        </div>
      )}

      {/* Texte narratif (page 11 uniquement) */}
      {!isLoading && showPage11Text && currentPageRef.current === 10 && (
        <div ref={page11TextRef} className="page11-narrative-overlay">
          <div className="narrative-box">
            <p className="narrative-text">
              Raiponce, dans sa solitude, passait le temps en chantant et faisait résonner sa douce voix. Elle avait de longs et splendides cheveux fins et filés comme de l'or.
            </p>
          </div>
        </div>
      )}

      {/* Interface utilisateur (overlay) */}
      {!isLoading && (
        <>
          {/* Compteur de pages */}
          <div className="page-counter">
            Page {currentPage} ({currentPageRef.current + 1} / {TOTAL_PAGES})
          </div>

          {/* Barre de progression */}
          <div className="navigation-bar">
            <div
              className="navigation-progress"
              style={{ width: `${((currentPageRef.current + 1) / TOTAL_PAGES) * 100}%` }}
            ></div>
          </div>

          {/* Contrôles de navigation */}
          <div className="controls">
            <button
              onClick={prevPage}
              disabled={currentPageRef.current === 0}
              className="control-btn"
              aria-label="Page précédente"
            >
              ← Précédent
            </button>

            <button
              onClick={resetToStart}
              className="control-btn reset-btn"
              aria-label="Retour au début"
            >
              ↺ Début
            </button>

            <button
              onClick={nextPage}
              disabled={currentPageRef.current === TOTAL_PAGES - 1}
              className="control-btn"
              aria-label="Page suivante"
            >
              Suivant →
            </button>
          </div>

          {/* Aide navigation */}
          <div className="help-text">
            <p>🖱️ Molette | ⌨️ Flèches | R = Retour au début</p>
          </div>
        </>
      )}
    </div>
  );
};

export default PixiBDViewer;
