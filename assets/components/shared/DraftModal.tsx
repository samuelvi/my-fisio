/**
 * Presentation Layer - Draft Modal Component
 *
 * Confirmation modal for draft restore/discard actions
 */

import React, { useEffect } from 'react';

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

/**
 * Draft Modal Component
 *
 * Confirmation modal for draft operations
 *
 * @example
 * ```tsx
 * <DraftModal
 *   isOpen={showRestoreModal}
 *   title="Recuperar borrador"
 *   message="¿Estás seguro de que deseas recuperar el borrador? Los datos actuales del formulario se reemplazarán."
 *   type="restore"
 *   onConfirm={handleConfirmRestore}
 *   onCancel={() => setShowRestoreModal(false)}
 * />
 * ```
 */
export default function DraftModal({
  isOpen,
  title,
  message,
  type,
  onConfirm,
  onCancel,
  isLoading = false
}: DraftModalProps) {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isRestoreType = type === 'restore';
  const confirmButtonColor = isRestoreType
    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500';

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
        onClick={isLoading ? undefined : onCancel}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Modal Panel */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Icon */}
              <div
                className={`
                  mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full
                  sm:mx-0 sm:h-10 sm:w-10
                  ${isRestoreType ? 'bg-blue-100' : 'bg-red-100'}
                `}
              >
                {isRestoreType ? (
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                <h3
                  className="text-lg font-semibold leading-6 text-gray-900"
                  id="modal-title"
                >
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">{message}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`
                inline-flex w-full justify-center rounded-md px-4 py-2
                text-sm font-semibold text-white shadow-sm
                sm:w-auto
                ${confirmButtonColor}
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-offset-2
                transition-colors
              `}
            >
              {isLoading && (
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {isLoading
                ? 'Procesando...'
                : isRestoreType
                ? 'Sí, recuperar'
                : 'Sí, descartar'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="
                mt-3 inline-flex w-full justify-center rounded-md
                bg-white px-4 py-2 text-sm font-semibold text-gray-900
                shadow-sm ring-1 ring-inset ring-gray-300
                hover:bg-gray-50
                sm:mt-0 sm:w-auto
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                transition-colors
              "
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
