import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function InvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters state
    const [nameFilter, setNameFilter] = useState('');
    const [numberFilter, setNumberFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    
    const ITEMS_PER_PAGE = 10; // Or from env

    // Generate years for select (2019 to current + 1)
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= 2019; y--) {
        years.push(y);
    }

    useEffect(() => {
        fetchInvoices();
    }, [page, yearFilter, nameFilter, numberFilter]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = {
                page: page,
                itemsPerPage: ITEMS_PER_PAGE,
                'order[date]': 'desc', // Recent first
            };

            if (nameFilter) params['name'] = nameFilter;
            if (numberFilter) params['number'] = numberFilter;
            
            if (yearFilter && yearFilter !== 'all') {
                params['date[after]'] = `${yearFilter}-01-01`;
                params['date[strictly_before]'] = `${parseInt(yearFilter) + 1}-01-01`;
            }

            const response = await axios.get('/api/invoices', { params });
            
            let data = [];
            if (response.data && Array.isArray(response.data['hydra:member'])) {
                data = response.data['hydra:member'];
            } else if (Array.isArray(response.data)) {
                data = response.data;
            }
            
            console.log('Invoices data:', data); // Debug log

            if (data.length > ITEMS_PER_PAGE) {
                setHasNextPage(true);
                setInvoices(data.slice(0, ITEMS_PER_PAGE));
            } else {
                setHasNextPage(false);
                setInvoices(data);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchInvoices();
    };

    const handleClear = () => {
        setNameFilter('');
        setNumberFilter('');
        setYearFilter(new Date().getFullYear().toString());
        setPage(1);
    };

    const Pagination = () => (
        <div className="flex items-center justify-between py-3 border-t border-b border-gray-100 bg-gray-50/50 px-4 rounded-lg my-4">
            <div className="flex items-center space-x-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Page {page}</span>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="px-3 py-1 border border-gray-300 text-xs font-bold rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 transition"
                >
                    Previous
                </button>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasNextPage || loading}
                    className="px-3 py-1 border border-gray-300 text-xs font-bold rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 transition"
                >
                    Next
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Invoices Manager</h1>
                <Link 
                    to="/invoices/new"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition flex items-center"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    New Invoice
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Customer Name</label>
                        <input
                            type="text"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Invoice Number</label>
                        <input
                            type="text"
                            value={numberFilter}
                            onChange={(e) => setNumberFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g. 202500..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Year</label>
                        <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">All Years</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex space-x-2">
                        <button 
                            type="submit"
                            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-900 transition"
                        >
                            Search Invoices
                        </button>
                        <button 
                            type="button"
                            onClick={handleClear}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No invoices found.</td>
                            </tr>
                        ) : (
                            invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                        {invoice.number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(invoice.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {invoice.name}
                                        <div className="text-xs text-gray-400">{invoice.taxId}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link to={`/invoices/${invoice.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <Pagination />
        </div>
    );
}
