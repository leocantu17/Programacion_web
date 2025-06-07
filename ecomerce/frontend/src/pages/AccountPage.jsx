import React, { use } from "react";
import {MdPerson, MdCreditCard, MdLocationOn, MdFavoriteBorder} from 'react-icons/md'
import { useAuth} from '../contexts/AuthContext'; 
// import { User, CreditCard, MapPin, Heart } from 'lucide-react';
import AccountSection from "../components/Commons/AccountSections";
import { useNavigate } from "react-router-dom";


const AccountPage = () => {

    const {user} = useAuth()
    const accountSections = [
        {
            icon: <MdPerson size={24} className="text-blue-500" />,
            title: 'Información personal',
            description: 'Información de tu identificación oficial y tu actividad fiscal.',
            route: '/personal-info', // Added route
        },
        {
            icon: <MdCreditCard size={24} className="text-blue-500" />,
            title: 'Tarjetas',
            description: 'Tarjetas guardadas en tu cuenta.',
            route: '/cards', // Added route
        },
        {
            icon: <MdLocationOn size={24} className="text-blue-500" />,
            title: 'Direcciones',
            description: 'Direcciones guardadas en tu cuenta.',
            route: '/addresses', // Added route
        },
        {
            icon: <MdFavoriteBorder size={24} className="text-red-500" />, // HeartCircle icon
            title: 'Wishlist',
            description: 'Tus productos guardados para comprar después.',
            route: '/wishlist', // Added route
        },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-4 flex justify-center items-start">
            <div className="bg-white rounded-lg shadow-md w-full max-w-2xl">
                {/* User Info Header */}
                <div className="flex items-center p-6 border-b border-gray-200">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 text-2xl font-semibold mr-4">
                        {user?.nombre.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{user?.nombre || "UserName"}</h2>
                        <p className="text-gray-500 text-sm">{user?.email || "Correo Electronico de Usuario"}</p>
                    </div>
                </div>

                {/* Account Sections */}
                <div className="py-2">
                    {accountSections.map((section, index) => (
                        <AccountSection
                            key={index}
                            icon={section.icon}
                            title={section.title}
                            description={section.description}
                            route={section.route}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
export default AccountPage;