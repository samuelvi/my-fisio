import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios, { AxiosResponse, AxiosError } from 'axios';
import './app.css';
import './routing/init';
import { LanguageProvider } from './components/LanguageContext';

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
import CustomerList from './components/customers/CustomerList';
import CustomerForm from './components/customers/CustomerForm';

axios.defaults.headers.common['Accept'] = 'application/ld+json';
axios.defaults.headers.common['Content-Type'] = 'application/ld+json';

const colorVars: Record<string, string | undefined> = {
    '--color-primary': import.meta.env.VITE_COLOR_PRIMARY as string,
    '--color-primary-light': import.meta.env.VITE_COLOR_PRIMARY_LIGHT as string,
    '--color-primary-dark': import.meta.env.VITE_COLOR_PRIMARY_DARK as string,
    '--color-primary-darker': import.meta.env.VITE_COLOR_PRIMARY_DARKER as string,
    '--color-primary-selected': import.meta.env.VITE_COLOR_PRIMARY_SELECTED as string,
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

const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

axios.interceptors.response.use(
    (response: AxiosResponse) => {
        if (response.data && (response.data as any).code === 401) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            window.location.href = '/login?expired=1';
            return new Promise(() => {});
        }
        return response;
    },
    (error: AxiosError) => {
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

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const isAuthenticated = !!localStorage.getItem('token');
    if (!isAuthenticated) {
        window.location.href = '/login?expired=1';
        return null;
    }
    return <>{children}</>;
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

                <Route path="/customers" element={
                    <ProtectedRoute>
                        <Layout>
                            <CustomerList />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/customers/new" element={
                    <ProtectedRoute>
                        <Layout>
                            <CustomerForm />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/customers/:id/edit" element={
                    <ProtectedRoute>
                        <Layout>
                            <CustomerForm />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </BrowserRouter>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <LanguageProvider>
                <App />
            </LanguageProvider>
        </React.StrictMode>
    );
}