import React from "react";
import BookSlider from "../components/Cards/BookSlider";

const genres = [
  "Fiction", "Non-fiction", "Mystery", "Fantasy", "Science Fiction", "Horror",
  "Romance", "Thriller", "Historical Fiction", "Biography", "Autobiography",
  "Self-Help", "Philosophy", "Poetry", "Drama", "Adventure", "Classic",
  "Young Adult", "Children's Literature", "Graphic Novel", "San pedro y sus conejos",
  "Young Adult", "Children's Literature", "Graphic Novel", "San pedro y sus conejos",
  "Young Adult", "Children's Literature", "Graphic Novel", "San pedro y sus conejos",
];

const dummyBooks = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `Libro de Nombre super largo de una vez y port todas ${i + 1}`,
  price: `${(10 + i).toFixed(2)} USD`,
  imageUrl: `https://placehold.co/200x300?text=Book+${i + 1}`
}));

function HomePage() {
  return (
    <div className="flex h-full bg-gray-500 py-2 pr-2">
      {/* Sidebar - Versión ajustada */}
      {<aside className="w-1/4 bg-lime-300 mr-2 relative"> {/* Contenedor relativo */}
        <div className="p-4 h-full flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 mb-1">GÉNEROS</h2> {/* Reducido mb */}
          <hr className="border-t-4 border-green-900"/>
          {/* Contenedor de scroll con espaciado ajustado */}
          <div className="
            absolute top-16 bottom-2 left-4 right-2 overflow-y-auto
            scrollbar-thin scrollbar-thumb-lime-600 scrollbar-track-lime-200
              hover:scrollbar-thumb-lime-700
          "> {/* Ajuste top y bottom */}
            <div className="space-y-2 pr-2 pb-2"> {/* Añadido pb-2 para espaciado final */}
              {genres.map((genre, index) => (
                <div key={index} className="p-3 bg-white shadow-sm hover:bg-gray-50 
                  cursor-pointer transition-colors duration-200 border-l-4 
                  border-lime-500">
                  <span className="text-gray-700 font-medium">{genre}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>}

      {/* Main content (sin cambios) */}
      <main className="flex-1 overflow-y-auto bg-white">
        <BookSlider title="Recomendados" books={dummyBooks} showNavigation={true} />
        <BookSlider title="Populares" books={dummyBooks.slice().reverse()} showNavigation={true} />
        <div className="w-full max-w-7xl mx-auto p-8 bg-yellow-600">
          {/* HERE GOES A LINK */}
          <button className="bg-lime-400 px-4 py-2 w-full rounded-full lg:text-xl ">EDITORIALES</button>
        </div>
      </main>
    </div>
  );
}

export default HomePage;