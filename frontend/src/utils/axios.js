import axios from 'axios';

// Créer un événement personnalisé pour la gestion de l'expiration de session
export const sessionEvents = {
  expired: new EventTarget(),
};

// Variable pour suivre si une redirection est en cours
let redirectionInProgress = false;

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

// Intercepteur pour les requêtes
instance.interceptors.request.use(async (config) => {
    // Si c'est une requête POST, PUT, PATCH ou DELETE
    if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
        try {
            // Récupérer le token CSRF
            await axios.get('/sanctum/csrf-cookie', {
                withCredentials: true,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération du token CSRF:', error);
        }
    }
    
    // Vérifier si cette requête doit être considérée comme une activité utilisateur
    // Si l'en-tête X-No-Activity-Update est présent, ne pas mettre à jour l'activité
    if (!config.headers['X-No-Activity-Update'] && window.updateLastActivityFn) {
        // Ne mettre à jour l'activité que pour les requêtes initiées par l'utilisateur
        // et non pour les vérifications automatiques d'authentification
        if (!config.url.includes('check_only=true') && !config.url.includes('reason=inactivity')) {
            window.updateLastActivityFn();
        }
    }
    
    return config;
});

// Intercepteur pour les réponses
instance.interceptors.response.use(
    response => response,
    async error => {
        // Gestion des erreurs 401 (non autorisé)
        if (error.response?.status === 401) {
            // Éviter les redirections multiples
            if (!redirectionInProgress) {
                redirectionInProgress = true;
                
                // Vérifier si nous sommes déjà sur la page de login
                const isLoginPage = window.location.pathname === '/login';
                
                // Ne pas déclencher d'événement ni rediriger si on est déjà sur la page de login
                if (!isLoginPage) {
                    // Déclencher l'événement d'expiration de session
                    const sessionExpiredEvent = new Event('session-expired');
                    sessionEvents.expired.dispatchEvent(sessionExpiredEvent);
                    
                    // Rediriger vers la page de connexion après un court délai
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 100);
                }
            }
            
            return Promise.reject(error);
        }
        
        // Gestion des erreurs 419 (CSRF token expiré)
        if (error.response?.status === 419) {
            // Token CSRF expiré, on essaie de le rafraîchir
            try {
                await axios.get('/sanctum/csrf-cookie', {
                    withCredentials: true,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                // Réessayer la requête originale
                return instance(error.config);
            } catch (refreshError) {
                console.error('Erreur lors du rafraîchissement du token CSRF:', refreshError);
            }
        }
        
        // Gestion des erreurs 403 liées aux restrictions de pays
        if (error.response?.status === 403 && error.response?.data?.access_denied) {
            // Stocker les informations du pays dans le localStorage
            const countryCode = error.response.data.country_code || '';
            localStorage.setItem('blocked_country_code', countryCode);
            
            // Rediriger vers la page d'erreur HTML statique
            window.location.href = `/access-denied.html`;
            return new Promise(() => {}); // Bloquer la chaîne de promesses
        }
        
        return Promise.reject(error);
    }
);

export default instance;
