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
                // 1. Fetch patient name for context
                const patientResponse = await axios.get(`/api/patients/${patientId}`);
                setPatientName(`${patientResponse.data.firstName} ${patientResponse.data.lastName}`);

                // 2. Fetch Record if editing
                if (isEditing) {
                    console.log(`Fetching record ${recordId}...`);
                    const recordResponse = await axios.get(`/api/records/${recordId}`);
                    const data = recordResponse.data;
                    console.log("Record data received:", data);
                    
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

    if (loading && isEditing && !formData.physiotherapyTreatment) {
        return <div className="p-8 text-center text-gray-500">Loading record data...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto">
             <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        {isEditing ? 'Edit Clinical Record' : 'New Clinical Record'}
                    </h2>
                    {patientName && (
                        <p className="mt-1 text-sm text-gray-500">For Patient: <span className="font-semibold">{patientName}</span></p>
                    )}
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <button
                        type="button"
                        onClick={() => navigate(`/patients/${patientId}`)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="record-form"
                        disabled={loading}
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Record'}
                    </button>
                </div>
            </div>

             {errors.global && (
                <div className="rounded-md bg-red-50 p-4 mb-6">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{errors.global}</h3>
                        </div>
                    </div>
                </div>
            )}

            <form id="record-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="grid grid-cols-6 gap-6">
                        
                        <div className="col-span-6">
                            <label htmlFor="physiotherapyTreatment" className="block text-sm font-medium text-gray-700">Physiotherapy Treatment *</label>
                            <textarea
                                name="physiotherapyTreatment"
                                id="physiotherapyTreatment"
                                rows={4}
                                required
                                value={formData.physiotherapyTreatment}
                                onChange={handleChange}
                                className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.physiotherapyTreatment ? 'border-red-500' : ''}`}
                            />
                            {errors.physiotherapyTreatment && <p className="mt-1 text-sm text-red-600">{errors.physiotherapyTreatment}</p>}
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="consultationReason" className="block text-sm font-medium text-gray-700">Reason for Consultation</label>
                             <textarea
                                name="consultationReason"
                                id="consultationReason"
                                rows={3}
                                value={formData.consultationReason}
                                onChange={handleChange}
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="onset" className="block text-sm font-medium text-gray-700">Onset (Aparición)</label>
                             <textarea
                                name="onset"
                                id="onset"
                                rows={3}
                                value={formData.onset}
                                onChange={handleChange}
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                         <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="currentSituation" className="block text-sm font-medium text-gray-700">Current Situation</label>
                             <textarea
                                name="currentSituation"
                                id="currentSituation"
                                rows={3}
                                value={formData.currentSituation}
                                onChange={handleChange}
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="col-span-6">
                            <label htmlFor="evolution" className="block text-sm font-medium text-gray-700">Evolution / Progress</label>
                            <textarea
                                name="evolution"
                                id="evolution"
                                rows={3}
                                value={formData.evolution}
                                onChange={handleChange}
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="radiologyTests" className="block text-sm font-medium text-gray-700">Radiology / Tests</label>
                            <input
                                type="text"
                                name="radiologyTests"
                                id="radiologyTests"
                                value={formData.radiologyTests}
                                onChange={handleChange}
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                         <div className="col-span-6 sm:col-span-3">
                            <label htmlFor="medicalTreatment" className="block text-sm font-medium text-gray-700">Medical Treatment</label>
                            <input
                                type="text"
                                name="medicalTreatment"
                                id="medicalTreatment"
                                value={formData.medicalTreatment}
                                onChange={handleChange}
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="col-span-6">
                            <label htmlFor="homeTreatment" className="block text-sm font-medium text-gray-700">Home Treatment</label>
                            <textarea
                                name="homeTreatment"
                                id="homeTreatment"
                                rows={3}
                                value={formData.homeTreatment}
                                onChange={handleChange}
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="col-span-6">
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Additional Notes</label>
                            <input
                                type="text"
                                name="notes"
                                id="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="col-span-6">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="sickLeave"
                                        name="sickLeave"
                                        type="checkbox"
                                        checked={formData.sickLeave}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="sickLeave" className="font-medium text-gray-700">Sick Leave</label>
                                    <p className="text-gray-500">Is the patient currently on sick leave?</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </form>
        </div>
    );
}
