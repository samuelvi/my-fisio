import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

export default function RecordForm() {
    const { patientId, recordId } = useParams();
    const navigate = useNavigate();
    const isEditing = !!recordId;
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [patientName, setPatientName] = useState('');

    const [formData, setFormData] = useState({
        physiotherapyTreatment: '',
        consultationReason: '',
        onset: '',
        currentSituation: '',
        evolution: '',
        radiologyTests: '',
        medicalTreatment: '',
        homeTreatment: '',
        notes: '',
        sickLeave: false
    });

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const patientResponse = await axios.get(`/api/patients/${patientId}`);
                setPatientName(`${patientResponse.data.firstName} ${patientResponse.data.lastName}`);

                if (isEditing) {
                    const recordResponse = await axios.get(`/api/records/${recordId}`);
                    const data = recordResponse.data;
                    
                    setFormData({
                        physiotherapyTreatment: data.physiotherapyTreatment || '',
                        consultationReason: data.consultationReason || '',
                        onset: data.onset || '',
                        currentSituation: data.currentSituation || '',
                        evolution: data.evolution || '',
                        radiologyTests: data.radiologyTests || '',
                        medicalTreatment: data.medicalTreatment || '',
                        homeTreatment: data.homeTreatment || '',
                        notes: data.notes || '',
                        sickLeave: data.sickLeave || false
                    });
                }
            } catch (err) {
                console.error("Error loading initial data:", err);
                const msg = err.response?.status === 404 ? 'Resource not found' : 'Could not load required data.';
                setErrors({ global: msg });
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [patientId, recordId, isEditing]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const payload = { ...formData };
            if (!isEditing) {
                payload.patient = `/api/patients/${patientId}`;
                payload.createdAt = new Date().toISOString();
            }

            if (isEditing) {
                await axios.put(`/api/records/${recordId}`, payload);
            } else {
                await axios.post('/api/records', payload);
            }
            navigate(`/patients/${patientId}`);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.violations) {
                const newErrors = {};
                err.response.data.violations.forEach(violation => {
                    newErrors[violation.propertyPath] = violation.message;
                });
                setErrors(newErrors);
            } else {
                setErrors({ global: 'An unexpected error occurred.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const InputArea = ({ label, name, required = false, rows = 3 }) => (
        <div className={rows > 2 ? "col-span-6" : "col-span-6 sm:col-span-3"}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label} {required && "*"}</label>
            <textarea
                name={name}
                id={name}
                rows={rows}
                required={required}
                value={formData[name]}
                onChange={handleChange}
                className={`block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors[name] ? 'border-red-500' : ''}`}
            />
            {errors[name] && <p className="mt-1 text-sm text-red-600">{errors[name]}</p>}
        </div>
    );

    if (loading && isEditing && !formData.physiotherapyTreatment) {
        return <div className="p-8 text-center text-gray-500">Loading Record...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={() => navigate(`/patients/${patientId}`)} className="text-indigo-600 hover:text-indigo-800 mb-6 inline-flex items-center">
                ← Back to Patient
            </button>

             <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEditing ? 'Update Clinical History' : 'New Clinical History Entry'}
                        </h2>
                        {patientName && (
                            <p className="mt-1 text-sm text-gray-500">Patient: <span className="font-medium text-gray-900">{patientName}</span></p>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {errors.global && (
                        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                            <h3 className="text-sm font-medium text-red-800">{errors.global}</h3>
                        </div>
                    )}

                    <form id="record-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-6 gap-6">
                            
                            <InputArea label="Main Physiotherapy Treatment" name="physiotherapyTreatment" required rows={4} />
                            
                            <InputArea label="Consultation Reason" name="consultationReason" rows={2} />
                            <InputArea label="Onset Details" name="onset" rows={2} />
                            <InputArea label="Current Situation" name="currentSituation" rows={2} />
                            <InputArea label="Evolution / Progress" name="evolution" rows={2} />

                            <div className="col-span-6 sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tests & Radiology</label>
                                <input type="text" name="radiologyTests" value={formData.radiologyTests} onChange={handleChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parallel Medical Treatment</label>
                                <input type="text" name="medicalTreatment" value={formData.medicalTreatment} onChange={handleChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>

                            <InputArea label="Home Tasks / Treatment" name="homeTreatment" rows={3} />
                            
                            <div className="col-span-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confidential Notes</label>
                                <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm italic" placeholder="Private notes..." />
                            </div>

                            <div className="col-span-6">
                                <div className="flex items-center">
                                    <input
                                        id="sickLeave"
                                        name="sickLeave"
                                        type="checkbox"
                                        checked={formData.sickLeave}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="sickLeave" className="ml-2 block text-sm text-gray-900 font-medium">
                                        Active Sick Leave
                                    </label>
                                </div>
                                <p className="mt-1 ml-6 text-xs text-gray-500">Mark if the patient is currently unfit for work due to this condition.</p>
                            </div>

                        </div>

                        <div className="pt-5 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate(`/patients/${patientId}`)}
                                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : (isEditing ? 'Update History' : 'Save History Entry')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
