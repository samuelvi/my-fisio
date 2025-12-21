import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PatientForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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
        notes: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

            await axios.post('/api/patients', payload);
            navigate('/patients');
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
                        New Patient
                    </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <button
                        type="button"
                        onClick={() => navigate('/patients')}
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

            </form>
        </div>
    );
}
