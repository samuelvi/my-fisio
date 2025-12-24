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
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label} {required && "*"}</label>
            <input
                type={type}
                required={required}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="block w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-5 focus:bg-white focus:border-primary/20 outline-none transition-all font-bold text-gray-800"
            />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-primary-dark tracking-tighter uppercase">Issue Invoice</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1 italic">New Fiscal Document Creation</p>
                </div>
                <div className="flex space-x-3">
                    <button type="button" onClick={() => navigate('/invoices')} className="px-8 py-4 bg-white border-2 border-gray-100 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-btn-secondary hover:text-btn-secondary transition-all">Cancel</button>
                    <button type="submit" form="invoice-form" disabled={loading} className="px-10 py-4 bg-btn-success text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-95 shadow-xl shadow-btn-success/20 transition-all disabled:opacity-50 flex items-center">
                        {loading && <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        {loading ? 'Processing...' : 'Confirm Issuance'}
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-5 rounded-[2rem] border-2 border-red-100 text-[10px] font-black uppercase tracking-widest text-center">{error}</div>}

            <form id="invoice-form" onSubmit={handleSubmit} className="space-y-10">
                {/* Master Section */}
                <div className="bg-white shadow-sm border border-gray-100 rounded-[2.5rem] p-12">
                    <h2 className="text-xl font-black text-primary-dark mb-10 border-b border-gray-50 pb-5 uppercase tracking-tight">Customer Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <Input label="Invoice Date" value={date} setter={setDate} type="date" required />
                        <Input label="Customer Full Name" value={customerName} setter={setCustomerName} required placeholder="Legal entity or person" />
                        <Input label="Tax Identifier (CIF/NIF)" value={customerTaxId} setter={setCustomerTaxId} required placeholder="Ex: 12345678A" />
                        <Input label="Contact Email" value={customerEmail} setter={setCustomerEmail} type="email" />
                        <Input label="Phone Number" value={customerPhone} setter={setCustomerPhone} />
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Billing Address</label>
                            <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Official mailing address" className="block w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-5 focus:bg-white focus:border-primary/20 outline-none transition-all font-bold text-gray-800" />
                        </div>
                    </div>
                </div>

                {/* Detail Section */}
                <div className="bg-white shadow-sm border border-gray-100 rounded-[2.5rem] p-12">
                    <div className="flex justify-between items-center mb-10 border-b border-gray-50 pb-5">
                        <h2 className="text-xl font-black text-primary-dark uppercase tracking-tight">Detailed Breakdown</h2>
                        <button type="button" onClick={handleAddLine} className="px-6 py-2.5 bg-btn-info/10 text-btn-info hover:bg-btn-info hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">+ Add Entry</button>
                    </div>
                    
                    <div className="space-y-8">
                        {lines.map((line, index) => (
                            <div key={index} className="grid grid-cols-12 gap-8 items-start bg-gray-50/50 p-8 rounded-3xl border-2 border-transparent hover:border-primary/5 transition-all">
                                <div className="col-span-12 md:col-span-5 space-y-4">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                                    <input type="text" required value={line.concept} onChange={(e) => handleLineChange(index, 'concept', e.target.value)} className="w-full px-5 py-3 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-primary/20 transition-all font-black text-gray-800 text-sm uppercase tracking-tight" placeholder="Ex: Physiotherapy Session" />
                                    <input type="text" value={line.description} onChange={(e) => handleLineChange(index, 'description', e.target.value)} className="w-full px-5 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:border-primary/20 transition-all text-xs text-gray-500 italic" placeholder="Internal notes" />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Unit Count</label>
                                    <input type="number" min="1" required value={line.quantity} onChange={(e) => handleLineChange(index, 'quantity', e.target.value)} className="w-full px-5 py-3 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-primary/20 text-center font-black" />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Unit Price</label>
                                    <input type="number" step="0.01" required value={line.price} onChange={(e) => handleLineChange(index, 'price', e.target.value)} className="w-full px-5 py-3 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-primary/20 text-center font-black text-primary-dark" />
                                </div>
                                <div className="col-span-4 md:col-span-2 text-right">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Total</label>
                                    <div className="py-3 text-lg font-black text-gray-800">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(line.amount)}
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-1 flex justify-end md:pt-10">
                                    <button type="button" onClick={() => handleRemoveLine(index)} className="p-3 text-gray-300 hover:text-btn-danger transition-colors bg-white rounded-xl shadow-sm border border-gray-100"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 flex justify-end items-center bg-gray-50 p-10 rounded-[2rem] border-2 border-primary/10 shadow-inner">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mr-8">Grand Calculation</span>
                        <span className="text-5xl font-black text-primary-dark tracking-tighter italic">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(calculateTotal())}
                        </span>
                    </div>
                </div>
            </form>
        </div>
    );
}