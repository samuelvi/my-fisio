/**
 * Reusable Form Draft Hook
 *
 * Encapsulates all draft-related state and logic for forms
 */

import { useState, useCallback } from 'react';
import { useDraft } from './useDraft';
import { DraftType } from '../../domain/Draft';

interface UseFormDraftOptions<T> {
  type: DraftType;
  formId: string;
  onRestore: (data: T) => void;
}

export interface UseFormDraftReturn<T> {
  // Draft state
  hasDraft: boolean;
  draftAge: string | null;
  draftSavedByError: boolean;

  // Modal state
  showRestoreModal: boolean;
  showDiscardModal: boolean;

  // Draft operations
  saveDraft: (data: T, savedByError?: boolean) => void;
  clearDraft: () => void;
  saveOnNetworkError: (error: any, data: T) => void;

  // Modal handlers
  handleRestoreDraft: () => Promise<void>;
  handleDiscardDraft: () => Promise<void>;
  openRestoreModal: () => void;
  closeRestoreModal: () => void;
  openDiscardModal: () => void;
  closeDiscardModal: () => void;
}

/**
 * Reusable hook for form draft management
 *
 * Handles all draft state, modals, and operations in one place
 * to avoid code duplication across forms
 */
export function useFormDraft<T>(options: UseFormDraftOptions<T>): UseFormDraftReturn<T> {
  const { type, formId, onRestore } = options;

  // Modal state
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Draft hook
  const draft = useDraft<T>({
    type,
    formId,
    onRestore,
    onDiscard: () => {
      // Modal already closed by handleDiscardDraft
    }
  });

  // Modal handlers
  const handleRestoreDraft = useCallback(async () => {
    await draft.restoreDraft();
    setShowRestoreModal(false);
  }, [draft]);

  const handleDiscardDraft = useCallback(async () => {
    await draft.discardDraft();
    setShowDiscardModal(false);
  }, [draft]);

  const openRestoreModal = useCallback(() => setShowRestoreModal(true), []);
  const closeRestoreModal = useCallback(() => setShowRestoreModal(false), []);
  const openDiscardModal = useCallback(() => setShowDiscardModal(true), []);
  const closeDiscardModal = useCallback(() => setShowDiscardModal(false), []);

  return {
    // Draft state
    hasDraft: draft.hasDraft,
    draftAge: draft.draftAge,
    draftSavedByError: draft.draftSavedByError,

    // Modal state
    showRestoreModal,
    showDiscardModal,

    // Draft operations
    saveDraft: draft.saveDraft,
    clearDraft: draft.clearDraft,
    saveOnNetworkError: draft.saveOnNetworkError,

    // Modal handlers
    handleRestoreDraft,
    handleDiscardDraft,
    openRestoreModal,
    closeRestoreModal,
    openDiscardModal,
    closeDiscardModal
  };
}
