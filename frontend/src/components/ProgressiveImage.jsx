import React, { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * Composant d'image avec chargement progressif
 * Caractéristiques :
 * - Chargement lazy (uniquement lorsque l'image est proche du viewport)
 * - Effet de flou progressif (l'image apparaît progressivement)
 * - Placeholder pendant le chargement
 * - Gestion des erreurs
 * - Support des images WebP avec fallback
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.src - URL de l'image
 * @param {string} props.alt - Texte alternatif
 * @param {string} props.placeholderSrc - URL d'une version basse résolution (optionnel)
 * @param {string} props.webpSrc - URL de la version WebP (optionnel)
 * @param {string} props.className - Classes CSS
 * @param {Object} props.style - Styles inline
 * @param {number} props.threshold - Seuil d'intersection (0 à 1)
 * @param {string} props.objectFit - Style d'ajustement de l'image
 * @param {Function} props.onLoad - Callback appelé quand l'image est chargée
 * @param {Function} props.onError - Callback appelé en cas d'erreur
 */
const ProgressiveImage = ({
  src,
  alt,
  placeholderSrc,
  webpSrc,
  className = '',
  style = {},
  threshold = 0.1,
  objectFit = 'cover',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || '');
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Effet pour observer quand l'image entre dans le viewport
  useEffect(() => {
    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observerRef.current.disconnect();
        }
      },
      { threshold }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold]);

  // Effet pour charger l'image quand elle devient visible
  useEffect(() => {
    if (!isVisible) return;

    const img = new Image();
    
    // Essayer d'abord la version WebP si disponible et supportée
    if (webpSrc && supportsWebP()) {
      img.src = webpSrc;
    } else {
      img.src = src;
    }

    img.onload = () => {
      setCurrentSrc(img.src);
      setIsLoaded(true);
      if (onLoad) onLoad();
    };

    img.onerror = () => {
      // Si WebP échoue, essayer le format standard
      if (img.src === webpSrc) {
        img.src = src;
      } else {
        setError(true);
        if (onError) onError();
      }
    };
  }, [isVisible, src, webpSrc, onLoad, onError]);

  // Fonction pour vérifier le support de WebP
  const supportsWebP = () => {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  };

  return (
    <Box
      ref={imgRef}
      className={`progressive-image-container ${className}`}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        ...style,
      }}
      {...props}
    >
      {!isLoaded && !error && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          width="100%"
          height="100%"
          sx={{ position: 'absolute', top: 0, left: 0 }}
        />
      )}

      {error && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            bgcolor: 'grey.200',
            color: 'text.secondary',
            fontSize: '0.875rem',
          }}
        >
          Image non disponible
        </Box>
      )}

      {currentSrc && !error && (
        <motion.img
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={isLoaded ? { opacity: 1, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.5 }}
          src={currentSrc}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            display: 'block',
          }}
        />
      )}
    </Box>
  );
};

export default ProgressiveImage;
