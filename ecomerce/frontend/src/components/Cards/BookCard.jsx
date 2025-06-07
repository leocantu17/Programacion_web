import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from  '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const BookCard = ({ idLibro, title, price, imageUrl }) => {
  const navigate =  useNavigate();
  const { addItem } = useCart(); // Get the addItem function from CartContext
  const { isAuthenticated } = useAuth(); // Get isAuthenticated from AuthContext
  
  const handleAddToCart = async (e) => {
    e.stopPropagation(); // Prevenir que se dispare el click del contenedor
    //console.log(`Agregando libro ${idLibro} al carrito`);
    if (!isAuthenticated) {
      alert("Debes iniciar sesión para agregar productos al carrito.")
      navigate('/login');
      return;
    }

    // Llamar a la funcion addItem desde CartContext
    const success = await addItem(idLibro, 1); // Add 1 unit of the book
    if(success) {
      console.log(`Libro ${title} (ID: ${idLibro}) agregado al carrito.`);
      // Optionally, show a success message or a temporary notification
      alert(`"${title}" agregado al carrito.`);
    } else {
      alert(`Error al agregar "${title}" al carrito. Por favor, intente de nuevo o verifique el stock.`);
    }
  };

  const handleViewDetails = (e) => {
    e.stopPropagation(); // Prevenir que se dispare el click del contenedor
    navigate(`/book/${idLibro}`);
  };

  const handleCardClick = () => {
    // También permitir navegación al hacer click en la tarjeta
    navigate(`/book/${idLibro}`);
  };

  return (
    <div 
      className="border border-gray-300 rounded-lg overflow-hidden shadow bg-white p-3 flex flex-col w-52 h-[360px] flex-shrink-0 relative group"
      onClick={handleCardClick}
    >
      {/* Book Image */}
      <div className='w-full flex justify-center mb-3'>
        <div className="w-40 h-52 bg-gray-200 flex items-center justify-center border border-gray-300">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={title} 
              className="object-cover w-full h-full" 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center text-gray-500 text-sm"
            style={{ display: imageUrl ? 'none' : 'flex' }}
          >
            Sin imagen
          </div>
        </div>
      </div>

      {/* Text Content - Fixed Height Container */}
      <div className="flex-1 flex flex-col px-2">
        {/* Title with proper line clamp */}
        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 min-h-[40px] overflow-hidden">
          {title}
        </h3>
        
        {/* Price positioned at bottom of text container */}
        <div className="mt-8 t-2 bg-gray-100 rounded">
          <p className="text-center text-base text-gray-700 font-semibold">
            ${typeof price === 'number' ? price.toFixed(2) : parseFloat(price || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Hover Overlay - Now covers just the price area */}
      {/*<div className="absolute inset-x-0 bottom-0 h-[88px] bg-black bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-3">*/}
      <div className="absolute inset-x-0 bottom-0 h-[88px] bg-black bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-3 rounded-b-lg">
        <div className="flex gap-3 w-full justify-center">

          {/* Botón Carrito - Tamaño original */}
          <button 
            onClick={handleAddToCart}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label={`Agregar ${title} al carrito`}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>

          {/* Botón Ver Detalles - Tamaño original */}
          <button 
            onClick={handleViewDetails}
            className="bg-gray-700 hover:bg-gray-800 text-white py-2 px-4 rounded-lg text-sm flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label={`Ver detalles de ${title}`}
          >
            Ver Detalles
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;