import React, { useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { ClipboardDocumentListIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function RecordTimeline({ records, patient, patientId, onAddRecord }) {
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isModalOpen, setIsConfirmModalOpen] = useState(false);
    const navigate = useNavigate();

    if (!records || records.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                <p className="text-gray-500 mb-4">No records found for this patient.</p>
                <button
                    onClick={onAddRecord}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    Add First Record
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
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Clinical History</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => navigate(`/patients/${patientId}/history`)}
                        className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 font-medium"
                    >
                        View All
                    </button>
                    <button
                        onClick={onAddRecord}
                        className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-100 font-medium"
                    >
                        + Add Record
                    </button>
                </div>
            </div>

            <div className="flow-root">
                <ul role="list" className="-mb-8">
                    {sortedRecords.map((record, recordIdx) => (
                        <li key={record.id}>
                            <div className="relative pb-8">
                                {recordIdx !== sortedRecords.length - 1 ? (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                        <div>
                                            <p className="text-sm text-gray-500">
                                                {new Date(record.createdAt).toLocaleDateString()}
                                            </p>
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-md font-semibold text-gray-900 mt-1">
                                                    Physiotherapy Treatment
                                                </h4>
                                                <div className="flex space-x-3 ml-4">
                                                    <button 
                                                        onClick={() => openViewModal(record)}
                                                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
                                                    >
                                                        View
                                                    </button>
                                                    <Link 
                                                        to={`/patients/${patientId}/records/${record.id}/edit`}
                                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Edit
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-700 space-y-2">
                                                <p><strong>Treatment:</strong> {record.physiotherapyTreatment}</p>
                                                {record.evolution && <p><strong>Evolution:</strong> {record.evolution}</p>}
                                                {record.notes && <p className="italic text-gray-500">{record.notes}</p>}
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
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 mr-3">
                                                    <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">
                                                        Clinical Record Detail
                                                    </Dialog.Title>
                                                    <p className="text-sm text-gray-500">
                                                        {selectedRecord && new Date(selectedRecord.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => setIsConfirmModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                                <XMarkIcon className="h-6 w-6" />
                                            </button>
                                        </div>

                                        {selectedRecord && patient && (
                                            <div className="mt-4 border-t border-gray-100 pt-4">
                                                {/* Patient Info Header in Modal */}
                                                <div className="bg-gray-50 p-4 rounded-lg mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                    <div>
                                                        <span className="font-bold text-gray-400 uppercase">Patient</span>
                                                        <p className="text-gray-900 font-semibold">{patient.firstName} {patient.lastName}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-400 uppercase">DNI</span>
                                                        <p className="text-gray-900">{patient.identityDocument || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-400 uppercase">Phone</span>
                                                        <p className="text-gray-900">{patient.phone || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-400 uppercase">Profession</span>
                                                        <p className="text-gray-900">{patient.profession || '-'}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="col-span-2">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Physiotherapy Treatment</h4>
                                                        <p className="text-sm text-gray-900 whitespace-pre-wrap bg-indigo-50/30 p-3 rounded border border-indigo-100">{selectedRecord.physiotherapyTreatment}</p>
                                                    </div>
                                                    
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Consultation Reason</h4>
                                                        <p className="text-sm text-gray-900">{selectedRecord.consultationReason || '-'}</p>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Onset (Aparición)</h4>
                                                        <p className="text-sm text-gray-900">{selectedRecord.onset || '-'}</p>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Situation</h4>
                                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.currentSituation || '-'}</p>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Evolution</h4>
                                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.evolution || '-'}</p>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Radiology / Tests</h4>
                                                        <p className="text-sm text-gray-900">{selectedRecord.radiologyTests || '-'}</p>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Medical Treatment</h4>
                                                        <p className="text-sm text-gray-900">{selectedRecord.medicalTreatment || '-'}</p>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Home Treatment</h4>
                                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.homeTreatment || '-'}</p>
                                                    </div>

                                                    <div className="flex items-center">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-3">Sick Leave</h4>
                                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${selectedRecord.sickLeave ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                            {selectedRecord.sickLeave ? 'YES' : 'NO'}
                                                        </span>
                                                    </div>

                                                    <div className="col-span-2 border-t border-gray-50 pt-3">
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Internal Notes</h4>
                                                        <p className="text-sm text-gray-700 italic">{selectedRecord.notes || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto transition"
                                            onClick={() => setIsConfirmModalOpen(false)}
                                        >
                                            Close Detail
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