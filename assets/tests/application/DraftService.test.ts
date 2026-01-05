/**
 * Unit Tests - DraftService
 *
 * Tests for draft business logic and auto-save functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DraftService } from '../../application/draft/DraftService';
import { DraftRepository, DRAFT_EVENTS } from '../../application/draft/types';
import { Draft, DraftData } from '../../domain/Draft';

describe('DraftService', () => {
  let service: DraftService;
  let mockRepository: DraftRepository;
  let mockEventListeners: { [key: string]: EventListener[] };

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock repository
    mockRepository = {
      save: vi.fn(),
      get: vi.fn(),
      remove: vi.fn(),
      exists: vi.fn(),
      getTimestamp: vi.fn()
    };

    // Mock window.addEventListener and dispatchEvent
    mockEventListeners = {};

    global.window = {
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        if (!mockEventListeners[event]) {
          mockEventListeners[event] = [];
        }
        mockEventListeners[event].push(listener);
      }),
      dispatchEvent: vi.fn((event: Event) => {
        const listeners = mockEventListeners[event.type] || [];
        listeners.forEach(listener => listener(event));
        return true;
      })
    } as any;

    service = new DraftService(mockRepository);
  });

  afterEach(() => {
    vi.useRealTimers();
    service.cleanup();
  });

  describe('startAutoSave', () => {
    it('should start auto-save timer', () => {
      const getData = vi.fn(() => ({ test: 'data' }));

      service.startAutoSave('invoice', getData, 'form-1');

      expect(getData).not.toHaveBeenCalled(); // Not called immediately

      // Advance time by 10 seconds
      vi.advanceTimersByTime(10000);

      expect(getData).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(
        'invoice',
        { test: 'data' },
        'form-1'
      );
    });

    it('should save multiple times with interval', () => {
      const getData = vi.fn(() => ({ test: 'data' }));

      service.startAutoSave('invoice', getData, 'form-1');

      // First save after 10s
      vi.advanceTimersByTime(10000);
      expect(getData).toHaveBeenCalledTimes(1);

      // Second save after another 10s
      vi.advanceTimersByTime(10000);
      expect(getData).toHaveBeenCalledTimes(2);

      // Third save after another 10s
      vi.advanceTimersByTime(10000);
      expect(getData).toHaveBeenCalledTimes(3);
    });

    it('should use custom auto-save interval', () => {
      const getData = vi.fn(() => ({ test: 'data' }));

      service.startAutoSave('invoice', getData, 'form-1', {
        autoSaveInterval: 5000 // 5 seconds
      });

      vi.advanceTimersByTime(5000);
      expect(getData).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(5000);
      expect(getData).toHaveBeenCalledTimes(2);
    });

    it('should not save if data is null', () => {
      const getData = vi.fn(() => null);

      service.startAutoSave('invoice', getData, 'form-1');

      vi.advanceTimersByTime(10000);

      expect(getData).toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should not start if disabled', () => {
      const getData = vi.fn(() => ({ test: 'data' }));

      service.startAutoSave('invoice', getData, 'form-1', {
        enabled: false
      });

      vi.advanceTimersByTime(10000);

      expect(getData).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should clear existing timer before starting new one', () => {
      const getData1 = vi.fn(() => ({ test: 'data1' }));
      const getData2 = vi.fn(() => ({ test: 'data2' }));

      service.startAutoSave('invoice', getData1, 'form-1');
      service.startAutoSave('invoice', getData2, 'form-1');

      vi.advanceTimersByTime(10000);

      // Only getData2 should be called (getData1 was cleared)
      expect(getData1).not.toHaveBeenCalled();
      expect(getData2).toHaveBeenCalled();
    });
  });

  describe('stopAutoSave', () => {
    it('should stop auto-save timer', () => {
      const getData = vi.fn(() => ({ test: 'data' }));

      service.startAutoSave('invoice', getData, 'form-1');
      service.stopAutoSave('invoice');

      vi.advanceTimersByTime(10000);

      expect(getData).not.toHaveBeenCalled();
    });

    it('should not error if no timer exists', () => {
      expect(() => {
        service.stopAutoSave('invoice');
      }).not.toThrow();
    });
  });

  describe('saveDraft', () => {
    it('should save draft immediately', () => {
      const data = { test: 'data' };

      service.saveDraft('invoice', data, 'form-1');

      expect(mockRepository.save).toHaveBeenCalledWith('invoice', data, 'form-1');
    });
  });

  describe('getDraft', () => {
    it('should return draft if exists', () => {
      const draftData: DraftData<{ test: string }> = {
        type: 'invoice',
        data: { test: 'value' },
        timestamp: Date.now(),
        formId: 'form-1'
      };

      (mockRepository.get as any).mockReturnValue(draftData);

      const draft = service.getDraft<{ test: string }>('invoice');

      expect(draft).toBeInstanceOf(Draft);
      expect(draft?.data).toEqual({ test: 'value' });
    });

    it('should return null if draft does not exist', () => {
      (mockRepository.get as any).mockReturnValue(null);

      const draft = service.getDraft('invoice');

      expect(draft).toBeNull();
    });
  });

  describe('hasDraft', () => {
    it('should return true if draft exists', () => {
      (mockRepository.exists as any).mockReturnValue(true);

      expect(service.hasDraft('invoice')).toBe(true);
    });

    it('should return false if draft does not exist', () => {
      (mockRepository.exists as any).mockReturnValue(false);

      expect(service.hasDraft('invoice')).toBe(false);
    });
  });

  describe('clearDraft', () => {
    it('should stop auto-save and remove draft', () => {
      const getData = vi.fn(() => ({ test: 'data' }));
      service.startAutoSave('invoice', getData, 'form-1');

      service.clearDraft('invoice');

      expect(mockRepository.remove).toHaveBeenCalledWith('invoice');

      // Auto-save should be stopped
      vi.advanceTimersByTime(10000);
      expect(getData).not.toHaveBeenCalled();
    });

    it('should dispatch SAVE_SUCCESS event', () => {
      service.clearDraft('invoice');

      expect(window.dispatchEvent).toHaveBeenCalled();
      const event = (window.dispatchEvent as any).mock.calls[0][0];
      expect(event.type).toBe(DRAFT_EVENTS.SAVE_SUCCESS);
      expect(event.detail.type).toBe('invoice');
    });
  });

  describe('restoreDraft', () => {
    it('should restore draft and dispatch event', async () => {
      const draftData: DraftData<{ test: string }> = {
        type: 'invoice',
        data: { test: 'value' },
        timestamp: 123456,
        formId: 'form-1'
      };

      (mockRepository.get as any).mockReturnValue(draftData);

      const data = await service.restoreDraft<{ test: string }>('invoice');

      expect(data).toEqual({ test: 'value' });
      expect(window.dispatchEvent).toHaveBeenCalled();

      const event = (window.dispatchEvent as any).mock.calls[0][0];
      expect(event.type).toBe(DRAFT_EVENTS.DRAFT_RESTORED);
      expect(event.detail.type).toBe('invoice');
      expect(event.detail.timestamp).toBe(123456);
    });

    it('should return null if no draft exists', async () => {
      (mockRepository.get as any).mockReturnValue(null);

      const data = await service.restoreDraft('invoice');

      expect(data).toBeNull();
    });
  });

  describe('discardDraft', () => {
    it('should stop auto-save and remove draft', async () => {
      const getData = vi.fn(() => ({ test: 'data' }));
      service.startAutoSave('invoice', getData, 'form-1');

      await service.discardDraft('invoice');

      expect(mockRepository.remove).toHaveBeenCalledWith('invoice');

      // Auto-save should be stopped
      vi.advanceTimersByTime(10000);
      expect(getData).not.toHaveBeenCalled();
    });

    it('should dispatch DRAFT_DISCARDED event', async () => {
      await service.discardDraft('invoice');

      expect(window.dispatchEvent).toHaveBeenCalled();
      const event = (window.dispatchEvent as any).mock.calls[0][0];
      expect(event.type).toBe(DRAFT_EVENTS.DRAFT_DISCARDED);
      expect(event.detail.type).toBe('invoice');
    });
  });

  describe('getDraftAge', () => {
    it('should return formatted age if draft exists', () => {
      const now = Date.now();
      const timestamp = now - (5 * 60 * 1000); // 5 minutes ago

      const draftData: DraftData = {
        type: 'invoice',
        data: {},
        timestamp,
        formId: 'form-1'
      };

      (mockRepository.get as any).mockReturnValue(draftData);

      vi.setSystemTime(now);

      const age = service.getDraftAge('invoice');

      expect(age).toBe('hace 5 minutos');
    });

    it('should return null if no draft exists', () => {
      (mockRepository.get as any).mockReturnValue(null);

      const age = service.getDraftAge('invoice');

      expect(age).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should clear all auto-save timers', () => {
      const getData1 = vi.fn(() => ({ test: 'data1' }));
      const getData2 = vi.fn(() => ({ test: 'data2' }));
      const getData3 = vi.fn(() => ({ test: 'data3' }));

      service.startAutoSave('invoice', getData1, 'form-1');
      service.startAutoSave('patient', getData2, 'form-2');
      service.startAutoSave('customer', getData3, 'form-3');

      service.cleanup();

      vi.advanceTimersByTime(10000);

      expect(getData1).not.toHaveBeenCalled();
      expect(getData2).not.toHaveBeenCalled();
      expect(getData3).not.toHaveBeenCalled();
    });
  });

  describe('network error listener', () => {
    it('should save draft when NETWORK_ERROR event is dispatched', () => {
      const eventData = {
        type: 'invoice',
        data: { test: 'error-data' },
        formId: 'form-error'
      };

      window.dispatchEvent(
        new CustomEvent(DRAFT_EVENTS.NETWORK_ERROR, {
          detail: eventData
        })
      );

      expect(mockRepository.save).toHaveBeenCalledWith(
        'invoice',
        { test: 'error-data' },
        'form-error'
      );
    });

    it('should not save if event data is incomplete', () => {
      window.dispatchEvent(
        new CustomEvent(DRAFT_EVENTS.NETWORK_ERROR, {
          detail: { type: 'invoice' } // missing data and formId
        })
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
