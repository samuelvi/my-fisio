import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDraft } from '../../presentation/hooks/useDraft';
import { draftService } from '../../application/draft/DraftService';

vi.mock('../../application/draft/DraftService', () => ({
  draftService: {
    hasDraft: vi.fn(),
    getDraftAge: vi.fn(),
    getDraft: vi.fn(),
    saveDraft: vi.fn(),
    restoreDraft: vi.fn(),
    discardDraft: vi.fn(),
    clearDraft: vi.fn(),
  },
}));

describe('useDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(draftService.hasDraft).mockReturnValue(false);
    vi.mocked(draftService.getDraftAge).mockReturnValue(null);
    vi.mocked(draftService.getDraft).mockReturnValue(null);
  });

  it('loads empty draft state by default', () => {
    const { result } = renderHook(() => useDraft({ type: 'invoice', formId: 'invoice-new' }));

    expect(result.current.hasDraft).toBe(false);
    expect(result.current.draftAge).toBeNull();
  });

  it('saves draft explicitly', () => {
    const { result } = renderHook(() => useDraft({ type: 'invoice', formId: 'invoice-new' }));

    act(() => {
      result.current.saveDraft({ total: 100 });
    });

    expect(draftService.saveDraft).toHaveBeenCalledWith('invoice', { total: 100 }, 'invoice-new', false);
  });

  it('restores draft and invokes callback', async () => {
    const onRestore = vi.fn();
    vi.mocked(draftService.restoreDraft).mockResolvedValueOnce({ total: 250 });

    const { result } = renderHook(() =>
      useDraft({
        type: 'invoice',
        formId: 'invoice-new',
        onRestore,
      }),
    );

    await act(async () => {
      await result.current.restoreDraft();
    });

    expect(onRestore).toHaveBeenCalledWith({ total: 250 });
  });

  it('saves draft on network errors only', () => {
    const { result } = renderHook(() => useDraft({ type: 'invoice', formId: 'invoice-new' }));

    act(() => {
      result.current.saveOnNetworkError({ response: null, code: 'ERR_NETWORK' }, { total: 100 });
    });

    expect(draftService.saveDraft).toHaveBeenCalledWith('invoice', { total: 100 }, 'invoice-new', true);

    vi.clearAllMocks();

    act(() => {
      result.current.saveOnNetworkError({ response: { status: 422 }, code: 'ERR_BAD_RESPONSE' }, { total: 100 });
    });

    expect(draftService.saveDraft).not.toHaveBeenCalled();
  });
});
