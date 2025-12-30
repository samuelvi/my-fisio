import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import Routing from '../../routing/init';
import { Customer } from '../../types';

export default function CustomerForm() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<Customer>({
        firstName: '',
        lastName: '',
        taxId: '',
        email: '',
        phone: '',
        billingAddress: ''
    });

    useEffect(() => {
        if (id) {
            fetchCustomer(id);
        }
    }, [id]);

    const fetchCustomer = async (customerId: string) => {
        setLoading(true);
        try {
            const response = await axios.get(Routing.generate('api_customers_item_get', { id: customerId }));
            const customer = response.data;
            setFormData({
                firstName: customer.firstName,
                lastName: customer.lastName,
                taxId: customer.taxId,
                email: customer.email || '',
                phone: customer.phone || '',
                billingAddress: customer.billingAddress || ''
            });
        } catch (error) {
            console.error('Error fetching customer:', error);
            setError(t('error_loading_customer'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear specific error when user types
        if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.firstName.trim()) errors.firstName = t('field_required');
        if (!formData.lastName.trim()) errors.lastName = t('field_required');
        if (!formData.taxId.trim()) errors.taxId = t('field_required');
        if (!formData.billingAddress.trim()) errors.billingAddress = t('field_required');

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setError(null);

        try {
            if (id) {
                await axios.put(Routing.generate('api_customers_put', { id }), formData);
            } else {
                await axios.post(Routing.generate('api_customers_post'), formData);
            }
            navigate('/customers');
        } catch (error: any) {
            console.error('Error saving customer:', error);
            
            const responseData = error.response?.data;
            if (error.response?.status !== 422 || !responseData) {
                setError(t('error_saving_customer'));
                return;
            }

            const violations = responseData.violations;
            if (violations) {
                const serverErrors: Record<string, string> = {};
                violations.forEach((violation: any) => {
                    serverErrors[violation.propertyPath] = violation.message;
                });
                setFormErrors(serverErrors);
                setError(t('error_validation_failed'));
                return;
            }

            if (responseData['hydra:description']) {
                setError(responseData['hydra:description']);
                return;
            }

            setError(t('error_saving_customer'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    {id ? t('edit_customer') : t('new_customer')}
                </h1>
                <Link 
                    to="/customers"
                    className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-black text-sm transition shadow-sm hover:bg-gray-50 inline-flex items-center justify-center"
                >
                    {t('cancel')}
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100 flex items-center">
                    <svg className="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                {t('first_name')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium ${
                                    formErrors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
                                }`}
                            />
                            {formErrors.firstName && (
                                <p className="mt-1 text-xs font-bold text-red-500 ml-1">{t(formErrors.firstName)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                {t('last_name')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium ${
                                    formErrors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
                                }`}
                            />
                            {formErrors.lastName && (
                                <p className="mt-1 text-xs font-bold text-red-500 ml-1">{t(formErrors.lastName)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                {t('tax_id')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="taxId"
                                value={formData.taxId}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium ${
                                    formErrors.taxId ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
                                }`}
                            />
                            {formErrors.taxId && (
                                <p className="mt-1 text-xs font-bold text-red-500 ml-1">{t(formErrors.taxId)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                {t('email')}
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                {t('phone')}
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                            {t('address')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="billingAddress"
                            value={formData.billingAddress}
                            onChange={handleChange}
                            rows={3}
                            className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium ${
                                formErrors.billingAddress ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
                            }`}
                        ></textarea>
                        {formErrors.billingAddress && (
                            <p className="mt-1 text-xs font-bold text-red-500 ml-1">{t(formErrors.billingAddress)}</p>
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                         <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-black text-sm transition shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? t('saving') : t('save_customer')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}