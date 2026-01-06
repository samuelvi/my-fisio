/**
 * Presentation Layer - Network Error Alert Component
 *
 * Simple alert that appears when a network error occurs during a transaction
 * that doesn't support drafts (like calendar operations)
 */

import React from 'react';
import { XMarkIcon, NoSymbolIcon } from '@heroicons/react/24/outline';

interface NetworkErrorAlertProps {
  /** Whether the alert should be shown */
  show: boolean;

  /** Callback when user clicks close */
  onClose: () => void;

  /** Optional message customization */
  message?: string;

  /** Optional className for customization */
  className?: string;
}

export default function NetworkErrorAlert({
  show,
  onClose,
  message,
  className = ''
}: NetworkErrorAlertProps) {
  if (!show) {
    return null;
  }

  const defaultMessage = 'Los cambios no se pudieron guardar porque se ha perdido la conexión a Internet. Por favor, comprueba tu conexión e inténtalo de nuevo.';

  return (
    <div
      id="network-error-alert"
      className={`
        sticky top-0 z-[100] mb-6
        bg-red-50 border-l-4 border-red-500
        rounded-lg shadow-lg
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-center p-4">
        <div className="flex-shrink-0">
          <NoSymbolIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-black text-red-900 uppercase tracking-tight">
            Error de conexión
          </h3>
          <div className="mt-1 text-sm text-red-800 font-medium">
            {message || defaultMessage}
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 transition-all"
            >
              <span className="sr-only">Cerrar</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
