/**
 * Application Layer - Draft Types
 *
 * Defines contracts and configuration for draft management
 */

import { DraftType } from '../../domain/Draft';

/**
 * Configuration for draft auto-save behavior
 */
export interface DraftConfig {
  /** Auto-save interval in milliseconds (default: 10000ms = 10s) */
  autoSaveInterval: number;

  /** LocalStorage key for this draft type */
  storageKey: string;

  /** Whether auto-save is enabled */
  enabled: boolean;
}

/**
 * Actions available for draft management
 */
export interface DraftActions {
  /** Save current data as draft */
  save: (data: unknown) => void;

  /** Restore draft data */
  restore: () => Promise<void>;

  /** Discard draft permanently */
  discard: () => Promise<void>;

  /** Clear draft (used after successful save) */
  clear: () => void;
}

/**
 * Draft repository interface for storage abstraction
 */
export interface DraftRepository {
  /** Save draft to storage */
  save<T>(type: DraftType, data: T, formId: string, savedByError?: boolean): void;

  /** Get draft from storage */
  get<T>(type: DraftType): T | null;

  /** Remove draft from storage */
  remove(type: DraftType): void;

  /** Check if draft exists */
  exists(type: DraftType): boolean;

  /** Get draft timestamp */
  getTimestamp(type: DraftType): number | null;
}

/**
 * Events emitted by the draft system
 */
export const DRAFT_EVENTS = {
  /** Network error occurred, should save draft */
  NETWORK_ERROR: 'draft:network-error',

  /** Save was successful, should clear draft */
  SAVE_SUCCESS: 'draft:save-success',

  /** Draft was saved */
  DRAFT_SAVED: 'draft:saved',

  /** Draft was restored */
  DRAFT_RESTORED: 'draft:restored',

  /** Draft was discarded */
  DRAFT_DISCARDED: 'draft:discarded'
} as const;

export type DraftEvent = typeof DRAFT_EVENTS[keyof typeof DRAFT_EVENTS];
