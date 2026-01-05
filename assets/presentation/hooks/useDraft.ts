/**
 * Presentation Layer - useDraft Hook
 *
 * React hook for managing draft functionality in forms
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { DraftType } from '../../domain/Draft';
import { draftService } from '../../application/draft/DraftService';
import { DRAFT_EVENTS } from '../../application/draft/types';

interface UseDraftOptions {
  /** Draft type (invoice, patient, customer) */
  type: DraftType;

  /** Unique form identifier */
  formId: string;

  /** Auto-save interval in milliseconds (default: 10000 = 10s) */
  autoSaveInterval?: number;

  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;

  /** Callback when draft is restored */
  onRestore?: (data: any) => void;

  /** Callback when draft is discarded */
  onDiscard?: () => void;
}

interface UseDraftReturn<T> {
  /** Whether a draft exists */
  hasDraft: boolean;

  /** Human-readable draft age (e.g., "hace 2 horas") */
  draftAge: string | null;

  /** Whether the draft was saved due to a network error */
  draftSavedByError: boolean;

  /** Save current form data as draft */
  saveDraft: (data: T, savedByError?: boolean) => void;

  /** Restore draft data */
  restoreDraft: () => Promise<T | null>;

  /** Discard draft permanently */
  discardDraft: () => Promise<void>;

  /** Clear draft (called after successful save) */
  clearDraft: () => void;

  /** Start auto-save */
  startAutoSave: (getData: () => T) => void;

  /** Stop auto-save */
  stopAutoSave: () => void;

  /** Save draft on network error */
  saveOnNetworkError: (error: any, data: T) => void;
}

/**
 * Hook for managing draft functionality in forms
 *
 * @example
 * ```tsx
 * const draft = useDraft<InvoiceFormData>({
 *   type: 'invoice',
 *   formId: 'invoice-new',
 *   onRestore: (data) => {
 *     // Populate form with draft data
 *     setFormData(data);
 *   }
 * });
 *
 * // In form submit handler:
 * try {
 *   await saveInvoice(formData);
 *   draft.clearDraft(); // Clear on success
 * } catch (error) {
 *   draft.saveOnNetworkError(error, formData); // Save on network error
 * }
 * ```
 */
export function useDraft<T = unknown>(options: UseDraftOptions): UseDraftReturn<T> {
  const { type, formId, autoSaveInterval, enabled = true, onRestore, onDiscard } = options;

  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [draftAge, setDraftAge] = useState<string | null>(null);
  const [draftSavedByError, setDraftSavedByError] = useState<boolean>(false);

  // Track if component is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);

  /**
   * Check if draft exists and update state
   */
  const checkDraft = useCallback(() => {
    if (!isMountedRef.current) return;

    const exists = draftService.hasDraft(type);
    console.log('[useDraft] checkDraft - exists:', exists);
    setHasDraft(exists);

    if (exists) {
      const age = draftService.getDraftAge(type);
      const draft = draftService.getDraft(type);
      console.log('[useDraft] checkDraft - draft:', {
        age,
        savedByError: draft?.savedByError,
        draft
      });
      setDraftAge(age);
      setDraftSavedByError(draft?.savedByError || false);
    } else {
      setDraftAge(null);
      setDraftSavedByError(false);
    }
  }, [type]);

  /**
   * Save draft immediately
   */
  const saveDraft = useCallback((data: T, savedByError: boolean = false) => {
    draftService.saveDraft(type, data, formId, savedByError);
    checkDraft();
  }, [type, formId, checkDraft]);

  /**
   * Restore draft data
   */
  const restoreDraft = useCallback(async (): Promise<T | null> => {
    const data = await draftService.restoreDraft<T>(type);
    if (data && onRestore) {
      onRestore(data);
    }
    checkDraft();
    return data;
  }, [type, onRestore, checkDraft]);

  /**
   * Discard draft permanently
   */
  const discardDraft = useCallback(async (): Promise<void> => {
    await draftService.discardDraft(type);
    if (onDiscard) {
      onDiscard();
    }
    checkDraft();
  }, [type, onDiscard, checkDraft]);

  /**
   * Clear draft (after successful save)
   */
  const clearDraft = useCallback(() => {
    draftService.clearDraft(type);
    checkDraft();
  }, [type, checkDraft]);

  /**
   * Start auto-save with data getter
   */
  const startAutoSave = useCallback((getData: () => T) => {
    if (!enabled) return;

    draftService.startAutoSave(type, getData, formId, {
      autoSaveInterval,
      enabled
    });
  }, [type, formId, autoSaveInterval, enabled]);

  /**
   * Stop auto-save
   */
  const stopAutoSave = useCallback(() => {
    draftService.stopAutoSave(type);
  }, [type]);

  /**
   * Save draft on network error
   *
   * Call this in your catch block to save draft when API fails
   */
  const saveOnNetworkError = useCallback((error: any, data: T) => {
    console.log('[useDraft] saveOnNetworkError called', {
      hasResponse: !!error.response,
      code: error.code,
      error
    });

    // Check if it's a network error (no response = network failed)
    const isNetworkError =
      !error.response || // No response = network error
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT';

    console.log('[useDraft] isNetworkError:', isNetworkError);

    if (isNetworkError) {
      console.warn('[useDraft] Network error detected, saving draft with savedByError=true');
      saveDraft(data, true); // Mark as saved by error
      console.log('[useDraft] Draft saved, emitting event');

      // Emit event for other listeners
      window.dispatchEvent(
        new CustomEvent(DRAFT_EVENTS.NETWORK_ERROR, {
          detail: { type, data, formId, error: error.message }
        })
      );
    } else {
      console.log('[useDraft] Not a network error, skipping draft save');
    }
  }, [type, formId, saveDraft]);

  /**
   * Check for existing draft on mount
   */
  useEffect(() => {
    checkDraft();

    // Check draft age every minute
    const interval = setInterval(checkDraft, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [checkDraft]);

  /**
   * Listen for draft events
   */
  useEffect(() => {
    const handleDraftSaved = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.type === type) {
        checkDraft();
      }
    };

    const handleDraftRestored = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.type === type) {
        checkDraft();
      }
    };

    const handleDraftDiscarded = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.type === type) {
        checkDraft();
      }
    };

    window.addEventListener('draft:saved', handleDraftSaved);
    window.addEventListener(DRAFT_EVENTS.DRAFT_RESTORED, handleDraftRestored);
    window.addEventListener(DRAFT_EVENTS.DRAFT_DISCARDED, handleDraftDiscarded);

    return () => {
      window.removeEventListener('draft:saved', handleDraftSaved);
      window.removeEventListener(DRAFT_EVENTS.DRAFT_RESTORED, handleDraftRestored);
      window.removeEventListener(DRAFT_EVENTS.DRAFT_DISCARDED, handleDraftDiscarded);
    };
  }, [type, checkDraft]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopAutoSave();
    };
  }, [stopAutoSave]);

  return {
    hasDraft,
    draftAge,
    draftSavedByError,
    saveDraft,
    restoreDraft,
    discardDraft,
    clearDraft,
    startAutoSave,
    stopAutoSave,
    saveOnNetworkError
  };
}
