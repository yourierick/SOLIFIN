import React from 'react';
import ProgressiveImage from './ProgressiveImage';
import useImageOptimization from '../hooks/useImageOptimization';

/**
 * Composant d'image optimisé qui combine le chargement progressif
 * et l'optimisation des images (tailles responsives, WebP, etc.)
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.src - URL de l'image
 * @param {string} props.alt - Texte alternatif
 * @param {string} props.className - Classes CSS
 * @param {Object} props.style - Styles inline
 * @param {string} props.objectFit - Style d'ajustement de l'image
 * @param {boolean} props.generateWebP - Générer des URLs WebP
 * @param {boolean} props.generatePlaceholder - Générer un placeholder
 * @param {Array<number>} props.sizes - Tailles d'images à générer
 */
const OptimizedImage = ({
  src,
  alt,
  className,
  style,
  objectFit = 'cover',
  generateWebP = true,
  generatePlaceholder = true,
  sizes = [640, 768, 1024, 1280, 1536],
  ...props
}) => {
  const {
    original,
    webp,
    responsive,
    placeholder,
    supportsWebP
  } = useImageOptimization({
    src,
    generateWebP,
    generatePlaceholder,
    sizes
  });

  // Utiliser l'image WebP si disponible et supportée
  const bestSrc = (supportsWebP && webp) ? webp : original;
  
  // Trouver la meilleure taille responsive en fonction de la largeur de l'écran
  const findBestResponsiveImage = () => {
    if (!responsive || responsive.length === 0) return bestSrc;
    
    const screenWidth = window.innerWidth;
    
    // Trouver l'image qui correspond le mieux à la taille de l'écran
    const bestMatch = responsive
      .sort((a, b) => a.width - b.width)
      .find(item => item.width >= screenWidth);
    
    return bestMatch ? bestMatch.src : responsive[responsive.length - 1].src;
  };

  return (
    <ProgressiveImage
      src={findBestResponsiveImage()}
      alt={alt}
      placeholderSrc={placeholder}
      webpSrc={webp}
      className={className}
      style={style}
      objectFit={objectFit}
      {...props}
    />
  );
};

export default OptimizedImage;
