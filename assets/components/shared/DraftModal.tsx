/**
 * Presentation Layer - Draft Modal Component
 *
 * Confirmation modal for draft restore/discard actions using Headless UI
 */

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  ArrowPathIcon, 
  TrashIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../LanguageContext';

interface DraftModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Modal title */
  title: string;

  /** Modal message/description */
  message: string;

  /** Type of modal: 'restore' or 'discard' */
  type: 'restore' | 'discard';

  /** Callback when user confirms */
  onConfirm: () => void;

  /** Callback when user cancels */
  onCancel: () => void;

  /** Whether an async action is in progress */
  isLoading?: boolean;
}

export default function DraftModal({
  isOpen,
  title,
  message,
  type,
  onConfirm,
  onCancel,
  isLoading = false
}: DraftModalProps) {
  const { t } = useLanguage();
  const isRestoreType = type === 'restore';
  
  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onConfirm();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCancel) {
        onCancel();
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onCancel || (() => {})}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-200">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-8 sm:pb-6">
                  <div className="sm:flex sm:items-start">
                    <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isRestoreType ? 'bg-blue-100' : 'bg-red-100'}`}>
                      {isRestoreType ? (
                        <ArrowPathIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                      ) : (
                        <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                      )}
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                      <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                        {title}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8 gap-4">
                  <button
                    type="button"
                    disabled={isLoading}
                    data-testid="confirm-draft-btn"
                    className={`inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-bold text-white shadow-sm sm:w-auto transition ${isRestoreType ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'} disabled:opacity-50`}
                    onClick={handleConfirm}
                  >
                    {isLoading ? t('processing') : (isRestoreType ? t('yes_restore') : t('yes_discard'))}
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    data-testid="cancel-draft-btn"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition disabled:opacity-50"
                    onClick={handleCancel}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}