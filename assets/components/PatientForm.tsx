import React, { useState, useEffect, Fragment, ChangeEvent, FormEvent, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLanguage } from './LanguageContext';
import Routing from '../routing/init';
import { Patient, PatientStatus } from '../types';
import { useFormDraft } from '../presentation/hooks/useFormDraft';
import FormDraftUI from './shared/FormDraftUI';

interface PatientFormData {
    firstName: string;
    lastName: string;
    taxId: string;
    dateOfBirth: string;
    phone: string;
    email: string;
    address: string;
    profession: string;
    sportsActivity: string;
    rate: string;
    allergies: string;
    systemicDiseases: string;
    medication: string;
    surgeries: string;
    accidents: string;
    injuries: string;
    bruxism: string;
    insoles: string;
    others: string;
    notes: string;
    status: PatientStatus;
}

export default function PatientForm() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const [loading, setLoading] = useState<boolean>(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<PatientFormData>({
        firstName: '',
        lastName: '',
        taxId: '',
        dateOfBirth: '',
        phone: '',
        email: '',
        address: '',
        profession: '',
        sportsActivity: '',
        rate: '',
        allergies: '',
        systemicDiseases: '',
        medication: '',
        surgeries: '',
        accidents: '',
        injuries: '',
        bruxism: '',
        insoles: '',
        others: '',
        notes: '',
        status: 'active'
    });

    // Ref to hold current form data for auto-save (avoids stale closures)
    const formDataRef = useRef<PatientFormData>(formData);

    // Update ref whenever form data changes
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    // Draft system using reusable hook
    const formIdRef = useRef(`patient-${isEditing ? id : 'new'}-${Date.now()}`);
    const draft = useFormDraft<PatientFormData>({
        type: 'patient',
        formId: formIdRef.current,
        onRestore: (data) => {
            setFormData(data);
        }
    });

    useEffect(() => {
        if (isEditing) {
            fetchPatient();
        }
    }, [id]);

    const fetchPatient = async () => {
        setLoading(true);
        try {
            const response = await axios.get<Patient>(Routing.generate('api_patients_get', { id }));
            const data = response.data;
            const formattedDate = data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '';

            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                taxId: data.taxId || '',
                dateOfBirth: formattedDate,
                phone: data.phone || '',
                email: data.email || '',
                address: data.address || '',
                profession: data.profession || '',
                sportsActivity: data.sportsActivity || '',
                rate: data.rate || '',
                allergies: data.allergies || '',
                systemicDiseases: data.systemicDiseases || '',
                medication: data.medication || '',
                surgeries: data.surgeries || '',
                accidents: data.accidents || '',
                injuries: data.injuries || '',
                bruxism: data.bruxism || '',
                insoles: data.insoles || '',
                others: data.others || '',
                notes: data.notes || '',
                status: data.status || 'active'
            });
        } catch (err) {
            console.error("Error loading patient:", err);
            setErrors({ global: t('error_could_not_load_patient') });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStatusChange = () => {
        const currentStatus = formData.status || 'active';

        if (currentStatus === 'active') {
            setIsConfirmModalOpen(true);
        } else {
            setFormData(prev => ({ ...prev, status: 'active' }));
        }
    };

    const confirmDeactivate = () => {
        setFormData(prev => ({ ...prev, status: 'disabled' }));
        setIsConfirmModalOpen(false);
    };


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // Save draft before submitting (as per requirement)
        draft.saveDraft(formDataRef.current);
        
        // Set loading state first
        setLoading(true);
        setErrors({});
        try {
            const payload: any = { ...formData };
            if (!payload.dateOfBirth) delete payload.dateOfBirth;

            if (isEditing) {
                await axios.put(Routing.generate('api_patients_put', { id }), payload);
            } else {
                await axios.post(Routing.generate('api_patients_post'), payload);
            }

            // SUCCESS: Clear draft and navigate
            draft.clearDraft();

            // Do NOT set loading to false here, let the component unmount
            if (isEditing) {
                navigate(`/patients/${id}`);
            } else {
                navigate('/patients');
            }
        } catch (err: any) {
            console.error(err);

            // Save draft on network error
            draft.saveOnNetworkError(err, formDataRef.current);

            // Move focus to draft alert if it's a network error
            const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED';
            if (isNetworkError) {
                setTimeout(() => {
                    const alertElement = document.getElementById('draft-alert');
                    if (alertElement) {
                        alertElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        alertElement.focus();
                    }
                }, 300);
            }

            if (err.response && err.response.data && err.response.data.violations) {
                const newErrors: Record<string, string> = {};
                err.response.data.violations.forEach((violation: any) => {
                    newErrors[violation.propertyPath] = violation.message;
                });
                setErrors(newErrors);
            } else {
                setErrors({ global: t('error_unexpected') });
            }

            // ONLY set loading to false on error, so auto-save can resume if fixed
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            {/* Draft UI (Alert + Modals) */}
            <FormDraftUI
                hasDraft={draft.hasDraft}
                draftAge={draft.draftAge}
                draftSavedByError={draft.draftSavedByError}
                showRestoreModal={draft.showRestoreModal}
                showDiscardModal={draft.showDiscardModal}
                onRestore={draft.openRestoreModal}
                onDiscard={draft.openDiscardModal}
                onRestoreConfirm={draft.handleRestoreDraft}
                onDiscardConfirm={draft.handleDiscardDraft}
                onRestoreCancel={draft.closeRestoreModal}
                onDiscardCancel={draft.closeDiscardModal}
            />

            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        {isEditing ? t('edit_patient') : t('new_patient')}
                    </h2>
                </div>
            </div>

            {errors.global && (
                <div className="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{errors.global}</h3>
                        </div>
                    </div>
                </div>
            )}

            <form id="patient-form" onSubmit={handleSubmit} className="space-y-6 pb-20">
                <div className="bg-white shadow-sm px-4 py-5 sm:rounded-lg sm:p-6 border border-gray-200">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-bold leading-6 text-gray-900">{t('personal_information')}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('basic_identification_subtitle')}
                            </p>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700">{t('first_name')} *</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        id="firstName"
                                        required
                                        placeholder={t('first_name_placeholder')}
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.firstName ? 'border-red-500' : ''} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700">{t('last_name')} *</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        id="lastName"
                                        required
                                        placeholder={t('last_name_placeholder')}
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.lastName ? 'border-red-500' : ''} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="taxId" className="block text-sm font-semibold text-gray-700">{t('id_document')}</label>
                                    <input
                                        type="text"
                                        name="taxId"
                                        id="taxId"
                                        placeholder={t('id_document_placeholder')}
                                        value={formData.taxId}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-700">{t('date_of_birth')}</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        id="dateOfBirth"
                                        placeholder={t('date_of_birth_placeholder')}
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm px-4 py-5 sm:rounded-lg sm:p-6 border border-gray-200">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-bold leading-6 text-gray-900">{t('contact_details')}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('contact_details_subtitle')}
                            </p>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">{t('phone_number')}</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        id="phone"
                                        placeholder={t('phone_placeholder')}
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">{t('email')}</label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        placeholder={t('email_placeholder')}
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="address" className="block text-sm font-semibold text-gray-700">{t('address')}</label>
                                    <input
                                        type="text"
                                        name="address"
                                        id="address"
                                        placeholder={t('address_placeholder')}
                                        value={formData.address}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm px-4 py-5 sm:rounded-lg sm:p-6 border border-gray-200">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-bold leading-6 text-gray-900">{t('administrative_details')}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('administrative_details_subtitle')}
                            </p>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="rate" className="block text-sm font-semibold text-gray-700">{t('rate')}</label>
                                    <input
                                        type="text"
                                        name="rate"
                                        id="rate"
                                        placeholder={t('rate_placeholder')}
                                        value={formData.rate}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm px-4 py-5 sm:rounded-lg sm:p-6 border border-gray-200">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-bold leading-6 text-gray-900">{t('clinical_background')}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('clinical_background_subtitle')}
                            </p>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="profession" className="block text-sm font-semibold text-gray-700">{t('profession')}</label>
                                    <input
                                        type="text"
                                        name="profession"
                                        id="profession"
                                        placeholder={t('profession_placeholder')}
                                        value={formData.profession}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="sportsActivity" className="block text-sm font-semibold text-gray-700">{t('sports_activity')}</label>
                                    <input
                                        type="text"
                                        name="sportsActivity"
                                        id="sportsActivity"
                                        placeholder={t('sports_activity_placeholder')}
                                        value={formData.sportsActivity}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="allergies" className="block text-sm font-bold text-red-600">{t('allergies')} *</label>
                                    <input
                                        type="text"
                                        name="allergies"
                                        id="allergies"
                                        required
                                        placeholder={t('allergies_placeholder')}
                                        value={formData.allergies}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-red-500 focus:border-red-500 block w-full px-4 py-2.5 shadow-sm sm:text-sm border-red-300 rounded-md placeholder-gray-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="systemicDiseases" className="block text-sm font-semibold text-gray-700">{t('systemic_diseases')}</label>
                                    <textarea
                                        name="systemicDiseases"
                                        id="systemicDiseases"
                                        rows={2}
                                        placeholder={t('systemic_diseases_placeholder')}
                                        value={formData.systemicDiseases}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="surgeries" className="block text-sm font-semibold text-gray-700">{t('surgeries')}</label>
                                    <textarea
                                        name="surgeries"
                                        id="surgeries"
                                        rows={2}
                                        placeholder={t('surgeries_placeholder')}
                                        value={formData.surgeries}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="accidents" className="block text-sm font-semibold text-gray-700">{t('accidents')}</label>
                                    <textarea
                                        name="accidents"
                                        id="accidents"
                                        rows={2}
                                        placeholder={t('accidents_placeholder')}
                                        value={formData.accidents}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="medication" className="block text-sm font-semibold text-gray-700">{t('current_medication')}</label>
                                    <input
                                        type="text"
                                        name="medication"
                                        id="medication"
                                        placeholder={t('medication_placeholder')}
                                        value={formData.medication}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="injuries" className="block text-sm font-semibold text-gray-700">{t('injuries')}</label>
                                    <textarea
                                        name="injuries"
                                        id="injuries"
                                        rows={2}
                                        placeholder={t('injuries_placeholder')}
                                        value={formData.injuries}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="bruxism" className="block text-sm font-semibold text-gray-700">{t('bruxism')}</label>
                                    <input
                                        type="text"
                                        name="bruxism"
                                        id="bruxism"
                                        placeholder={t('bruxism_placeholder')}
                                        value={formData.bruxism}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="insoles" className="block text-sm font-semibold text-gray-700">{t('insoles')}</label>
                                    <input
                                        type="text"
                                        name="insoles"
                                        id="insoles"
                                        placeholder={t('insoles_placeholder')}
                                        value={formData.insoles}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="others" className="block text-sm font-semibold text-gray-700">
                                        {t('others') === 'Otros' ? 'Otros Detalles' : t('others')}
                                    </label>
                                    <textarea
                                        name="others"
                                        id="others"
                                        rows={3}
                                        placeholder={t('others_placeholder')}
                                        value={formData.others}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="notes" className="block text-sm font-semibold text-gray-700">
                                        {t('notes') === 'Notas' ? 'Observaciones' : t('notes')}
                                    </label>
                                    <textarea
                                        name="notes"
                                        id="notes"
                                        rows={4}
                                        placeholder={t('notes_placeholder')}
                                        value={formData.notes}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className={`mt-1 focus:ring-primary focus:border-primary block w-full px-4 py-2.5 shadow-sm sm:text-sm border-gray-300 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="bg-red-50 shadow-sm px-4 py-5 sm:rounded-lg sm:p-6 border border-red-200 mt-12 mb-12">
                        <div className="md:grid md:grid-cols-3 md:gap-6">
                            <div className="md:col-span-1">
                                <h3 className="text-lg font-bold leading-6 text-red-800">{t('danger_zone')}</h3>
                                <p className="mt-1 text-sm text-red-600">
                                    {t('manage_status_subtitle')}
                                </p>
                            </div>
                            <div className="mt-5 md:mt-0 md:col-span-2 flex items-center justify-between">
                                <div>
                                    <span className="block text-sm font-bold text-gray-700">{t('patient_status')}</span>
                                    <span className="text-sm text-gray-500">
                                        {t('status')}: <span className={`font-bold ${formData.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t(formData.status)}
                                        </span>
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        onClick={handleStatusChange}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${formData.status === 'active' ? 'bg-primary' : 'bg-gray-200'}`}
                                        role="switch"
                                        aria-checked={formData.status === 'active'}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.status === 'active' ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                    <span className="ml-3 text-sm font-bold text-gray-900">
                                        {formData.status === 'active' ? t('active') : t('inactive')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center bg-white p-4 sm:rounded-lg border border-gray-200 shadow-sm mt-8">
                    <button
                        type="button"
                        onClick={() => navigate(isEditing ? `/patients/${id}` : '/patients')}
                        className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="save-patient-btn"
                        className="inline-flex items-center px-8 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50 transition"
                    >
                        {loading ? t('saving') : t('save_patient')}
                    </button>
                </div>
            </form>

            <Transition.Root show={isConfirmModalOpen} as={Fragment}>
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
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-200">
                                    <div className="bg-white px-4 pb-4 pt-5 sm:p-8 sm:pb-6">
                                        <div className="sm:flex sm:items-start">
                                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                                            </div>
                                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                                                    {t('deactivate_patient')}
                                                </Dialog.Title>
                                                <div className="mt-2">
                                                    <p className="text-sm text-gray-500">
                                                        {t('deactivate_patient_confirm_msg')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8 gap-4">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-500 sm:w-auto transition"
                                            onClick={confirmDeactivate}
                                        >
                                            {t('deactivate')}
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition"
                                            onClick={() => setIsConfirmModalOpen(false)}
                                        >
                                            {t('cancel')}
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
