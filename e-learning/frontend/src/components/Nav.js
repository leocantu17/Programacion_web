// Importamos Link de react-router-dom para navegación sin recarga
import { Link } from 'react-router-dom';
// useState para manejar el estado del menú desplegable
import { useState } from 'react';
// Icono de usuario de la librería react-icons
import { FaUserCircle } from 'react-icons/fa';
// Hook personalizado que obtiene el usuario autenticado
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  // Extraemos el usuario desde el hook de autenticación
  const { user } = useAuth();

  // Estado local para manejar si el menú de usuario está abierto o cerrado
  const [menuOpen, setMenuOpen] = useState(false);

  // Función que alterna la visibilidad del menú
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      // Hacemos una petición POST al backend para cerrar sesión
      const response = await fetch('http://localhost:5000/logout', {
        method: 'POST',
        credentials: 'include', // Envía las cookies (incluye el token)
        headers: {
          'Content-Type': 'application/json', // Tipo de contenido JSON
        }
      });

      // Si la respuesta es exitosa
      if (response.ok) {
        console.log('Logout exitoso');
        // Recargamos la página para actualizar el estado
        window.location.reload();
      }
      
    } catch (error) {
      // Si ocurre un error en la petición
      console.error('Error al hacer logout:', error);
    }
  };

  // JSX de la barra de navegación
  return (
    <nav className="navbar">
      {/* Enlace al inicio */}
      <Link to="/">Inicio</Link>

      {/* Si el usuario está autenticado, mostramos enlace al panel */}
      {user ? <Link to="/dashboard">Mi Panel</Link> : null}

      {/* Si el usuario NO está autenticado, mostramos enlaces para login y registro */}
      {!user && <Link to="/login">Iniciar Sesión</Link>}
      {!user && <Link to="/register">Registrarse</Link>}

      {/* Si el usuario está autenticado, mostramos menú de usuario */}
      {user && (
        <div className="user-menu" style={{ position: 'relative', marginLeft: 'auto' }}>
          {/* Contenedor que muestra icono y nombre del usuario */}
          <div
            className="user-info"
            onClick={toggleMenu}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {/* Icono de usuario */}
            <FaUserCircle size={24} style={{ marginRight: '8px' }} />
            {/* Mostramos el nombre del usuario o "Usuario" por defecto */}
            <span>{user.name || 'Usuario'}</span>
          </div>

          {/* Menú desplegable visible si menuOpen es true */}
          {menuOpen && (
            <div
              className="dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                padding: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                zIndex: 1000,
                whiteSpace: 'nowrap',
              }}
            >
              {/* Botón para cerrar sesión */}
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  fontSize: '14px',
                  color: '#333'
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

// Exportamos el componente para usarlo en otras partes de la app
export default Navbar;
