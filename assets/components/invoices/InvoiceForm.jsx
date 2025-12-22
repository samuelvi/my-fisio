import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function InvoiceForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Master Data
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [customerName, setCustomerName] = useState('');
    const [customerTaxId, setCustomerTaxId] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');

    // Detail Data (Lines)
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
        
        // Recalculate amount if qty or price changes
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

        if (lines.length === 0) {
            setError('Please add at least one invoice line.');
            setLoading(false);
            return;
        }

        const payload = {
            date: new Date(date).toISOString(), // ISO format for API Platform
            name: customerName,
            taxId: customerTaxId,
            address: customerAddress,
            phone: customerPhone,
            email: customerEmail,
            amount: calculateTotal(),
            number: 'DRAFT', // Will be overwritten by backend processor
            createdAt: new Date().toISOString(), // Optional, backend sets it, but good practice
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

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">New Invoice</h1>
                <button
                    type="button"
                    onClick={() => navigate('/invoices')}
                    className="text-gray-600 hover:text-gray-900 font-medium"
                >
                    Cancel
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Master Section */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Customer & Date</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID (NIF/DNI) *</label>
                                <input
                                    type="text"
                                    required
                                    value={customerTaxId}
                                    onChange={(e) => setCustomerTaxId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="12345678A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Street, City, Zip"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detail Section */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg font-semibold text-gray-700">Invoice Lines</h2>
                        <button
                            type="button"
                            onClick={handleAddLine}
                            className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md font-medium hover:bg-indigo-100 transition"
                        >
                            + Add Line
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {lines.map((line, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-md">
                                <div className="col-span-12 md:col-span-4">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Concept</label>
                                    <input
                                        type="text"
                                        required
                                        value={line.concept}
                                        onChange={(e) => handleLineChange(index, 'concept', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Service/Product"
                                    />
                                    <input
                                        type="text"
                                        value={line.description}
                                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded mt-1 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Description (optional)"
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={line.quantity}
                                        onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-3">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Price (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={line.price}
                                        onChange={(e) => handleLineChange(index, 'price', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="col-span-10 md:col-span-2 text-right">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Total</label>
                                    <div className="text-sm font-bold text-gray-800 py-1">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(line.amount)}
                                    </div>
                                </div>
                                <div className="col-span-2 md:col-span-1 flex justify-end mt-4">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLine(index)}
                                        className="text-red-500 hover:text-red-700"
                                        title="Remove line"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end items-center border-t pt-4">
                        <span className="text-lg font-bold text-gray-700 mr-4">Invoice Total:</span>
                        <span className="text-2xl font-bold text-indigo-600">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(calculateTotal())}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md font-bold text-lg shadow-md transition disabled:opacity-50 flex items-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            'Create Invoice'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
