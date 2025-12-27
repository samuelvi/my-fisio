import React, { useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { ClipboardDocumentListIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from './LanguageContext';

export default function RecordTimeline({ records, patient, patientId, onAddRecord }) {
    const { t } = useLanguage();
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isModalOpen, setIsConfirmModalOpen] = useState(false);
    const navigate = useNavigate();

    if (!records || records.length === 0) {
        return (
            <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
                <p className="text-gray-400 font-bold mb-6">{t('no_records_available')}</p>
                <button
                    onClick={onAddRecord}
                    className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-black rounded-xl shadow-lg text-white bg-primary hover:bg-primary-dark transition active:scale-95"
                >
                    + {t('add_first_record')}
                </button>
            </div>
        );
    }

    const openViewModal = (record) => {
        setSelectedRecord(record);
        setIsConfirmModalOpen(true);
    };

    // Sort records by date descending
    const sortedRecords = [...(records || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="bg-white shadow-sm rounded-2xl p-4 sm:p-8 border border-gray-200">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-50">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('clinical_history')}</h3>
                <div className="flex space-x-3">
                    <button
                        onClick={() => navigate(`/patients/${patientId}/history`)}
                        className="text-xs bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-black uppercase tracking-widest transition"
                    >
                        {t('view_all')}
                    </button>
                    <button
                        onClick={onAddRecord}
                        className="text-xs bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark font-black uppercase tracking-widest transition shadow-md shadow-primary/20"
                    >
                        + {t('add_item')}
                    </button>
                </div>
            </div>

            <div className="flow-root">
                <ul role="list" className="-mb-8">
                    {sortedRecords.map((record, recordIdx) => (
                        <li key={record.id}>
                            <div className="relative pb-8">
                                {recordIdx !== sortedRecords.length - 1 ? (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-100" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-4">
                                    <div>
                                        <span className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center ring-8 ring-white border border-primary/10">
                                            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1 flex justify-between space-x-4">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                {new Date(record.createdAt).toLocaleDateString()}
                                            </p>
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-base font-bold text-gray-900 leading-tight">
                                                    {t('main_physiotherapy_treatment')}
                                                </h4>
                                                <div className="flex space-x-4 ml-4">
                                                    <button 
                                                        onClick={() => openViewModal(record)}
                                                        className="text-xs font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-widest"
                                                    >
                                                        {t('view')}
                                                    </button>
                                                    <Link 
                                                        to={`/patients/${patientId}/records/${record.id}/edit`}
                                                        className="text-xs font-black text-primary hover:text-primary-dark transition-colors uppercase tracking-widest"
                                                    >
                                                        {t('edit')}
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-sm text-gray-600 space-y-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                <p className="line-clamp-3 leading-relaxed"><span className="font-bold text-gray-900">{t('treatment')}:</span> {record.physiotherapyTreatment}</p>
                                                {record.evolution && <p className="line-clamp-2 leading-relaxed"><span className="font-bold text-gray-900">{t('evolution')}:</span> {record.evolution}</p>}
                                                {record.notes && <p className="italic text-gray-400 text-xs font-medium">{record.notes}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Record Detail Modal */}
            <Transition.Root show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={setIsConfirmModalOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-gray-200">
                                    <div className="bg-white px-4 pb-4 pt-5 sm:p-8 sm:pb-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mr-4 border border-primary/10">
                                                    <ClipboardDocumentListIcon className="h-7 w-7 text-primary" />
                                                </div>
                                                <div>
                                                    <Dialog.Title as="h3" className="text-xl font-black leading-6 text-gray-900 tracking-tight">
                                                        {t('clinical_record_detail')}
                                                    </Dialog.Title>
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                        {selectedRecord && new Date(selectedRecord.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => setIsConfirmModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50">
                                                <XMarkIcon className="h-6 w-6" />
                                            </button>
                                        </div>

                                        {selectedRecord && patient && (
                                            <div className="mt-6 border-t border-gray-100 pt-8">
                                                {/* Patient Info Header in Modal */}
                                                <div className="bg-gray-50/80 border border-gray-100 p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                                                    <div>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t('patient')}</span>
                                                        <p className="text-gray-900 font-bold">{patient.firstName} {patient.lastName}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t('dni')}</span>
                                                        <p className="text-gray-900 font-bold">{patient.taxId || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t('phone')}</span>
                                                        <p className="text-gray-900 font-bold">{patient.phone || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t('profession')}</span>
                                                        <p className="text-gray-900 font-bold">{patient.profession || '-'}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="col-span-2">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('main_physiotherapy_treatment')}</h4>
                                                        <p className="text-base text-gray-900 font-medium whitespace-pre-wrap bg-primary/5 p-5 rounded-2xl border border-primary/10 leading-relaxed">{selectedRecord.physiotherapyTreatment}</p>
                                                    </div>
                                                    
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('consultation_reason')}</h4>
                                                        <p className="text-sm text-gray-700 font-bold">{selectedRecord.consultationReason || '-'}</p>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('onset')}</h4>
                                                        <p className="text-sm text-gray-700 font-bold">{selectedRecord.onset || '-'}</p>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('current_situation')}</h4>
                                                        <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedRecord.currentSituation || '-'}</p>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('evolution')}</h4>
                                                        <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedRecord.evolution || '-'}</p>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('tests_radiology')}</h4>
                                                        <p className="text-sm text-gray-700 font-bold">{selectedRecord.radiologyTests || '-'}</p>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('parallel_medical_treatment')}</h4>
                                                        <p className="text-sm text-gray-700 font-bold">{selectedRecord.medicalTreatment || '-'}</p>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('home_tasks_treatment')}</h4>
                                                        <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{selectedRecord.homeTreatment || '-'}</p>
                                                    </div>

                                                    <div className="flex items-center bg-gray-50 p-4 rounded-xl border border-gray-100 w-fit">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-6">{t('active_sick_leave')}</h4>
                                                        <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${selectedRecord.sickLeave ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                                            {selectedRecord.sickLeave ? t('yes') : t('no')}
                                                        </span>
                                                    </div>

                                                    <div className="col-span-2 border-t border-gray-100 pt-6">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('internal_notes')}</h4>
                                                        <p className="text-xs text-gray-400 italic font-medium">{selectedRecord.notes || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 px-8 py-4 sm:flex sm:flex-row-reverse sm:px-10">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-xl bg-white px-6 py-2.5 text-sm font-black text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 sm:w-auto transition active:scale-95"
                                            onClick={() => setIsConfirmModalOpen(false)}
                                        >
                                            {t('close_detail')}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </div>
    );
}
