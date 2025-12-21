import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function PatientForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;
    const [loading, setLoading] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [errors, setErrors] = useState({});
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        identityDocument: '',
        dateOfBirth: '',
        phone: '',
        email: '',
        address: '',
        profession: '',
        sportsActivity: '',
        allergies: '',
        systemicDiseases: '',
        medication: '',
        surgeries: '',
        accidents: '',
        notes: '',
        status: 'active'
    });

    useEffect(() => {
        if (isEditing) {
            fetchPatient();
        }
    }, [id]);

    const fetchPatient = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/patients/${id}`);
            const data = response.data;
            // Format date for input type="date"
            const formattedDate = data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '';
            
            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                identityDocument: data.identityDocument || '',
                dateOfBirth: formattedDate,
                phone: data.phone || '',
                email: data.email || '',
                address: data.address || '',
                profession: data.profession || '',
                sportsActivity: data.sportsActivity || '',
                allergies: data.allergies || '',
                systemicDiseases: data.systemicDiseases || '',
                medication: data.medication || '',
                surgeries: data.surgeries || '',
                accidents: data.accidents || '',
                notes: data.notes || '',
                status: data.status || 'active'
            });
        } catch (err) {
            console.error("Error loading patient:", err);
            setErrors({ global: 'Could not load patient details.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            // Filter out empty strings to send null for optional fields if preferred, 
            // or API Platform handles empty strings. Let's send what we have.
            // Ensure date is properly formatted or null if empty
            const payload = { ...formData };
            if (!payload.dateOfBirth) delete payload.dateOfBirth;

            if (isEditing) {
                await axios.put(`/api/patients/${id}`, payload);
                navigate(`/patients/${id}`);
            } else {
                await axios.post('/api/patients', payload);
                navigate('/patients');
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.violations) {
                // Handle API Platform validation errors
                const newErrors = {};
                err.response.data.violations.forEach(violation => {
                    newErrors[violation.propertyPath] = violation.message;
                });
                setErrors(newErrors);
            } else {
                setErrors({ global: 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        {isEditing ? 'Edit Patient' : 'New Patient'}
                    </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <button
                        type="button"
                        onClick={() => navigate(isEditing ? `/patients/${id}` : '/patients')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="patient-form"
                        disabled={loading}
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Patient'}
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

            <form id="patient-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* SECTION 1: Personal Information */}
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Basic identification details.
                            </p>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First name *</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        id="firstName"
                                        required
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.firstName ? 'border-red-500' : ''}`}
                                    />
                                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last name *</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        id="lastName"
                                        required
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.lastName ? 'border-red-500' : ''}`}
                                    />
                                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="identityDocument" className="block text-sm font-medium text-gray-700">ID Document / DNI</label>
                                    <input
                                        type="text"
                                        name="identityDocument"
                                        id="identityDocument"
                                        value={formData.identityDocument}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        id="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: Contact Information */}
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Contact Details</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                How to reach the patient.
                            </p>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        id="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 3: Clinical Background */}
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Clinical Background</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                History and lifestyle factors.
                            </p>
                        </div>
                        <div className="mt-5 md:mt-0 md:col-span-2">
                            <div className="grid grid-cols-6 gap-6">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="profession" className="block text-sm font-medium text-gray-700">Profession</label>
                                    <input
                                        type="text"
                                        name="profession"
                                        id="profession"
                                        value={formData.profession}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="sportsActivity" className="block text-sm font-medium text-gray-700">Sports / Physical Activity</label>
                                    <input
                                        type="text"
                                        name="sportsActivity"
                                        id="sportsActivity"
                                        value={formData.sportsActivity}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="allergies" className="block text-sm font-medium text-red-600">Allergies</label>
                                    <input
                                        type="text"
                                        name="allergies"
                                        id="allergies"
                                        placeholder="e.g. Penicillin, Latex..."
                                        value={formData.allergies}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-red-300 rounded-md placeholder-gray-300"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="systemicDiseases" className="block text-sm font-medium text-gray-700">Systemic Diseases</label>
                                    <textarea
                                        name="systemicDiseases"
                                        id="systemicDiseases"
                                        rows={2}
                                        value={formData.systemicDiseases}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="surgeries" className="block text-sm font-medium text-gray-700">Surgeries</label>
                                    <textarea
                                        name="surgeries"
                                        id="surgeries"
                                        rows={2}
                                        value={formData.surgeries}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="accidents" className="block text-sm font-medium text-gray-700">Accidents / Trauma</label>
                                    <textarea
                                        name="accidents"
                                        id="accidents"
                                        rows={2}
                                        value={formData.accidents}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                                
                                <div className="col-span-6">
                                    <label htmlFor="medication" className="block text-sm font-medium text-gray-700">Current Medication</label>
                                    <input
                                        type="text"
                                        name="medication"
                                        id="medication"
                                        value={formData.medication}
                                        onChange={handleChange}
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 4: Danger Zone (Status Toggle) */}
                {isEditing && (
                    <div className="bg-red-50 shadow px-4 py-5 sm:rounded-lg sm:p-6 border border-red-200 mt-12">
                        <div className="md:grid md:grid-cols-3 md:gap-6">
                            <div className="md:col-span-1">
                                <h3 className="text-lg font-medium leading-6 text-red-800">Danger Zone</h3>
                                <p className="mt-1 text-sm text-red-600">
                                    Manage patient activation status.
                                </p>
                            </div>
                            <div className="mt-5 md:mt-0 md:col-span-2 flex items-center justify-between">
                                <div>
                                    <span className="block text-sm font-bold text-gray-700">Patient Status</span>
                                    <span className="text-sm text-gray-500">
                                        Current status: <span className={`font-semibold ${formData.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                            {formData.status.toUpperCase()}
                                        </span>
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <button
                                        type="button"
                                        onClick={handleStatusChange}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${formData.status === 'active' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                        role="switch"
                                        aria-checked={formData.status === 'active'}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.status === 'active' ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                    <span className="ml-3 text-sm font-medium text-gray-900">
                                        {formData.status === 'active' ? 'Active' : 'Disabled'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </form>

            {/* Confirmation Modal */}
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
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                        <div className="sm:flex sm:items-start">
                                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                                            </div>
                                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                                <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                                    Deactivate Patient
                                                </Dialog.Title>
                                                <div className="mt-2">
                                                    <p className="text-sm text-gray-500">
                                                        Are you sure you want to deactivate this patient? They will no longer appear in the active patients list by default.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                                            onClick={confirmDeactivate}
                                        >
                                            Deactivate
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                            onClick={() => setIsConfirmModalOpen(false)}
                                        >
                                            Cancel
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
