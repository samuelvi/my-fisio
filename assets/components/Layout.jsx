import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    HomeIcon,
    UsersIcon,
    CalendarIcon,
    DocumentTextIcon,
    ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const appTitle = import.meta.env.VITE_APP_TITLE || '@TODO';

    const handleLogout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: HomeIcon },
        { name: 'Patients', path: '/patients', icon: UsersIcon },
        { name: 'Appointments', path: '/appointments', icon: CalendarIcon },
        { name: 'Invoices', path: '/invoices', icon: DocumentTextIcon },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex overflow-hidden">
            {/* Sidebar */}
            <div
                className={`${
                    isSidebarOpen ? 'w-64' : 'w-20'
                } bg-indigo-800 text-white flex-shrink-0 transition-all duration-300 ease-in-out relative flex flex-col`}
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-10 bg-indigo-600 rounded-full p-1 border-2 border-white text-white hover:bg-indigo-500 transition-colors z-20 shadow-md"
                >
                    {isSidebarOpen ? (
                        <ChevronLeftIcon className="h-4 w-4" />
                    ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                    )}
                </button>

                {/* Logo Area */}
                <div className={`p-6 border-b border-indigo-700 h-20 flex items-center ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
                    <span className={`font-bold text-xl truncate transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                        {appTitle}
                    </span>
                    {!isSidebarOpen && (
                        <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-inner">
                            {appTitle.charAt(0)}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="mt-6 flex-1 px-3 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center p-3 rounded-lg transition-colors group relative ${
                                    isActive
                                        ? 'bg-indigo-900 text-white shadow-sm'
                                        : 'text-indigo-100 hover:bg-indigo-700'
                                } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
                                title={!isSidebarOpen ? item.name : ''}
                            >
                                <item.icon className={`h-6 w-6 flex-shrink-0 ${isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white'}`} />
                                <span className={`ml-3 font-medium transition-all duration-300 truncate ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                                    {item.name}
                                </span>

                                {/* Tooltip for collapsed state */}
                                {!isSidebarOpen && (
                                    <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout at bottom */}
                <div className="p-3 border-t border-indigo-700">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full p-3 rounded-lg text-indigo-100 hover:bg-red-700 hover:text-white transition-colors group relative ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
                        title={!isSidebarOpen ? 'Logout' : ''}
                    >
                        <ArrowLeftOnRectangleIcon className="h-6 w-6 flex-shrink-0 text-indigo-300 group-hover:text-white" />
                        <span className={`ml-3 font-medium transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                            Logout
                        </span>
                        {!isSidebarOpen && (
                            <div className="absolute left-16 bg-red-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                Logout
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white shadow-sm h-16 flex-shrink-0 px-8 flex justify-between items-center z-10">
                    <h2 className="text-xl font-semibold text-gray-800">Clinic Management</h2>
                    <div className="text-sm text-gray-500 font-medium">
                        Administrator
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-gray-100">
                    {children}
                </main>
            </div>
        </div>
    );
}
