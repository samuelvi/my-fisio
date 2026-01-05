/**
 * Unit Tests - LocalStorageDraftRepository
 *
 * Tests for localStorage-based draft persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageDraftRepository } from '../../infrastructure/storage/LocalStorageDraftRepository';
import { DraftData } from '../../domain/Draft';

describe('LocalStorageDraftRepository', () => {
  let repository: LocalStorageDraftRepository;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};

    global.localStorage = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      key: vi.fn(),
      length: 0
    } as any;

    // Mock window.dispatchEvent
    global.window = {
      dispatchEvent: vi.fn()
    } as any;

    repository = new LocalStorageDraftRepository();
  });

  describe('save', () => {
    it('should save draft to localStorage', () => {
      const data = { name: 'Test Invoice', amount: 100 };
      repository.save('invoice', data, 'form-123');

      expect(localStorage.setItem).toHaveBeenCalled();
      const stored = mockLocalStorage['draft_invoice'];
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored);
      expect(parsed.type).toBe('invoice');
      expect(parsed.data).toEqual(data);
      expect(parsed.formId).toBe('form-123');
      expect(parsed.timestamp).toBeTypeOf('number');
    });

    it('should dispatch custom event when saved', () => {
      repository.save('invoice', {}, 'form-1');

      expect(window.dispatchEvent).toHaveBeenCalled();
      const event = (window.dispatchEvent as any).mock.calls[0][0];
      expect(event.type).toBe('draft:saved');
      expect(event.detail.type).toBe('invoice');
    });

    it('should save different draft types with different keys', () => {
      repository.save('invoice', { a: 1 }, 'form-1');
      repository.save('patient', { b: 2 }, 'form-2');
      repository.save('customer', { c: 3 }, 'form-3');

      expect(mockLocalStorage['draft_invoice']).toBeDefined();
      expect(mockLocalStorage['draft_patient']).toBeDefined();
      expect(mockLocalStorage['draft_customer']).toBeDefined();
    });

    it('should handle save errors gracefully', () => {
      // Mock setItem to throw
      (localStorage.setItem as any).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => {
        repository.save('invoice', {}, 'form-1');
      }).not.toThrow();
    });
  });

  describe('get', () => {
    it('should retrieve saved draft', () => {
      const draftData: DraftData<{ test: string }> = {
        type: 'invoice',
        data: { test: 'value' },
        timestamp: Date.now(),
        formId: 'form-123'
      };

      mockLocalStorage['draft_invoice'] = JSON.stringify(draftData);

      const retrieved = repository.get<{ test: string }>('invoice');

      expect(retrieved).toEqual(draftData);
    });

    it('should return null if draft does not exist', () => {
      const retrieved = repository.get('invoice');

      expect(retrieved).toBeNull();
    });

    it('should return null if JSON is invalid', () => {
      mockLocalStorage['draft_invoice'] = 'invalid json{{{';

      const retrieved = repository.get('invoice');

      expect(retrieved).toBeNull();
    });

    it('should validate draft structure', () => {
      // Missing required fields
      mockLocalStorage['draft_invoice'] = JSON.stringify({
        type: 'invoice',
        // missing data, timestamp, formId
      });

      const retrieved = repository.get('invoice');

      expect(retrieved).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('draft_invoice');
    });

    it('should remove invalid drafts', () => {
      mockLocalStorage['draft_invoice'] = JSON.stringify({
        invalid: 'structure'
      });

      repository.get('invoice');

      expect(localStorage.removeItem).toHaveBeenCalledWith('draft_invoice');
    });
  });

  describe('remove', () => {
    it('should remove draft from localStorage', () => {
      mockLocalStorage['draft_invoice'] = JSON.stringify({
        type: 'invoice',
        data: {},
        timestamp: Date.now(),
        formId: 'form-1'
      });

      repository.remove('invoice');

      expect(localStorage.removeItem).toHaveBeenCalledWith('draft_invoice');
      expect(mockLocalStorage['draft_invoice']).toBeUndefined();
    });

    it('should dispatch custom event when removed', () => {
      repository.remove('invoice');

      expect(window.dispatchEvent).toHaveBeenCalled();
      const event = (window.dispatchEvent as any).mock.calls[0][0];
      expect(event.type).toBe('draft:discarded');
      expect(event.detail.type).toBe('invoice');
    });

    it('should handle remove errors gracefully', () => {
      (localStorage.removeItem as any).mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        repository.remove('invoice');
      }).not.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true if draft exists', () => {
      mockLocalStorage['draft_invoice'] = JSON.stringify({
        type: 'invoice',
        data: {},
        timestamp: Date.now(),
        formId: 'form-1'
      });

      expect(repository.exists('invoice')).toBe(true);
    });

    it('should return false if draft does not exist', () => {
      expect(repository.exists('invoice')).toBe(false);
    });

    it('should return false if draft is invalid', () => {
      mockLocalStorage['draft_invoice'] = 'invalid';

      expect(repository.exists('invoice')).toBe(false);
    });
  });

  describe('getTimestamp', () => {
    it('should return timestamp if draft exists', () => {
      const timestamp = Date.now();
      mockLocalStorage['draft_invoice'] = JSON.stringify({
        type: 'invoice',
        data: {},
        timestamp,
        formId: 'form-1'
      });

      expect(repository.getTimestamp('invoice')).toBe(timestamp);
    });

    it('should return null if draft does not exist', () => {
      expect(repository.getTimestamp('invoice')).toBeNull();
    });
  });

  describe('getAllKeys', () => {
    it('should return all storage keys', () => {
      const keys = repository.getAllKeys();

      expect(keys).toContain('draft_invoice');
      expect(keys).toContain('draft_patient');
      expect(keys).toContain('draft_customer');
      expect(keys).toHaveLength(3);
    });
  });

  describe('clearAll', () => {
    it('should remove all drafts', () => {
      mockLocalStorage['draft_invoice'] = 'test1';
      mockLocalStorage['draft_patient'] = 'test2';
      mockLocalStorage['draft_customer'] = 'test3';

      repository.clearAll();

      expect(localStorage.removeItem).toHaveBeenCalledWith('draft_invoice');
      expect(localStorage.removeItem).toHaveBeenCalledWith('draft_patient');
      expect(localStorage.removeItem).toHaveBeenCalledWith('draft_customer');
    });

    it('should handle clear errors gracefully', () => {
      (localStorage.removeItem as any).mockImplementation(() => {
        throw new Error('Error');
      });

      expect(() => {
        repository.clearAll();
      }).not.toThrow();
    });
  });
});
