import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext';

export default function Layout({ children }: { children: ReactNode }) {
    const { t, language, changeLanguage } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const navigation = [
        { name: t('dashboard'), href: '/dashboard', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        )},
        { name: t('patients'), href: '/patients', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        )},
        { name: t('appointments'), href: '/appointments', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )},
        { name: t('invoices'), href: '/invoices', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )},
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <aside 
                className={`fixed inset-y-0 left-0 bg-primary border-r border-primary-dark/20 hidden lg:block z-20 transition-all duration-300 ${
                    isSidebarCollapsed ? 'w-20' : 'w-64'
                }`}
            >
                <div className="relative h-full flex flex-col">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="absolute -right-3 top-9 w-6 h-6 bg-primary rounded-full border border-primary-selected shadow-sm flex items-center justify-center text-white hover:text-primary-selected transition-colors z-50 cursor-pointer"
                    >
                        <svg className={`w-3 h-3 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="p-4">
                        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3 px-4'} mb-10 h-10`}>
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10 shrink-0">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            {!isSidebarCollapsed && (
                                <span className="text-xl font-black text-white tracking-tighter whitespace-nowrap overflow-hidden">TinaFisio</span>
                            )}
                        </div>

                        <nav className="space-y-1.5">
                            {navigation.map((item) => {
                                const isActive = location.pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        title={isSidebarCollapsed ? item.name : ''}
                                        className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3 rounded-xl transition-all duration-200 group ${
                                            isActive 
                                            ? 'bg-primary-light text-white shadow-md shadow-black/10' 
                                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <span className={`${isActive ? 'text-white' : 'text-white/60 group-hover:text-white transition-colors'}`}>
                                            {item.icon}
                                        </span>
                                        {!isSidebarCollapsed && (
                                            <span className="text-sm font-bold tracking-tight whitespace-nowrap">{item.name}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-auto p-4 border-t border-white/10">
                        <div className={`bg-primary-dark/30 rounded-2xl ${isSidebarCollapsed ? 'p-2' : 'p-4'} mb-4 overflow-hidden`}>
                            {!isSidebarCollapsed && (
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">{t('language')}</p>
                            )}
                            <div className={`flex ${isSidebarCollapsed ? 'flex-col space-y-2' : 'space-x-2'}`}>
                                <button 
                                    onClick={() => changeLanguage('en')}
                                    className={`flex-1 text-[10px] font-black py-2 rounded-lg transition-all ${language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-white/60 hover:text-white'}`}
                                >
                                    EN
                                </button>
                                <button 
                                    onClick={() => changeLanguage('es')}
                                    className={`flex-1 text-[10px] font-black py-2 rounded-lg transition-all ${language === 'es' ? 'bg-white text-primary shadow-sm' : 'text-white/60 hover:text-white'}`}
                                >
                                    ES
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3 px-4'} py-3 w-full rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200 group`}
                            title={isSidebarCollapsed ? t('logout') : ''}
                        >
                            <svg className="w-5 h-5 text-white/50 group-hover:text-red-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {!isSidebarCollapsed && (
                                <span className="text-sm font-bold tracking-tight">{t('logout')}</span>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="font-black text-gray-900 tracking-tighter">TinaFisio</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>
                </div>

                {isMobileMenuOpen && (
                    <div className="border-t border-gray-100 bg-white px-4 py-6 space-y-2 animate-in slide-in-from-top duration-200">
                        {navigation.map((item) => {
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl ${
                                        isActive ? 'bg-primary-light text-white' : 'text-gray-500 bg-gray-50'
                                    }`}
                                >
                                    {item.icon}
                                    <span className="text-sm font-bold">{item.name}</span>
                                </Link>
                            );
                        })}
                        <div className="pt-4 flex items-center justify-between">
                            <div className="flex space-x-2">
                                <button onClick={() => changeLanguage('en')} className={`px-3 py-1 rounded text-xs font-bold ${language === 'en' ? 'bg-primary text-white' : 'bg-gray-100'}`}>EN</button>
                                <button onClick={() => changeLanguage('es')} className={`px-3 py-1 rounded text-xs font-bold ${language === 'es' ? 'bg-primary text-white' : 'bg-gray-100'}`}>ES</button>
                            </div>
                            <button onClick={handleLogout} className="text-sm font-bold text-red-600">{t('logout')}</button>
                        </div>
                    </div>
                )}
            </header>

            <main className={`min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                {children}
            </main>
        </div>
    );
}