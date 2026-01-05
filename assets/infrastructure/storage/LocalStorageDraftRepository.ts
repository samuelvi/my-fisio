/**
 * Infrastructure Layer - LocalStorage Draft Repository
 *
 * Implements persistence of drafts using browser's localStorage
 */

import { DraftType, DraftData } from '../../domain/Draft';
import { DraftRepository } from '../../application/draft/types';

/**
 * Storage keys for different draft types
 */
const STORAGE_KEYS: Record<DraftType, string> = {
  invoice: 'draft_invoice',
  patient: 'draft_patient',
  customer: 'draft_customer'
} as const;

/**
 * LocalStorage implementation of DraftRepository
 *
 * Handles serialization/deserialization and error handling
 */
export class LocalStorageDraftRepository implements DraftRepository {
  /**
   * Save draft to localStorage
   */
  save<T>(type: DraftType, data: T, formId: string, savedByError: boolean = false): void {
    try {
      const draftData: DraftData<T> = {
        type,
        data,
        timestamp: Date.now(),
        formId,
        savedByError
      };

      const key = STORAGE_KEYS[type];
      const serialized = JSON.stringify(draftData);

      localStorage.setItem(key, serialized);

      // Dispatch event for other tabs/windows
      window.dispatchEvent(
        new CustomEvent('draft:saved', {
          detail: { type, timestamp: draftData.timestamp }
        })
      );
    } catch (error) {
      console.error(`Failed to save draft for ${type}:`, error);
      // Don't throw - saving draft is not critical
    }
  }

  /**
   * Get draft from localStorage
   */
  get<T>(type: DraftType): DraftData<T> | null {
    try {
      const key = STORAGE_KEYS[type];
      const serialized = localStorage.getItem(key);

      if (!serialized) {
        return null;
      }

      const parsed = JSON.parse(serialized) as DraftData<T>;

      // Validate structure
      if (!this.isValidDraft(parsed)) {
        console.warn(`Invalid draft structure for ${type}, removing`);
        this.remove(type);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error(`Failed to get draft for ${type}:`, error);
      return null;
    }
  }

  /**
   * Remove draft from localStorage
   */
  remove(type: DraftType): void {
    try {
      const key = STORAGE_KEYS[type];
      localStorage.removeItem(key);

      // Dispatch event for other tabs/windows
      window.dispatchEvent(
        new CustomEvent('draft:discarded', {
          detail: { type }
        })
      );
    } catch (error) {
      console.error(`Failed to remove draft for ${type}:`, error);
    }
  }

  /**
   * Check if draft exists
   */
  exists(type: DraftType): boolean {
    const draft = this.get(type);
    return draft !== null;
  }

  /**
   * Get draft timestamp
   */
  getTimestamp(type: DraftType): number | null {
    const draft = this.get(type);
    return draft?.timestamp ?? null;
  }

  /**
   * Validate draft structure
   */
  private isValidDraft(data: unknown): data is DraftData {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const draft = data as Record<string, unknown>;

    return (
      typeof draft.type === 'string' &&
      'data' in draft &&
      typeof draft.timestamp === 'number' &&
      typeof draft.formId === 'string'
    );
  }

  /**
   * Get all storage keys for debugging
   */
  getAllKeys(): string[] {
    return Object.values(STORAGE_KEYS);
  }

  /**
   * Clear all drafts (for testing/debugging)
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to clear ${key}:`, error);
      }
    });
  }
}

/**
 * Singleton instance
 */
export const draftRepository = new LocalStorageDraftRepository();
