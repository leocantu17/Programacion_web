import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiPlus, FiMinus, FiShoppingCart, FiArrowLeft } from 'react-icons/fi';
import { useCart } from "../contexts/CartContext";
import {useAuth } from "../contexts/AuthContext"
import api from "../utils/api";

const ProductDetailPage = () => {
    const [quantity, setQuantity] = useState(1);
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false); // Loading state for adding to cart
    const [error, setError] = useState(null);
    
    const { id } = useParams(); // Obtener el ID del libro desde la URL
    const navigate = useNavigate();
    const { addItem } = useCart(); // Llama a la funcion addItem desde el Context
    const { isAuthenticated } = useAuth();
 
    useEffect(() => {
        const fetchBookDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await api.get(`/books/${id}`);
                setBook(response.data);
            } catch (err) {
                if (err.response?.status === 404) {
                    setError('Libro no encontrado');
                } else if (err.response?.status >= 500) {
                    setError('Error del servidor. Intenta más tarde.');
                } else if (err.response?.status === 401) {
                    setError('No tienes permisos para ver este libro');
                } else {
                    setError('Error al cargar los detalles del libro');
                }
                console.error('Error fetching book details:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBookDetails();
        }
    }, [id]);

    const increment = () => {
        setQuantity(quantity + 1);
    }
    
    const decrement = () => {
        if (quantity > 1) setQuantity(quantity - 1);
    };

    const addToCart = async () => {
        if (!isAuthenticated) {
            alert("Debes iniciar sesión para agregar productos al carrito.");
            navigate('/login');
            return;
        }

        if(!book) {
            setError("No se pudo agregar el libro al carrito porque los detalles no están cargados");
            return;
        }

        setAddingToCart(true); // Set loading state for cart button
        try {
            const success = await addItem(book.id_libro, quantity);
            if (success) {
                alert(`"${book.titulo}" (${quantity} unidades) agregadas al carrito.`);
                // Optionally, navigate to cart or show a different success message
            } else {
                // addItem already handles setting error within CartContext
                // You might display the CartContext error here if needed.
                alert("Error al agregar el libro al carrito. Por favor, intente de nuevo.");
            }
        } catch (err) {
            console.error("Error adding to cart:", err);
            alert("Hubo un problema al intentar agregar el libro al carrito.");
        } finally {
            setAddingToCart(false); // Reset loading state
        }
    };

    const goBack = () => {
        navigate(-1); // Volver a la página anterior
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No disponible';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6 mt-10">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando detalles del libro...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6 mt-10">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Reintentar
                        </button>
                        <button
                            onClick={goBack}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Volver
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="max-w-4xl mx-auto p-6 mt-10">
                <div className="text-center">
                    <p className="text-gray-600">No se encontraron detalles del libro.</p>
                    <button
                        onClick={goBack}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg my-10">
            {/* Botón de regreso */}
            <button
                onClick={goBack}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors bg-lime-400 px-2 rounded-full"
            >
                <FiArrowLeft className="mr-2" />
                Volver
            </button>

            <div className="flex flex-col md:flex-row">
                {/* Imagen del libro */}
                <div className="w-full md:w-48 flex-shrink-0">
                    <div className="w-full h-auto bg-gray-200 rounded-md shadow-md overflow-hidden">
                        {book.portada_url ? (
                            <img
                                src={book.portada_url}
                                alt={book.titulo}
                                className="w-full h-auto object-cover sm:max-h-[600px]"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div 
                            className="w-full h-64 bg-gray-200 flex items-center justify-center"
                            style={{ display: book.portada_url ? 'none' : 'flex' }}
                        >
                            <span className="text-gray-500">Sin imagen</span>
                        </div>
                    </div>
                </div>

                {/* Detalles del libro */}
                <div className="md:ml-6 mt-4 md:mt-0 flex-1">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{book.titulo}</h1>
                    <p className="text-xl text-green-600 font-semibold mb-4">
                        ${book.precio.toFixed(2)}
                    </p>

                    <div className="text-sm text-gray-700 space-y-1">
                        <p>
                            <span className="font-semibold">Autor(es):</span> {
                                book.autores && book.autores.length > 0 
                                    ? book.autores.join(', ') 
                                    : 'No disponible'
                            }
                        </p>
                        <p>
                            <span className="font-semibold">Editorial:</span> {book.editorial || 'No disponible'}
                        </p>
                        <p>
                            <span className="font-semibold">Idioma:</span> {book.idioma || 'No disponible'}
                        </p>
                        <p>
                            <span className="font-semibold">Categoría:</span> {book.categoria || 'No disponible'}
                        </p>
                        <p>
                            <span className="font-semibold">Páginas:</span> {book.numero_paginas || 'No disponible'}
                        </p>
                        <p>
                            <span className="font-semibold">Fecha de publicación:</span> {formatDate(book.fecha_publicacion)}
                        </p>
                        <p>
                            <span className="font-semibold">ISBN:</span> {book.isbn || 'No disponible'}
                        </p>
                    </div>

                    {/* Sinopsis */}
                    {book.sinopsis && (
                        <div className="mt-4">
                            <h2 className="text-lg font-semibold text-gray-800 mb-1">Sinopsis</h2>
                            <div className="text-gray-600 text-sm max-h-40 overflow-y-auto pr-2">
                                {book.sinopsis}
                            </div>
                        </div>
                    )}

                    {/* Controles de cantidad y agregar al carrito */}
                    <div className="mt-6 flex items-center space-x-4">
                        <div className="flex items-center border rounded px-2 py-1 bg-white">
                            <button 
                                onClick={decrement} 
                                className="text-gray-600 hover:text-black p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={quantity <= 1}
                            >
                                <FiMinus />
                            </button>
                            <span className="mx-3 text-sm font-medium min-w-[20px] text-center">
                                {quantity}
                            </span>
                            <button 
                                onClick={increment} 
                                className="text-gray-600 hover:text-black p-1"
                            >
                                <FiPlus />
                            </button>
                        </div>

                        <button
                            onClick={addToCart}
                            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={addingToCart}
                        >
                            <FiShoppingCart className="mr-2" /> 
                            {addingToCart ? 'Agregando...' : 'Agregar al carrito'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;