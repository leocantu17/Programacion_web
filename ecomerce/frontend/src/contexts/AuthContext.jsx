import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from 'axios';

//1. Creaciond el contexto.
const AuthContext = createContext(null);

//2. Creacion del Hook Personalizado para usar el contexto.
export const useAuth = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null); //Almacenara la informacion del usuario.
    const [token, setToken] = useState(null); //Almacenara el token de autenticacion (JWT).
    const [isAuthenticated, setIsAuthenticated] = useState(false); //Flag para saber si el usuario esta logueado
    const [loading, setLoading] = useState(true); //Para manejar el estado de carga inicial.

    // Usar ref para rastrear si ya hemos inicializado para prevenir múltiples llamadas
    const hasInitialized = useRef(false);

    /**
     * Instancia de Axios para la API base
     */
    /*const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: {
          'Content-Type': 'application/json',            
        },
    });*/

    const api = useMemo(() => axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: {
          'Content-Type': 'application/json',            
        },
    }),[]);

    /**
     * Funcion para cerrar sesion
     * Usando useCallback para evitar re-renders innecesariosz
     */
    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }, []);

    // Interceptor para añadir el token a todas las peticiones salientes
    api.interceptors.request.use(
        (config) => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                config.headers.Authorization = `Bearer ${storedToken}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }        
    );

    // Interceptor para manejar respuestas de error (ej. token expirado/inválido)
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            //Si la respuesta es 401 Unauthorized, cerramos sesion
            if (error.response && error.response.status === 401) {
                console.warn('Token expirado o inválido. Cerrando sesión.');
                logout(); // Cierra la sesión
            }
            return Promise.reject(error);
        }
    );

    // Función para validar token con el servidor
    const validateTokenWithServer = async (currentStoredToken) => {
        if (!currentStoredToken) { // Si no hay token, no hay nada que validar
            return false;
        }

        try {
            // Usamos la instancia de axios directamente para evitar circular dependencies con api.interceptors.request.use
            // o simplemente configurar api con el token antes de la llamada.
            // Para simplicidad, pasemos el token en la llamada directa, o aseguremos que el interceptor ya lo ha puesto.
            const response = await api.get('/me', {
                headers: {
                    'Authorization': `Bearer ${currentStoredToken}`
                }
            });
            if (response.status === 200) {
                // Opcional: Actualizar el estado del usuario con datos frescos del servidor
                // Esto es útil si el backend devuelve más información del usuario.
                // setUser(response.data.user); // Si /me devuelve `user` object.
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error validando token:', error);
            return false;
        }
    };

    useEffect(() => {
        // Prevenir multples inicializaciones.
        if (hasInitialized.current) {
            return;
        }

        const initializeAuth = async () => {
            hasInitialized.current =  true;

            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');

            if (storedUser && storedToken) {
                try {
                    const userParsed = JSON.parse(storedUser);
                    // Primero intentamos validar el token
                    const isValid = await validateTokenWithServer(storedToken);

                    if (isValid) {
                        setUser(userParsed);
                        setToken(storedToken);
                        setIsAuthenticated(true);
                    } else {
                        // Si el token no es válido (ej. expirado), limpiamos todo
                        logout();
                    }
                } catch (e) {
                    console.error("Error al analizar los datos de usuario almacenados:",e);
                    logout(); // En caso de error de parseo, cerrar sesion.
                }
            }
            setLoading(false); // Una vez que toda la lógica de inicialización haya terminado
        };

        initializeAuth();
    }, []);

    /**
     * Funcion para iniciar sesion
     */
    const login = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userToken);
    };


    /**
     * El valor que sera proporcionado a todos los compoenents
     * que usen este contexto.
     */
    const value = {
        user, token, isAuthenticated, loading,
        login, logout,
        api, // Instancia de Axios.
    };

    if (loading){
        // Se muestra mientras se verfica la autenticacion.
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-700 text-lg">Cargando sesión...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};