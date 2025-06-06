import React , {useEffect, useState, useCallback} from "react";
import {useLocation, useNavigate} from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';
import FilterSidebar from '../components/Sides/Filter/FilterSidebar';
import BookCard from '../components/Cards/BookCard';
import Pagination from '../components/Commons/Pagination';
import api from '../utils/api';
 

const BrowsePage = () => {
    const location = useLocation();
    const navigate = useNavigate(); //Se usa para actualizar la URL en la paginacion.
    
    const { searchTerm, filters, searchResults, setSearchResults, syncFiltersFromURL } = useSearch();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [availableFilters, setAvailableFilters] = useState({
        authors: [],
        publishers: [],
        languages: [],
        price_range: [0, 9999], 
    });

    const perPage = 12; //Define cuantos libros por pagina se muestran.

    /**
     * Sincronizar filtros desde la URL al renderizar el componente
     * y al haber cambios en la URL
     */
    useEffect(()=>{
        syncFiltersFromURL();
    },[location.search, syncFiltersFromURL]);

    //Funcion para obtener los libros, ahora con paginacion y filtros dinamicosz
    const fetchBooks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams(location.search);
            const currentSearchTerm = queryParams.get('q') || searchTerm;
            const currentPageFromUrl = parseInt(queryParams.get('page') || '1', 10);
            setCurrentPage(currentPageFromUrl); //Sincronizar pagina con la URL

            const params = {
                q: currentSearchTerm,
                page: currentPageFromUrl,
                perPage: perPage,
            };

            //Agregar filtros activos (Si hay).
            if (filters.authors && filters.authors.length > 0) {
                params.authors = filters.authors.join(',');
            }
            if (filters.publishers && filters.publishers.length > 0) {
                params.publishers = filters.publishers.join(',');
            }
            if (filters.languages && filters.languages.length > 0) {
                params.languages = filters.languages.join(',');
            }
            if (filters.priceRange[0] !== 0) {
                params.min_price = filters.priceRange[0];
            }
            if (filters.priceRange[1] !== 9999) {
                params.max_price = filters.priceRange[1];
            }

            const response = await api.get('/books/search', { params });
            setSearchResults(response.data.books);
            setTotalResults(response.data.total_results);
            setAvailableFilters(response.data.available_filters);
            
        } catch (err) {
            console.error('Error fetching books:',err);
            setError('No se pudieron cargar los libros.Intenta de nuevo mas tarde.');
            setSearchResults([]);
            setTotalResults(0);
            setAvailableFilters({ 
                authors: [], 
                publishers: [], 
                languages: [], 
                price_range: [0, 0] 
            });
        } finally {
            setLoading(false);
        }
    },[location.search, searchTerm, filters]); //Dependencias para el useCallback

    /**
     * Efecto para disparar la busqueda cuando cambie el termino de
     * busqueda, los filtros o la URL (para la pagina)
     */
    useEffect(() => {
        fetchBooks();
        console.log("fectching");
    },[fetchBooks]); // Depende de fetchBooks

    /**
     * Funcion handler para el cambio de pagina.
     */
    const handlePageChange = (pageNumber) => {
        const currentParams = new URLSearchParams(location.search);
        currentParams.set('page',pageNumber);
        navigate(`/browse?${currentParams.toString()}`);
    }

    /**
     * Funcion para manejar la aplicacion de filtros (desde el sidebar)
     */
    const handleApplyFilters = (newFilters) => {
        const { applyFilters } =  useSearch()
        applyFilters(newFilters);
    };

    return (
        <div className="flex h-full p-2">
            {/* Contenedor del Filtro */}
            <div className="w-1/4 pr-4 overflow-y-auto">
                <FilterSidebar
                    onApplyFilters={handleApplyFilters}
                    currentFilters={filters}
                    availableFilters={availableFilters}
                />
            </div>

            {/* Contenedor del Contenido / Resultados de Busqueda -w-3/4  overflow-y-auto */}
            <div className="w-3/4 pl-4 overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">
                    Resultados de Búsqueda ({totalResults} libros)
                </h2>

                {loading && <p>Cargando libros...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && !error && searchResults.length === 0 && (
                    <p>No se encontraron coincidencias</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {searchResults.map((book) => (
                        <BookCard
                            key={book.idLibro}
                            idLibro={book.idLibro}
                            title={book.title}
                            price={book.price}
                            imageUrl={book.imageUrl}
                        />
                    ))}
                </div>
                
                {!loading && totalResults > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(totalResults / perPage)}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
        </div>
    );
};

export default BrowsePage;