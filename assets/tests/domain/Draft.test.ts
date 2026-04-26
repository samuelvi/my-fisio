import { describe, expect, it } from 'vitest';
import { Draft } from '../../domain/Draft';

describe('Draft domain value object', () => {
  it('creates draft from static factory', () => {
    const draft = Draft.create('patient', { id: 1 }, 'patient-form');

    expect(draft.type).toBe('patient');
    expect(draft.formId).toBe('patient-form');
    expect(draft.savedByError).toBe(false);
  });

  it('creates draft from plain data', () => {
    const timestamp = Date.now();
    const draft = Draft.fromData({
      type: 'invoice',
      data: { amount: 10 },
      timestamp,
      formId: 'invoice-form',
      savedByError: true,
    });

    expect(draft.timestamp).toBe(timestamp);
    expect(draft.savedByError).toBe(true);
  });

  it('serializes including savedByError field', () => {
    const draft = new Draft('customer', { id: 3 }, 1700000, 'customer-form', true);

    expect(draft.toData()).toEqual({
      type: 'customer',
      data: { id: 3 },
      timestamp: 1700000,
      formId: 'customer-form',
      savedByError: true,
    });
  });

  it('checks form ownership', () => {
    const draft = new Draft('record', { id: 4 }, Date.now(), 'record-form');

    expect(draft.isForForm('record-form')).toBe(true);
    expect(draft.isForForm('other-form')).toBe(false);
  });
});
