import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function InvoiceList() {
    const { t } = useLanguage();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Input States
    const [nameInput, setNameInput] = useState('');
    const [numberInput, setNumberInput] = useState('');
    const [yearInput, setYearInput] = useState(new Date().getFullYear().toString());

    // Applied Filter States
    const [filters, setFilters] = useState({
        name: '',
        number: '',
        year: new Date().getFullYear().toString()
    });

    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    
    const ITEMS_PER_PAGE = 10;

    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= 2019; y--) {
        years.push(y);
    }

    useEffect(() => {
        fetchInvoices();
    }, [page, filters]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = {
                page: page,
                itemsPerPage: ITEMS_PER_PAGE + 1, // To check for next page
                'order[date]': 'desc',
            };

            if (filters.name) params['name'] = filters.name;
            
            let numberQuery = '';
            if (filters.year && filters.year !== 'all') {
                numberQuery = filters.year;
            }
            if (filters.number) {
                numberQuery += filters.number;
            }
            
            if (numberQuery) {
                params['number'] = numberQuery;
            }

            const response = await axios.get('/api/invoices', { params });
            
            let data = response.data['member'] || response.data['hydra:member'] || (Array.isArray(response.data) ? response.data : []);

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
        setFilters({
            name: nameInput,
            number: numberInput,
            year: yearInput
        });
    };

    const handleClear = () => {
        const resetYear = new Date().getFullYear().toString();
        setNameInput('');
        setNumberInput('');
        setYearInput(resetYear);
        setPage(1);
        setFilters({
            name: '',
            number: '',
            year: resetYear
        });
    };

    const handleExport = async (id, number, format, mode = 'view') => {
        try {
            const params = mode === 'download' ? { download: 1 } : {};
            const response = await axios.get(`/api/invoices/${id}/export/${format}`, {
                params,
                responseType: 'blob'
            });

            const mimeType = format === 'pdf' ? 'application/pdf' : 'text/html';
            const blob = new Blob([response.data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);

            if (mode === 'download') {
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `factura_${number}.${format}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                window.open(url, '_blank');
            }
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Error exporting invoice:', error);
            alert(t('error_exporting_invoice'));
        }
    };

    const Pagination = () => (
        <div className="flex items-center justify-between py-3 border-t border-gray-100 bg-gray-50/50 px-4 rounded-lg my-4">
            <div className="flex items-center space-x-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{t('page')} {page}</span>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="px-3 py-1 border border-gray-300 text-xs font-bold rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 transition"
                >
                    {t('previous')}
                </button>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasNextPage || loading}
                    className="px-3 py-1 border border-gray-300 text-xs font-bold rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 transition"
                >
                    {t('next')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{t('invoices')}</h1>
                <Link 
                    to="/invoices/new"
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium transition flex items-center shadow-sm"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    {t('new_invoice')}
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('customer_name')}</label>
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary outline-none"
                            placeholder={t('search_by_name')}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('number')}</label>
                        <input
                            type="text"
                            value={numberInput}
                            onChange={(e) => setNumberInput(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary outline-none"
                            placeholder="e.g. 000454"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('year')}</label>
                        <select
                            value={yearInput}
                            onChange={(e) => setYearInput(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary outline-none"
                        >
                            <option value="all">{t('all_years')}</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex space-x-2">
                        <button type="submit" className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black transition">{t('search')}</button>
                        <button type="button" onClick={handleClear} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition">{t('clear')}</button>
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('number')}</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('date')}</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('customer')}</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('amount')}</th>
                            <th className="relative px-6 py-3"><span className="sr-only">{t('actions')}</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">{t('loading')}...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">{t('no_invoices_found')}</td></tr>
                        ) : (
                            invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-dark">
                                        {invoice.number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(invoice.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{invoice.name}</div>
                                        <div className="text-xs text-gray-400">{invoice.taxId}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end space-x-3">
                                        <button onClick={() => handleExport(invoice.id, invoice.number, 'html', 'view')} className="text-gray-400 hover:text-primary transition-colors" title={t('view_html')}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                                        </button>
                                        <button onClick={() => handleExport(invoice.id, invoice.number, 'pdf', 'view')} className="text-gray-400 hover:text-primary transition-colors" title={t('view_pdf')}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                        </button>
                                        <button onClick={() => handleExport(invoice.id, invoice.number, 'pdf', 'download')} className="text-gray-400 hover:text-primary transition-colors" title={t('download')}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        </button>
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
