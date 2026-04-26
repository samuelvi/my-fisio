import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DraftService } from '../../application/draft/DraftService';
import { DRAFT_EVENTS, DraftRepository } from '../../application/draft/types';

function buildRepositoryMock(): DraftRepository {
  return {
    save: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    exists: vi.fn(),
    getTimestamp: vi.fn(),
  };
}

describe('DraftService', () => {
  let repository: DraftRepository;
  let service: DraftService;

  beforeEach(() => {
    repository = buildRepositoryMock();
    service = new DraftService(repository);
  });

  it('saves draft payload', () => {
    service.saveDraft('invoice', { id: 1 }, 'form-1');

    expect(repository.save).toHaveBeenCalledWith('invoice', { id: 1 }, 'form-1', false);
  });

  it('returns null when draft does not exist', () => {
    vi.mocked(repository.get).mockReturnValueOnce(null);

    expect(service.getDraft('invoice')).toBeNull();
  });

  it('restores draft data when draft exists', async () => {
    vi.mocked(repository.get).mockReturnValueOnce({
      type: 'invoice',
      data: { id: 99 },
      timestamp: Date.now(),
      formId: 'form-99',
    });

    const result = await service.restoreDraft<{ id: number }>('invoice');

    expect(result).toEqual({ id: 99 });
  });

  it('clears draft and dispatches save success event', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    service.clearDraft('patient');

    expect(repository.remove).toHaveBeenCalledWith('patient');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: DRAFT_EVENTS.SAVE_SUCCESS }),
    );
  });

  it('saves draft on network error event', () => {
    window.dispatchEvent(
      new CustomEvent(DRAFT_EVENTS.NETWORK_ERROR, {
        detail: {
          type: 'patient',
          data: { firstName: 'John' },
          formId: 'patient-form',
        },
      }),
    );

    expect(repository.save).toHaveBeenCalledWith(
      'patient',
      { firstName: 'John' },
      'patient-form',
      true,
    );
  });
});
