import React from "react";
import { MdChevronRight } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'

const AccountSection = ({ icon, title, description, route }) => {
    const navigate = useNavigate();
    
    const handleClick = () => {
        if(route){ // Solo navegar si se proporciona una ruta.
            navigate(route);
        }
    }

    return (
        <div
            className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            onClick={handleClick} // Add onClick handler
        >
            <div className="flex items-center">
                <div className="p-2 mr-3">
                    {icon}
                </div>
                <div>
                    <p className="text-gray-800 font-medium flex items-center">
                        {title}
                    </p>
                    {description && (
                        <p className="text-gray-500 text-sm mt-0.5">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            <MdChevronRight size={20} className="text-gray-400" />
        </div>
    );
};

export default AccountSection;