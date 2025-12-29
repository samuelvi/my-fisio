import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import Routing from '../../routing/init';
import { Invoice, InvoiceLine } from '../../types';

interface InvoiceInputProps {
    label: string;
    value: string;
    setter: (val: string) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
}

const InvoiceInput = ({ label, value, setter, type = "text", required = false, placeholder = "" }: InvoiceInputProps) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && "*"}</label>
        <input
            type={type}
            required={required}
            value={value}
            onChange={(e) => setter(e.target.value)}
            placeholder={placeholder}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
    </div>
);

export default function InvoiceForm() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patientId');
    const isEditing = !!id;
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingPatient, setLoadingPatient] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [numberError, setNumberError] = useState<string>('');
    const editEnabled = import.meta.env.VITE_INVOICE_EDIT_ENABLED !== 'false';

    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [customerName, setCustomerName] = useState<string>('');
    const [customerTaxId, setCustomerTaxId] = useState<string>('');
    const [customerAddress, setCustomerAddress] = useState<string>('');
    const [customerPhone, setCustomerPhone] = useState<string>('');
    const [customerEmail, setCustomerEmail] = useState<string>('');
    const [invoiceNumber, setInvoiceNumber] = useState<string>('');

    const [lines, setLines] = useState<InvoiceLine[]>([
        { concept: '', description: '', quantity: 1, price: 0, amount: 0 }
    ]);

    useEffect(() => {
        if (isEditing && !editEnabled) {
            navigate('/invoices');
        }
    }, [isEditing, editEnabled, navigate]);

    useEffect(() => {
        if (!isEditing || !id) return;
        const fetchInvoice = async () => {
            setLoading(true);
            try {
                const response = await axios.get<Invoice>(Routing.generate('api_invoices_get', { id }));
                const data = response.data;
                setDate(data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                setCustomerName(data.fullName || '');
                setCustomerTaxId(data.taxId || '');
                setCustomerAddress(data.address || '');
                setCustomerPhone(data.phone || '');
                setCustomerEmail(data.email || '');
                setInvoiceNumber(data.number || '');
                const mappedLines = (data.lines || []).map((line) => ({
                    concept: line.concept || '',
                    description: line.description || '',
                    quantity: line.quantity || 1,
                    price: line.price || 0,
                    amount: line.amount || (line.quantity || 1) * (line.price || 0)
                }));
                setLines(mappedLines.length ? mappedLines : [{ concept: '', description: '', quantity: 1, price: 0, amount: 0 }]);
            } catch (err) {
                console.error('Error loading invoice:', err);
                setError(t('error_could_not_load_invoice'));
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [isEditing, id, t]);

    useEffect(() => {
        if (!patientId || isEditing) return;

        const fetchPrefillData = async () => {
            setLoadingPatient(true);
            try {
                const response = await axios.get(Routing.generate('invoice_prefill'), {
                    params: { patientId }
                });
                const data = response.data;

                setCustomerName(data.fullName || '');
                setCustomerTaxId(data.taxId || '');
                setCustomerAddress(data.address || '');
                setCustomerPhone(data.phone || '');
                setCustomerEmail(data.email || '');
            } catch (err) {
                console.error('Error loading prefill data:', err);
            } finally {
                setLoadingPatient(false);
            }
        };

        fetchPrefillData();
    }, [patientId, isEditing]);

    const handleAddLine = () => {
        setLines([...lines, { concept: '', description: '', quantity: 1, price: 0, amount: 0 }]);
    };

    const handleRemoveLine = (index: number) => {
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
    };

    const handleLineChange = (index: number, field: keyof InvoiceLine, value: string | number) => {
        const newLines = [...lines];
        (newLines[index] as any)[field] = value;
        if (field === 'quantity' || field === 'price') {
            const qty = parseFloat(String(newLines[index].quantity)) || 0;
            const price = parseFloat(String(newLines[index].price)) || 0;
            newLines[index].amount = qty * price;
        }
        setLines(newLines);
    };

    const calculateTotal = () => {
        return lines.reduce((sum, line) => sum + (parseFloat(String(line.amount)) || 0), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setNumberError('');

        if (!customerName || !customerTaxId) {
            setError(t('error_required_fields_missing'));
            setLoading(false);
            return;
        }

        const payload: any = {
            date: new Date(date).toISOString(),
            fullName: customerName,
            taxId: customerTaxId,
            address: customerAddress,
            phone: customerPhone,
            email: customerEmail,
            number: invoiceNumber,
            amount: calculateTotal(),
            lines: lines.map(line => ({
                concept: line.concept,
                description: line.description,
                quantity: parseInt(String(line.quantity)),
                price: parseFloat(String(line.price)),
                amount: parseFloat(String(line.amount))
            }))
        };

        try {
            if (isEditing) {
                await axios.put(Routing.generate('api_invoices_put', { id }), payload);
            } else {
                delete payload.number;
                await axios.post(Routing.generate('api_invoices_post'), payload);
            }
            navigate('/invoices');
        } catch (err: any) {
            console.error('Error creating invoice:', err);
            const detail = err.response?.data?.detail;
            if (detail && detail.startsWith('invoice_number_')) {
                setNumberError(t(detail));
            } else {
                setError(t('error_failed_to_create_invoice'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{isEditing ? t('edit_invoice') : t('new_invoice')}</h1>
                <p className="text-sm text-gray-500">{isEditing ? t('edit_invoice_subtitle') : t('new_invoice_subtitle')}</p>
            </div>

            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200 text-sm text-red-800">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-medium text-gray-900">{t('customer_information')}</h2>
                    </div>
                    <div className="p-6">
                        {patientId && !isEditing && (
                            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start">
                                <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="text-sm text-blue-800">
                                    {loadingPatient ? (
                                        <span className="font-medium">{t('loading')}...</span>
                                    ) : (
                                        <span>{t('invoice_prefilled_from_patient')}</span>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InvoiceInput label={t('invoice_date')} value={date} setter={setDate} type="date" required />
                            {isEditing && (
                                <InvoiceInput
                                    label={t('number')}
                                    value={invoiceNumber}
                                    setter={setInvoiceNumber}
                                    required
                                    placeholder="YYYY000001"
                                    type="text"
                                />
                            )}
                            {isEditing && numberError && (
                                <p className="text-sm text-red-600 font-bold -mt-3">{numberError}</p>
                            )}
                            <InvoiceInput label={t('customer_name')} value={customerName} setter={setCustomerName} required placeholder={t('customer_name_placeholder')} />
                            <InvoiceInput label={t('tax_id')} value={customerTaxId} setter={setCustomerTaxId} required placeholder="Ex: 12345678A" />
                            <InvoiceInput label={t('email')} value={customerEmail} setter={setCustomerEmail} type="email" />
                            <InvoiceInput label={t('phone')} value={customerPhone} setter={setCustomerPhone} />
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('address')}</label>
                                <input 
                                    type="text" 
                                    value={customerAddress} 
                                    onChange={(e) => setCustomerAddress(e.target.value)} 
                                    placeholder={t('billing_address_placeholder')} 
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">{t('invoice_items')}</h2>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        {lines.map((line, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="col-span-12 md:col-span-5 space-y-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('concept')}</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={line.concept} 
                                        onChange={(e) => handleLineChange(index, 'concept', e.target.value)} 
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" 
                                        placeholder={t('concept_placeholder')} 
                                    />
                                    <input 
                                        type="text" 
                                        value={line.description} 
                                        onChange={(e) => handleLineChange(index, 'description', e.target.value)} 
                                        className="w-full border border-gray-200 rounded-md py-1.5 px-3 text-xs text-gray-500" 
                                        placeholder={t('additional_notes')} 
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('qty')}</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        required 
                                        value={line.quantity} 
                                        onChange={(e) => handleLineChange(index, 'quantity', parseInt(e.target.value))} 
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-center" 
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('price')}</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        value={line.price} 
                                        onChange={(e) => handleLineChange(index, 'price', parseFloat(e.target.value))} 
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-center" 
                                    />
                                </div>
                                <div className="col-span-3 md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('total')}</label>
                                    <div className="py-2 text-sm font-bold text-gray-900">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(line.amount)}
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-1 flex justify-end md:pt-7">
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveLine(index)} 
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-end">
                            <button 
                                type="button" 
                                onClick={handleAddLine} 
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-md text-primary bg-primary/10 hover:bg-primary/20 transition"
                            >
                                + {t('add_item')}
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center">
                        <span className="text-sm font-medium text-gray-500 mr-4">{t('total_amount')}:</span>
                        <span className="text-2xl font-bold text-primary">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(calculateTotal())}
                        </span>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <button 
                        type="button" 
                        onClick={() => navigate('/invoices')} 
                        className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition"
                    >
                        {t('cancel')}
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="inline-flex items-center px-8 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50 transition"
                    >
                        {loading && (
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {loading ? t('processing') : t('confirm_issuance')}
                    </button>
                </div>
            </form>
        </div>
    );
}