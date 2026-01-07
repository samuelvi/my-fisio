import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import RecordTimeline from './RecordTimeline';
import { useLanguage } from './LanguageContext';
import Routing from '../routing/init';
import { Patient, Appointment } from '../types';

export default function PatientDetail() {
    const { t } = useLanguage();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const statePatient = (location.state as { patient?: Patient } | null)?.patient ?? null;
    const storedPatient = (() => {
        const raw = sessionStorage.getItem('patientDetail');
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw) as Patient;
            return id && parsed?.id && String(parsed.id) === String(id) ? parsed : null;
        } catch {
            return null;
        }
    })();
    const fallbackPatient = statePatient ?? storedPatient;
    const [patient, setPatient] = useState<Patient | null>(fallbackPatient);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            const [patientResult, appointmentsResult] = await Promise.allSettled([
                axios.get<Patient>(Routing.generate('api_patients_get', { id })),
                axios.get(Routing.generate('api_appointments_collection'), {
                    params: { patientId: id }
                })
            ]);

            if (patientResult.status === 'fulfilled') {
                setPatient(patientResult.value.data);
                sessionStorage.removeItem('patientDetail');
            } else {
                console.error('Error fetching patient data:', patientResult.reason);
                if (!fallbackPatient) {
                    setPatient(null);
                }
            }

            if (appointmentsResult.status === 'fulfilled') {
                const appData = appointmentsResult.value.data['member'] || appointmentsResult.value.data['hydra:member'] || [];
                setAppointments(appData);
            } else {
                console.error('Error fetching appointments:', appointmentsResult.reason);
                setAppointments([]);
            }

            setLoading(false);
        };

        fetchData();
    }, [id]);

    const handleAddRecord = () => {
        navigate(`/patients/${id}/records/new`);
    };

    const handleEdit = () => {
        navigate(`/patients/${id}/edit`);
    };

    if (loading) return <div className="p-4 sm:p-8 text-center font-bold text-gray-500">{t('loading')}...</div>;
    if (!patient) return <div className="p-4 sm:p-8 text-center text-red-600 font-bold">{t('error_could_not_load_patient')}</div>;

    return (
        <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
            <button onClick={() => navigate('/patients')} className="text-primary font-bold hover:text-primary-dark mb-4 inline-flex items-center transition">
                ← {t('back_to_list')}
            </button>

            <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
                <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                        {t('patient_information')}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${patient.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                            {t(patient.status)}
                        </span>
                        <Link to={`/invoices/new?patientId=${patient.id}`} className="text-sm text-green-600 hover:text-green-700 font-black transition-colors flex items-center">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {t('generate_invoice')}
                        </Link>
                        <button onClick={handleEdit} data-testid="edit-details-btn" className="text-sm text-primary hover:text-primary-dark font-black transition-colors flex items-center">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            {t('edit_details')}
                        </button>
                    </div>
                </div>
                <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-8 space-y-6 sm:space-y-0">
                        <div className="flex-shrink-0">
                            <span className="h-20 w-20 sm:h-28 sm:w-28 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl sm:text-4xl font-black border border-primary/10 shadow-inner">
                                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                            </span>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm">
                            <div>
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('full_name')}</dt>
                                <dd className="text-lg font-bold text-gray-900">{patient.firstName} {patient.lastName}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('phone')}</dt>
                                <dd className="text-gray-900 font-bold">{patient.phone || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('email')}</dt>
                                <dd className="text-gray-900 font-bold truncate" title={patient.email}>{patient.email || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('date_of_birth')}</dt>
                                <dd className="text-gray-900 font-bold">
                                    {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'}
                                </dd>
                            </div>
                             <div>
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('profession')}</dt>
                                <dd className="text-gray-900 font-bold">{patient.profession || '-'}</dd>
                            </div>
                             <div>
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sports_activity')}</dt>
                                <dd className="text-gray-900 font-bold">{patient.sportsActivity || '-'}</dd>
                            </div>
                            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('address')}</dt>
                                <dd className="text-gray-900 font-bold">{patient.address || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('rate')}</dt>
                                <dd className="text-gray-900 font-bold">{patient.rate || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('dni')}</dt>
                                <dd className="text-gray-900 font-bold">{patient.taxId || '-'}</dd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2">
                    <RecordTimeline 
                        records={patient.records || []} 
                        patient={patient}
                        patientId={patient.id}
                        onAddRecord={handleAddRecord} 
                    />
                </div>

                <div className="space-y-6 sm:space-y-8">
                    <div className="bg-white shadow-sm rounded-2xl p-4 sm:p-6 border-l-4 border-primary border border-gray-200">
                        <h4 className="text-sm font-black text-gray-900 mb-4 flex justify-between items-center uppercase tracking-widest">
                            {t('next_appointments')}
                            <button onClick={() => navigate('/appointments')} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-lg hover:bg-primary hover:text-white transition-all uppercase">{t('schedule')}</button>
                        </h4>
                        <div className="space-y-4">
                            {appointments.length > 0 ? (
                                appointments.slice(0, 3).map(app => (
                                    <div key={app.id} className="text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                        <p className="font-bold text-gray-800">{new Date(app.startsAt).toLocaleDateString()} - {new Date(app.startsAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        <p className="text-gray-500 truncate mt-0.5 font-medium">{app.title}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic font-medium">{t('no_upcoming_appointments')}</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-2xl p-4 sm:p-6 border-l-4 border-red-500 border border-gray-200">
                        <h4 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">{t('medical_alerts')}</h4>
                        <div className="space-y-4 text-xs font-bold">
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">{t('allergies')}</span>
                                <p className="text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{patient.allergies || t('none_recorded')}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">{t('systemic_diseases')}</span>
                                <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-100">{patient.systemicDiseases || t('none_recorded')}</p>
                            </div>
                             <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">{t('current_medication')}</span>
                                <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-100">{patient.medication || t('none_recorded')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm rounded-2xl p-4 sm:p-6 border-l-4 border-yellow-500 border border-gray-200">
                        <h4 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">{t('history_details')}</h4>
                         <div className="space-y-4 text-xs font-bold">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">{t('surgeries')}</span>
                                    <p className="text-gray-900 truncate">{patient.surgeries || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">{t('accidents')}</span>
                                    <p className="text-gray-900 truncate">{patient.accidents || '-'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">{t('bruxism')}</span>
                                    <p className="text-gray-900">{patient.bruxism || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">{t('insoles')}</span>
                                    <p className="text-gray-900">{patient.insoles || '-'}</p>
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">{t('others')}</span>
                                <p className="text-gray-900">{patient.others || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
