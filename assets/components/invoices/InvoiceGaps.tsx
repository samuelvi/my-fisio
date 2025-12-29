import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import Routing from '../../routing/init';

interface GapData {
    year: number;
    totalInvoices: number;
    totalGaps: number;
    gaps: string[];
}

export default function InvoiceGaps() {
    const { t } = useLanguage();
    const [gapYear, setGapYear] = useState<string>(new Date().getFullYear().toString());
    const [gapData, setGapData] = useState<GapData>({ year: new Date().getFullYear(), totalInvoices: 0, totalGaps: 0, gaps: [] });
    const [gapLoading, setGapLoading] = useState<boolean>(false);

    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear + 1; y >= 2019; y--) {
        years.push(y);
    }

    useEffect(() => {
        const fetchInvoiceGaps = async () => {
            setGapLoading(true);
            try {
                const response = await axios.get<GapData>(Routing.generate('invoice_number_gaps'), {
                    params: { year: gapYear }
                });
                setGapData(response.data);
            } catch (error) {
                console.error('Error fetching invoice gaps:', error);
                setGapData({ year: parseInt(gapYear, 10), totalInvoices: 0, totalGaps: 0, gaps: [] });
            } finally {
                setGapLoading(false);
            }
        };
        fetchInvoiceGaps();
    }, [gapYear]);

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{t('invoice_number_gaps')}</h1>
                    <p className="text-sm text-gray-500">{t('invoice_number_gaps_subtitle')}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Link
                        to="/invoices"
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm transition shadow-sm hover:bg-gray-50 inline-flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        {t('back_to_invoices')}
                    </Link>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('year')}</label>
                    <select
                        value={gapYear}
                        onChange={(e) => setGapYear(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-semibold text-gray-700"
                    >
                        {years.map((year) => (
                            <option key={year} value={String(year)}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('invoice_total_for_year')}</div>
                        <div className="text-2xl font-black text-gray-900 mt-2">{gapLoading ? '...' : gapData.totalInvoices}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('invoice_gaps_total')}</div>
                        <div className="text-2xl font-black text-gray-900 mt-2">{gapLoading ? '...' : gapData.totalGaps}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('invoice_gaps_list')}</div>
                        {gapLoading ? (
                            <div className="text-sm text-gray-400 mt-2">...</div>
                        ) : gapData.gaps.length ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {gapData.gaps.map((gap) => (
                                    <span key={gap} className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700">
                                        {gap}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 mt-2">{t('no_invoice_gaps')}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}