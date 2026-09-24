// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { lockScroll, trapFocus } from './overlay-chrome.ts';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.removeAttribute('style');
});

describe('lockScroll', () => {
  it('pins the body and puts it back afterwards', () => {
    const unlock = lockScroll();
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.width).toBe('100%');

    unlock();
    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.width).toBe('');
  });

  it('offsets the body by the scroll position, so the page does not jump', () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(640);
    const unlock = lockScroll();
    // position: fixed would otherwise show the top of the page.
    expect(document.body.style.top).toBe('-640px');
    unlock();
    vi.restoreAllMocks();
  });

  it('leaves styles the page already had alone', () => {
    document.body.style.paddingRight = '8px';
    const unlock = lockScroll();
    unlock();
    expect(document.body.style.paddingRight).toBe('8px');
  });
});

describe('trapFocus', () => {
  function overlay() {
    document.body.innerHTML = `
      <a id="opener" href="/work/fog/">tile</a>
      <div id="dialog" tabindex="-1">
        <button id="close">x</button>
        <button id="next">next</button>
      </div>`;
    return document.querySelector<HTMLElement>('#dialog') as HTMLElement;
  }

  it('moves focus to the dialog itself, not its first control', () => {
    // Focusing the ✕ would ring it the moment the overlay opens.
    overlay();
    const release = trapFocus(document.querySelector('#dialog') as HTMLElement);
    expect(document.activeElement?.id).toBe('dialog');
    release();
  });

  it('hands focus back to whatever opened it', () => {
    overlay();
    const opener = document.querySelector<HTMLElement>('#opener');
    opener?.focus();
    expect(document.activeElement?.id).toBe('opener');

    const release = trapFocus(document.querySelector('#dialog') as HTMLElement);
    expect(document.activeElement?.id).toBe('dialog');

    release();
    // A keyboard visitor carries on from the tile, not the top of the page.
    expect(document.activeElement?.id).toBe('opener');
  });

  it('wraps Tab round rather than letting it escape to the page behind', () => {
    const dialog = overlay();
    const release = trapFocus(dialog);
    const last = document.querySelector<HTMLElement>('#next');
    last?.focus();

    const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    dialog.dispatchEvent(forward);
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('close');

    const backward = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    dialog.dispatchEvent(backward);
    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('next');
    release();
  });

  it('ignores keys that are not Tab', () => {
    const dialog = overlay();
    const release = trapFocus(dialog);
    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    dialog.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    release();
  });
});
