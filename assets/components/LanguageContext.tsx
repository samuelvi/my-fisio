import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface LanguageContextType {
    language: string;
    locale: string;
    t: (key: string, params?: Record<string, string | number> | null) => string;
    changeLanguage: (newLocale: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const defaultLocale = (import.meta.env.VITE_DEFAULT_LOCALE as string) || 'en';
    const initialLocale = localStorage.getItem('app_locale') || defaultLocale;
    const [locale, setLocale] = useState<string>(initialLocale);
    
    const allTranslations = (window as any).APP_TRANSLATIONS || {};
    const [translations, setTranslations] = useState<Record<string, string>>(allTranslations[initialLocale] || {});

    useEffect(() => {
        // Re-sync translations if window object changed or locale changed
        const currentAllTranslations = (window as any).APP_TRANSLATIONS || {};
        setTranslations(currentAllTranslations[locale] || {});
        localStorage.setItem('app_locale', locale);
        axios.defaults.headers.common['X-App-Locale'] = locale;
    }, [locale]);

    const t = (key: string, params: Record<string, string | number> | null = null): string => {
        let value = translations[key] || key;
        if (params && typeof value === 'string') {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
            });
        }
        return value;
    };

    const changeLanguage = (newLocale: string) => {
        setLocale(newLocale);
    };

    return (
        <LanguageContext.Provider value={{ language: locale, locale, t, changeLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

// Backward compatibility alias
export const useTranslation = useLanguage;