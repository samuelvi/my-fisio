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
            <label htmlFor={name} className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label} {required && "*"}</label>
            <textarea
                name={name}
                id={name}
                rows={rows}
                required={required}
                value={formData[name]}
                onChange={handleChange}
                className={`block w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-4 focus:bg-white focus:border-primary/20 outline-none transition-all font-bold text-gray-800 ${errors[name] ? 'border-red-500' : ''}`}
            />
            {errors[name] && <p className="mt-1 text-xs font-bold text-red-600 uppercase tracking-tight">{errors[name]}</p>}
        </div>
    );

    if (loading && isEditing && !formData.physiotherapyTreatment) {
        return <div className="p-8 text-center text-gray-400 font-black uppercase tracking-[0.3em] animate-pulse">Loading Record...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-4xl font-black text-primary-dark tracking-tighter uppercase">
                        {isEditing ? 'Update History' : 'New History Entry'}
                    </h2>
                    {patientName && (
                        <p className="mt-1 text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">Patient File: <span className="text-primary-dark font-black">{patientName}</span></p>
                    )}
                </div>
                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate(`/patients/${patientId}`)}
                        className="px-8 py-4 bg-white border-2 border-gray-100 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-btn-secondary hover:text-btn-secondary transition-all"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        form="record-form"
                        disabled={loading}
                        className="px-10 py-4 bg-btn-success text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-95 shadow-xl shadow-btn-success/20 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Confirm Entry'}
                    </button>
                </div>
            </div>

             {errors.global && (
                <div className="rounded-2xl bg-red-50 p-4 border-2 border-red-100">
                    <h3 className="text-xs font-black text-red-800 uppercase tracking-widest text-center">{errors.global}</h3>
                </div>
            )}

            <form id="record-form" onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white shadow-sm border border-gray-100 rounded-[2rem] p-10">
                    <div className="grid grid-cols-6 gap-8">
                        
                        <InputArea label="Main Physiotherapy Treatment" name="physiotherapyTreatment" required rows={5} />
                        
                        <div className="col-span-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50 pt-8 mt-4">
                            <InputArea label="Consultation Reason" name="consultationReason" rows={2} />
                            <InputArea label="Onset Details" name="onset" rows={2} />
                            <InputArea label="Current Situation" name="currentSituation" rows={2} />
                            <InputArea label="Evolution / Progress" name="evolution" rows={2} />
                        </div>

                        <div className="col-span-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50 pt-8 mt-4">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tests & Radiology</label>
                                <input type="text" name="radiologyTests" value={formData.radiologyTests} onChange={handleChange} className="block w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-4 focus:bg-white focus:border-primary/20 outline-none transition-all font-bold text-gray-800" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Parallel Medical Treatment</label>
                                <input type="text" name="medicalTreatment" value={formData.medicalTreatment} onChange={handleChange} className="block w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-4 focus:bg-white focus:border-primary/20 outline-none transition-all font-bold text-gray-800" />
                            </div>
                        </div>

                        <InputArea label="Home Tasks / Treatment" name="homeTreatment" rows={3} />
                        
                        <div className="col-span-6">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Confidential Notes</label>
                            <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="block w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3 px-4 focus:bg-white focus:border-primary/20 outline-none transition-all font-bold text-gray-800 italic" />
                        </div>

                        <div className="col-span-6 pt-4 border-t border-gray-50">
                            <label className="inline-flex items-center cursor-pointer bg-gray-50 p-6 rounded-[2rem] border-2 border-transparent hover:border-primary/10 transition-all w-full sm:w-auto">
                                <input
                                    type="checkbox"
                                    name="sickLeave"
                                    checked={formData.sickLeave}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-btn-danger"></div>
                                <div className="ml-4">
                                    <span className="block text-sm font-black text-gray-800 uppercase tracking-tight">Active Sick Leave</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mark if patient is currently unfit for work</span>
                                </div>
                            </label>
                        </div>

                    </div>
                </div>
            </form>
        </div>
    );
}