import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';

// Layout Imports
import MainLayout from "../layouts/MainLayout";

// Page Import
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import HomePage from "../pages/HomePage";
import BrowsePage from "../pages/BrowsePage";
import ProductDetailPage from '../pages/ProductDetailPage';
import AccountPage from "../pages/AccountPage";
import AddressPage from "../pages/AddressPage";

//Componentes para rutas protegidas.
const ProtectedRoute = ({children}) => {
    const { isAuthenticated, loading/*, token, logout, api*/ } = useAuth();
    /*const [validatingToken, setValidatingToken] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);*/

    /*useEffect(() => {
        const validateToken = async () => {
            // Si no hay token o no está autenticado localmente, no validar
            if (!token || !isAuthenticated) {
                setValidatingToken(false);
                setTokenValid(false);
                return;
            }

            try {
                // Hacer petición al endpoint /api/me para validar el token
                const response = await api.get('/me');

                if (response.status === 200) {
                    setTokenValid(true);
                } else {
                    setTokenValid(false);
                    logout(); // Cerrar sesion si el token no es valido.
                }
            } catch (error) {
                console.error('Error validando token:',error);
                setTokenValid(false);
                
                // Si es error 401, cerrar sesión automáticamente
                if (error.response?.status === 401) {
                    logout();
                }
            } finally {
                setValidatingToken(false);
            }
        };
        validateToken();
    },[token, isAuthenticated, api, logout]);*/

    // Mostrar loading mientras se carga la autenticación inicial
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-700 text-lg">Cargando aplicación...</p>
                </div>
            </div>
        );
    }

    // Si AuthContext ya terminó de cargar y no está autenticado, redirigir
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    // Si todo está bien, mostrar el contenido protegido
    return children;
};

function AppRoutes() {
    const {user} = useAuth();

    return (
        <Routes>
            {/* Rutas públicas sin MainLayout específico (login, registro) */}
            <Route path='/login' element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Rutas con MainLayout (la mayoría de la aplicación) */}
            {/* Las páginas que usarán la SearchBar y los filtros irán aquí */}
            <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
            
            {/* Ruta para la página de resultados de búsqueda */}
            <Route path="/browse" element={<MainLayout><BrowsePage /></MainLayout>} />

            {/* Ruta para detalles de un producto (ejemplo) */}
            <Route path="/book/:id" element={<MainLayout><ProductDetailPage /></MainLayout>} />

            {/* Rutas Protegidas (Requieren autenticación) */}
            <Route
                path='/account'
                element={
                    <ProtectedRoute>
                        <MainLayout><AccountPage/></MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Ruta para la página de direcciones */}
            <Route
                path='/addresses'
                element={
                    <ProtectedRoute>
                        <MainLayout><AddressPage/></MainLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/cart"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <div className="text-center text-2xl">Página del Carrito (Pronto)</div>
                        </MainLayout>
                    </ProtectedRoute>
                }
            />
            
            
            {/* Ruta para cualquier otra URL no definida (404) */}
            <Route path="*" element={<MainLayout><h1 className="text-center text-4xl mt-10">404 - Página no encontrada</h1></MainLayout>} />
        </Routes>
    );
}

export default AppRoutes;