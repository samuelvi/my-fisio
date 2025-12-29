import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from './LanguageContext';
import Routing from '../routing/init';
import { RecordEntry, Patient } from '../types';

interface RecordFormInputAreaProps {
    label: string;
    name: string;
    required?: boolean;
    rows?: number;
    value: string;
    error?: string;
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

const RecordFormInputArea = ({ label, name, required = false, rows = 3, value, error, onChange }: RecordFormInputAreaProps) => (
    <div className={rows > 2 ? "col-span-6" : "col-span-6 sm:col-span-3"}>
        <label htmlFor={name} className="block text-sm font-bold text-gray-700 mb-1">{label} {required && "*"}</label>
        <textarea
            name={name}
            id={name}
            rows={rows}
            required={required}
            value={value}
            onChange={onChange}
            className={`block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${error ? 'border-red-500' : ''}`}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

interface RecordFormData {
    physiotherapyTreatment: string;
    consultationReason: string;
    onset: string;
    currentSituation: string;
    evolution: string;
    radiologyTests: string;
    medicalTreatment: string;
    homeTreatment: string;
    notes: string;
    sickLeave: boolean;
}

export default function RecordForm() {
    const { t } = useLanguage();
    const { patientId, recordId } = useParams<{ patientId: string; recordId: string }>();
    const navigate = useNavigate();
    const isEditing = !!recordId;
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [patientName, setPatientName] = useState<string>('');
    const [recordDate, setRecordDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

    const [formData, setFormData] = useState<RecordFormData>({
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
            if (!patientId) return;
            setLoading(true);
            try {
                const patientResponse = await axios.get<Patient>(Routing.generate('api_patients_get', { id: patientId }));
                setPatientName(`${patientResponse.data.firstName} ${patientResponse.data.lastName}`);

                if (isEditing && recordId) {
                    const recordResponse = await axios.get<RecordEntry>(Routing.generate('api_records_get', { id: recordId }));
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
                    if (data.createdAt) {
                        const normalizedDate = typeof data.createdAt === 'string'
                            ? data.createdAt.slice(0, 10)
                            : new Date(data.createdAt).toISOString().slice(0, 10);
                        setRecordDate(normalizedDate);
                    }
                }
            } catch (err: any) {
                console.error("Error loading initial data:", err);
                const msg = err.response?.status === 404 ? t('resource_not_found') : t('error_could_not_load_data');
                setErrors({ global: msg });
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [patientId, recordId, isEditing]);

    const formattedRecordDate = recordDate ? new Date(recordDate).toLocaleDateString() : '';

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const payload: any = { ...formData, createdAt: recordDate || undefined };
            if (!isEditing) {
                payload.patient = Routing.generate('api_patients_get', { id: patientId });
            }

            if (isEditing && recordId) {
                await axios.put(Routing.generate('api_records_put', { id: recordId }), payload);
            } else {
                await axios.post(Routing.generate('api_records_post'), payload);
            }
            navigate(`/patients/${patientId}`);
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.violations) {
                const newErrors: Record<string, string> = {};
                err.response.data.violations.forEach((violation: any) => {
                    newErrors[violation.propertyPath] = violation.message;
                });
                setErrors(newErrors);
            } else {
                setErrors({ global: t('error_unexpected') });
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditing && !formData.physiotherapyTreatment) {
        return <div className="p-4 sm:p-8 text-center text-gray-500">{t('loading')}...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <button onClick={() => navigate(`/patients/${patientId}`)} className="text-primary font-bold hover:text-primary-dark mb-6 inline-flex items-center transition">
                ← {t('back_to_patient')}
            </button>

             <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">
                            {isEditing ? t('update_clinical_history') : t('new_clinical_history_entry')}
                        </h2>
                        {patientName && (
                            <p className="mt-1 text-sm text-gray-500">{t('patient')}: <span className="font-bold text-gray-900">{patientName}</span></p>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('date')}</div>
                        <input
                            type="date"
                            value={recordDate}
                            onChange={(event) => setRecordDate(event.target.value)}
                            className="text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                        {formattedRecordDate && (
                            <div className="text-[10px] text-gray-400 mt-1">{formattedRecordDate}</div>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {errors.global && (
                        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                            <h3 className="text-sm font-bold text-red-800">{errors.global}</h3>
                        </div>
                    )}

                    <form id="record-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-6 gap-6">
                            
                            <RecordFormInputArea
                                label={t('main_physiotherapy_treatment')}
                                name="physiotherapyTreatment"
                                required
                                rows={4}
                                value={formData.physiotherapyTreatment}
                                error={errors.physiotherapyTreatment}
                                onChange={handleChange}
                            />
                            
                            <RecordFormInputArea
                                label={t('consultation_reason')}
                                name="consultationReason"
                                rows={2}
                                value={formData.consultationReason}
                                error={errors.consultationReason}
                                onChange={handleChange}
                            />
                            <RecordFormInputArea
                                label={t('onset_details')}
                                name="onset"
                                rows={2}
                                value={formData.onset}
                                error={errors.onset}
                                onChange={handleChange}
                            />
                            <RecordFormInputArea
                                label={t('current_situation')}
                                name="currentSituation"
                                rows={2}
                                value={formData.currentSituation}
                                error={errors.currentSituation}
                                onChange={handleChange}
                            />
                            <RecordFormInputArea
                                label={t('evolution_progress')}
                                name="evolution"
                                rows={2}
                                value={formData.evolution}
                                error={errors.evolution}
                                onChange={handleChange}
                            />

                            <div className="col-span-6 sm:col-span-3">
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('tests_radiology')}</label>
                                <input type="text" name="radiologyTests" value={formData.radiologyTests} onChange={handleChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('parallel_medical_treatment')}</label>
                                <input type="text" name="medicalTreatment" value={formData.medicalTreatment} onChange={handleChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>

                            <RecordFormInputArea
                                label={t('home_tasks_treatment')}
                                name="homeTreatment"
                                rows={3}
                                value={formData.homeTreatment}
                                error={errors.homeTreatment}
                                onChange={handleChange}
                            />
                            
                            <div className="col-span-6">
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('confidential_notes')}</label>
                                <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm italic" placeholder={t('private_notes_placeholder')} />
                            </div>

                            <div className="col-span-6">
                                <div className="flex items-center">
                                    <input
                                        id="sickLeave"
                                        name="sickLeave"
                                        type="checkbox"
                                        checked={formData.sickLeave}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor="sickLeave" className="ml-2 block text-sm text-gray-900 font-bold">
                                        {t('active_sick_leave')}
                                    </label>
                                </div>
                                <p className="mt-1 ml-6 text-xs text-gray-500">{t('sick_leave_help_text')}</p>
                            </div>

                        </div>

                        <div className="pt-5 border-t border-gray-200 flex justify-between items-center">
                            <button
                                type="button"
                                onClick={() => navigate(`/patients/${patientId}`)}
                                className="px-6 py-2 border border-gray-300 shadow-sm text-sm font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50 transition"
                            >
                                {loading ? t('saving') : (isEditing ? t('update') : t('save_history_entry'))}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}