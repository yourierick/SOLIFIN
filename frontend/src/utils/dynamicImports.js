/**
 * dynamicImports.js
 * 
 * Ce fichier centralise les importations dynamiques des bibliothèques volumineuses
 * pour optimiser le chargement de l'application. Ces importations sont utilisées
 * uniquement lorsque nécessaire, ce qui permet de réduire la taille du bundle initial.
 */

// Bibliothèques de graphiques
export const loadChartJs = () => import('chart.js');
export const loadReactChartJs = () => import('react-chartjs-2');
export const loadRecharts = () => import('recharts');

// Bibliothèques de traitement média
export const loadFFmpeg = () => import('@ffmpeg/ffmpeg');
export const loadFFmpegCore = () => import('@ffmpeg/core');
export const loadFFmpegUtil = () => import('@ffmpeg/util');
export const loadReactPlayer = () => import('react-player');
export const loadVideoReact = () => import('video-react');

// Bibliothèques d'édition et de rendu
export const loadReactMarkdown = () => import('react-markdown');
export const loadRehypeSanitize = () => import('rehype-sanitize');
export const loadXLSX = () => import('xlsx');
export const loadDomPurify = () => import('dompurify');

// Bibliothèques d'animation et d'interaction
export const loadFramerMotion = () => import('framer-motion');
export const loadSwiper = () => import('swiper');
export const loadReactBeautifulDnd = () => import('react-beautiful-dnd');
export const loadHelloPangeaDnd = () => import('@hello-pangea/dnd');
export const loadEmojiPicker = () => import('emoji-picker-react');

// Bibliothèques de visualisation
export const loadReactD3Tree = () => import('react-d3-tree');
export const loadQRCode = () => import('qrcode.react');
