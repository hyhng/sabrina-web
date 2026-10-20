/**
 * A `tel:` link for a phone number written the way a person writes one —
 * "+420 777 123 456", "777 123 456", "(+420) 777-123-456". Only the digits and a
 * leading plus are kept, which is what a phone dials; the number on the page
 * stays exactly as she typed it.
 */
export function telHref(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  return `tel:${/^\(?\+/.test(trimmed) ? '+' : ''}${digits}`;
}
