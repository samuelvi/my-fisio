import { describe, expect, it } from 'vitest';
import { extractCollection } from '../../../presentation/api/utils/collectionUtils';

describe('extractCollection', () => {
  it('returns array as-is when payload is array', () => {
    const payload = [{ id: 1 }];

    expect(extractCollection<{ id: number }>(payload)).toEqual(payload);
  });

  it('returns hydra member entries when available', () => {
    const payload = { 'hydra:member': [{ id: 2 }] };

    expect(extractCollection<{ id: number }>(payload)).toEqual([{ id: 2 }]);
  });

  it('returns member entries when available', () => {
    const payload = { member: [{ id: 3 }] };

    expect(extractCollection<{ id: number }>(payload)).toEqual([{ id: 3 }]);
  });

  it('returns empty array for unsupported payloads', () => {
    expect(extractCollection<{ id: number }>({})).toEqual([]);
    expect(extractCollection<{ id: number }>(null)).toEqual([]);
  });
});
