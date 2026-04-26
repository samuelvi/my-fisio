import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './app.css';
import './routing/init';
import { LanguageProvider } from './components/LanguageContext';
import { hasSessionToken } from './presentation/auth/sessionStore';
import { initializeFrontendBootstrap } from './presentation/bootstrap/frontendBootstrap';
import { queryClient } from './presentation/query/queryClient';

import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import Login from './components/Login';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';
import PatientForm from './components/PatientForm';
import RecordForm from './components/RecordForm';
import FullHistory from './components/FullHistory';
import Calendar from './components/Calendar';
import PatientAppointmentList from './components/PatientAppointmentList';
import InvoiceList from './components/invoices/InvoiceList';
import InvoiceForm from './components/invoices/InvoiceForm';
import InvoiceGaps from './components/invoices/InvoiceGaps';
import CustomerList from './components/customers/CustomerList';
import CustomerForm from './components/customers/CustomerForm';

initializeFrontendBootstrap(true);

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const isAuthenticated = hasSessionToken();
    if (!isAuthenticated) {
        return <Navigate to="/login?expired=1" replace />;
    }
    return <>{children}</>;
};

function App() {
    const isAuthenticated = hasSessionToken();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
                } />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />

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

                <Route path="/patients/:id/appointments" element={
                    <ProtectedRoute>
                        <Layout>
                            <PatientAppointmentList />
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
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <App />
                </LanguageProvider>
            </QueryClientProvider>
        </React.StrictMode>
    );
}
