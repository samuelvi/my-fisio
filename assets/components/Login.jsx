import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from './LanguageContext';

export default function Login() {
    const { locale, t, changeLanguage } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [sessionExpired, setSessionExpired] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check for expired session parameter
        const params = new URLSearchParams(location.search);
        if (params.get('expired')) {
            setSessionExpired(true);
        }

        // Auto-fill credentials in development
        const envEmail = import.meta.env.VITE_AUTH_EMAIL;
        const envPassword = import.meta.env.VITE_AUTH_PASSWORD;
        
        if (envEmail) setEmail(envEmail);
        if (envPassword) setPassword(envPassword);
    }, [location.search]);

    useEffect(() => {
        if (localStorage.getItem('token')) {
            navigate('/');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await axios.post('/api/login_check', {
                username: email,
                password: password
            });

            const jwt = response.data.token;
            localStorage.setItem('token', jwt);
            axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
            navigate('/');
            
        } catch (err) {
            setError(t('invalid_credentials') || 'Invalid credentials');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="flex justify-center space-x-4 mb-4">
                    <button 
                        onClick={() => changeLanguage('en')}
                        className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${locale === 'en' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200 hover:border-indigo-300'}`}
                    >
                        English
                    </button>
                    <button 
                        onClick={() => changeLanguage('es')}
                        className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${locale === 'es' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200 hover:border-indigo-300'}`}
                    >
                        Español
                    </button>
                </div>

                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {t('sign_in_to_account') || 'Sign in to your account'}
                    </h2>
                </div>

                {sessionExpired && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-12 0 8 8 0 0112 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    {t('session_expired_msg') || 'Your session has expired. Please log in again to continue.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder={t('email_address') || "Email address"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder={t('password') || "Password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center font-bold">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {t('sign_in') || 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}