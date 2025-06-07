// frontend/src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext'
import { useCart } from '../contexts/CartContext';

// Importa iconos de Lucide React
import {
  Search,
  ShoppingCart,
  Heart,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

// Importa iconos específicos de React Icons (ej. Font Awesome para UserCircle)
import { FaUserCircle } from 'react-icons/fa';

const navLinks = [
  { name: 'TODOS', href: '/browse' },
  { name: 'NOVEDADES', href: '/new-arrivals' },
  { name: 'MAS VENDIDOS', href: '/best-sellers' },
  { name: 'ACERCA DE', href: '/deals' },
  { name: 'EDITORIALES', href: '/genres' },
];

// Componente reutilizable para el dropdown del usuario
const UserDropdown = ({ 
  isMobile = false, 
  isOpen, 
  onToggle, 
  onClose, 
  displayUserName, 
  handleLogout,
  dropdownRef 
}) => {
  const containerClass = isMobile ? "relative" : "relative z-20";
  
  const buttonClass = isMobile
    ? "flex items-center space-x-1 px-2 py-1 bg-lime-400 rounded-lg text-gray-700 hover:bg-lime-500 text-xs"
    : "flex items-center space-x-1 px-3 py-2 bg-lime-400 rounded-lg text-gray-700 hover:bg-lime-500 transition-colors";

  const iconSize = isMobile ? "h-5 w-5" : "h-6 w-6";
  
  const dropdownClass = isMobile
    ? "absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-1 z-20"
    : "absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30";

  const displayName = isMobile 
    ? (displayUserName.length > 8 ? `${displayUserName.substring(0, 8)}...` : displayUserName)
    : displayUserName;

  return (
    <div className={containerClass} ref={dropdownRef}>
      <button
        onClick={onToggle}
        className={buttonClass}
      >
        <FaUserCircle className={iconSize} />
        {isMobile ? (
          <span className="hidden sm:inline">{displayName}</span>
        ) : (
          <span className="text-sm font-medium">{displayName}</span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className={dropdownClass}>
          <Link 
            to="/account" 
            onClick={onClose} 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Mi Cuenta
          </Link>
          <button 
            onClick={() => {
              console.log(`Logout clicked - ${isMobile ? 'Mobile' : 'Desktop'}`);
              handleLogout();
            }} 
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { handleSearch } = useSearch();
  const { cartItemCount } = useCart() // Get cartItemCount from useCart
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  
  const desktopUserDropdownRef = useRef(null);
  const mobileUserDropdownRef = useRef(null);

  // Sincronizar el estado local con el contexto
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const qParam = queryParams.get('q') || '';
    setLocalSearchTerm(qParam);
  }, [window.location.search]); // Depende location.search to sync with URL.

  // Efecto para cerrar el menú móvil si la pantalla se agranda
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint de Tailwind
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Efecto para cerrar el dropdown del usuario si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickOutsideDesktop = desktopUserDropdownRef.current && 
        !desktopUserDropdownRef.current.contains(event.target);
      const isClickOutsideMobile = mobileUserDropdownRef.current && 
        !mobileUserDropdownRef.current.contains(event.target);
      
      if (isClickOutsideDesktop && isClickOutsideMobile) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserDropdownOpen(false);
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedTerm = localSearchTerm.trim();
    if (trimmedTerm) {
      handleSearch(trimmedTerm); // This updates contexts searchTerm and navigates
      setIsMobileMenuOpen(false);
    }
  };

  const handleUserDropdownToggle = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const handleUserDropdownClose = () => {
    setIsUserDropdownOpen(false);
  };

  const displayUserName = user?.nombre || user?.email?.split('@')[0] || 'Usuario';

  return (
    <header className="bg-white shadow-md font-sans">
      {/* Sección Superior del Navbar (Logo, Búsqueda, Iconos, Autenticación) */}
      <div className="container mx-auto px-4 py-3">
        {/* Vista de Escritorio y Tablet */}
        <div className="hidden md:flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/src/assets/logo.png" alt="Logo de la Empresa" className="h-10 rounded" />
            </Link>
          </div>

          {/* Barra de Búsqueda */}
          <form onSubmit={handleSearchSubmit} className="flex-grow max-w-xl mx-4 relative z-0">
            <div className="relative">
              <input
                type="search"
                placeholder="Buscar libros..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 bg-lime-100 border border-lime-300 rounded-lg text-sm focus:ring-lime-500 focus:border-lime-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-lime-600" />
              </div>
            </div>
          </form>

          {/* Iconos y Autenticación */}
          <div className="flex items-center space-x-4">
            <Link to="/cart" aria-label="Carrito de Compras" className="relative p-2 bg-lime-400 rounded-full text-gray-700 hover:bg-lime-500 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <Link to="/wishlist" aria-label="Lista de Deseos" className="p-2 bg-lime-400 rounded-full text-gray-700 hover:bg-lime-500 transition-colors">
              <Heart className="h-6 w-6" />
            </Link>

            {isAuthenticated ? (
              <UserDropdown
                isMobile={false}
                isOpen={isUserDropdownOpen}
                onToggle={handleUserDropdownToggle}
                onClose={handleUserDropdownClose}
                displayUserName={displayUserName}
                handleLogout={handleLogout}
                dropdownRef={desktopUserDropdownRef}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 bg-lime-500 text-white text-sm font-medium rounded-lg hover:bg-lime-600 transition-colors">
                  LOGIN
                </Link>
                <Link to="/register" className="px-4 py-2 bg-lime-500 text-white text-sm font-medium rounded-lg hover:bg-lime-600 transition-colors">
                  SIGN UP
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Vista Móvil */}
        <div className="md:hidden">
          {/* Línea Superior Móvil: Hamburguesa, Logo, Autenticación/Botones */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-lime-500"
              aria-label="Abrir menú principal"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/src/assets/logo.png" alt="Logo de la Empresa" className="h-8 rounded" />
              </Link>
            </div>

            {/* Autenticación/Botones (derecha de la línea superior móvil) */}
            <div className="flex items-center">
              {isAuthenticated ? (
                <UserDropdown
                  isMobile={true}
                  isOpen={isUserDropdownOpen}
                  onToggle={handleUserDropdownToggle}
                  onClose={handleUserDropdownClose}
                  displayUserName={displayUserName}
                  handleLogout={handleLogout}
                  dropdownRef={mobileUserDropdownRef}
                />
              ) : (
                <div className="flex items-center space-x-1">
                  <Link to="/login" className="px-3 py-1.5 bg-lime-500 text-white text-xs font-medium rounded-md hover:bg-lime-600">
                    LOGIN
                  </Link>
                  <Link to="/register" className="px-3 py-1.5 bg-lime-500 text-white text-xs font-medium rounded-md hover:bg-lime-600">
                    SIGN UP
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Segunda Línea Móvil: Búsqueda, Carrito, Wishlist */}
          <div className="flex items-center space-x-2">
            <form onSubmit={handleSearchSubmit} className="flex-grow relative">
              <input
                type="search"
                placeholder="Buscar"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 bg-lime-100 border border-lime-300 rounded-lg text-sm focus:ring-lime-500 focus:border-lime-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-lime-600" />
              </div>
            </form>
            <Link to="/cart" aria-label="Carrito de Compras" className="relative p-2 bg-lime-100 rounded-full text-lime-600 hover:bg-lime-200 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <Link to="/wishlist" aria-label="Lista de Deseos" className="p-2 bg-lime-100 rounded-full text-lime-600 hover:bg-lime-200 transition-colors">
              <Heart className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>

      {/* Barra de Navegación Principal (TODOS, MÁS RECIENTES, etc.) - Escritorio */}
      <nav className="hidden md:flex bg-green-600 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-6 h-12">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Menú Desplegable Móvil (solo enlaces de navegación + opciones de usuario logueado) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;