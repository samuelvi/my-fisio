import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function InvoiceForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [customerName, setCustomerName] = useState('');
    const [customerTaxId, setCustomerTaxId] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');

    const [lines, setLines] = useState([
        { concept: '', description: '', quantity: 1, price: 0, amount: 0 }
    ]);

    const handleAddLine = () => {
        setLines([...lines, { concept: '', description: '', quantity: 1, price: 0, amount: 0 }]);
    };

    const handleRemoveLine = (index) => {
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
    };

    const handleLineChange = (index, field, value) => {
        const newLines = [...lines];
        newLines[index][field] = value;
        if (field === 'quantity' || field === 'price') {
            const qty = parseFloat(newLines[index].quantity) || 0;
            const price = parseFloat(newLines[index].price) || 0;
            newLines[index].amount = qty * price;
        }
        setLines(newLines);
    };

    const calculateTotal = () => {
        return lines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!customerName || !customerTaxId) {
            setError('Customer Name and Tax ID are required.');
            setLoading(false);
            return;
        }

        const payload = {
            date: new Date(date).toISOString(),
            name: customerName,
            taxId: customerTaxId,
            address: customerAddress,
            phone: customerPhone,
            email: customerEmail,
            amount: calculateTotal(),
            number: 'DRAFT',
            lines: lines.map(line => ({
                concept: line.concept,
                description: line.description,
                quantity: parseInt(line.quantity),
                price: parseFloat(line.price),
                amount: parseFloat(line.amount)
            }))
        };

        try {
            await axios.post('/api/invoices', payload);
            navigate('/invoices');
        } catch (err) {
            console.error('Error creating invoice:', err);
            setError('Failed to create invoice. Please check your input.');
        } finally {
            setLoading(false);
        }
    };

    const Input = ({ label, value, setter, type = "text", required = false, placeholder = "" }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && "*"}</label>
            <input
                type={type}
                required={required}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Issue Invoice</h1>
                <p className="text-sm text-gray-500">Create a new fiscal document for a customer.</p>
            </div>

            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200 text-sm text-red-800">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                {/* Customer Section */}
                <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-medium text-gray-900">Customer Information</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Invoice Date" value={date} setter={setDate} type="date" required />
                            <Input label="Customer Full Name" value={customerName} setter={setCustomerName} required placeholder="Legal entity or person" />
                            <Input label="Tax Identifier (CIF/NIF)" value={customerTaxId} setter={setCustomerTaxId} required placeholder="Ex: 12345678A" />
                            <Input label="Contact Email" value={customerEmail} setter={setCustomerEmail} type="email" />
                            <Input label="Phone Number" value={customerPhone} setter={setCustomerPhone} />
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                                <input 
                                    type="text" 
                                    value={customerAddress} 
                                    onChange={(e) => setCustomerAddress(e.target.value)} 
                                    placeholder="Official mailing address" 
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">Invoice Items</h2>
                        <button 
                            type="button" 
                            onClick={handleAddLine} 
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition"
                        >
                            + Add Item
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        {lines.map((line, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="col-span-12 md:col-span-5 space-y-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Description</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={line.concept} 
                                        onChange={(e) => handleLineChange(index, 'concept', e.target.value)} 
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                                        placeholder="Concept (e.g. Session)" 
                                    />
                                    <input 
                                        type="text" 
                                        value={line.description} 
                                        onChange={(e) => handleLineChange(index, 'description', e.target.value)} 
                                        className="w-full border border-gray-200 rounded-md py-1.5 px-3 text-xs text-gray-500" 
                                        placeholder="Additional notes" 
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Qty</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        required 
                                        value={line.quantity} 
                                        onChange={(e) => handleLineChange(index, 'quantity', e.target.value)} 
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center" 
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Price</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        value={line.price} 
                                        onChange={(e) => handleLineChange(index, 'price', e.target.value)} 
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center" 
                                    />
                                </div>
                                <div className="col-span-3 md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Total</label>
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
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center">
                        <span className="text-sm font-medium text-gray-500 mr-4">Total Amount:</span>
                        <span className="text-2xl font-bold text-indigo-600">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(calculateTotal())}
                        </span>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-between items-center bg-gray-50 px-6 py-4 rounded-lg border border-gray-200 shadow-sm">
                    <button 
                        type="button" 
                        onClick={() => navigate('/invoices')} 
                        className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="inline-flex items-center px-8 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 flex items-center"
                    >
                        {loading && (
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {loading ? 'Processing...' : 'Confirm Issuance'}
                    </button>
                </div>
            </form>
        </div>
    );
}
