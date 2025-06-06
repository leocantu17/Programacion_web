import React,{useState} from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FilterCheckboxGroup = ({
    title,             // Título del grupo de filtro (ej. "Autor", "Editorial")
    name,              // Nombre del campo en los filtros (ej. "authors", "publishers")
    options,           // Array de strings con todas las opciones disponibles
    selectedOptions,   // Array de strings con las opciones actualmente seleccionadas
    onChange,          // Función para manejar el cambio en los checkboxes
    maxHeight = "200px", // Altura máxima del contenido scrollable
    defaultOpen = false  // Si el panel debe estar abierto por defecto
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const togglePanel = () => {
        setIsOpen(!isOpen);
    };

    const selectedCount = selectedOptions.length;

    return(
        <div className="mb-4">
            {/* Header del panel */}
            <button
                onClick={togglePanel}
                className={`
                    w-full
                    px-3 py-2 
                    bg-gray-200 
                    hover:bg-gray-300 
                    transition-colors 
                    duration-200 
                    flex items-center 
                    justify-between 
                    text-left rounded 
                    focus:outline-none 
                    focus:ring-2 
                    focus:ring-blue-500
                `}
                aria-expanded={isOpen}
                aria-controls={`${name}-content`}
            >
                <div className="flex items-center">
                    <span className="block text-gray-700 font-bold">{title}</span>
                    {selectedCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                            {selectedCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center text-gray-600">
                    {isOpen ? (
                        <ChevronUp className="w-4 h-4"/>
                    ) : (
                        <ChevronDown className="w-4 h-4"/>
                    )}
                </div>
            </button>

            {/* Contenido desplegable */}
            {isOpen && (
                <div
                    id={`${name}-content`}
                    className="mt-2 border border-gray-300 rounded bg-white"
                >
                    {options && options.length > 0 ? (
                        <div 
                            className="p-3 overflow-y-auto"
                            style={{ maxHeight: maxHeight }}
                        >
                            {options.map((option) => (
                                <div key={option} className="flex items-center mb-1">
                                    <input
                                        type="checkbox"
                                        name={name}
                                        value={option}
                                        checked={selectedOptions.includes(option)}
                                        onChange={onChange}
                                        className="form-checkbox text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                                    />
                                    <span className="ml-2 text-gray-700">{option}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-3 text-center">
                            <p className="text-sm text-gray-500">
                                No hay {title.toLowerCase()} disponibles para estos resultados
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FilterCheckboxGroup;