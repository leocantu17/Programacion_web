// src/contexts/SearchContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SearchContext = createContext();

export const useSearch = () => {
  return useContext(SearchContext);
};

export const SearchProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    authors: [],
    publishers: [],
    languages: [],
    priceRange: [0, 9999],
  });
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    navigate(`/browse?q=${encodeURIComponent(term)}`);
  }, [navigate]);

  const applyFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
    // Si quieres que la URL refleje los filtros para compartir:
    // const params = new URLSearchParams();
    // params.append('q', searchTerm);
    // // ... Lógica para añadir filtros a params
    // navigate(`/browse?${params.toString()}`);

    // Actualizar la URL con el término de búsqueda actual y los nuevos filtros
    const currentParams = new URLSearchParams(location.search);

    // Mantener el termino de busqueda actual.
    if (searchTerm) {
      currentParams.set('q',searchTerm)
    }

    // Resest page a pagina 1 cuando cambian los filtros.
    currentParams.set('page','1');
    
    // Handler de filtro de autor
    if(newFilters.authors && newFilters.authors.length > 0) {
      currentParams.set('authors',newFilters.authors.join(','));
    } else {
      currentParams.delete('authors');
    }

    // Handler de filtro de editorial.
    if(newFilters.publishers && newFilters.publishers.length > 0) {
      currentParams.set('publishers', newFilters.publishers.join(','));
    } else {
      currentParams.delete('publishers');
    }
    
    // Handler de filtro de idiomas.
    if(newFilters.languages && newFilters.languages.length > 0) {
      currentParams.set('languages', newFilters.languages.join(','));
    } else {
      currentParams.delete('languages');
    }

    // Handler de filtro de rangos de precios.
    if( newFilters.priceRange) {
      if(newFilters.priceRange[0] !== 0) {
        currentParams.set('min_price', newFilters.priceRange[0].toString());
      } else {
        currentParams.delete('min_price');
      }

      if(newFilters.priceRange[1] !== 9999) {
        currentParams.set('max_price', newFilters.priceRange[1].toString());
      } else {
        currentParams.delete('max_price');
      }
    }

    // Navegar a la URL actualizada.
    navigate(`/browse?${currentParams.toString()}`);
  }, [navigate, location.search, searchTerm]);

  const resetFilters = useCallback(() => {
    const defaultFilters = {
      authors: [],
      publishers: [],
      languages: [],
      priceRange: [0, 9999],
    };

    setFilters(defaultFilters);

    // Actualizar la URL para remover todos los paramtros de filtrado.
    const currentParams = new URLSearchParams(location.search);

    // Se conservan solo el termino de busqueda y se resetea la pagina a 1.
    const newParams = new URLSearchParams();
    if (searchTerm) {
      newParams.set('q', searchTerm);
    }
    newParams.set('page',1);

    navigate(`/browse?${newParams.toString()}`);
  }, [navigate, location.search, searchTerm]);

  /**
   * Función auxiliar para sincronizar filtros desde URL 
   * (se llama desde componentes cuando sea necesario)
   */
  const syncFiltersFromURL = useCallback(() => {
    const queryParams = new URLSearchParams(location.search);

    const urlFilters = {
      authors: queryParams.get('authors')?.split(',').filter(Boolean) || [],
      publishers: queryParams.get('publishers')?.split(',').filter(Boolean) || [],
      languages: queryParams.get('languages')?.split(',').filter(Boolean) || [],
      priceRange: [
        parseFloat(queryParams.get('min_price')) || 0,
        parseFloat(queryParams.get('max_price')) || 9999
      ]
    };

    const urlSearchTerm = queryParams.get('q') || '';

    setSearchTerm(urlSearchTerm);
    setFilters(urlFilters);

    return { filters: urlFilters, searchTerm: urlSearchTerm};
  },[location.search]);

  const value = {
    searchTerm, setSearchTerm,
    filters, setFilters, applyFilters, resetFilters,
    searchResults, setSearchResults, handleSearch,
    syncFiltersFromURL,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
