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

    const [page, setPage] = useState(parseInt(sessionStorage.getItem('invoiceList_page') || '1', 10));
    const [hasNextPage, setHasNextPage] = useState(false);
    
    const ITEMS_PER_PAGE = parseInt(import.meta.env.VITE_ITEMS_PER_PAGE || '10', 10);

    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= 2019; y--) {
        years.push(y);
    }

    useEffect(() => {
        sessionStorage.setItem('invoiceList_page', page.toString());
        fetchInvoices();
    }, [page, filters]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = {
                page: page,
                itemsPerPage: ITEMS_PER_PAGE + 1, // Request N+1 to check for next page
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
            
            let data = [];
            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data && response.data['hydra:member']) {
                data = response.data['hydra:member'];
            } else if (response.data && response.data['member']) {
                data = response.data['member'];
            }

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-t border-b border-gray-100 bg-gray-50/50 px-4 rounded-lg my-4">
            <div className="flex items-center flex-wrap gap-3">
                <div className="flex items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-3">{t('page')}</span>
                    <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black shadow-lg">
                        {page}
                    </div>
                </div>
                {page > 1 && (
                    <button
                        onClick={() => setPage(1)}
                        className="text-xs font-black text-primary hover:text-primary-dark uppercase tracking-tighter bg-white border border-primary/20 px-4 py-2 rounded-xl shadow-sm transition active:scale-95"
                    >
                        « {t('back_to_start')}
                    </button>
                )}
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="inline-flex items-center px-5 py-2 border border-gray-200 text-xs font-black rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm uppercase tracking-widest"
                >
                    {t('previous')}
                </button>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasNextPage || loading}
                    className="inline-flex items-center px-5 py-2 border border-gray-200 text-xs font-black rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm uppercase tracking-widest"
                >
                    {t('next')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{t('invoices')}</h1>
                <Link 
                    to="/invoices/new"
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-black text-sm transition shadow-lg shadow-primary/20 active:scale-95 inline-flex items-center justify-center shadow-sm"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    {t('new_invoice')}
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-end">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('customer_name')}</label>
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                            placeholder={t('search_by_name')}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('number')}</label>
                        <input
                            type="text"
                            value={numberInput}
                            onChange={(e) => setNumberInput(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                            placeholder="e.g. 000454"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('year')}</label>
                        <select
                            value={yearInput}
                            onChange={(e) => setYearInput(e.target.value)}
                            className="w-full h-[46px] bg-gray-50 pl-4 pr-10 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold rounded-xl"
                        >
                            <option value="all">{t('all_years')}</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex space-x-3">
                        <button type="submit" className="flex-1 bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-black text-sm transition shadow-lg active:scale-95">{t('search')}</button>
                        <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest transition-colors px-2">{t('clear')}</button>
                    </div>
                </form>
            </div>

            <Pagination />

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 lg:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('number')}</th>
                                <th className="px-4 lg:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('date')}</th>
                                <th className="px-4 lg:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('customer')}</th>
                                <th className="px-4 lg:px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('amount')}</th>
                                <th className="relative px-4 lg:px-8 py-4"><span className="sr-only">{t('actions')}</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="px-4 lg:px-8 py-20 text-center text-gray-400 font-bold">{t('loading')}...</td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 lg:px-8 py-20 text-center text-gray-400 font-bold">{t('no_invoices_found')}</td></tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-4 lg:px-8 py-5 whitespace-nowrap text-sm font-bold text-primary">
                                            {invoice.number}
                                        </td>
                                        <td className="px-4 lg:px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                                            {new Date(invoice.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 lg:px-8 py-5 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{invoice.name}</div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{invoice.taxId}</div>
                                        </td>
                                        <td className="px-4 lg:px-8 py-5 whitespace-nowrap text-sm text-right font-black text-gray-900">
                                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                                        </td>
                                        <td className="px-4 lg:px-8 py-5 whitespace-nowrap text-right text-sm font-bold flex items-center justify-end space-x-4">
                                            <button onClick={() => handleExport(invoice.id, invoice.number, 'html', 'view')} className="text-gray-400 hover:text-primary transition-colors p-1" title={t('view_html')}>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                                            </button>
                                            <button onClick={() => handleExport(invoice.id, invoice.number, 'pdf', 'view')} className="text-gray-400 hover:text-primary transition-colors p-1" title={t('view_pdf')}>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                            </button>
                                            <button onClick={() => handleExport(invoice.id, invoice.number, 'pdf', 'download')} className="text-gray-400 hover:text-primary transition-colors p-1" title={t('download')}>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="md:hidden divide-y divide-gray-100">
                    {loading && (
                        <div className="px-4 py-16 text-center text-gray-400 font-bold">{t('loading')}...</div>
                    )}
                    {!loading && invoices.length === 0 && (
                        <div className="px-4 py-16 text-center text-gray-400 font-bold">{t('no_invoices_found')}</div>
                    )}
                    {!loading && invoices.map((invoice) => (
                        <div key={invoice.id} className="p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-primary">{invoice.number}</div>
                                <div className="text-xs text-gray-500">{new Date(invoice.date).toLocaleDateString()}</div>
                            </div>
                            <div className="text-sm font-semibold text-gray-900 truncate">{invoice.name}</div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{invoice.taxId}</div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-black text-gray-900">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold">
                                    <button onClick={() => handleExport(invoice.id, invoice.number, 'html', 'view')} className="text-gray-400 hover:text-primary transition-colors">{t('view_html')}</button>
                                    <button onClick={() => handleExport(invoice.id, invoice.number, 'pdf', 'view')} className="text-gray-400 hover:text-primary transition-colors">{t('view_pdf')}</button>
                                    <button onClick={() => handleExport(invoice.id, invoice.number, 'pdf', 'download')} className="text-gray-400 hover:text-primary transition-colors">{t('download')}</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Pagination />
        </div>
    );
}
