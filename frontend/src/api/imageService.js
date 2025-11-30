/**
 * Service pour gérer l'optimisation des images
 * Ce service fournit des fonctions pour travailler avec l'API d'optimisation d'images
 */

import axios from '../utils/axios';

/**
 * Génère une URL optimisée pour une image
 * @param {string} imagePath - Chemin de l'image
 * @param {Object} options - Options d'optimisation
 * @param {number} options.width - Largeur souhaitée
 * @param {number} options.height - Hauteur souhaitée (optionnel)
 * @param {string} options.format - Format souhaité (webp, jpeg, png)
 * @param {number} options.quality - Qualité de l'image (1-100)
 * @param {number} options.blur - Niveau de flou (optionnel)
 * @returns {string} URL optimisée
 */
export const getOptimizedImageUrl = (imagePath, options = {}) => {
  const baseUrl = '/api/images';
  const path = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  // Construire les paramètres de requête
  const params = new URLSearchParams();
  params.append('path', path);
  
  if (options.width) params.append('width', options.width);
  if (options.height) params.append('height', options.height);
  if (options.format) params.append('format', options.format);
  if (options.quality) params.append('quality', options.quality);
  if (options.blur) params.append('blur', options.blur);
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Génère un placeholder basse résolution pour une image
 * @param {string} imagePath - Chemin de l'image
 * @returns {string} URL du placeholder
 */
export const getPlaceholderUrl = (imagePath) => {
  return getOptimizedImageUrl(imagePath, {
    width: 50,
    height: 50,
    quality: 30,
    blur: 10
  });
};

/**
 * Génère une URL pour une image WebP
 * @param {string} imagePath - Chemin de l'image
 * @param {Object} options - Options additionnelles
 * @returns {string} URL de l'image WebP
 */
export const getWebPUrl = (imagePath, options = {}) => {
  return getOptimizedImageUrl(imagePath, {
    ...options,
    format: 'webp',
    quality: options.quality || 80
  });
};

/**
 * Génère des URLs pour différentes tailles d'image
 * @param {string} imagePath - Chemin de l'image
 * @param {Array<number>} sizes - Tableau des largeurs souhaitées
 * @param {Object} options - Options additionnelles
 * @returns {Array<Object>} Tableau d'objets {src, width}
 */
export const getResponsiveImageUrls = (imagePath, sizes = [640, 768, 1024, 1280, 1536], options = {}) => {
  return sizes.map(width => ({
    src: getOptimizedImageUrl(imagePath, { ...options, width }),
    width
  }));
};

/**
 * Vérifie si le navigateur supporte le format WebP
 * @returns {Promise<boolean>} Promise qui résout à true si WebP est supporté
 */
export const supportsWebP = () => {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = function () {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

export default {
  getOptimizedImageUrl,
  getPlaceholderUrl,
  getWebPUrl,
  getResponsiveImageUrls,
  supportsWebP
};
