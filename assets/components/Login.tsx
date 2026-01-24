import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import Routing from '../routing/init';
import { useLanguage } from './LanguageContext';

export default function Login() {
    const { language, t, changeLanguage } = useLanguage();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [sessionExpired, setSessionExpired] = useState<boolean>(false);
    const location = useLocation();

    const dashboardUrl = Routing.generate('app_home', { reactRouting: 'dashboard' });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const isExpired = params.get('expired');

        if (isExpired) {
            setSessionExpired(true);
            localStorage.removeItem('token');
        }

        // Dev/test convenience: auto-fill login form (empty in production)
        const envEmail = import.meta.env.VITE_AUTH_EMAIL as string;
        const envPassword = import.meta.env.VITE_AUTH_PASSWORD as string;
        if (envEmail) setEmail(envEmail);
        if (envPassword) setPassword(envPassword);
    }, [location.search]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (localStorage.getItem('token') && !params.get('expired')) {
            window.location.href = dashboardUrl;
        }
    }, [dashboardUrl, location.search]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await axios.post(
                Routing.generate('api_login_check'),
                {
                    username: email,
                    password: password
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            const jwt = response.data.token;
            localStorage.setItem('token', jwt);
            axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
            window.location.href = dashboardUrl;
            
        } catch (err) {
            setError(t('invalid_credentials'));
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md w-full space-y-8">
                <div className="flex justify-center space-x-4 mb-4">
                    <button 
                        onClick={() => changeLanguage('en')}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all border ${language === 'en' ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white text-gray-400 border-gray-200 hover:border-primary/30'}`}
                    >
                        {t('english')}
                    </button>
                    <button 
                        onClick={() => changeLanguage('es')}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all border ${language === 'es' ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white text-gray-400 border-gray-200 hover:border-primary/30'}`}
                    >
                        {t('spanish')}
                    </button>
                </div>

                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        {t('sign_in_to_account')}
                    </h2>
                </div>

                {sessionExpired && (
                    <div className="bg-primary/5 border-l-4 border-primary p-4 mb-4 rounded-r-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-12 0 8 8 0 0112 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-bold text-primary">
                                    {t('session_expired_msg')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">
                                {t('email_address')}
                            </label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">
                                {t('password')}
                            </label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-xs text-center font-black bg-red-50 py-2 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-lg hover:shadow-primary/30 active:scale-95"
                        >
                            {t('sign_in')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}