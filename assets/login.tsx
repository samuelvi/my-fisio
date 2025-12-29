import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import { LanguageProvider } from './components/LanguageContext';
import './app.css';
import './routing/init';

const colorVars: Record<string, string | undefined> = {
    '--color-primary': import.meta.env.VITE_COLOR_PRIMARY as string,
    '--color-primary-light': import.meta.env.VITE_COLOR_PRIMARY_LIGHT as string,
    '--color-primary-dark': import.meta.env.VITE_COLOR_PRIMARY_DARK as string,
    '--color-primary-darker': import.meta.env.VITE_COLOR_PRIMARY_DARKER as string,
    '--color-btn-success': import.meta.env.VITE_COLOR_BTN_SUCCESS as string,
    '--color-btn-danger': import.meta.env.VITE_COLOR_BTN_DANGER as string,
    '--color-btn-secondary': import.meta.env.VITE_COLOR_BTN_SECONDARY as string,
    '--color-btn-info': import.meta.env.VITE_COLOR_BTN_INFO as string,
    '--color-calendar-appointment': import.meta.env.VITE_COLOR_CALENDAR_APPOINTMENT as string,
    '--color-calendar-other': import.meta.env.VITE_COLOR_CALENDAR_OTHER as string,
    '--color-calendar-text-other': import.meta.env.VITE_COLOR_CALENDAR_TEXT_OTHER as string,
    '--color-calendar-event-default': import.meta.env.VITE_COLOR_CALENDAR_EVENT_DEFAULT as string,
};

Object.entries(colorVars).forEach(([key, value]) => {
    if (value) {
        document.documentElement.style.setProperty(key, value);
    }
});

axios.defaults.headers.common['Accept'] = 'application/ld+json';
axios.defaults.headers.common['Content-Type'] = 'application/ld+json';

const rootElement = document.getElementById('login-app');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <LanguageProvider>
                    <Login />
                </LanguageProvider>
            </BrowserRouter>
        </React.StrictMode>
    );
}