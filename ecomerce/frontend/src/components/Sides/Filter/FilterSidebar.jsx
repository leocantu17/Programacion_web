import React, { useState, useEffect } from "react";
import FilterCheckboxGroup from './FilterCheckboxGroup';

const FilterSidebar = ({ onApplyFilters, currentFilters, availableFilters }) => {
  // Estado local para los filtros que se están editando
  const [localFilters, setLocalFilters] = useState(() => {
    // Inicializa localFilters:
    // Toma currentFilters como base
    const initialFilters = { ...currentFilters };

    if (
      currentFilters.priceRange[0] === 0 &&
      currentFilters.priceRange[1] === 9999 &&
      availableFilters.price_range &&
      availableFilters.price_range[1] > 0
    ) {
        initialFilters.priceRange = [...availableFilters.price_range];
    }

    return initialFilters;
  });

  // Este useEffect simplemente mantiene localFilters sincronizado con currentFilters
  // cuando currentFilters cambia externamente (ej. por reset o nueva búsqueda principal)
  useEffect(() => {
    // Si los currentFilters cambian (ej. por una búsqueda nueva desde el header),
    // actualizamos localFilters. Pero necesitamos evitar el bucle para priceRange.
    setLocalFilters(prevLocalFilters => {
        const newFilters = { ...currentFilters };
        // Si el priceRange no ha sido modificado localmente por el usuario,
        // y el available_filters tiene un rango válido, usa ese rango.
        // Esto evita reestablecer un rango de precio ya puesto por el usuario.
        if (prevLocalFilters.priceRange[0] === 0 && prevLocalFilters.priceRange[1] === 9999 &&
            availableFilters.price_range[0] !== 0 && availableFilters.price_range[1] !== 0) {
            newFilters.priceRange = availableFilters.price_range;
        }
        return newFilters;
    });
  }, [currentFilters, availableFilters.price_range]); // Mantén availableFilters.price_range aquí si quieres que el rango se actualice al buscar algo que cambie los filtros disponibles


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setLocalFilters(prevFilters => {
        const currentValues = prevFilters[name] || [];
        if (checked) {
          return { ...prevFilters, [name]: [...currentValues, value] };
        } else {
          return { ...prevFilters, [name]: currentValues.filter(item => item !== value) };
        }
      });
    } else if (name === 'min_price' || name === 'max_price') {
      setLocalFilters(prevFilters => {
        const newPriceRange = [...prevFilters.priceRange];
        // Aquí es importante usar los límites disponibles, no solo el 9999
        const maxAllowedPrice = availableFilters.price_range[1] || 9999;
        if (name === 'min_price') newPriceRange[0] = parseFloat(value) || 0;
        if (name === 'max_price') newPriceRange[1] = parseFloat(value) || maxAllowedPrice;
        return { ...prevFilters, priceRange: newPriceRange };
      });
    } else {
      setLocalFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    //onApplyFilters(localFilters);
    console.log(localFilters)
  };

  const handleResetFilters = () => {
    const defaultPriceRange = [0, availableFilters.price_range[1] || 9999];
    const resetValues = {
      authors: [],
      publishers: [],
      languages: [],
      priceRange: defaultPriceRange,
    };
    setLocalFilters(resetValues);
    onApplyFilters(resetValues);
  };

  return (
    <div className="w-full bg-gray-100 p-4 overflow-y-auto rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Filtros</h3>
      <form onSubmit={handleSubmit}>

        <FilterCheckboxGroup
          title="Autor"
          name="authors"
          options={availableFilters.authors}
          selectedOptions={localFilters.authors}
          onChange={handleInputChange}
          maxHeight="150px"
          defaultOpen={false}
        />

        <FilterCheckboxGroup
          title="Editorial"
          name="publishers"
          options={availableFilters.publishers}
          selectedOptions={localFilters.publishers}
          onChange={handleInputChange}
          maxHeight="150px"
          defaultOpen={false}
        />

        <FilterCheckboxGroup
          title="Idioma"
          name="languages"
          options={availableFilters.languages}
          selectedOptions={localFilters.languages}
          onChange={handleInputChange}
          maxHeight="150px"
          defaultOpen={false}
        />

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Precio</label>
          <p className="text-sm text-gray-500 mb-1">
            Rango disponible: ${availableFilters.price_range[0].toFixed(2)} - ${availableFilters.price_range[1].toFixed(2)}
          </p>
          <div className="flex space-x-2">
            <input
              type="number"
              name="min_price"
              placeholder={`Min ($${availableFilters.price_range[0].toFixed(2)})`}
              // Asegúrate de que el valor inicial sea el del localFilters
              value={localFilters.priceRange[0]}
              onChange={handleInputChange}
              className="w-1/2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
            />
            <input
              type="number"
              name="max_price"
              placeholder={`Max ($${availableFilters.price_range[1].toFixed(2)})`}
              // Asegúrate de que el valor inicial sea el del localFilters
              value={localFilters.priceRange[1]}
              onChange={handleInputChange}
              className="w-1/2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
            />
          </div>
        </div>

        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded w-full mb-2 transition duration-200 ease-in-out">
          Aplicar Filtros
        </button>
        <button type="button" onClick={handleResetFilters} className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded w-full transition duration-200 ease-in-out">
          Limpiar Filtros
        </button>
      </form>
    </div>
  );
};


export default FilterSidebar;