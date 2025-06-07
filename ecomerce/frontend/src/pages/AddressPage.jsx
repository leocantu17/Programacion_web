import React, { useState, useEffect } from "react";
import AddressCard from "../components/Cards/AddressCard";
import { PlusIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const AddressPage = () => {
    const { api, user } = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch addresses from the API
    const fetchAddresses = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            //const response = await api.get(`/users/${user.id_usuario}/addresses`);
            const response = await api.get('/addresses');
            
            // Transform the API response to match the format expected by AddressCard
            const transformedAddresses = response.data.map(address => ({
                id: address.id,
                name: address.recipientName,
                street: address.street,
                neighborhood: address.neighborhood,
                city: address.city,
                state: address.state,
                postalCode: address.zipCode,
                country: address.country,
                phone: address.contactPhone
            }));
            
            setAddresses(transformedAddresses);
        } catch (err) {
            console.error('Error fetching addresses:', err);
            setError(err.response?.data?.message || 'Error al cargar las direcciones');
        } finally {
            setLoading(false);
        }
    };

    // Fetch addresses when component mounts or when user changes
    useEffect(() => {
        fetchAddresses();
    }, [user]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-semibold text-gray-800 mb-6">Domicilios</h1>
                    <div className="flex items-center justify-center py-12">
                        <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-gray-600">Cargando direcciones...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-semibold text-gray-800 mb-6">Domicilios</h1>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                            </svg>
                            <span className="text-red-800">{error}</span>
                        </div>
                        <button
                            onClick={fetchAddresses}
                            className="mt-3 text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Note: Authentication is already handled by ProtectedRoute wrapper
    // No need for additional authentication check here

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6 max-w-3xl mx-auto">Domicilios</h1>
            <div className="max-w-3xl mx-auto">
                {addresses.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes direcciones guardadas</h3>
                        <p className="text-gray-500 mb-4">Agrega tu primera dirección de envío para realizar pedidos.</p>
                    </div>
                ) : (
                    addresses.map(address => (
                        <AddressCard 
                            key={address.id} 
                            address={address}
                            onAddressDeleted={fetchAddresses} // Pass callback to refresh list after deletion
                        />
                    ))
                )}
                <button className="flex items-center text-blue-600 hover:underline mt-6 ml-9 pl-2 pr-8 py-2 bg-gray-300 rounded-md shadow">
                    <PlusIcon className="text-gray-500 mr-3" size={24} />
                    Agregar dirección
                </button>
            </div>
        </div>
    );
};

export default AddressPage;