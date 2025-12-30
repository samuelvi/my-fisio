import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import Routing from '../../routing/init';
import { Customer } from '../../types';

export default function CustomerList() {
    const { t } = useLanguage();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    
    const [nameInput, setNameInput] = useState<string>('');
    const [taxIdInput, setTaxIdInput] = useState<string>('');

    const [filters, setFilters] = useState<{
        name: string;
        taxId: string;
    }>({
        name: '',
        taxId: ''
    });

    const [page, setPage] = useState<number>(parseInt(sessionStorage.getItem('customerList_page') || '1', 10));
    const [hasNextPage, setHasNextPage] = useState<boolean>(false);
    
    const ITEMS_PER_PAGE = parseInt(import.meta.env.VITE_ITEMS_PER_PAGE || '10', 10);

    useEffect(() => {
        sessionStorage.setItem('customerList_page', page.toString());
        fetchCustomers();
    }, [page, filters]);


    const fetchCustomers = async () => {
        console.log('[CustomerList] Fetching with filters:', filters, 'page:', page);
        setLoading(true);
        try {
            const params: any = {
                page: page,
                itemsPerPage: ITEMS_PER_PAGE,
                'order[lastName]': 'asc',
                'order[firstName]': 'asc',
            };

            if (filters.name.trim()) params['fullName'] = filters.name.trim();
            if (filters.taxId.trim()) params['taxId'] = filters.taxId.trim();
            
            console.log('[CustomerList] API Request Params:', params);
            const response = await axios.get(Routing.generate('api_customers_collection'), { params });
            const responseData = response.data;
            console.log('[CustomerList] API Response received:', responseData);
            
            let data: Customer[] = [];
            if (Array.isArray(responseData)) {
                data = responseData;
            } else if (responseData && responseData['hydra:member']) {
                data = responseData['hydra:member'];
            } else if (responseData && responseData['member']) {
                data = responseData['member'];
            }

            // Handle N+1 pagination
            const hasMore = data.length > ITEMS_PER_PAGE;
            console.log('[CustomerList] hasMore:', hasMore, 'Count:', data.length);
            if (hasMore) {
                data.pop(); // Remove the N+1 item
            }
            setHasNextPage(hasMore);
            setCustomers(data);
        } catch (error: any) {
            console.error('[CustomerList] Error fetching customers:', error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[CustomerList] handleSearch triggered. nameInput:', nameInput, 'taxIdInput:', taxIdInput);
        
        const newFilters = {
            name: nameInput,
            taxId: taxIdInput
        };
        
        setPage(1);
        setFilters(newFilters);
    };

    const handleClear = () => {
        console.log('[CustomerList] handleClear triggered');
        setNameInput('');
        setTaxIdInput('');
        setPage(1);
        setFilters({
            name: '',
            taxId: ''
        });
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
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {t('listing_results', { count: customers.length })}
                </span>
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
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{t('customers')}</h1>
                <Link 
                    to="/customers/new"
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-black text-sm transition shadow-lg shadow-primary/20 active:scale-95 inline-flex items-center justify-center shadow-sm"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    {t('new_customer')}
                </Link>
            </div>

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
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('tax_id')}</label>
                        <input
                            type="text"
                            value={taxIdInput}
                            onChange={(e) => setTaxIdInput(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                            placeholder={t('search_by_tax_id')}
                        />
                    </div>
                    <div className="flex space-x-3 lg:col-span-2">
                        <button type="submit" className="flex-1 bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-black text-sm transition shadow-lg active:scale-95">{t('search')}</button>
                        <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest transition-colors px-2">{t('clear')}</button>
                    </div>
                </form>
            </div>

            <Pagination />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 lg:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('customer')}</th>
                                <th className="px-4 lg:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('tax_id')}</th>
                                <th className="px-4 lg:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('phone')}</th>
                                <th className="px-4 lg:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('email')}</th>
                                <th className="relative px-4 lg:px-8 py-4"><span className="sr-only">{t('actions')}</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 lg:px-8 py-20 text-center text-gray-400 font-bold">{t('loading')}...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 lg:px-8 py-20 text-center text-gray-400 font-bold">{t('no_customers_found')}</td></tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-4 lg:px-8 py-5 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                {customer.fullName || `${customer.firstName} ${customer.lastName}`}
                                            </div>
                                        </td>
                                        <td className="px-4 lg:px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                                            {customer.taxId}
                                        </td>
                                        <td className="px-4 lg:px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                                            {customer.phone || '-'}
                                        </td>
                                        <td className="px-4 lg:px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                                            {customer.email || '-'}
                                        </td>
                                        <td className="px-4 lg:px-8 py-5 whitespace-nowrap text-right text-sm font-bold flex items-center justify-end space-x-4">
                                            <Link
                                                to={`/invoices/new?customerId=${customer.id}`}
                                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                                title={t('generate_invoice')}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </Link>
                                            <Link to={`/customers/${customer.id}/edit`} className="text-gray-400 hover:text-primary transition-colors p-1" title={t('edit')}>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                            </Link>
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
                    {!loading && customers.length === 0 && (
                        <div className="px-4 py-16 text-center text-gray-400 font-bold">{t('no_customers_found')}</div>
                    )}
                    {!loading && customers.map((customer) => (
                        <div key={customer.id} className="p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-primary">{customer.fullName || `${customer.firstName} ${customer.lastName}`}</div>
                                <div className="text-xs text-gray-500">{customer.taxId}</div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">{customer.email}</div>
                                <div className="flex items-center gap-4 text-xs font-bold">
                                    <Link 
                                        to={`/invoices/new?customerId=${customer.id}`}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {t('generate_invoice')}
                                    </Link>
                                    <Link to={`/customers/${customer.id}/edit`} className="text-gray-400 hover:text-primary transition-colors">
                                        {t('edit')}
                                    </Link>
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