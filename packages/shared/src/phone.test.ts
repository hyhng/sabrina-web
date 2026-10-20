import { describe, expect, it } from 'vitest';

import { telHref } from './phone.ts';

describe('telHref', () => {
  it('keeps the digits and the international plus', () => {
    expect(telHref('+420 777 123 456')).toBe('tel:+420777123456');
    expect(telHref('(+420) 777-123-456')).toBe('tel:+420777123456');
  });

  it('dials a number written without a country code as it is', () => {
    expect(telHref(' 777 123 456 ')).toBe('tel:777123456');
  });
});
