/**
 * Presentation Layer - Draft Alert Component
 *
 * Sticky alert that appears when a draft is available
 * Allows user to restore or discard the draft
 */

import React from 'react';

interface DraftAlertProps {
  /** Whether the alert should be shown */
  show: boolean;

  /** Human-readable draft age (e.g., "hace 2 horas") */
  draftAge: string | null;

  /** Callback when user clicks "Restore" */
  onRestore: () => void;

  /** Callback when user clicks "Discard" */
  onDiscard: () => void;

  /** Alert type: always 'error' (red) for network errors */
  variant?: 'error';

  /** Optional className for customization */
  className?: string;
}

/**
 * Draft Alert Component
 *
 * Sticky alert that shows at the top of the form when a draft exists
 *
 * @example
 * ```tsx
 * <DraftAlert
 *   show={draft.hasDraft}
 *   draftAge={draft.draftAge}
 *   onRestore={handleRestore}
 *   onDiscard={handleDiscard}
 * />
 * ```
 */
export default function DraftAlert({
  show,
  draftAge,
  onRestore,
  onDiscard,
  variant = 'error',
  className = ''
}: DraftAlertProps) {
  console.log('[DraftAlert] Render:', { show, draftAge, variant });

  if (!show) {
    return null;
  }

  // Always red for error variant
  const bgColor = 'bg-red-50';
  const borderColor = 'border-red-500';
  const iconColor = 'text-red-600';
  const titleColor = 'text-red-900';
  const textColor = 'text-red-800';
  const buttonPrimaryBg = 'bg-red-600 hover:bg-red-700 focus:ring-red-500';

  const title = 'Error de red - Borrador guardado';
  const message = 'No se pudo guardar la factura por un error de conexión. Se ha guardado un borrador automáticamente';

  return (
    <div
      id="draft-alert"
      tabIndex={-1}
      className={`
        sticky top-0 z-50 mb-6
        ${bgColor} border-l-4 ${borderColor}
        rounded-lg shadow-md
        ${className}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-start p-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <svg
            className={`w-6 h-6 ${iconColor}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-bold ${titleColor}`}>
            {title}
          </h3>
          <div className={`mt-1 text-sm ${textColor}`}>
            <p>
              {message}
              {draftAge && (
                <span className="font-medium"> {draftAge}</span>
              )}
              . ¿Deseas recuperarlo o descartarlo?
            </p>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRestore();
              }}
              className={`
                inline-flex items-center px-4 py-2
                border border-transparent rounded-md
                text-sm font-medium
                text-white ${buttonPrimaryBg}
                focus:outline-none focus:ring-2 focus:ring-offset-2
                transition-colors
              `}
            >
              <svg
                className="w-4 h-4 mr-2"
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
              Recuperar borrador
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDiscard();
              }}
              className="
                inline-flex items-center px-4 py-2
                border border-gray-300 rounded-md
                text-sm font-medium
                text-gray-700 bg-white
                hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                transition-colors
              "
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Descartar borrador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
