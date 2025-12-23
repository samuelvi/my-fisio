import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalPatients: 0,
        appointmentsToday: 0,
        invoicesThisYear: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, colorClass }) => (
        <div className={`bg-white p-6 rounded-lg shadow border-t-4 ${colorClass}`}>
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">
                {loading ? '...' : value}
            </p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Patients" 
                    value={stats.totalPatients} 
                    colorClass="border-blue-500" 
                />
                <StatCard 
                    title="Appointments Today" 
                    value={stats.appointmentsToday} 
                    colorClass="border-green-500" 
                />
                <StatCard 
                    title="Invoices This Year" 
                    value={stats.invoicesThisYear} 
                    colorClass="border-purple-500" 
                />
            </div>

            <div className="bg-white p-8 rounded-lg shadow border border-gray-100">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-indigo-100 p-3 rounded-full">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">Welcome back, Admin</h3>
                        <p className="text-gray-500">Your clinic's activity at a glance.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t border-gray-50 pt-8">
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2 uppercase text-xs tracking-widest">Quick Actions</h4>
                        <div className="flex flex-wrap gap-3">
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition">New Patient</button>
                            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition">Schedule Appointment</button>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2 uppercase text-xs tracking-widest">System Status</h4>
                        <div className="flex items-center space-x-2 text-sm text-green-600 font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>All systems operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}