/**
 * Application Layer - Draft Service
 *
 * Business logic for draft management including auto-save functionality
 */

import { DraftType, Draft } from '../../domain/Draft';
import { DraftRepository, DraftConfig, DRAFT_EVENTS } from './types';
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
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private repository: DraftRepository;

  constructor(repository: DraftRepository = draftRepository) {
    this.repository = repository;
    this.setupNetworkErrorListener();
  }

  /**
   * Start auto-saving for a specific draft type
   *
   * @param type - The draft type (invoice, patient, customer)
   * @param getData - Callback to get current form data
   * @param formId - Unique form identifier
   * @param config - Configuration options
   */
  startAutoSave<T>(
    type: DraftType,
    getData: () => T,
    formId: string,
    config: Partial<DraftConfig> = {}
  ): void {
    const finalConfig: DraftConfig = {
      autoSaveInterval: config.autoSaveInterval ?? 10000, // 10 seconds
      storageKey: config.storageKey ?? `draft_${type}`,
      enabled: config.enabled ?? true
    };

    if (!finalConfig.enabled) {
      return;
    }

    // Clear existing timer if any
    this.stopAutoSave(type);

    // Set up new auto-save timer
    const timer = setInterval(() => {
      const data = getData();
      if (data) {
        // Preserve savedByError flag if it exists
        const existingDraft = this.getDraft(type);
        const savedByError = existingDraft?.savedByError || false;
        this.saveDraft(type, data, formId, savedByError);
      }
    }, finalConfig.autoSaveInterval);

    this.autoSaveTimers.set(type, timer);
  }

  /**
   * Stop auto-saving for a specific draft type
   */
  stopAutoSave(type: DraftType): void {
    const timer = this.autoSaveTimers.get(type);
    if (timer) {
      clearInterval(timer);
      this.autoSaveTimers.delete(type);
    }
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
    this.stopAutoSave(type);
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
    this.stopAutoSave(type);
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

  /**
   * Cleanup all timers (call on app unmount)
   */
  cleanup(): void {
    this.autoSaveTimers.forEach(timer => clearInterval(timer));
    this.autoSaveTimers.clear();
  }
}

/**
 * Singleton instance
 */
export const draftService = new DraftService();
