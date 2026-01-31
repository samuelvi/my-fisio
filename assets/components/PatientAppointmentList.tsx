import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import Routing from '../routing/init';
import { Appointment, Patient } from '../types';

export default function PatientAppointmentList() {
    const { t } = useLanguage();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [hasNextPage, setHasNextPage] = useState<boolean>(false);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const fetchPatient = async () => {
            if (!id) return;
            try {
                const response = await axios.get<Patient>(Routing.generate('api_patients_get', { id }));
                setPatient(response.data);
            } catch (error) {
                console.error('Error fetching patient:', error);
            }
        };
        fetchPatient();
    }, [id]);

    useEffect(() => {
        fetchAppointments();
    }, [id, page]);

    const fetchAppointments = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await axios.get(Routing.generate('api_appointments_collection'), {
                params: { 
                    patientId: id,
                    page: page,
                    itemsPerPage: ITEMS_PER_PAGE + 1,
                    order: 'DESC' // Most recent first
                }
            });
            
            const data: Appointment[] = response.data['member'] || response.data['hydra:member'] || [];
            
            if (data.length > ITEMS_PER_PAGE) {
                setHasNextPage(true);
                setAppointments(data.slice(0, ITEMS_PER_PAGE));
            } else {
                setHasNextPage(false);
                setAppointments(data);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    if (!patient && !loading) return <div className="p-8 text-center text-red-600 font-bold">{t('error_could_not_load_patient')}</div>;

    const Pagination = () => (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-t border-b border-gray-100 bg-gray-50/50 px-4 rounded-lg my-4">
            <div className="flex items-center flex-wrap gap-3">
                <div className="flex items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-3">{t('page')}</span>
                    <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black shadow-lg">
                        {page}
                    </div>
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {t('listing_results', { count: appointments.length })}
                </span>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="inline-flex items-center px-5 py-2 border border-gray-200 text-xs font-black rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm uppercase tracking-widest"
                >
                    {t('previous')}
                </button>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasNextPage || loading}
                    className="inline-flex items-center px-5 py-2 border border-gray-200 text-xs font-black rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm uppercase tracking-widest"
                >
                    {t('next')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6">
            <button onClick={() => navigate('/patients')} className="text-primary font-bold hover:text-primary-dark mb-6 inline-flex items-center transition">
                ← {t('back_to_list')}
            </button>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{t('appointments')}</h1>
                    <p className="text-gray-500 font-bold mt-1">
                        {patient ? `${patient.firstName} ${patient.lastName}` : '...'}
                    </p>
                </div>
                <Link 
                    to="/appointments"
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-black text-sm transition shadow-lg shadow-primary/20 active:scale-95 inline-flex items-center justify-center"
                >
                    {t('clinic_calendar')}
                </Link>
            </div>

            <Pagination />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading && page === 1 ? (
                    <div className="py-20 text-center text-gray-400 font-bold">{t('loading')}...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('date')}</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('title')}</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('type')}</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('notes')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {appointments.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {new Date(app.startsAt).toLocaleDateString()} <span className="text-gray-400 font-normal">|</span> {new Date(app.startsAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className="px-6 py-5 text-sm font-bold text-gray-700">
                                            {app.title}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                                                app.type === 'other' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-primary/10 text-primary border border-primary/10'
                                            }`}>
                                                {t(app.type || 'appointment')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-xs text-gray-500 max-w-xs truncate font-medium">
                                            {app.notes || '-'}
                                        </td>
                                    </tr>
                                ))}
                                {appointments.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <p className="text-gray-400 font-bold">{t('no_upcoming_appointments')}</p>
                                        </td>
                                    </tr>
                                ) }
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Pagination />
        </div>
    );
}
