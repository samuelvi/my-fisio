/**
 * Application Layer - Draft Service
 *
 * Business logic for draft management including auto-save functionality
 */

import { DraftType, Draft } from '../../domain/Draft';
import { DraftRepository, DRAFT_EVENTS } from './types';
import { draftRepository } from '../../infrastructure/storage/LocalStorageDraftRepository';

/**
 * Draft Service
 *
 * Manages draft lifecycle including:
 * - Auto-save every 10 seconds
 * - Save on network failure
 * - Clear on successful save
 * - Restore and discard operations
 */
export class DraftService {
  private repository: DraftRepository;

  constructor(repository: DraftRepository = draftRepository) {
    this.repository = repository;
    this.setupNetworkErrorListener();
  }

  /**
   * Save draft immediately
   */
  saveDraft<T>(type: DraftType, data: T, formId: string, savedByError: boolean = false): void {
    this.repository.save(type, data, formId, savedByError);
  }

  /**
   * Get draft if exists
   */
  getDraft<T>(type: DraftType): Draft<T> | null {
    const draftData = this.repository.get<T>(type);
    if (!draftData) {
      return null;
    }
    return Draft.fromData(draftData);
  }

  /**
   * Check if draft exists
   */
  hasDraft(type: DraftType): boolean {
    return this.repository.exists(type);
  }

  /**
   * Clear draft (used after successful save)
   */
  clearDraft(type: DraftType): void {
    this.repository.remove(type);

    window.dispatchEvent(
      new CustomEvent(DRAFT_EVENTS.SAVE_SUCCESS, {
        detail: { type }
      })
    );
  }

  /**
   * Restore draft data
   */
  async restoreDraft<T>(type: DraftType): Promise<T | null> {
    const draft = this.getDraft<T>(type);
    if (!draft) {
      return null;
    }

    window.dispatchEvent(
      new CustomEvent(DRAFT_EVENTS.DRAFT_RESTORED, {
        detail: { type, timestamp: draft.timestamp }
      })
    );

    return draft.data;
  }

  /**
   * Discard draft permanently
   */
  async discardDraft(type: DraftType): Promise<void> {
    this.repository.remove(type);

    window.dispatchEvent(
      new CustomEvent(DRAFT_EVENTS.DRAFT_DISCARDED, {
        detail: { type }
      })
    );
  }

  /**
   * Get draft age in human-readable format
   */
  getDraftAge(type: DraftType): string | null {
    const draft = this.getDraft(type);
    return draft?.getAge() ?? null;
  }

  /**
   * Setup listener for network errors to auto-save
   */
  private setupNetworkErrorListener(): void {
    window.addEventListener(DRAFT_EVENTS.NETWORK_ERROR, ((event: CustomEvent) => {
      const { type, data, formId } = event.detail;
      if (type && data && formId) {
        // Save with savedByError flag set to true
        this.saveDraft(type, data, formId, true);
      }
    }) as EventListener);
  }
}

/**
 * Singleton instance
 */
export const draftService = new DraftService();
