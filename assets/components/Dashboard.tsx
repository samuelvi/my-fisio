import React, { useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useLanguage } from './LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import Routing from '../routing/init';
import { DashboardStats, HealthCheck, Appointment, Patient } from '../types';

export default function Dashboard() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totalPatients: 0,
        appointmentsToday: 0,
        othersToday: 0,
        invoicesThisYear: 0
    });
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [health, setHealth] = useState<HealthCheck>({ status: 'loading', checks: {} });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const today = new Date();
                const startStr = today.toISOString().split('T')[0] + 'T00:00:00';
                const endStr = today.toISOString().split('T')[0] + 'T23:59:59';

                const [statsResponse, healthResponse, appointmentsResponse, patientsResponse] = await Promise.all([
                    axios.get<DashboardStats>(Routing.generate('api_dashboard_stats')),
                    axios.get<HealthCheck>(Routing.generate('api_health')),
                    axios.get(Routing.generate('api_appointments_collection'), {
                        params: { start: startStr, end: endStr }
                    }),
                    axios.get(Routing.generate('api_patients_collection'), {
                        params: { itemsPerPage: 5, 'order[id]': 'desc' }
                    })
                ]);
                
                setStats(statsResponse.data);
                setHealth(healthResponse.data);
                
                const appData = appointmentsResponse.data['member'] || appointmentsResponse.data['hydra:member'] || [];
                appData.sort((a: any, b: any) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
                setTodayAppointments(appData);

                const patientData = patientsResponse.data['member'] || patientsResponse.data['hydra:member'] || [];
                setRecentPatients(patientData);

            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                setHealth({ status: 'degraded', checks: {} });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, colorClass, icon, linkTo }: { title: string; value: number; colorClass: string; icon: ReactNode; linkTo?: string }) => (
        <div 
            onClick={() => linkTo && navigate(linkTo)}
            className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${colorClass} ${linkTo ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                        {value}
                    </p>
                </div>
                <div className="text-gray-300">
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 p-4 sm:p-6 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                    title={t('total_patients')}
                    value={loading ? 0 : stats?.totalPatients || 0}
                    colorClass="border-primary"
                    icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
                    linkTo={Routing.generate('app_home', { reactRouting: 'patients' })}
                />
                <StatCard
                    title={t('invoices_this_year')}
                    value={loading ? 0 : stats?.invoicesThisYear || 0}
                    colorClass="border-yellow-500"
                    icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>}
                    linkTo={Routing.generate('app_home', { reactRouting: 'invoices' })}
                />
                <StatCard
                    title={t('appointments_today')}
                    value={loading ? 0 : stats?.appointmentsToday || 0}
                    colorClass="border-primary"
                    icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
                    linkTo={Routing.generate('app_home', { reactRouting: 'appointments' })}
                />
                <StatCard
                    title={t('others_today')}
                    value={loading ? 0 : stats?.othersToday || 0}
                    colorClass="border-green-500"
                    icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                    linkTo={Routing.generate('app_home', { reactRouting: 'appointments' })}
                />
            </div>

            <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-primary/10 p-3 sm:p-4 rounded-full">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{t('welcome_back')}, {t('administrator')}</h3>
                        <p className="text-sm sm:text-base text-gray-500">{t('dashboard_subtitle')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 mt-6 sm:mt-8 border-t border-gray-100 pt-6 sm:pt-8">
                    <div>
                        <h4 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-widest">{t('quick_actions')}</h4>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => navigate('/patients/new')}
                                className="px-5 py-2.5 bg-[rgb(var(--color-btn-info))] text-primary-dark rounded-xl text-sm font-bold hover:bg-[rgb(var(--color-btn-secondary))] transition shadow-sm border border-primary/10"
                            >
                                {t('new_patient')}
                            </button>
                            <button
                                onClick={() => navigate('/appointments')}
                                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
                            >
                                {t('schedule_appointment')}
                            </button>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-widest">{t('system_status')}</h4>
                        <div className={`flex items-center space-x-3 text-sm font-bold px-4 py-3 rounded-xl border ${
                            health?.status === 'ok'
                                ? 'text-green-600 bg-green-50 border-green-100'
                                : 'text-yellow-700 bg-yellow-50 border-yellow-100'
                        }`}>
                            <span className="relative flex h-3 w-3">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                                    health?.status === 'ok' ? 'bg-green-400' : 'bg-yellow-300'
                                } opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                                    health?.status === 'ok' ? 'bg-green-500' : 'bg-yellow-400'
                                }`}></span>
                            </span>
                            <span>
                                {health?.status === 'ok' ? t('all_systems_operational') : t('system_issues_detected')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Today's Agenda */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">{t('today_agenda') || "Today's Agenda"}</h3>
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-lg">
                            {todayAppointments.length} {t('appointments')}
                        </span>
                    </div>
                    <div className="p-2 sm:p-4">
                        {loading ? (
                            <div className="py-12 text-center text-gray-400 font-bold">{t('loading')}...</div>
                        ) : todayAppointments.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 italic">{t('no_upcoming_appointments')}</div>
                        ) : (
                            <div className="space-y-2">
                                {todayAppointments.map((app) => (
                                    <div 
                                        key={app.id} 
                                        onClick={() => navigate('/appointments')}
                                        className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                                    >
                                        <div className="w-16 text-center">
                                            <div className="text-xs font-black text-primary">
                                                {new Date(app.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                                                {app.title}
                                            </div>
                                            {app.patientName && (
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                                    {app.patientName}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                            app.type === 'other' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                                        }`}>
                                            {t(app.type || 'appointment')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Patients */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">{t('latest_added')}</h3>
                        <Link to="/patients" className="text-primary hover:text-primary-dark text-[10px] font-black uppercase tracking-widest transition-colors">{t('view_all')} →</Link>
                    </div>
                    <div className="p-2 sm:p-4">
                        {loading ? (
                            <div className="py-12 text-center text-gray-400 font-bold">{t('loading')}...</div>
                        ) : recentPatients.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 italic">{t('no_patients_found')}</div>
                        ) : (
                            <div className="space-y-2">
                                {recentPatients.map((patient) => (
                                    <div 
                                        key={patient.id} 
                                        onClick={() => navigate(`/patients/${patient.id}`)}
                                        className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                                    >
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-inner group-hover:bg-primary/20 transition-colors">
                                            {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                                                {patient.firstName} {patient.lastName}
                                            </div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                                {patient.taxId || patient.phone || '-'}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-medium italic">
                                            {new Date(patient.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
