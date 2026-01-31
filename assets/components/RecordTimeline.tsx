import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { RecordEntry, Patient } from '../types';

interface RecordTimelineProps {
    records: RecordEntry[];
    onAddRecord: () => void;
    patientId: number | undefined;
    patient: Patient | null;
}

export default function RecordTimeline({ records, onAddRecord, patientId, patient }: RecordTimelineProps) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [selectedRecord, setSelectedRecord] = useState<RecordEntry | null>(null);

    const sortedRecords = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleViewDetails = (record: RecordEntry) => {
        setSelectedRecord(record);
    };

    const handleEdit = (recordId: number) => {
        navigate(`/patients/${patientId}/records/${recordId}/edit`);
    };

    const RecordDetailModal = ({ record, onClose }: { record: RecordEntry; onClose: () => void }) => (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-200">
                    <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-900 leading-tight">
                                {t('entry_details')} — {new Date(record.createdAt).toLocaleDateString()}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div>
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">{t('main_treatment')}</h4>
                                <p className="text-gray-900 font-bold whitespace-pre-wrap leading-relaxed">{record.physiotherapyTreatment}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {record.consultationReason && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('consultation_reason')}</h4>
                                        <p className="text-sm font-medium text-gray-700">{record.consultationReason}</p>
                                    </div>
                                )}
                                {record.onset && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('onset')}</h4>
                                        <p className="text-sm font-medium text-gray-700">{record.onset}</p>
                                    </div>
                                )}
                            </div>
                            {record.currentSituation && (
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('current_situation')}</h4>
                                    <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap">{record.currentSituation}</p>
                                </div>
                            )}
                            {record.evolution && (
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('evolution')}</h4>
                                    <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap">{record.evolution}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {record.radiologyTests && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('tests_radiology')}</h4>
                                        <p className="text-sm font-medium text-gray-700">{record.radiologyTests}</p>
                                    </div>
                                )}
                                {record.medicalTreatment && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('medical_treatment')}</h4>
                                        <p className="text-sm font-medium text-gray-700">{record.medicalTreatment}</p>
                                    </div>
                                )}
                            </div>
                            {record.homeTreatment && (
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('home_tasks_treatment')}</h4>
                                    <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap">{record.homeTreatment}</p>
                                </div>
                            )}
                            <div className="flex items-center space-x-4 bg-gray-50 p-3 rounded-xl border border-gray-100 w-fit">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('sick_leave')}</span>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${record.sickLeave ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {record.sickLeave ? t('yes') : t('no')}
                                </span>
                            </div>
                            {record.notes && (
                                <div className="border-t border-gray-100 pt-4 italic">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('internal_notes')}</h4>
                                    <p className="text-sm text-gray-500">{record.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8 gap-3">
                        <button onClick={() => handleEdit(record.id)} className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg px-6 py-2 bg-primary text-sm font-black text-white hover:bg-primary-dark sm:w-auto transition-all active:scale-95">
                            {t('edit_entry')}
                        </button>
                        <button onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-6 py-2 bg-white text-sm font-black text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all">
                            {t('close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase tracking-widest text-xs">
                    {t('clinical_history')}
                </h3>
                <div className="flex gap-2">
                    <Link
                        to={`/patients/${patientId}/history`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-200 shadow-sm text-xs font-black rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all uppercase tracking-wider"
                    >
                        {t('view_all')}
                    </Link>
                    <button
                        onClick={onAddRecord}
                        data-testid="add-record-btn"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-black rounded-lg text-white bg-primary hover:bg-primary-dark transition-all uppercase tracking-wider"
                    >
                        + {t('add_item')}
                    </button>
                </div>
            </div>
            <div className="p-4 sm:p-8">
                {records.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <p className="text-gray-400 font-bold mb-6">{t('no_records_available')}</p>
                        <button
                            onClick={onAddRecord}
                            data-testid="add-first-record-btn"
                            className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-black rounded-xl text-white bg-primary hover:bg-primary-dark transition-all active:scale-95"
                        >
                            {t('add_first_record')}
                        </button>
                    </div>
                ) : (
                    <div className="flow-root">
                        <ul role="list" className="-mb-8">
                            {sortedRecords.map((record, index) => (
                                <li key={record.id}>
                                    <div className="relative pb-8">
                                        {index !== sortedRecords.length - 1 && (
                                            <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-100" aria-hidden="true"></span>
                                        )}
                                        <div className="relative flex items-start space-x-4">
                                            <div className="relative">
                                                <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center ring-8 ring-white">
                                                    <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1 bg-gray-50/50 rounded-2xl p-4 border border-gray-100 hover:border-primary/20 transition-all group">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                                                            {new Date(record.createdAt).toLocaleDateString()}
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-900 leading-relaxed line-clamp-2 group-hover:text-primary transition-colors">
                                                            {record.physiotherapyTreatment}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleViewDetails(record)}
                                                            className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                                                            title={t('view')}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEdit(record.id)}
                                                            className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                                                            title={t('edit')}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                {record.sickLeave && (
                                                    <div className="mt-2">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-700 uppercase tracking-wider">
                                                            {t('active_sick_leave')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {selectedRecord && (
                <RecordDetailModal 
                    record={selectedRecord} 
                    onClose={() => setSelectedRecord(null)} 
                />
            )}
        </div>
    );
}
