/**
 * Draft Domain Types
 *
 * Represents unsaved work that can be restored after network failures
 * or browser closure. Following DDD principles, this is a Value Object.
 */

export type DraftType = 'invoice' | 'patient' | 'customer';

export interface DraftData<T = unknown> {
  /** Type of draft (invoice, patient, customer) */
  type: DraftType;

  /** The actual form data */
  data: T;

  /** When the draft was created/updated (Unix timestamp) */
  timestamp: number;

  /** Unique identifier for the form instance */
  formId: string;

  /** Whether the draft was saved due to a network error */
  savedByError?: boolean;
}

/**
 * Draft Value Object
 *
 * Immutable representation of a draft with utility methods
 */
export class Draft<T = unknown> {
  constructor(
    public readonly type: DraftType,
    public readonly data: T,
    public readonly timestamp: number,
    public readonly formId: string,
    public readonly savedByError: boolean = false
  ) {}

  /**
   * Create a new draft
   */
  static create<T>(type: DraftType, data: T, formId: string): Draft<T> {
    return new Draft(type, data, Date.now(), formId);
  }

  /**
   * Create draft from stored data
   */
  static fromData<T>(data: DraftData<T>): Draft<T> {
    return new Draft(data.type, data.data, data.timestamp, data.formId, data.savedByError || false);
  }

  /**
   * Convert to plain object for storage
   */
  toData(): DraftData<T> {
    return {
      type: this.type,
      data: this.data,
      timestamp: this.timestamp,
      formId: this.formId,
      savedByError: this.savedByError
    };
  }

  /**
   * Get human-readable age of draft
   */
  getAge(): string {
    const now = Date.now();
    const diff = now - this.timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'hace unos segundos';
  }

  /**
   * Check if this draft is for the same form instance
   */
  isForForm(formId: string): boolean {
    return this.formId === formId;
  }
}
