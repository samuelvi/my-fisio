import React from 'react';

export default function Dashboard() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
                <h3 className="text-gray-500 text-sm font-medium uppercase">Total Patients</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">124</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-t-4 border-green-500">
                <h3 className="text-gray-500 text-sm font-medium uppercase">Appointments Today</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">8</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-t-4 border-purple-500">
                <h3 className="text-gray-500 text-sm font-medium uppercase">Pending Tasks</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">3</p>
            </div>

            <div className="md:col-span-3 bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Welcome back, Admin</h3>
                <p className="text-gray-600">This is your physiotherapy clinic overview. From here you can manage patients, appointments and records.</p>
            </div>
        </div>
    );
}
