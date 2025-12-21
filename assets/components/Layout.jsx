import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Layout({ children }) {
    const navigate = useNavigate();
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <div className="w-64 bg-indigo-800 text-white flex-shrink-0">
                <div className="p-6 text-2xl font-bold border-b border-indigo-700">
                    PhysioApp
                </div>
                <nav className="mt-6">
                    <Link to="/" className="block py-3 px-6 hover:bg-indigo-700 transition">
                        Dashboard
                    </Link>
                    <Link to="/patients" className="block py-3 px-6 hover:bg-indigo-700 transition">
                        Patients
                    </Link>
                    <Link to="/appointments" className="block py-3 px-6 hover:bg-indigo-700 transition">
                        Appointments
                    </Link>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Clinic Management</h2>
                    <button 
                        onClick={handleLogout}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                        Logout
                    </button>
                </header>

                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
