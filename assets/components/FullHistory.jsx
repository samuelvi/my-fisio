import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function FullHistory() {
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

    if (loading) return <div className="p-8 text-center">Loading full history...</div>;
    if (!patient) return <div className="p-8 text-center text-red-600">Patient not found</div>;

    const sortedRecords = [...(patient.records || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="flex justify-between items-center border-b pb-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Clinical History</h1>
                    <p className="text-gray-500 mt-1">Patient: <span className="font-semibold text-gray-700">{patient.firstName} {patient.lastName}</span></p>
                </div>
                <div className="flex space-x-3">
                    <button 
                        onClick={() => window.print()}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition shadow-sm font-medium"
                    >
                        Print History
                    </button>
                    <button 
                        onClick={() => navigate(`/patients/${id}`)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition shadow-sm font-medium"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>

            {/* Comprehensive Patient Info Card (Visible on Screen and Print) */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Patient Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8 text-sm">
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</h4>
                        <p className="text-gray-900 font-semibold">{patient.firstName} {patient.lastName}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">DNI / Identity</h4>
                        <p className="text-gray-900">{patient.identityDocument || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date of Birth</h4>
                        <p className="text-gray-900">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Phone</h4>
                        <p className="text-gray-900">{patient.phone || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</h4>
                        <p className="text-gray-900">{patient.email || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Profession</h4>
                        <p className="text-gray-900">{patient.profession || '-'}</p>
                    </div>
                    <div className="md:col-span-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Address</h4>
                        <p className="text-gray-900">{patient.address || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Sports Activity</h4>
                        <p className="text-gray-900">{patient.sportsActivity || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Rate / Pricing</h4>
                        <p className="text-gray-900">{patient.rate || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Created At</h4>
                        <p className="text-gray-900">{new Date(patient.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Medical Info Section */}
                    <div className="md:col-span-3 mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-red-50 p-3 rounded border border-red-100">
                            <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Allergies & Diseases</h4>
                            <p className="text-gray-900 text-xs"><strong>Allergies:</strong> {patient.allergies || '-'}</p>
                            <p className="text-gray-900 text-xs mt-1"><strong>Systemic Diseases:</strong> {patient.systemicDiseases || '-'}</p>
                            <p className="text-gray-900 text-xs mt-1"><strong>Medication:</strong> {patient.medication || '-'}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded border border-blue-100">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Observations</h4>
                            <p className="text-gray-900 text-xs"><strong>Surgeries:</strong> {patient.surgeries || '-'}</p>
                            <p className="text-gray-900 text-xs mt-1"><strong>Accidents:</strong> {patient.accidents || '-'}</p>
                            <p className="text-gray-900 text-xs mt-1"><strong>Injuries:</strong> {patient.injuries || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Other Details</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <p><strong>Bruxism:</strong> {patient.bruxism || '-'}</p>
                                <p><strong>Insoles:</strong> {patient.insoles || '-'}</p>
                            </div>
                            <p className="text-gray-900 text-xs mt-2"><strong>Notes:</strong> {patient.notes || '-'}</p>
                            <p className="text-gray-900 text-xs mt-1"><strong>Others:</strong> {patient.others || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {sortedRecords.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed">
                    <p className="text-gray-500">No records available for this patient.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {sortedRecords.map((record, index) => (
                        <div key={record.id} className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                <span className="text-sm font-bold text-indigo-600">Entry #{sortedRecords.length - index}</span>
                                <span className="text-sm text-gray-500 font-medium">{new Date(record.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="col-span-2">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Physiotherapy Treatment</h4>
                                        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{record.physiotherapyTreatment}</p>
                                    </div>
                                    
                                    {record.consultationReason && (
                                        <div className="col-span-2 md:col-span-1">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Consultation Reason</h4>
                                            <p className="text-gray-700 leading-relaxed">{record.consultationReason}</p>
                                        </div>
                                    )}

                                    {record.onset && (
                                        <div className="col-span-2 md:col-span-1">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Onset</h4>
                                            <p className="text-gray-700 leading-relaxed">{record.onset}</p>
                                        </div>
                                    )}

                                    {record.currentSituation && (
                                        <div className="col-span-2">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Situation</h4>
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{record.currentSituation}</p>
                                        </div>
                                    )}

                                    {record.evolution && (
                                        <div className="col-span-2">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Evolution</h4>
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{record.evolution}</p>
                                        </div>
                                    )}

                                    {record.radiologyTests && (
                                        <div className="col-span-2 md:col-span-1">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Radiology / Tests</h4>
                                            <p className="text-gray-700 leading-relaxed">{record.radiologyTests}</p>
                                        </div>
                                    )}

                                    {record.medicalTreatment && (
                                        <div className="col-span-2 md:col-span-1">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Medical Treatment</h4>
                                            <p className="text-gray-700 leading-relaxed">{record.medicalTreatment}</p>
                                        </div>
                                    )}

                                    {record.homeTreatment && (
                                        <div className="col-span-2">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Home Treatment</h4>
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{record.homeTreatment}</p>
                                        </div>
                                    )}

                                    <div className="col-span-2 md:col-span-1 flex items-center">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-4">Sick Leave</h4>
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${record.sickLeave ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {record.sickLeave ? 'YES' : 'NO'}
                                        </span>
                                    </div>

                                    {record.notes && (
                                        <div className="col-span-2 border-t border-gray-50 pt-4">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Internal Notes</h4>
                                            <p className="text-gray-600 italic leading-relaxed">{record.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
