import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  // Lógica para mostrar un rango de páginas (ej. 2 antes, 2 después de la actual)
  const maxPagesToShow = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  // Adjust startPage if there arent enough pages after current to fill maxPagesToShow
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  // Ensure endPage doesn't exceed totalPages if startPage was adjusted
  endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center mt-8 space-x-2">
        <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-md bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Primera
        </button>
        <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-md bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Anterior
        </button>

        {startPage >  1 && <span className="px-4 py-2">...</span>}
        {pages.map((page) => (
            <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-4 py-2 border rounded-md ${
                    page === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-100'
                }`}
            >
                {page}
            </button>
        ))}

        {endPage < totalPages && <span className="px-4 py-2">...</span>}
        <button
            onClick={()=> onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-md bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Siguiente
        </button>
        <button
            onClick={()=> onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-md bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Ultima
        </button>
    </div>
  );
};

export default Pagination;