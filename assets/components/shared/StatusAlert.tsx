/**
 * Presentation Layer - Status Alert Component
 *
 * Simple alert that appears when a network or server error occurs
 */

import React from 'react';
import { XMarkIcon, NoSymbolIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../LanguageContext';

interface StatusAlertProps {
  /** Whether the alert should be shown */
  show: boolean;

  /** Callback when user clicks close */
  onClose: () => void;

  /** Alert title */
  title?: string;

  /** Optional message customization */
  message?: string;

  /** Variant: 'error' (red) or 'warning' (amber) */
  variant?: 'error' | 'warning';

  /** Optional className for customization */
  className?: string;
}

export default function StatusAlert({
  show,
  onClose,
  title,
  message,
  variant = 'error',
  className = ''
}: StatusAlertProps) {
  const { t } = useLanguage();

  if (!show) {
    return null;
  }

  const isError = variant === 'error';
  const bgColor = isError ? 'bg-red-50' : 'bg-amber-50';
  const borderColor = isError ? 'border-red-500' : 'border-amber-500';
  const iconColor = isError ? 'text-red-600' : 'text-amber-600';
  const titleColor = isError ? 'text-red-900' : 'text-amber-900';
  const textColor = isError ? 'text-red-800' : 'text-amber-800';
  const closeButtonColor = isError ? 'text-red-500 hover:bg-red-100' : 'text-amber-500 hover:bg-amber-100';
  const focusRingColor = isError ? 'focus:ring-red-600' : 'focus:ring-amber-600';

  const defaultTitle = isError ? t('server_error') : t('system_notice');
  const defaultMessage = isError 
    ? t('unexpected_server_error')
    : t('request_problem_msg');

  return (
    <div
      id="status-alert"
      className={`
        sticky top-0 z-[100] mb-6
        ${bgColor} border-l-4 ${borderColor}
        rounded-lg shadow-lg
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-center p-4">
        <div className="flex-shrink-0">
          {isError ? (
            <NoSymbolIcon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
          ) : (
            <ExclamationTriangleIcon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-black ${titleColor} uppercase tracking-tight`}>
            {title || defaultTitle}
          </h3>
          <div className={`mt-1 text-sm ${textColor} font-medium`}>
            {message || defaultMessage}
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex rounded-md ${bgColor} p-1.5 ${closeButtonColor} focus:outline-none focus:ring-2 ${focusRingColor} focus:ring-offset-2 transition-all`}
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