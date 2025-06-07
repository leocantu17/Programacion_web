import axios from "axios";

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',            
    },
});

// Opcional: Interceptores para añadir el token de autenticación
/*api.interceptors.request.use(
    (config) => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)*/

// Interceptor para manejar respuestas de error (ej. token expirado/inválido)
/*api.interceptors.response.use(
    (response) => response,
    (error) => {
        //Si la respuesta es 401 Unauthorized, cerramos sesion
        if (error.response && error.response.status === 401) {
            console.warn('Token expirado o inválido. Cerrando sesión.');
            logout(); // Cierra la sesión
        }
        return Promise.reject(error);
    }
);*/

export default api;