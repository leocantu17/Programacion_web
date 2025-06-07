// Importa los hooks de React necesarios
import { useState, useEffect } from 'react';

// Define el custom hook useAuth
const useAuth = () => {
  // Estado para almacenar la información del usuario autenticado
  const [user, setUser] = useState(null);

  // useEffect se ejecuta una vez cuando el componente que usa este hook se monta
  useEffect(() => {
    // Función asincrónica para obtener los datos del usuario
    const fetchUserData = async () => {
      try {
        // Paso 1: Llama al endpoint /me para obtener el ID del usuario desde el token JWT almacenado en la cookie
        const meResponse = await fetch("http://localhost:5000/me", {
          method: "GET",             // Método GET
          credentials: "include",    // Importante: incluye cookies en la petición
        });

        // Si la respuesta no es exitosa, lanza un error
        if (!meResponse.ok) throw new Error("No hay sesión activa");

        // Parsea el JSON de la respuesta
        const meData = await meResponse.json();

        // Extrae el user_id del JSON
        const userId = meData.user_id;

        // Si no hay user_id válido, lanza un error
        if (!userId) throw new Error("user_id inválido");

        // Paso 2: Llama al endpoint /perfil con el user_id para obtener la información completa del usuario
        const perfilResponse = await fetch(`http://localhost:5000/perfil?user_id=${userId}`, {
          method: "GET",             // Método GET
          credentials: "include",    // Incluye cookies (por si el endpoint requiere sesión)
        });

        // Si falla la respuesta, lanza un error
        if (!perfilResponse.ok) throw new Error("No se pudo cargar el perfil");

        // Parsea la respuesta JSON con los datos completos del usuario
        const perfilData = await perfilResponse.json();

        // Guarda los datos del usuario en el estado `user`
        setUser(perfilData);

      } catch (err) {
        // Si ocurre algún error en cualquier paso, muestra un error en consola
        console.error("Error de autenticación:", err.message);

        // Y asegura que `user` esté en null (no autenticado)
        setUser(null);
      }
    };

    // Llama a la función para iniciar la obtención de datos
    fetchUserData();

  // Solo se ejecuta una vez (cuando el componente se monta)
  }, []);

  // Retorna un objeto con el estado del usuario para que pueda ser usado en otros componentes
  return { user };
};

// Exporta el hook para ser usado en otros componentes
export default useAuth;
