// frontend/src/layouts/MainLayout.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar Completa */}
      <Header/>
      
      {/* Contenido principal de la aplicación */}
      {/* Removed clases: container mx-auto*/}
      <main className="flex-grow bg-gray-200">
        {children} {/* Aquí se renderizarán las páginas */}
      </main>

      {/* Footer */}
      {/*<footer className="bg-gray-800 text-white text-center p-4 text-sm">
        &copy; 2025 LibrosOnline. Todos los derechos reservados.
      </footer>*/}
      <Footer/>
    </div>
  );
};

export default MainLayout;