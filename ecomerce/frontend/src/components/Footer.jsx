import React from 'react';
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaPinterest, FaTiktok } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8 border-t border-gray-700">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Section 1: Nombre del E-commerce */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Nombre del E-commerce</h3>
          <ul>
            <li className="mb-2"><a href="#" className="hover:text-white transition-colors">Quienes somos</a></li>
            <li className="mb-2"><a href="#" className="hover:text-white transition-colors">Autores</a></li>
            <li className="mb-2"><a href="#" className="hover:text-white transition-colors">Editoriales</a></li>
          </ul>
        </div>

        {/* Section 2: Información legal */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Información legal</h3>
          <ul>
            <li className="mb-2"><a href="#" className="hover:text-white transition-colors">Terminos y Condiciones</a></li>
            <li className="mb-2"><a href="#" className="hover:text-white transition-colors">Privacidad y Seguridad</a></li>
            <li className="mb-2"><a href="#" className="hover:text-white transition-colors">Política de Devoluciones</a></li>
            <li className="mb-2"><a href="#" className="hover:text-white transition-colors">Política de Cookies</a></li>
          </ul>
        </div>

        {/* Section 3: Métodos de Pago */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Métodos de Pago</h3>
          <div className="bg-gray-700 p-4 rounded-md text-center text-gray-400 h-24 flex items-center justify-center">
            IMG (Métodos de Pago)
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="border-t border-gray-700 mt-8 pt-6 text-center">
        <p className="text-gray-400 mb-4">Síguenos en las redes:</p>
        <div className="flex justify-center space-x-6 text-2xl">
          <a href="#" className="hover:text-white transition-colors"><FaFacebookF /></a>
          <a href="#" className="hover:text-white transition-colors"><FaTwitter /></a>
          <a href="#" className="hover:text-white transition-colors"><FaInstagram /></a>
          <a href="#" className="hover:text-white transition-colors"><FaYoutube /></a>
          <a href="#" className="hover:text-white transition-colors"><FaPinterest /></a>
          {/* Add TikTok as it's common now */}
          <a href="#" className="hover:text-white transition-colors"><FaTiktok /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;