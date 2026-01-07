import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import Routing from '../../routing/init';
import { Invoice, InvoiceLine } from '../../types';
import { useFormDraft } from '../../presentation/hooks/useFormDraft';
import FormDraftUI from '../shared/FormDraftUI';

interface InvoiceInputProps {
    label: string;
    name: string;
    value: string;
    setter: (val: string) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
}

const InvoiceInput = ({ label, name, value, setter, type = "text", required = false, placeholder = "", disabled = false, error }: InvoiceInputProps) => (
    <div>
        <label htmlFor={`invoice-${name}`} className="block text-sm font-medium text-gray-700 mb-1">{label} {required && "*"}</label>
        <input
            id={`invoice-${name}`}
            name={name}
            data-testid={`invoice-${name}`}
            type={type}
            required={required}
            value={value}
            onChange={(e) => setter(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`block w-full border ${error ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60' : ''}`}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

interface ValidationErrors {
    [key: string]: string;
}

interface InvoiceFormData {
    date: string;
    customerName: string;
    customerTaxId: string;
    customerAddress: string;
    customerPhone: string;
    customerEmail: string;
    invoiceNumber: string;
    lines: InvoiceLine[];
}

function parseValidationViolations(violations: Array<{ propertyPath: string; message: string }>): ValidationErrors {
    const errors: ValidationErrors = {};
    violations.forEach(violation => {
        errors[violation.propertyPath] = violation.message;
    });
    return errors;
}

function getLineError(validationErrors: ValidationErrors, lineIndex: number, field: string): string | undefined {
    return validationErrors[`lines[${lineIndex}].${field}`];
}

export default function InvoiceForm() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patientId');
    const customerId = searchParams.get('customerId');
    const invoicePrefix = import.meta.env.VITE_INVOICE_PREFIX || 'F';

    const isEditing = !!id;
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingPatient, setLoadingPatient] = useState<boolean>(false);
    const [loadingCustomer, setLoadingCustomer] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [numberError, setNumberError] = useState<string>('');
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const editEnabled = import.meta.env.VITE_INVOICE_EDIT_ENABLED !== 'false';

    const isLoading = loading || loadingPatient || loadingCustomer;

    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [customerName, setCustomerName] = useState<string>('');
    const [customerTaxId, setCustomerTaxId] = useState<string>('');
    const [customerAddress, setCustomerAddress] = useState<string>('');
    const [customerPhone, setCustomerPhone] = useState<string>('');
    const [customerEmail, setCustomerEmail] = useState<string>('');
    const [invoiceNumber, setInvoiceNumber] = useState<string>('');

    const clearFieldError = (fieldName: string) => {
        if (validationErrors[fieldName]) {
            const newErrors = { ...validationErrors };
            delete newErrors[fieldName];
            setValidationErrors(newErrors);
        }
    };

    const setDateWithClearError = (value: string) => {
        setDate(value);
        clearFieldError('date');
    };

    const setCustomerNameWithClearError = (value: string) => {
        setCustomerName(value);
        clearFieldError('fullName');
    };

    const setCustomerTaxIdWithClearError = (value: string) => {
        setCustomerTaxId(value);
        clearFieldError('taxId');
    };

    const [lines, setLines] = useState<InvoiceLine[]>([
        { concept: '', description: '', quantity: 1, price: 0, amount: 0 }
    ]);

    const formIdRef = useRef(`invoice-${isEditing ? id : 'new'}-${Date.now()}`);

    const draft = useFormDraft<InvoiceFormData>({
        type: 'invoice',
        formId: formIdRef.current,
        onRestore: (data) => {
            if (!data) return;
            setDate(data.date || new Date().toISOString().split('T')[0]);
            setCustomerName(data.customerName || '');
            setCustomerTaxId(data.customerTaxId || '');
            setCustomerAddress(data.customerAddress || '');
            setCustomerPhone(data.customerPhone || '');
            setCustomerEmail(data.customerEmail || '');
            setInvoiceNumber(data.invoiceNumber || '');
            setLines(data.lines || [{ concept: '', description: '', quantity: 1, price: 0, amount: 0 }]);
        }
    });

    const getCurrentFormData = (): InvoiceFormData => ({
        date,
        customerName,
        customerTaxId,
        customerAddress,
        customerPhone,
        customerEmail,
        invoiceNumber,
        lines
    });

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
                const response = await axios.get(Routing.generate('invoice_prefill'), { params: { patientId } });
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

    useEffect(() => {
        if (!customerId || isEditing) return;
        const fetchCustomerData = async () => {
            setLoadingCustomer(true);
            try {
                const response = await axios.get(Routing.generate('api_customers_item_get', { id: customerId }));
                const data = response.data;
                if (data) {
                    setCustomerName(data.fullName || `${data.firstName} ${data.lastName}`);
                    setCustomerTaxId(data.taxId || '');
                    setCustomerAddress(data.billingAddress || '');
                    setCustomerPhone(data.phone || '');
                    setCustomerEmail(data.email || '');
                }
            } catch (err) {
                console.error('Error loading customer data:', err);
                setError(t('error_could_not_load_data'));
            } finally {
                setLoadingCustomer(false);
            }
        };
        fetchCustomerData();
    }, [customerId, isEditing, t]);

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
        const errorKey = `lines[${index}].${field}`;
        if (validationErrors[errorKey]) {
            const newErrors = { ...validationErrors };
            delete newErrors[errorKey];
            setValidationErrors(newErrors);
        }
    };

    const calculateTotal = () => {
        return lines.reduce((sum, line) => sum + (parseFloat(String(line.amount)) || 0), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        draft.saveDraft(getCurrentFormData());
        
        if (!customerName || !customerTaxId) {
            setError(t('error_required_fields_missing'));
            return;
        }

        setLoading(true);
        setError(null);
        setValidationErrors({});

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
            draft.clearDraft();
            navigate('/invoices');
        } catch (err: any) {
            console.error('INVOICE SUBMIT ERROR:', err.response?.data || err);
            if (err.response?.status === 422 && err.response?.data?.violations) {
                const parsedErrors = parseValidationViolations(err.response.data.violations);
                setValidationErrors(parsedErrors);
                setError(t('error_validation_failed'));
                setLoading(false);
                return;
            }
            const detail = err.response?.data?.detail;
            if (detail && detail.startsWith('invoice_number_')) {
                setNumberError(t(detail));
                setLoading(false);
                return;
            }
            setError(t('error_failed_to_create_invoice'));
            draft.saveOnNetworkError(err, getCurrentFormData());
            setLoading(false);
        }
    };

    const setCustomerAddressWithClearError = (value: string) => {
        setCustomerAddress(value);
        clearFieldError('address');
    };

    const setCustomerPhoneWithClearError = (value: string) => {
        setCustomerPhone(value);
        clearFieldError('phone');
    };

    const setCustomerEmailWithClearError = (value: string) => {
        setCustomerEmail(value);
        clearFieldError('email');
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InvoiceInput
                                label={t('invoice_date')}
                                name="date"
                                value={date}
                                setter={setDateWithClearError}
                                type="date"
                                required
                                disabled={isLoading}
                                error={validationErrors['date']}
                            />
                            <InvoiceInput
                                label={t('customer_name')}
                                name="customerName"
                                value={customerName}
                                setter={setCustomerNameWithClearError}
                                required
                                placeholder={t('customer_name_placeholder')}
                                disabled={isLoading}
                                error={validationErrors['fullName']}
                            />
                            <InvoiceInput
                                label={t('tax_id')}
                                name="customerTaxId"
                                value={customerTaxId}
                                setter={setCustomerTaxIdWithClearError}
                                required
                                placeholder="Ex: 12345678A"
                                disabled={isLoading}
                                error={validationErrors['taxId']}
                            />
                            <InvoiceInput
                                label={t('email')}
                                name="customerEmail"
                                value={customerEmail}
                                setter={setCustomerEmailWithClearError}
                                type="email"
                                disabled={isLoading}
                                error={validationErrors['email']}
                            />
                            <InvoiceInput
                                label={t('phone')}
                                name="customerPhone"
                                value={customerPhone}
                                setter={setCustomerPhoneWithClearError}
                                disabled={isLoading}
                                error={validationErrors['phone']}
                            />
                            <div className="md:col-span-2">
                                <label htmlFor="invoice-customerAddress" className="block text-sm font-medium text-gray-700 mb-1">{t('address')} *</label>
                                <textarea
                                    id="invoice-customerAddress"
                                    name="customerAddress"
                                    data-testid="invoice-customerAddress"
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddressWithClearError(e.target.value)}
                                    placeholder={t('billing_address_placeholder')}
                                    disabled={isLoading}
                                    rows={2}
                                    className={`block w-full border ${validationErrors['address'] ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${isLoading ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60' : ''}`}
                                />
                                {validationErrors['address'] && <p className="mt-1 text-sm text-red-600">{validationErrors['address']}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">{t('invoice_items')}</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {lines.map((line, index) => {
                            const conceptError = getLineError(validationErrors, index, 'concept');
                            const priceError = getLineError(validationErrors, index, 'price');
                            return (
                                <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="col-span-12 md:col-span-5 space-y-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('concept')} *</label>
                                        <input
                                            type="text"
                                            required
                                            value={line.concept}
                                            data-testid={`line-concept-${index}`}
                                            onChange={(e) => handleLineChange(index, 'concept', e.target.value)}
                                            disabled={isLoading}
                                            className={`w-full border ${conceptError ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                                            placeholder={t('concept_placeholder')}
                                        />
                                        {conceptError && <p className="mt-1 text-xs text-red-600">{conceptError}</p>}
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('price')}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={line.price}
                                            data-testid={`line-price-${index}`}
                                            onChange={(e) => handleLineChange(index, 'price', parseFloat(e.target.value))}
                                            disabled={isLoading}
                                            className={`w-full border ${priceError ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-center`}
                                        />
                                        {priceError && <p className="mt-1 text-xs text-red-600">{priceError}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <button
                        type="submit"
                        disabled={isLoading}
                        data-testid="confirm-issuance-btn"
                        className="inline-flex items-center px-8 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50 transition"
                    >
                        {t('confirm_issuance')}
                    </button>
                </div>
            </form>
        </div>
    );
}