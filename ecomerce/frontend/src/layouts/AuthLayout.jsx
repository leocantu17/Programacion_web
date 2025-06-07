// frontend/src/layouts/AuthLayout.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Para el logo que puede ser un link a la home

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar Minimalista */}
      <nav className="bg-gray-800 p-4 shadow-md">
        <div className="container mx-auto flex justify-center">
          {/* Aquí podrías poner tu logo. Por ahora, un simple texto. */}
          <Link to="/" className="text-white text-3xl font-bold tracking-wider">
            <span className="text-blue-400">Libros</span>Online
          </Link>
        </div>
      </nav>

      {/* Contenido principal (formularios de Login/Registro) */}
      <main className="flex-grow flex items-center justify-center p-4">
        {children} {/* Aquí se renderizarán los formularios */}
      </main>

      {/* Opcional: Footer minimalista */}
      <footer className="bg-gray-800 text-white text-center p-4 text-sm">
        &copy; 2025 LibrosOnline. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default AuthLayout;