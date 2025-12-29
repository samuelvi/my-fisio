import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import { LanguageProvider } from './components/LanguageContext';
import './app.css';
import './routing/init';

// Apply color variables
const colorVars = {
    '--color-primary': import.meta.env.VITE_COLOR_PRIMARY,
    '--color-primary-light': import.meta.env.VITE_COLOR_PRIMARY_LIGHT,
    '--color-primary-dark': import.meta.env.VITE_COLOR_PRIMARY_DARK,
    '--color-primary-darker': import.meta.env.VITE_COLOR_PRIMARY_DARKER,
    '--color-btn-success': import.meta.env.VITE_COLOR_BTN_SUCCESS,
    '--color-btn-danger': import.meta.env.VITE_COLOR_BTN_DANGER,
    '--color-btn-secondary': import.meta.env.VITE_COLOR_BTN_SECONDARY,
    '--color-btn-info': import.meta.env.VITE_COLOR_BTN_INFO,
    '--color-calendar-appointment': import.meta.env.VITE_COLOR_CALENDAR_APPOINTMENT,
    '--color-calendar-other': import.meta.env.VITE_COLOR_CALENDAR_OTHER,
    '--color-calendar-text-other': import.meta.env.VITE_COLOR_CALENDAR_TEXT_OTHER,
    '--color-calendar-event-default': import.meta.env.VITE_COLOR_CALENDAR_EVENT_DEFAULT,
};

Object.entries(colorVars).forEach(([key, value]) => {
    if (value) {
        document.documentElement.style.setProperty(key, value);
    }
});

// Configure Axios
axios.defaults.headers.common['Accept'] = 'application/ld+json';
axios.defaults.headers.common['Content-Type'] = 'application/ld+json';

const rootElement = document.getElementById('login-app');
if (rootElement) {
    const props = JSON.parse(rootElement.dataset.props || '{}');
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <LanguageProvider>
                    <Login {...props} />
                </LanguageProvider>
            </BrowserRouter>
        </React.StrictMode>
    );
}
