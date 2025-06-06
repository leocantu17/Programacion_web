import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BookCard from './BookCard'; // Ajusta la ruta según tu estructura

// Componente BookSlider
const BookSlider = ({ title = "Libros Recomendados", books = [], showNavigation = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);

  const cardWidth = 280; // 260px de ancho + 20px de gap
  const visibleCards = Math.floor((window.innerWidth - 64) / cardWidth); // Estimación basada en el ancho de pantalla

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < books.length - visibleCards;

  // Función para actualizar currentIndex basado en la posición actual del scroll
  const updateCurrentIndex = () => {
    if (sliderRef.current) {
      const scrollLeft = sliderRef.current.scrollLeft;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(newIndex);
    }
  };

  // Efecto para escuchar cambios en el scroll manual
  React.useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', updateCurrentIndex);
      return () => slider.removeEventListener('scroll', updateCurrentIndex);
    }
  }, []);

  const scrollLeft = () => {
    if (canScrollLeft) {
      const newIndex = Math.max(0, currentIndex - 1);
      setCurrentIndex(newIndex);
      if (sliderRef.current) {
        sliderRef.current.scrollTo({
          left: newIndex * cardWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      const newIndex = Math.min(books.length - visibleCards, currentIndex + 1);
      setCurrentIndex(newIndex);
      if (sliderRef.current) {
        sliderRef.current.scrollTo({
          left: newIndex * cardWidth,
          behavior: 'smooth'
        });
      }
    }
  };

  if (!books || books.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto p-8">
        <div className="text-center text-gray-500">
          No hay libros disponibles
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-8">
      {/* Header con título y botón "Ver más" */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {title}
            <hr className='border-t-4 border-black'/>
          </h2>
        </div>
        <button className="
          bg-blue-500 
          hover:bg-blue-600 
          text-white 
          px-6 
          py-2 
          rounded-lg 
          transition-colors 
          duration-200
          focus:outline-none
          focus:ring-2
          focus:ring-blue-300
        ">
          Ver más
        </button>
      </div>

      {/* Contenedor del slider */}
      <div className="relative">
        {/* Botones de navegación - Solo se renderizan si showNavigation es true */}
        {showNavigation && (
          <>
            {/* Botón de navegación izquierda */}
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`
                absolute 
                left-0 
                top-1/2 
                transform 
                -translate-y-1/2 
                z-10 
                w-12 
                h-12 
                rounded-full 
                flex 
                items-center 
                justify-center 
                transition-all 
                duration-200
                focus:outline-none
                focus:ring-2
                focus:ring-blue-300
                ${canScrollLeft 
                  ? 'bg-gray-100 shadow-lg hover:bg-lime-400 text-gray-700 border border-gray-200' 
                  : 'bg-lime-200 text-gray-400 cursor-not-allowed'
                }
              `}
              aria-label="Deslizar hacia la izquierda"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Botón de navegación derecha */}
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`
                absolute 
                right-0 
                top-1/2 
                transform 
                -translate-y-1/2 
                z-10 
                w-12 
                h-12 
                rounded-full 
                flex 
                items-center 
                justify-center 
                transition-all 
                duration-200
                focus:outline-none
                focus:ring-2
                focus:ring-blue-300
                ${canScrollRight 
                  ? 'bg-gray-100 shadow-lg hover:bg-lime-400 text-gray-700 border border-gray-200' 
                  : 'bg-lime-200 text-gray-400 cursor-not-allowed'
                }
              `}
              aria-label="Deslizar hacia la derecha"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Contenedor de las cards con scroll */}
        <div 
          ref={sliderRef}
          className={`
            flex 
            gap-5 
            overflow-x-auto 
            scroll-smooth 
            scrollbar-hide 
            ${showNavigation ? 'px-16' : 'px-0'}
          `}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {books.map((book, index) => (
            <div key={book.id || index} style={{ scrollSnapAlign: 'start' }}>
              <BookCard
                idLibro={book.id}
                title={book.title}
                price={book.price}
                imageUrl={book.imageUrl}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookSlider;