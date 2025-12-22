import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './app.css';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';
import PatientForm from './components/PatientForm';
import RecordForm from './components/RecordForm';
import FullHistory from './components/FullHistory';
import Calendar from './components/Calendar';

// 1. Configure Basic Axios Defaults
axios.defaults.headers.common['Accept'] = 'application/ld+json';
axios.defaults.headers.common['Content-Type'] = 'application/ld+json';

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
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={
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

                {/* Catch-all for undefined routes */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
