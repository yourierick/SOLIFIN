import { useState, useEffect } from 'react';

/**
 * Hook pour optimiser les images
 * Fonctionnalités :
 * - Génération d'URL pour différentes tailles d'images
 * - Détection du support WebP
 * - Génération de placeholders
 * 
 * @param {Object} options - Options de configuration
 * @param {string} options.src - URL de l'image source
 * @param {boolean} options.generateWebP - Générer des URLs WebP
 * @param {boolean} options.generatePlaceholder - Générer un placeholder
 * @param {Array<number>} options.sizes - Tailles d'images à générer
 */
const useImageOptimization = ({
  src,
  generateWebP = true,
  generatePlaceholder = true,
  sizes = [640, 768, 1024, 1280, 1536]
}) => {
  const [optimizedSources, setOptimizedSources] = useState({
    original: src,
    webp: null,
    responsive: [],
    placeholder: null,
    supportsWebP: false
  });
  
  useEffect(() => {
    if (!src) return;
    
    // Vérifier le support de WebP
    const checkWebPSupport = async () => {
      const supportsWebP = await testWebP();
      
      // Générer les sources optimisées
      const result = {
        original: src,
        webp: null,
        responsive: [],
        placeholder: null,
        supportsWebP
      };
      
      // Si l'URL est une URL d'API ou externe, utiliser directement
      if (isExternalUrl(src)) {
        // Pour les URLs externes, on peut seulement ajouter des paramètres
        // si le service le supporte (comme Cloudinary, Imgix, etc.)
        if (isCloudinaryUrl(src)) {
          result.responsive = generateCloudinarySizes(src, sizes);
          if (generateWebP && supportsWebP) {
            result.webp = generateCloudinaryWebP(src);
          }
          if (generatePlaceholder) {
            result.placeholder = generateCloudinaryPlaceholder(src);
          }
        } else {
          // Pour les autres URLs externes, on ne peut pas faire grand-chose
          result.responsive = [{ src, width: 'original' }];
        }
      } else {
        // Pour les images locales, on peut générer des URLs optimisées
        // en utilisant des paramètres pour le serveur d'images
        result.responsive = generateLocalSizes(src, sizes);
        if (generateWebP && supportsWebP) {
          result.webp = generateLocalWebP(src);
        }
        if (generatePlaceholder) {
          result.placeholder = generateLocalPlaceholder(src);
        }
      }
      
      setOptimizedSources(result);
    };
    
    checkWebPSupport();
  }, [src, generateWebP, generatePlaceholder, sizes]);
  
  return optimizedSources;
};

// Fonction pour tester le support de WebP
const testWebP = () => {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = function () {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Vérifier si l'URL est externe
const isExternalUrl = (url) => {
  return url.startsWith('http') || url.startsWith('//');
};

// Vérifier si l'URL est une URL Cloudinary
const isCloudinaryUrl = (url) => {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

// Générer des tailles d'images pour Cloudinary
const generateCloudinarySizes = (src, sizes) => {
  return sizes.map(size => ({
    src: src.replace(/\/upload\//, `/upload/w_${size},q_auto,f_auto/`),
    width: size
  }));
};

// Générer une version WebP pour Cloudinary
const generateCloudinaryWebP = (src) => {
  return src.replace(/\/upload\//, '/upload/f_webp,q_auto/');
};

// Générer un placeholder pour Cloudinary
const generateCloudinaryPlaceholder = (src) => {
  return src.replace(/\/upload\//, '/upload/w_50,h_50,c_fill,e_blur:1000,q_30/');
};

// Générer des tailles d'images pour les images locales
const generateLocalSizes = (src, sizes) => {
  // Supposons que nous avons un endpoint /api/images qui accepte des paramètres
  // width et quality pour redimensionner les images
  const baseUrl = '/api/images';
  const imagePath = src.startsWith('/') ? src.substring(1) : src;
  
  return sizes.map(size => ({
    src: `${baseUrl}?path=${encodeURIComponent(imagePath)}&width=${size}&quality=80`,
    width: size
  }));
};

// Générer une version WebP pour les images locales
const generateLocalWebP = (src) => {
  const baseUrl = '/api/images';
  const imagePath = src.startsWith('/') ? src.substring(1) : src;
  
  return `${baseUrl}?path=${encodeURIComponent(imagePath)}&format=webp&quality=80`;
};

// Générer un placeholder pour les images locales
const generateLocalPlaceholder = (src) => {
  const baseUrl = '/api/images';
  const imagePath = src.startsWith('/') ? src.substring(1) : src;
  
  return `${baseUrl}?path=${encodeURIComponent(imagePath)}&width=50&height=50&blur=10&quality=30`;
};

export default useImageOptimization;
