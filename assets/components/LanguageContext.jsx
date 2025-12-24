import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE || 'en';
    const [locale, setLocale] = useState(localStorage.getItem('app_locale') || defaultLocale);
    
    // Get translations from global window object injected by Twig
    const allTranslations = window.APP_TRANSLATIONS || {};
    const [translations, setTranslations] = useState(allTranslations[locale] || {});

    useEffect(() => {
        setTranslations(allTranslations[locale] || {});
        localStorage.setItem('app_locale', locale);
    }, [locale, allTranslations]);

    const t = (key) => {
        return translations[key] || key;
    };

    const changeLanguage = (newLocale) => {
        setLocale(newLocale);
    };

        return (

            <LanguageContext.Provider value={{ language: locale, locale, t, changeLanguage }}>

                {children}

            </LanguageContext.Provider>

        );

    };

    

    export const useLanguage = () => {

        const context = useContext(LanguageContext);

        if (!context) {

            throw new Error('useLanguage must be used within a LanguageProvider');

        }

        return context;

    };

    

    // Backward compatibility alias

    export const useTranslation = useLanguage;

    