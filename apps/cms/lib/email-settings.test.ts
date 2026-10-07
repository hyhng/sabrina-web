import { describe, expect, it } from 'vitest';

import { adminBase, emailSettings, resetEmailHtml } from './email-settings.ts';

describe('emailSettings', () => {
  it('is nothing without both a key and a sender, so Payload keeps logging e-mails', () => {
    expect(emailSettings({})).toBeUndefined();
    expect(emailSettings({ RESEND_API_KEY: 're_x' })).toBeUndefined();
    expect(emailSettings({ EMAIL_FROM: 'admin@example.com' })).toBeUndefined();
    expect(emailSettings({ RESEND_API_KEY: ' ', EMAIL_FROM: 'admin@example.com' })).toBeUndefined();
  });

  it('takes a bare address', () => {
    expect(emailSettings({ RESEND_API_KEY: 're_x', EMAIL_FROM: 'admin@example.com' })).toEqual({
      apiKey: 're_x',
      from: 'admin@example.com',
      fromName: 'Sabrina Kulhankova',
    });
  });

  it('splits "Name <address>" into the two parts the adapter wants', () => {
    expect(
      emailSettings({ RESEND_API_KEY: 're_x', EMAIL_FROM: 'Web admin <admin@example.com>' }),
    ).toEqual({ apiKey: 're_x', from: 'admin@example.com', fromName: 'Web admin' });
  });

  it('refuses a sender that is not an address rather than failing on the first reset', () => {
    expect(emailSettings({ RESEND_API_KEY: 're_x', EMAIL_FROM: 'not an address' })).toBeUndefined();
  });
});

describe('adminBase', () => {
  it('is the public address of the admin, without a trailing slash', () => {
    expect(adminBase({ PAYLOAD_PUBLIC_URL: 'https://admin.example.com/' })).toBe(
      'https://admin.example.com',
    );
  });

  it('is localhost for development, and ignores anything that is not a web address', () => {
    expect(adminBase({})).toBe('http://localhost:3001');
    expect(adminBase({ PAYLOAD_PUBLIC_URL: 'javascript:alert(1)' })).toBe('http://localhost:3001');
  });
});

describe('resetEmailHtml', () => {
  const html = resetEmailHtml('https://admin.example.com', 'abc123');

  it('links to the reset screen of the admin with the token', () => {
    expect(html).toContain('href="https://admin.example.com/admin/reset/abc123"');
  });

  it('is in Czech and says what to do if it was not asked for', () => {
    expect(html).toContain('obnovení hesla');
    expect(html).toContain('nic nedělej');
  });

  it('does not let a token break out of the link', () => {
    expect(resetEmailHtml('https://a.b', '"><script>')).not.toContain('<script>');
  });
});
