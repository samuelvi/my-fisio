import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormDraft } from '../../presentation/hooks/useFormDraft';
import { useDraft } from '../../presentation/hooks/useDraft';

vi.mock('../../presentation/hooks/useDraft', () => ({
  useDraft: vi.fn()
}));

describe('useFormDraft', () => {
  it('closes discard modal even if discard operation fails', async () => {
    const discardDraft = vi.fn().mockRejectedValue(new Error('discard failed'));

    vi.mocked(useDraft).mockReturnValue({
      hasDraft: true,
      draftAge: 'now',
      draftSavedByError: true,
      saveDraft: vi.fn(),
      clearDraft: vi.fn(),
      saveOnNetworkError: vi.fn(),
      restoreDraft: vi.fn(),
      discardDraft
    });

    const { result } = renderHook(() =>
      useFormDraft({
        type: 'appointment',
        formId: 'appointment-new',
        onRestore: vi.fn()
      })
    );

    act(() => {
      result.current.openDiscardModal();
    });

    expect(result.current.showDiscardModal).toBe(true);

    await act(async () => {
      await expect(result.current.handleDiscardDraft()).rejects.toThrow('discard failed');
    });

    expect(result.current.showDiscardModal).toBe(false);
  });
});
