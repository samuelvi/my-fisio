import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './app.css';
import { LanguageProvider } from './components/LanguageContext';
import { RouteProvider } from './components/RouteContext';

import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';
import PatientForm from './components/PatientForm';
import RecordForm from './components/RecordForm';
import FullHistory from './components/FullHistory';
import Calendar from './components/Calendar';
import InvoiceList from './components/invoices/InvoiceList';
import InvoiceForm from './components/invoices/InvoiceForm';
import InvoiceGaps from './components/invoices/InvoiceGaps';

// 1. Configure Basic Axios Defaults
axios.defaults.headers.common['Accept'] = 'application/ld+json';
axios.defaults.headers.common['Content-Type'] = 'application/ld+json';

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

const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// 2. Global Response Interceptor for Session Expiration
axios.interceptors.response.use(
    (response) => {
        if (response.data && response.data.code === 401) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            window.location.href = '/login?expired=1';
            return new Promise(() => {});
        }
        return response;
    },
    (error) => {
        const isUnauthorized = error.response && error.response.status === 401;
        
        if (isUnauthorized && !window.location.pathname.includes('/login')) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            window.location.href = '/login?expired=1';
            return new Promise(() => {});
        }
        return Promise.reject(error);
    }
);

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('token');
    if (!isAuthenticated) {
        window.location.href = '/login?expired=1';
        return null;
    }
    return children;
};

function App() {
    const isAuthenticated = !!localStorage.getItem('token');
    if (!isAuthenticated) {
        window.location.href = '/login';
        return null;
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/patients" element={
                    <ProtectedRoute>
                        <Layout>
                            <PatientList />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/patients/new" element={
                    <ProtectedRoute>
                        <Layout>
                            <PatientForm />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/patients/:id" element={
                    <ProtectedRoute>
                        <Layout>
                            <PatientDetail />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/patients/:id/history" element={
                    <ProtectedRoute>
                        <Layout>
                            <FullHistory />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/patients/:id/edit" element={
                    <ProtectedRoute>
                        <Layout>
                            <PatientForm />
                        </Layout>
                    </ProtectedRoute>
                } />

                 <Route path="/patients/:patientId/records/new" element={
                    <ProtectedRoute>
                        <Layout>
                            <RecordForm />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/patients/:patientId/records/:recordId/edit" element={
                    <ProtectedRoute>
                        <Layout>
                            <RecordForm />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/appointments" element={
                    <ProtectedRoute>
                        <Layout>
                             <Calendar />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/invoices" element={
                    <ProtectedRoute>
                        <Layout>
                            <InvoiceList />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/invoices/new" element={
                    <ProtectedRoute>
                        <Layout>
                            <InvoiceForm />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/invoices/:id/edit" element={
                    <ProtectedRoute>
                        <Layout>
                            <InvoiceForm />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/invoices/gaps" element={
                    <ProtectedRoute>
                        <Layout>
                            <InvoiceGaps />
                        </Layout>
                    </ProtectedRoute>
                } />

                {/* Catch-all for undefined routes */}
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </BrowserRouter>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const routes = JSON.parse(rootElement.dataset.routes || '{}');
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <RouteProvider routes={routes}>
                <LanguageProvider>
                    <App />
                </LanguageProvider>
            </RouteProvider>
        </React.StrictMode>
    );
}
