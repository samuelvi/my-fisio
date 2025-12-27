import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from './LanguageContext';

export default function FullHistory() {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axios.get(`/api/patients/${id}`);
                setPatient(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching history:", error);
                setLoading(false);
            }
        };
        fetchHistory();
    }, [id]);

    if (loading) return <div className="p-4 sm:p-8 text-center font-bold text-gray-500">{t('loading')}...</div>;
    if (!patient) return <div className="p-4 sm:p-8 text-center text-red-600 font-bold">{t('error_could_not_load_patient')}</div>;

    const sortedRecords = [...(patient.records || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 pb-4 sm:pb-6 no-print">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{t('clinical_history')}</h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1">{t('patient')}: <span className="font-bold text-primary">{patient.firstName} {patient.lastName}</span></p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={() => window.print()}
                        className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition shadow-sm font-bold text-sm flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        {t('print_history')}
                    </button>
                    <button 
                        onClick={() => navigate(`/patients/${id}`)}
                        className="bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-dark transition shadow-lg font-bold text-sm"
                    >
                        {t('back_to_profile')}
                    </button>
                </div>
            </div>

            {/* Comprehensive Patient Info Card */}
            <div className="bg-white shadow-sm rounded-2xl border border-gray-200 p-4 sm:p-8 no-print">
                <h2 className="text-xl font-black text-gray-800 mb-6 sm:mb-8 border-b border-gray-100 pb-4">{t('personal_information')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12 text-sm">
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('full_name')}</h4>
                        <p className="text-gray-900 font-bold text-base">{patient.firstName} {patient.lastName}</p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('dni_identity')}</h4>
                        <p className="text-gray-900 font-medium">{patient.taxId || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('date_of_birth')}</h4>
                        <p className="text-gray-900 font-medium">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('phone')}</h4>
                        <p className="text-gray-900 font-medium">{patient.phone || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('email')}</h4>
                        <p className="text-gray-900 font-medium">{patient.email || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('profession')}</h4>
                        <p className="text-gray-900 font-medium">{patient.profession || '-'}</p>
                    </div>
                    <div className="md:col-span-3">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('address')}</h4>
                        <p className="text-gray-900 font-medium">{patient.address || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sports_activity')}</h4>
                        <p className="text-gray-900 font-medium">{patient.sportsActivity || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('rate_pricing')}</h4>
                        <p className="text-gray-900 font-medium">{patient.rate || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('created_at')}</h4>
                        <p className="text-gray-900 font-medium">{new Date(patient.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Medical Info Section */}
                    <div className="md:col-span-3 mt-6 pt-6 sm:pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100">
                            <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4">{t('allergies_diseases')}</h4>
                            <div className="space-y-2 text-xs">
                                <p><span className="font-bold text-red-800">{t('allergies')}:</span> <span className="text-gray-700">{patient.allergies || '-'}</span></p>
                                <p><span className="font-bold text-red-800">{t('systemic_diseases')}:</span> <span className="text-gray-700">{patient.systemicDiseases || '-'}</span></p>
                                <p><span className="font-bold text-red-800">{t('current_medication')}:</span> <span className="text-gray-700">{patient.medication || '-'}</span></p>
                            </div>
                        </div>
                        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20">
                            <h4 className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-4">{t('observations')}</h4>
                            <div className="space-y-2 text-xs">
                                <p><span className="font-bold text-primary-dark">{t('surgeries')}:</span> <span className="text-gray-700">{patient.surgeries || '-'}</span></p>
                                <p><span className="font-bold text-primary-dark">{t('accidents')}:</span> <span className="text-gray-700">{patient.accidents || '-'}</span></p>
                                <p><span className="font-bold text-primary-dark">{t('injuries')}:</span> <span className="text-gray-700">{patient.injuries || '-'}</span></p>
                            </div>
                        </div>
                        <div className="bg-gray-100/50 p-5 rounded-2xl border border-gray-200 md:col-span-2">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t('other_details')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                                <div>
                                    <span className="font-bold text-gray-600 block mb-1">{t('bruxism')}</span>
                                    <span className="text-gray-700">{patient.bruxism || '-'}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-600 block mb-1">{t('insoles')}</span>
                                    <span className="text-gray-700">{patient.insoles || '-'}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-600 block mb-1">{t('others')}</span>
                                    <span className="text-gray-700">{patient.others || '-'}</span>
                                </div>
                                <div className="md:col-span-3 pt-2 border-t border-gray-200/50">
                                    <span className="font-bold text-gray-600 block mb-1">{t('notes')}</span>
                                    <span className="text-gray-700 italic">{patient.notes || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {sortedRecords.length === 0 ? (
                <div className="text-center py-16 sm:py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200 print-only">
                    <p className="text-gray-400 font-bold">{t('no_records_available')}</p>
                </div>
            ) : (
                <div className="space-y-6 sm:space-y-10 print-only">
                    {sortedRecords.map((record, index) => (
                        <div key={record.id} className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden page-break-inside-avoid print-card">
                            <div className="bg-gray-50 px-4 sm:px-8 py-4 border-b border-gray-200 flex justify-between items-center print-header">
                                <span className="text-xs font-black text-primary uppercase tracking-widest">
                                    {t('created_at')} {new Date(record.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="p-4 sm:p-8 print-body">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    <div className="col-span-2">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t('main_physiotherapy_treatment')}</h4>
                                        <p className="text-gray-900 leading-relaxed font-medium text-base whitespace-pre-wrap">{record.physiotherapyTreatment}</p>
                                    </div>
                                    
                                    {record.consultationReason && (
                                        <div className="col-span-2 md:col-span-1">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t('consultation_reason')}</h4>
                                            <p className="text-gray-700 leading-relaxed font-medium">{record.consultationReason}</p>
                                        </div>
                                    )}

                                    {record.onset && (
                                        <div className="col-span-2 md:col-span-1">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t('onset_details')}</h4>
                                            <p className="text-gray-700 leading-relaxed font-medium">{record.onset}</p>
                                        </div>
                                    )}

                                    {record.currentSituation && (
                                        <div className="col-span-2">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t('current_situation')}</h4>
                                            <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{record.currentSituation}</p>
                                        </div>
                                    )}

                                    {record.evolution && (
                                        <div className="col-span-2">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t('evolution_progress')}</h4>
                                            <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{record.evolution}</p>
                                        </div>
                                    )}

                                    {record.radiologyTests && (
                                        <div className="col-span-2 md:col-span-1">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t('tests_radiology')}</h4>
                                            <p className="text-gray-700 leading-relaxed font-medium">{record.radiologyTests}</p>
                                        </div>
                                    )}

                                    {record.medicalTreatment && (
                                        <div className="col-span-2 md:col-span-1">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t('parallel_medical_treatment')}</h4>
                                            <p className="text-gray-700 leading-relaxed font-medium">{record.medicalTreatment}</p>
                                        </div>
                                    )}

                                    {record.homeTreatment && (
                                        <div className="col-span-2">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t('home_tasks_treatment')}</h4>
                                            <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{record.homeTreatment}</p>
                                        </div>
                                    )}

                                    <div className="col-span-2 md:col-span-1 flex items-center bg-gray-50 p-4 rounded-xl border border-gray-100 w-fit">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-6">{t('active_sick_leave')}</h4>
                                        <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${record.sickLeave ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                            {record.sickLeave ? t('yes') : t('no')}
                                        </span>
                                    </div>

                                    {record.notes && (
                                        <div className="col-span-2 border-t border-gray-100 pt-6">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t('internal_notes')}</h4>
                                            <p className="text-gray-500 italic leading-relaxed font-medium">{record.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body * { visibility: hidden !important; }
                    .print-only, .print-only * { visibility: visible !important; }
                    .print-only { position: absolute; left: 0; top: 0; width: 100%; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .max-w-5xl { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    .page-break-inside-avoid { page-break-inside: avoid; }
                    .shadow-sm, .shadow-lg { shadow: none !important; box-shadow: none !important; }
                    .border { border-color: #ddd !important; }
                    .print-card { border-radius: 6px !important; box-shadow: none !important; }
                    .print-card, .print-card * { background: white !important; }
                    .print-header, .print-body { padding: 12px 16px !important; }
                    .print-body { font-size: 11pt; line-height: 1.4; }
                }
                @media screen {
                    .print-only { position: static; visibility: visible; }
                }
            `}} />
        </div>
    );
}
