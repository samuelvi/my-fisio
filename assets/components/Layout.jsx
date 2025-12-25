import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from './LanguageContext';
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
    const { language, t, changeLanguage } = useLanguage();
    const appTitle = import.meta.env.VITE_APP_TITLE || 'PhysioApp';    
    
    React.useEffect(() => {
        document.title = appTitle;
    }, [appTitle]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/login');
    };

    const navItems = [
        { name: t('dashboard'), path: '/dashboard', icon: HomeIcon },
        { name: t('patients'), path: '/patients', icon: UsersIcon },
        { name: t('appointments'), path: '/appointments', icon: CalendarIcon },
        { name: t('invoices'), path: '/invoices', icon: DocumentTextIcon },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-hidden font-sans">
            {/* Sidebar */}
            <div
                className={`${
                    isSidebarOpen ? 'w-64' : 'w-20'
                } bg-primary-darker text-white flex-shrink-0 transition-all duration-300 ease-in-out relative flex flex-col shadow-xl z-20`}
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-10 bg-primary rounded-full p-1 border-2 border-white text-white hover:bg-primary-light transition-colors z-30 shadow-md"
                >
                    {isSidebarOpen ? (
                        <ChevronLeftIcon className="h-4 w-4 stroke-[3px]" />
                    ) : (
                        <ChevronRightIcon className="h-4 w-4 stroke-[3px]" />
                    )}
                </button>

                {/* Logo Area */}
                <div className={`p-6 border-b border-white/10 h-20 flex items-center ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
                    <span className={`font-black text-xl tracking-tighter truncate transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                        {appTitle}
                    </span>
                    {!isSidebarOpen && (
                        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-lg shadow-inner border border-white/20">
                            {appTitle.charAt(0)}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="mt-6 flex-1 px-3 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center p-3 rounded-xl transition-all group relative ${
                                    isActive
                                        ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
                                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                                } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
                                title={!isSidebarOpen ? item.name : ''}
                            >
                                <item.icon className={`h-6 w-6 flex-shrink-0 transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-white/40 group-hover:text-white group-hover:scale-110'}`} />
                                <span className={`ml-3 font-bold text-sm transition-all duration-300 truncate ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                                    {item.name}
                                </span>

                                {/* Tooltip for collapsed state */}
                                {!isSidebarOpen && (
                                    <div className="absolute left-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-white/10">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Language Switcher */}
                <div className="p-4 border-t border-white/10">
                    <div className={`flex items-center ${isSidebarOpen ? 'justify-between px-2' : 'justify-center'} py-2`}>
                        {isSidebarOpen && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                {t('language')}
                            </span>
                        )}
                        <div className={`flex ${isSidebarOpen ? 'space-x-2' : 'flex-col space-y-2'} items-center`}>
                            <button 
                                onClick={() => changeLanguage('en')}
                                className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all border ${language === 'en' ? 'bg-primary text-white border-primary shadow-lg' : 'text-white/40 border-white/10 hover:text-white hover:bg-white/10'}`}
                                title={t('english')}
                            >
                                EN
                            </button>
                            <button 
                                onClick={() => changeLanguage('es')}
                                className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all border ${language === 'es' ? 'bg-primary text-white border-primary shadow-lg' : 'text-white/40 border-white/10 hover:text-white hover:bg-white/10'}`}
                                title={t('spanish')}
                            >
                                ES
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-white/10">
                    <button 
                        onClick={handleLogout}
                        className={`flex items-center w-full p-3 rounded-xl text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all group relative border border-transparent hover:border-red-500/30 ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
                        title={!isSidebarOpen ? t('logout') : ''}
                    >
                        <ArrowLeftOnRectangleIcon className="h-6 w-6 flex-shrink-0 transition-transform group-hover:scale-110" />
                        <span className={`ml-3 font-bold text-sm transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                            {t('logout')}
                        </span>
                        {!isSidebarOpen && (
                            <div className="absolute left-16 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-red-400/30">
                                {t('logout')}
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-20 flex-shrink-0 px-8 flex justify-between items-center z-10">
                    <h2 className="text-xl font-black text-gray-800 tracking-tight">{t('clinic_management')}</h2>
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <div className="text-sm font-black text-gray-900 leading-none">{t('administrator')}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Online</div>
                        </div>
                        <div className="h-10 w-10 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center">
                            <UsersIcon className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
