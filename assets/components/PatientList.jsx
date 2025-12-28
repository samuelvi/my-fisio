import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useLanguage } from './LanguageContext';

export default function PatientList() {
    const { t } = useLanguage();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(sessionStorage.getItem('patientList_searchInput') || '');
    const [searchTerm, setSearchTerm] = useState(sessionStorage.getItem('patientList_searchTerm') || '');
    const [statusFilter, setStatusFilter] = useState(sessionStorage.getItem('patientList_statusFilter') || 'all');
    const [sortOrder, setSortOrder] = useState(sessionStorage.getItem('patientList_sortOrder') || 'latest');
    const [useFuzzy, setUseFuzzy] = useState(sessionStorage.getItem('patientList_useFuzzy') === 'true');
    const [page, setPage] = useState(parseInt(sessionStorage.getItem('patientList_page') || '1', 10));
    const [hasNextPage, setHasNextPage] = useState(false);
    const [searchTrigger, setSearchTrigger] = useState(0);
    const ITEMS_PER_PAGE = parseInt(import.meta.env.VITE_ITEMS_PER_PAGE || '10', 10);

    // Save to sessionStorage whenever values change
    useEffect(() => {
        sessionStorage.setItem('patientList_searchInput', searchInput);
        sessionStorage.setItem('patientList_searchTerm', searchTerm);
        sessionStorage.setItem('patientList_statusFilter', statusFilter);
        sessionStorage.setItem('patientList_sortOrder', sortOrder);
        sessionStorage.setItem('patientList_useFuzzy', useFuzzy.toString());
        sessionStorage.setItem('patientList_page', page.toString());
    }, [searchInput, searchTerm, statusFilter, sortOrder, useFuzzy, page]);

    // Only fetch when searchTrigger or page changes
    useEffect(() => {
        fetchPatients();
    }, [page, searchTrigger]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setSearchTerm(searchInput);
        // Increment trigger to force search even if term hasn't changed
        setSearchTrigger(prev => prev + 1);
    };

    const handleClear = () => {
        setSearchInput('');
        setSearchTerm('');
        setPage(1);
    };

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/patients', {
                params: { 
                    status: statusFilter,
                    order: sortOrder,
                    page: page,
                    itemsPerPage: ITEMS_PER_PAGE + 1, // Request N+1 to check for next page
                    search: searchTerm,
                    fuzzy: useFuzzy
                }
            });
            
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
                setPatients(data.slice(0, ITEMS_PER_PAGE));
            } else {
                setHasNextPage(false);
                setPatients(data);
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching patients:', error);
            setLoading(false);
            setPatients([]);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-bold">{t('loading')}...</div>;

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
                    {t('listing_results', { count: patients.length })}
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
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{t('patients')}</h1>
                <Link 
                    to="/patients/new"
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-black text-sm transition shadow-lg shadow-primary/20 active:scale-95 inline-flex items-center justify-center"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    {t('new_patient')}
                </Link>
            </div>

            {/* Search Bar & Status Filter */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
                <form onSubmit={handleSearch} className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
                        <div className="flex-1 relative">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('intelligent_search')}</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('search_placeholder')}
                                    className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                                <div className="absolute left-4 top-3.5 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                                {searchInput && (
                                    <button 
                                        type="button"
                                        onClick={handleClear}
                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.414 1.414a1 1 0 101.414 1.414L10 11.414l1.414 1.414a1 1 0 001.414-1.414L11.414 10l1.414-1.414a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                            <div className="flex flex-col">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('fuzzy_search') || 'Fuzzy'}</label>
                                <div className="flex items-center h-[46px] bg-gray-50 px-4 border border-gray-200 rounded-xl">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={useFuzzy}
                                            onChange={(e) => { setUseFuzzy(e.target.checked); setPage(1); }}
                                        />
                                        <div className="relative w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="statusFilter" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                    {t('status')}
                                </label>
                                <select
                                    id="statusFilter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-[46px] bg-gray-50 pl-4 pr-10 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold rounded-xl"
                                >
                                    <option value="all">{t('any_status')}</option>
                                    <option value="active">{t('active')}</option>
                                    <option value="disabled">{t('inactive')}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('sort_by')}</span>
                            <div className="flex space-x-2">
                                <button 
                                    type="button"
                                    onClick={() => { setSortOrder('latest'); setPage(1); }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sortOrder === 'latest' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    {t('latest_added')}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => { setSortOrder('alpha'); setPage(1); }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sortOrder === 'alpha' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    {t('alphabetical')}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-end flex-wrap gap-3">
                            <button 
                                type="button"
                                onClick={handleClear}
                                className="text-gray-400 hover:text-gray-600 text-xs font-black uppercase tracking-widest px-4 py-2 transition-colors"
                            >
                                {t('clear')}
                            </button>
                            <button 
                                type="submit"
                                className="bg-gray-900 hover:bg-black text-white px-10 py-2.5 rounded-xl font-black text-sm transition shadow-lg active:scale-95"
                            >
                                {t('search')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <Pagination />

            {/* Patients Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 lg:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('name')}</th>
                                <th className="px-4 lg:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('phone')}</th>
                                <th className="px-4 lg:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('email')}</th>
                                <th className="px-4 lg:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('status')}</th>
                                <th className="px-4 lg:px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('created')}</th>
                                <th className="relative px-4 lg:px-8 py-4">
                                    <span className="sr-only">{t('actions')}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {patients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-4 lg:px-8 py-5 whitespace-nowrap">
                                        <Link to={`/patients/${patient.id}`} className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <span className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                    {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                    {patient.firstName} {patient.lastName}
                                                </div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 lg:px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                                        {patient.phone || '-'}
                                    </td>
                                    <td className="px-4 lg:px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                                        {patient.email || '-'}
                                    </td>
                                    <td className="px-4 lg:px-8 py-5 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${patient.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                            {t(patient.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 lg:px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-500">
                                        {new Date(patient.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 lg:px-8 py-5 whitespace-nowrap text-right text-sm font-bold">
                                        <Link to={`/patients/${patient.id}`} className="text-primary hover:text-primary-dark transition-colors inline-flex items-center">
                                            {t('view')}
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                            </Link>
                                    </td>
                                </tr>
                            ))}
                            {patients.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 lg:px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                            </div>
                                            <p className="text-gray-400 font-bold max-w-xs mx-auto">
                                                {t('no_patients_found')}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="md:hidden divide-y divide-gray-100">
                    {patients.map((patient) => (
                        <Link
                            key={patient.id}
                            to={`/patients/${patient.id}`}
                            className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm border border-primary/10">
                                    {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                                </span>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-gray-900 truncate">
                                        {patient.firstName} {patient.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {patient.phone || patient.email || '-'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${patient.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                    {t(patient.status)}
                                </span>
                                <div className="text-[10px] text-gray-400 mt-2">
                                    {new Date(patient.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </Link>
                    ))}
                    {patients.length === 0 && (
                        <div className="px-4 py-16 text-center">
                            <p className="text-gray-400 font-bold">{t('no_patients_found')}</p>
                        </div>
                    )}
                </div>
            </div>

            <Pagination />
        </div>
    );
}
