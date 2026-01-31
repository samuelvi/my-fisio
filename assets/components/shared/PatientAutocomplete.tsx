import React, { useState, useEffect, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import axios from 'axios';
import Routing from '../../routing/init';
import { useLanguage } from '../LanguageContext';
import { Patient } from '../../types';

interface PatientAutocompleteProps {
    value: Patient | null;
    onChange: (patient: Patient | null) => void;
    error?: string;
    onInputChange?: (value: string) => void;
}

export default function PatientAutocomplete({ value, onChange, error, onInputChange }: PatientAutocompleteProps) {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query) {
            setPatients([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await axios.get(Routing.generate('api_patients_collection'), {
                    params: { search: query, itemsPerPage: 10 }
                });
                const data = response.data['member'] || response.data['hydra:member'] || [];
                setPatients(data);
            } catch (err) {
                console.error("Error searching patients:", err);
                setPatients([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    return (
        <div className="w-full">
            <Combobox value={value} onChange={onChange} nullable>
                <div className="relative mt-1">
                    <div className={`relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-sm focus:outline-none sm:text-sm border ${error ? 'border-red-500' : 'border-gray-300'}`}>
                        <Combobox.Input
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                            displayValue={(patient: Patient) => patient ? `${patient.firstName} ${patient.lastName}` : ''}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                if (onInputChange) onInputChange(event.target.value);
                            }}
                            placeholder={t('search_placeholder')}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </Combobox.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                            {loading ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                    {t('loading_patients')}
                                </div>
                            ) : patients.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                    {t('no_patients_found')}
                                </div>
                            ) : (
                                patients.map((patient) => (
                                    <Combobox.Option
                                        key={patient.id}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                active ? 'bg-primary text-white' : 'text-gray-900'
                                            }`
                                        }
                                        value={patient}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span
                                                    className={`block truncate ${
                                                        selected ? 'font-medium' : 'font-normal'
                                                    }`}
                                                >
                                                    {patient.firstName} {patient.lastName}
                                                </span>
                                                {selected ? (
                                                    <span
                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                            active ? 'text-white' : 'text-primary'
                                                        }`}
                                                    >
                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
