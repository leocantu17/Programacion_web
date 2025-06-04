import { Link } from 'react-router-dom'; 
// Importa el componente Link de react-router-dom para navegación SPA sin recargar la página

const Navbar = () => { 
  // Define un componente funcional llamado Navbar
  return (
    <nav className="navbar"> 
      {/* Elemento <nav> que representa la barra de navegación, con clase CSS para estilos */}

      <Link to="/">Inicio</Link> 
      {/* Link a la ruta raíz "/" con texto "Inicio" */}

      <Link to="/dashboard">Mi Panel</Link> 
      {/* Link a la ruta "/dashboard" con texto "Mi Panel" */}

      <Link to="/login">Iniciar Sesión</Link> 
      {/* Link a la ruta "/login" con texto "Iniciar Sesión" */}

      <Link to="/register">Registrarse</Link> 
      {/* Link a la ruta "/register" con texto "Registrarse" */}

    </nav>
  );
};

export default Navbar; 
// Exporta el componente para poder importarlo y usarlo en otras partes de la app
