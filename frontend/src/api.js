import axios from 'axios';

const api_url = axios.create({
    baseURL: 'http://localhost:8000/api',
});

export const login = async (email, password) => {
    try {
        const response = await api_url.post('/login', { email, password });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        throw error;
    }
};

export const register = async (email, password) => {
    try {
        const response = await api_url.post('/register', { email, password });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        throw error;
    }
};

