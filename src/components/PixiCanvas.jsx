import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

/**
 * Composant React qui initialise et gère une scène Pixi.js
 * Affiche une image avec une animation GSAP fluide
 */
const PixiCanvas = ({ imagePath, width = 800, height = 600 }) => {
  // Référence vers l'élément DOM qui contiendra le canvas Pixi
  const pixiContainerRef = useRef(null);
  // Référence vers l'application Pixi pour la nettoyer au démontage
  const pixiAppRef = useRef(null);

  useEffect(() => {
    // Initialisation de l'application Pixi.js
    const app = new PIXI.Application();

    // Configuration asynchrone de l'application
    const initPixi = async () => {
      await app.init({
        width,
        height,
        backgroundColor: 0x1a1a2e, // Couleur de fond élégante
        antialias: true, // Anti-aliasing pour un rendu plus lisse
        resolution: window.devicePixelRatio || 1, // Adaptation à la densité d'écran
      });

      // Ajout du canvas au DOM
      pixiContainerRef.current.appendChild(app.canvas);
      pixiAppRef.current = app;

      // Chargement de l'image
      try {
        const texture = await PIXI.Assets.load(imagePath);
        const sprite = new PIXI.Sprite(texture);

        // Centrage de l'image
        sprite.anchor.set(0.5);
        sprite.x = width / 2;
        sprite.y = height / 2;

        // Adaptation de la taille pour qu'elle tienne dans le canvas
        const scale = Math.min(
          (width * 0.8) / sprite.width,
          (height * 0.8) / sprite.height
        );
        sprite.scale.set(scale);

        // État initial pour l'animation (invisible et petit)
        sprite.alpha = 0;
        sprite.scale.set(scale * 0.5);

        // Ajout du sprite à la scène
        app.stage.addChild(sprite);

        // Animation GSAP : apparition douce avec zoom et rotation légère
        gsap.to(sprite, {
          alpha: 1, // Opacité complète
          duration: 1.5,
          ease: 'power2.out',
        });

        gsap.to(sprite.scale, {
          x: scale,
          y: scale,
          duration: 1.5,
          ease: 'back.out(1.2)', // Effet de rebond élégant
        });

        // Animation en boucle : mouvement flottant subtil
        gsap.to(sprite, {
          y: sprite.y + 20,
          duration: 2,
          yoyo: true, // Retour automatique
          repeat: -1, // Boucle infinie
          ease: 'sine.inOut',
        });

        // Rotation douce en boucle
        gsap.to(sprite, {
          rotation: Math.PI * 0.05, // Légère rotation (environ 9 degrés)
          duration: 3,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });

      } catch (error) {
        console.error('Erreur lors du chargement de l\'image:', error);
      }
    };

    initPixi();

    // Nettoyage : destruction de l'app Pixi lors du démontage du composant
    return () => {
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true, texture: true });
      }
    };
  }, [imagePath, width, height]);

  return (
    <div
      ref={pixiContainerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
      }}
    />
  );
};

export default PixiCanvas;
