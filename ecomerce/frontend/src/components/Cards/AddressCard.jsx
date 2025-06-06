import React, { useState, useRef, useEffect } from 'react';
import { Home, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';


const AddressCard = ({ address, onAddressDeleted }) => {
    // Map address.icon string to Lucide React component
    const { user, api } = useAuth(); 
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const dropdownRef = useRef(null); // Ref for the dropdown container
    const toggleIconRef = useRef(null); // Ref for the toggle icon (ChevronDown/Up)

    // Function to toggle dropdown visibility
    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };

    // Function to handle address deletion
    const handleDelete = async () => {
        if (isDeleting) return; // Prevent multiple delete requests
        
        const confirmDelete = window.confirm('¿Estás seguro de que quieres eliminar esta dirección?');
        if (!confirmDelete) return;

        try {
            setIsDeleting(true);
            await api.delete(`/users/${user.id_usuario}/addresses/${address.id}`);
            //await api.delete('/addresses/${address.id}');
            console.log(address.id)
            
            // Close dropdown and call parent callback to refresh the list
            setIsDropdownOpen(false);
            if (onAddressDeleted) {
                onAddressDeleted();
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            alert('Error al eliminar la dirección. Por favor, intenta de nuevo.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Effect to close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close if click is outside the dropdown and outside the toggle icon
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                toggleIconRef.current && !toggleIconRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        /*if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };*/
        //handleClickOutside();
    },[/* isDropdownOpen */]);

    // Determine which icon to show based on dropdown state
    const ToggleChevronIcon = isDropdownOpen ? ChevronUp : ChevronDown;

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4 relative"> {/* Added relative for dropdown positioning */}
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <Home className="text-gray-500 mr-3" size={24} />
                    <p className="text-lg font-medium">{address.street}</p>
                </div>
                <div className="relative"> {/* Wrapper for chevron and dropdown */}
                    <ToggleChevronIcon // Dynamically rendered Chevron icon
                        ref={toggleIconRef} // Attach ref to the dynamic icon
                        className="text-gray-500 cursor-pointer hover:text-gray-700"
                        size={24} // Set size for Lucide icon
                        onClick={toggleDropdown}
                    />
                    {isDropdownOpen && (
                        <div
                            ref={dropdownRef} // Attach ref to dropdown menu
                            className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                        >
                            <ul className="py-1">
                                <li 
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer flex items-center"
                                    onClick={handleDelete}
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    {isDeleting ? 'Eliminando' : 'Eliminar'}
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            <div className="ml-9 text-gray-600 text-sm mt-1 text-justify">
                <p>Código postal {address.postalCode} - {address.state} - {address.city}</p>
                <p>{address.name} - {address.phone}</p>
            </div>
            <div className="ml-9 mt-3">
                <button className="text-blue-600 text-sm hover:underline py-2 px-4 text-left">
                    Editar
                </button>
            </div>
        </div>
    );

}

export default AddressCard;
