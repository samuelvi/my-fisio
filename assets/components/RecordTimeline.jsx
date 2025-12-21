import React from 'react';

export default function RecordTimeline({ records, onAddRecord }) {
    if (!records || records.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                <p className="text-gray-500 mb-4">No records found for this patient.</p>
                <button
                    onClick={onAddRecord}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    Add First Record
                </button>
            </div>
        );
    }

    // Sort records by date descending
    const sortedRecords = [...records].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Clinical History</h3>
                <button
                    onClick={onAddRecord}
                    className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-100 font-medium"
                >
                    + Add Record
                </button>
            </div>

            <div className="flow-root">
                <ul role="list" className="-mb-8">
                    {sortedRecords.map((record, recordIdx) => (
                        <li key={record.id}>
                            <div className="relative pb-8">
                                {recordIdx !== sortedRecords.length - 1 ? (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                        <div>
                                            <p className="text-sm text-gray-500">
                                                {new Date(record.createdAt).toLocaleDateString()}
                                            </p>
                                            <h4 className="text-md font-semibold text-gray-900 mt-1">
                                                Physiotherapy Treatment
                                            </h4>
                                            <div className="mt-2 text-sm text-gray-700 space-y-2">
                                                <p><strong>Treatment:</strong> {record.physiotherapyTreatment}</p>
                                                {record.evolution && <p><strong>Evolution:</strong> {record.evolution}</p>}
                                                {record.notes && <p className="italic text-gray-500">{record.notes}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
