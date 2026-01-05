/**
 * Presentation Layer - Draft Interceptor for Network Errors
 *
 * Axios interceptor that detects network failures and triggers draft save
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import { DRAFT_EVENTS } from '../../../application/draft/types';

/**
 * Network error codes that should trigger draft save
 */
const NETWORK_ERROR_CODES = [
  'ERR_NETWORK',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_BAD_REQUEST'
];

/**
 * Check if error is a network error (not server error)
 */
function isNetworkError(error: AxiosError): boolean {
  // Network errors have no response (connection failed before reaching server)
  if (!error.response) {
    return true;
  }

  // Check for specific network error codes
  if (error.code && NETWORK_ERROR_CODES.includes(error.code)) {
    return true;
  }

  return false;
}

/**
 * Setup draft interceptor on axios instance
 *
 * This interceptor catches network errors and emits custom event
 * to trigger draft save via DraftService
 */
export function setupDraftInterceptor(axiosInstance: AxiosInstance = axios): void {
  axiosInstance.interceptors.response.use(
    // Success response - pass through
    (response) => response,

    // Error response - check if network error
    (error: AxiosError) => {
      if (isNetworkError(error)) {
        console.warn('[DraftInterceptor] Network error detected, emitting event', error.code || error.message);

        // Emit network error event
        // Components using DraftService will listen for this and save draft
        window.dispatchEvent(
          new CustomEvent(DRAFT_EVENTS.NETWORK_ERROR, {
            detail: {
              error: {
                code: error.code,
                message: error.message
              },
              // Note: The component is responsible for providing type, data, and formId
              // This interceptor only signals that a network error occurred
              timestamp: Date.now()
            }
          })
        );
      }

      // Always reject to let component handle the error
      return Promise.reject(error);
    }
  );
}

/**
 * Remove draft interceptor from axios instance
 */
export function removeDraftInterceptor(axiosInstance: AxiosInstance = axios, interceptorId: number): void {
  axiosInstance.interceptors.response.eject(interceptorId);
}
