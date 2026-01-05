/**
 * Unit Tests - useDraft Hook
 *
 * Tests for the React hook that manages draft functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDraft } from '../../presentation/hooks/useDraft';
import { draftService } from '../../application/draft/DraftService';
import { DRAFT_EVENTS } from '../../application/draft/types';

// Mock DraftService
vi.mock('../../application/draft/DraftService', () => ({
  draftService: {
    hasDraft: vi.fn(),
    getDraftAge: vi.fn(),
    saveDraft: vi.fn(),
    restoreDraft: vi.fn(),
    discardDraft: vi.fn(),
    clearDraft: vi.fn(),
    startAutoSave: vi.fn(),
    stopAutoSave: vi.fn()
  }
}));

describe('useDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock window.dispatchEvent
    global.window.dispatchEvent = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with no draft', () => {
    (draftService.hasDraft as any).mockReturnValue(false);
    (draftService.getDraftAge as any).mockReturnValue(null);

    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form'
      })
    );

    expect(result.current.hasDraft).toBe(false);
    expect(result.current.draftAge).toBeNull();
  });

  it('should detect existing draft', () => {
    (draftService.hasDraft as any).mockReturnValue(true);
    (draftService.getDraftAge as any).mockReturnValue('hace 5 minutos');

    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form'
      })
    );

    expect(result.current.hasDraft).toBe(true);
    expect(result.current.draftAge).toBe('hace 5 minutos');
  });

  it('should save draft immediately', () => {
    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form'
      })
    );

    const data = { test: 'data' };

    act(() => {
      result.current.saveDraft(data);
    });

    expect(draftService.saveDraft).toHaveBeenCalledWith('invoice', data, 'test-form');
  });

  it('should restore draft and call onRestore callback', async () => {
    const restoredData = { test: 'restored' };
    (draftService.restoreDraft as any).mockResolvedValue(restoredData);

    const onRestore = vi.fn();

    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form',
        onRestore
      })
    );

    await act(async () => {
      const data = await result.current.restoreDraft();
      expect(data).toEqual(restoredData);
    });

    expect(draftService.restoreDraft).toHaveBeenCalledWith('invoice');
    expect(onRestore).toHaveBeenCalledWith(restoredData);
  });

  it('should discard draft and call onDiscard callback', async () => {
    const onDiscard = vi.fn();

    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form',
        onDiscard
      })
    );

    await act(async () => {
      await result.current.discardDraft();
    });

    expect(draftService.discardDraft).toHaveBeenCalledWith('invoice');
    expect(onDiscard).toHaveBeenCalled();
  });

  it('should clear draft', () => {
    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form'
      })
    );

    act(() => {
      result.current.clearDraft();
    });

    expect(draftService.clearDraft).toHaveBeenCalledWith('invoice');
  });

  it('should start auto-save with getData function', () => {
    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form',
        autoSaveInterval: 5000
      })
    );

    const getData = vi.fn(() => ({ test: 'data' }));

    act(() => {
      result.current.startAutoSave(getData);
    });

    expect(draftService.startAutoSave).toHaveBeenCalledWith(
      'invoice',
      getData,
      'test-form',
      {
        autoSaveInterval: 5000,
        enabled: true
      }
    );
  });

  it('should stop auto-save', () => {
    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form'
      })
    );

    act(() => {
      result.current.stopAutoSave();
    });

    expect(draftService.stopAutoSave).toHaveBeenCalledWith('invoice');
  });

  it('should save on network error', () => {
    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form'
      })
    );

    const error = { response: null, message: 'Network Error' };
    const data = { test: 'data' };

    act(() => {
      result.current.saveOnNetworkError(error, data);
    });

    expect(draftService.saveDraft).toHaveBeenCalledWith('invoice', data, 'test-form');
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  it('should detect network error by missing response', () => {
    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form'
      })
    );

    const error = { response: null };
    const data = { test: 'data' };

    act(() => {
      result.current.saveOnNetworkError(error, data);
    });

    expect(draftService.saveDraft).toHaveBeenCalled();
  });

  it('should detect network error by ERR_NETWORK code', () => {
    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form'
      })
    );

    const error = { response: null, code: 'ERR_NETWORK' };
    const data = { test: 'data' };

    act(() => {
      result.current.saveOnNetworkError(error, data);
    });

    expect(draftService.saveDraft).toHaveBeenCalled();
  });

  it('should NOT save on server error (non-network)', () => {
    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form'
      })
    );

    const error = { response: { status: 500 }, code: 'ERR_BAD_RESPONSE' };
    const data = { test: 'data' };

    act(() => {
      result.current.saveOnNetworkError(error, data);
    });

    expect(draftService.saveDraft).not.toHaveBeenCalled();
  });

  it('should stop auto-save on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form'
      })
    );

    const getData = vi.fn();

    act(() => {
      result.current.startAutoSave(getData);
    });

    unmount();

    expect(draftService.stopAutoSave).toHaveBeenCalled();
  });

  it('should not start auto-save if disabled', () => {
    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form',
        enabled: false
      })
    );

    const getData = vi.fn();

    act(() => {
      result.current.startAutoSave(getData);
    });

    expect(draftService.startAutoSave).not.toHaveBeenCalled();
  });

  it('should listen to draft saved events', async () => {
    (draftService.hasDraft as any).mockReturnValue(false);
    const { result, rerender } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form'
      })
    );

    expect(result.current.hasDraft).toBe(false);

    // Simulate draft saved
    (draftService.hasDraft as any).mockReturnValue(true);
    (draftService.getDraftAge as any).mockReturnValue('hace unos segundos');

    // Dispatch event
    act(() => {
      window.dispatchEvent(
        new CustomEvent('draft:saved', {
          detail: { type: 'invoice' }
        })
      );
    });

    // Force recheck
    await waitFor(() => {
      expect(result.current.hasDraft).toBe(true);
    });
  });

  it('should update draft age every minute', async () => {
    (draftService.hasDraft as any).mockReturnValue(true);
    (draftService.getDraftAge as any).mockReturnValueOnce('hace 1 minuto');

    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'test-form'
      })
    );

    expect(result.current.draftAge).toBe('hace 1 minuto');

    // Change the return value for next call
    (draftService.getDraftAge as any).mockReturnValueOnce('hace 2 minutos');

    // Advance time by 60 seconds
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    await waitFor(() => {
      expect(result.current.draftAge).toBe('hace 2 minutos');
    });
  });
});
