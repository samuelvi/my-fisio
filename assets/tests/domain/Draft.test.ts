/**
 * Unit Tests - Draft Domain
 *
 * Tests for the Draft Value Object
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Draft, DraftData } from '../../domain/Draft';

describe('Draft Value Object', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create', () => {
    it('should create a new draft with current timestamp', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const data = { name: 'Test', amount: 100 };
      const draft = Draft.create('invoice', data, 'form-123');

      expect(draft.type).toBe('invoice');
      expect(draft.data).toEqual(data);
      expect(draft.timestamp).toBe(now);
      expect(draft.formId).toBe('form-123');
    });

    it('should support different draft types', () => {
      const invoiceDraft = Draft.create('invoice', {}, 'inv-1');
      const patientDraft = Draft.create('patient', {}, 'pat-1');
      const customerDraft = Draft.create('customer', {}, 'cust-1');

      expect(invoiceDraft.type).toBe('invoice');
      expect(patientDraft.type).toBe('patient');
      expect(customerDraft.type).toBe('customer');
    });
  });

  describe('fromData', () => {
    it('should create draft from stored data', () => {
      const draftData: DraftData<{ name: string }> = {
        type: 'invoice',
        data: { name: 'Test' },
        timestamp: 1234567890,
        formId: 'form-456'
      };

      const draft = Draft.fromData(draftData);

      expect(draft.type).toBe('invoice');
      expect(draft.data).toEqual({ name: 'Test' });
      expect(draft.timestamp).toBe(1234567890);
      expect(draft.formId).toBe('form-456');
    });
  });

  describe('toData', () => {
    it('should convert draft to plain object', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const draft = Draft.create('patient', { id: 1 }, 'pat-123');
      const data = draft.toData();

      expect(data).toEqual({
        type: 'patient',
        data: { id: 1 },
        timestamp: now,
        formId: 'pat-123'
      });
    });
  });

  describe('getAge', () => {
    it('should return "hace unos segundos" for drafts less than 1 minute old', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const draft = Draft.create('invoice', {}, 'form-1');

      vi.advanceTimersByTime(30 * 1000); // 30 seconds

      expect(draft.getAge()).toBe('hace unos segundos');
    });

    it('should return minutes for drafts less than 1 hour old', () => {
      const now = Date.now();
      const timestamp = now - (5 * 60 * 1000); // 5 minutes ago

      const draft = new Draft('invoice', {}, timestamp, 'form-1');

      vi.setSystemTime(now);

      expect(draft.getAge()).toBe('hace 5 minutos');
    });

    it('should return singular "minuto" for 1 minute', () => {
      const now = Date.now();
      const timestamp = now - (1 * 60 * 1000); // 1 minute ago

      const draft = new Draft('invoice', {}, timestamp, 'form-1');

      vi.setSystemTime(now);

      expect(draft.getAge()).toBe('hace 1 minuto');
    });

    it('should return hours for drafts less than 1 day old', () => {
      const now = Date.now();
      const timestamp = now - (3 * 60 * 60 * 1000); // 3 hours ago

      const draft = new Draft('invoice', {}, timestamp, 'form-1');

      vi.setSystemTime(now);

      expect(draft.getAge()).toBe('hace 3 horas');
    });

    it('should return singular "hora" for 1 hour', () => {
      const now = Date.now();
      const timestamp = now - (1 * 60 * 60 * 1000); // 1 hour ago

      const draft = new Draft('invoice', {}, timestamp, 'form-1');

      vi.setSystemTime(now);

      expect(draft.getAge()).toBe('hace 1 hora');
    });

    it('should return days for drafts older than 1 day', () => {
      const now = Date.now();
      const timestamp = now - (2 * 24 * 60 * 60 * 1000); // 2 days ago

      const draft = new Draft('invoice', {}, timestamp, 'form-1');

      vi.setSystemTime(now);

      expect(draft.getAge()).toBe('hace 2 días');
    });

    it('should return singular "día" for 1 day', () => {
      const now = Date.now();
      const timestamp = now - (1 * 24 * 60 * 60 * 1000); // 1 day ago

      const draft = new Draft('invoice', {}, timestamp, 'form-1');

      vi.setSystemTime(now);

      expect(draft.getAge()).toBe('hace 1 día');
    });
  });

  describe('isForForm', () => {
    it('should return true if formId matches', () => {
      const draft = Draft.create('invoice', {}, 'form-123');

      expect(draft.isForForm('form-123')).toBe(true);
    });

    it('should return false if formId does not match', () => {
      const draft = Draft.create('invoice', {}, 'form-123');

      expect(draft.isForForm('form-456')).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const draft = Draft.create('invoice', { test: 1 }, 'form-1');

      // TypeScript should prevent this, but we can test runtime behavior
      expect(() => {
        (draft as any).type = 'patient';
      }).toThrow();

      expect(() => {
        (draft as any).timestamp = 999;
      }).toThrow();
    });
  });
});
