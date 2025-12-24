import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from './LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalPatients: 0,
        appointmentsToday: 0,
        invoicesThisYear: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, colorClass, icon }) => (
        <div className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${colorClass}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                        {loading ? '...' : value}
                    </p>
                </div>
                <div className="text-gray-300">
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title={t('total_patients')} 
                    value={stats.totalPatients} 
                    colorClass="border-blue-500"
                    icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
                />
                <StatCard 
                    title={t('appointments_today')} 
                    value={stats.appointmentsToday} 
                    colorClass="border-green-500" 
                    icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
                />
                <StatCard 
                    title={t('invoices_this_year')} 
                    value={stats.invoicesThisYear} 
                    colorClass="border-primary" 
                    icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>}
                />
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-6 mb-8">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{t('welcome_back')}, {t('administrator')}</h3>
                        <p className="text-gray-500">{t('dashboard_subtitle')}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8 border-t border-gray-100 pt-8">
                    <div>
                        <h4 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-widest">{t('quick_actions')}</h4>
                        <div className="flex flex-wrap gap-4">
                            <button 
                                onClick={() => navigate('/patients/new')}
                                className="px-5 py-2.5 bg-primary text-white rounded-md text-sm font-bold hover:bg-primary-dark transition shadow-sm"
                            >
                                {t('new_patient')}
                            </button>
                            <button 
                                onClick={() => navigate('/calendar')}
                                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-bold hover:bg-gray-50 transition"
                            >
                                {t('schedule_appointment')}
                            </button>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-widest">{t('system_status')}</h4>
                        <div className="flex items-center space-x-3 text-sm text-green-600 font-bold bg-green-50 px-4 py-3 rounded-md border border-green-100">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span>{t('all_systems_operational')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}