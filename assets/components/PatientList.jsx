import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function PatientList() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(sessionStorage.getItem('patientList_searchInput') || '');
    const [searchTerm, setSearchTerm] = useState(sessionStorage.getItem('patientList_searchTerm') || '');
    const [statusFilter, setStatusFilter] = useState(sessionStorage.getItem('patientList_statusFilter') || 'active');
    const [sortOrder, setSortOrder] = useState(sessionStorage.getItem('patientList_sortOrder') || 'latest');
    const [useFuzzy, setUseFuzzy] = useState(sessionStorage.getItem('patientList_useFuzzy') === 'true');
    const [page, setPage] = useState(parseInt(sessionStorage.getItem('patientList_page') || '1', 10));
    const [hasNextPage, setHasNextPage] = useState(false);
    const ITEMS_PER_PAGE = parseInt(import.meta.env.VITE_ITEMS_PER_PAGE || '10', 10);

    useEffect(() => {
        sessionStorage.setItem('patientList_searchInput', searchInput);
        sessionStorage.setItem('patientList_searchTerm', searchTerm);
        sessionStorage.setItem('patientList_statusFilter', statusFilter);
        sessionStorage.setItem('patientList_sortOrder', sortOrder);
        sessionStorage.setItem('patientList_useFuzzy', useFuzzy.toString());
        sessionStorage.setItem('patientList_page', page.toString());
        fetchPatients();
    }, [statusFilter, page, searchTerm, sortOrder, useFuzzy]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // Reset to page 1 on new search
        setSearchTerm(searchInput);
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
                    itemsPerPage: ITEMS_PER_PAGE,
                    search: searchTerm,
                    fuzzy: useFuzzy
                }
            });
            console.log('API Response:', response.data);
            
            let data = [];
            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data && response.data['hydra:member']) {
                data = response.data['hydra:member'];
            } else if (response.data && response.data['member']) {
                data = response.data['member'];
            }
            
            // N+1 Logic: If we got more than ITEMS_PER_PAGE, there is a next page
            if (data.length > ITEMS_PER_PAGE) {
                setHasNextPage(true);
                setPatients(data.slice(0, ITEMS_PER_PAGE)); // Only show N
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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading patients...</div>;

    const Pagination = () => (
        <div className="flex items-center justify-between py-3 border-t border-b border-gray-100 bg-gray-50/50 px-4 rounded-lg my-4">
            <div className="flex items-center space-x-4">
                <div className="flex items-center">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mr-2">Page</span>
                    <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                        {page}
                    </div>
                </div>
                {page > 1 && (
                    <button
                        onClick={() => setPage(1)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tighter bg-white border border-indigo-200 px-3 py-2 rounded-md shadow-sm transition"
                    >
                        « Back to Start
                    </button>
                )}
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm uppercase tracking-tighter"
                >
                    Previous
                </button>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasNextPage || loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm uppercase tracking-tighter"
                >
                    Next
                </button>
            </div>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
                <Link 
                    to="/patients/new"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition"
                >
                    + New Patient
                </Link>
            </div>

            {/* Search Bar & Status Filter */}
            <form onSubmit={handleSearch} className="mb-8 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search by name, phone or email..."
                            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        {searchInput && (
                            <button 
                                type="button"
                                onClick={handleClear}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.414 1.414a1 1 0 101.414 1.414L10 11.414l1.414 1.414a1 1 0 001.414-1.414L11.414 10l1.414-1.414a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-white px-4 py-2 border border-gray-300 rounded-md shadow-sm">
                        <label className="inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={useFuzzy}
                                onChange={(e) => { setUseFuzzy(e.target.checked); setPage(1); }}
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="ms-3 text-sm font-medium text-gray-700">Intelligent Search</span>
                        </label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Status:
                        </label>
                        <select
                            id="statusFilter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                        >
                            <option value="active">Active</option>
                            <option value="disabled">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-2">
                        <label htmlFor="sortOrder" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Sort by:
                        </label>
                        <select
                            id="sortOrder"
                            value={sortOrder}
                            onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
                            className="block w-full md:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                        >
                            <option value="latest">Latest added</option>
                            <option value="alpha">Alphabetical (Name)</option>
                        </select>
                    </div>
                    
                    <div className="flex items-center justify-end space-x-3 pt-2 md:pt-0">
                        <button 
                            type="button"
                            onClick={handleClear}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2"
                        >
                            Clear Results
                        </button>
                        <button 
                            type="submit"
                            className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-2 rounded-md font-medium transition shadow-sm"
                        >
                            Search Patients
                        </button>
                    </div>
                </div>
            </form>

            <Pagination />

            {/* Patients Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {patients.map((patient) => (
                            <tr key={patient.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link to={`/patients/${patient.id}`} className="flex items-center group">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            <span className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold group-hover:bg-indigo-200 transition">
                                                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition">
                                                {patient.firstName} {patient.lastName}
                                            </div>
                                        </div>
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {patient.phone || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {patient.email || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {patient.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(patient.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link to={`/patients/${patient.id}`} className="text-indigo-600 hover:text-indigo-900">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {patients.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    No patients found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination />
        </div>
    );
}