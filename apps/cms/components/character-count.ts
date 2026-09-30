/**
 * The wording of the character counter under the biography (docs/SPEC.md 8.4).
 *
 * Payload's `maxLength` only validates on save — the compiled Textarea field in
 * 3.90 renders no counter — so the count is ours to draw. Kept apart from the
 * component because the interesting part is the three states, and those are
 * worth testing without a form around them.
 *
 * `recommended` is the length the page was drawn for; `max` is where the
 * section would have to scroll, which docs/SPEC.md 5 forbids. Between them the
 * counter warns and still lets her save — she is the one looking at the page.
 */

export type CountTone = 'ok' | 'warn' | 'over';

export type Count = {
  length: number;
  tone: CountTone;
  message: string;
};

export type CountLimits = {
  recommended: number;
  max: number;
};

export function characterCount(value: unknown, { recommended, max }: CountLimits): Count {
  // Anything but a string is an empty field: Payload hands back undefined
  // before the first keystroke.
  const length = typeof value === 'string' ? value.length : 0;

  if (length > max) {
    return {
      length,
      tone: 'over',
      message: `${String(length)} / ${String(max)} znaků — o ${String(length - max)} přes maximum, takhle se to neuloží.`,
    };
  }

  if (length > recommended) {
    return {
      length,
      tone: 'warn',
      message: `${String(length)} / ${String(max)} znaků — nad doporučených ${String(recommended)}, sekce Information bude delší.`,
    };
  }

  return { length, tone: 'ok', message: `${String(length)} / ${String(max)} znaků` };
}
