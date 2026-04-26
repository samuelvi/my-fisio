import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Login from './components/Login';
import { LanguageProvider } from './components/LanguageContext';
import './app.css';
import './routing/init';
import { initializeFrontendBootstrap } from './presentation/bootstrap/frontendBootstrap';

initializeFrontendBootstrap(false);

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
