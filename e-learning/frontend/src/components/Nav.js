import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/">Inicio</Link>
      <Link to="/dashboard">Mi Panel</Link>
      <Link to="/login">Iniciar Sesión</Link>
      <Link to="/register">Registrarse</Link>
    </nav>
  );
};

export default Navbar;
