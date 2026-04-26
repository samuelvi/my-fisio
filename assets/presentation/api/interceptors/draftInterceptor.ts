/**
 * Presentation Layer - Draft Interceptor for Network Errors
 *
 * Axios interceptor that detects network failures and triggers draft save
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import { DRAFT_EVENTS } from '../../../application/draft/types';
import { isNetworkError } from '../utils/httpErrorUtils';

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
