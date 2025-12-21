import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RecordTimeline from './RecordTimeline';

export default function PatientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [patientRes, appointmentsRes] = await Promise.all([
                    axios.get(`/api/patients/${id}`),
                    axios.get(`/api/appointments?patientId=${id}`)
                ]);
                
                setPatient(patientRes.data);
                setAppointments(appointmentsRes.data['member'] || appointmentsRes.data['hydra:member'] || []);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching patient data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleAddRecord = () => {
        navigate(`/patients/${id}/records/new`);
    };

    const handleEdit = () => {
        navigate(`/patients/${id}/edit`);
    };

    if (loading) return <div className="p-8">Loading details...</div>;
    if (!patient) return <div className="p-8">Patient not found</div>;

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/patients')} className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center">
                ← Back to List
            </button>

            {/* Top Section: Patient 360 Card */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Patient Information
                    </h3>
                    <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {patient.status.toUpperCase()}
                        </span>
                        <button onClick={handleEdit} className="text-sm text-indigo-600 hover:text-indigo-900 font-medium">
                            Edit Details
                        </button>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <div className="flex items-start space-x-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <span className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl font-bold border-4 border-white shadow-sm">
                                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                            </span>
                        </div>
                        
                        {/* Details Grid */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                            <div>
                                <dt className="font-medium text-gray-500 uppercase text-xs">Full Name</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">{patient.firstName} {patient.lastName}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-gray-500 uppercase text-xs">Phone</dt>
                                <dd className="mt-1 text-gray-900 font-medium">{patient.phone || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-gray-500 uppercase text-xs">Email</dt>
                                <dd className="mt-1 text-gray-900 font-medium">{patient.email || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-gray-500 uppercase text-xs">Date of Birth</dt>
                                <dd className="mt-1 text-gray-900 font-medium">
                                    {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                                </dd>
                            </div>
                             <div>
                                <dt className="font-medium text-gray-500 uppercase text-xs">Profession</dt>
                                <dd className="mt-1 text-gray-900 font-medium">{patient.profession || 'N/A'}</dd>
                            </div>
                             <div>
                                <dt className="font-medium text-gray-500 uppercase text-xs">Sports Activity</dt>
                                <dd className="mt-1 text-gray-900 font-medium">{patient.sportsActivity || 'N/A'}</dd>
                            </div>
                            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                <dt className="font-medium text-gray-500 uppercase text-xs">Address</dt>
                                <dd className="mt-1 text-gray-900 font-medium">{patient.address || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-gray-500 uppercase text-xs">Rate</dt>
                                <dd className="mt-1 text-gray-900 font-medium">{patient.rate || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-gray-500 uppercase text-xs">DNI</dt>
                                <dd className="mt-1 text-gray-900 font-medium">{patient.identityDocument || 'N/A'}</dd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Medical Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content (Records) - Takes up 2/3 space on large screens */}
                <div className="lg:col-span-2">
                    <RecordTimeline 
                        records={patient.records} 
                        patient={patient}
                        patientId={patient.id}
                        onAddRecord={handleAddRecord} 
                    />
                </div>

                {/* Side Panel (Medical Alerts & Appointments) - Takes up 1/3 space */}
                <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6 border-l-4 border-indigo-500">
                        <h4 className="text-md font-bold text-gray-900 mb-3 flex justify-between items-center">
                            Next Appointments
                            <button className="text-xs text-indigo-600 hover:underline">Schedule</button>
                        </h4>
                        <div className="space-y-3">
                            {appointments.length > 0 ? (
                                appointments.slice(0, 3).map(app => (
                                    <div key={app.id} className="text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                        <p className="font-semibold text-gray-800">{new Date(app.startsAt).toLocaleDateString()} - {new Date(app.startsAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        <p className="text-gray-500 truncate">{app.title}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 italic">No upcoming appointments</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-500">
                        <h4 className="text-md font-bold text-gray-900 mb-3">Medical Alerts</h4>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-semibold text-gray-500">Allergies:</span>
                                <p className="text-gray-900">{patient.allergies || 'None recorded'}</p>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-500">Systemic Diseases:</span>
                                <p className="text-gray-900">{patient.systemicDiseases || 'None recorded'}</p>
                            </div>
                             <div>
                                <span className="font-semibold text-gray-500">Medication:</span>
                                <p className="text-gray-900">{patient.medication || 'None recorded'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6 border-l-4 border-yellow-500">
                        <h4 className="text-md font-bold text-gray-900 mb-3">History Details</h4>
                         <div className="space-y-2 text-sm">
                            <div>
                                <span className="font-semibold text-gray-500">Surgeries:</span>
                                <p className="text-gray-900">{patient.surgeries || '-'}</p>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-500">Accidents:</span>
                                <p className="text-gray-900">{patient.accidents || '-'}</p>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-500">Injuries:</span>
                                <p className="text-gray-900">{patient.injuries || '-'}</p>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-500">Bruxism:</span>
                                <p className="text-gray-900">{patient.bruxism || '-'}</p>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-500">Insoles:</span>
                                <p className="text-gray-900">{patient.insoles || '-'}</p>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-500">Others:</span>
                                <p className="text-gray-900">{patient.others || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}