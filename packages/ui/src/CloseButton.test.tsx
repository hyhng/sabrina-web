import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { CloseButton } from './CloseButton.tsx';
import { FullscreenPhoto } from './FullscreenPhoto.tsx';

const cross = (html: string) => /<svg[^>]*>.*?<\/svg>/.exec(html)?.[0] ?? '';

describe('CloseButton', () => {
  const html = renderToStaticMarkup(<CloseButton onClick={vi.fn()} />);

  it('is a drawn cross in the text colour, not a glyph that differs by font', () => {
    expect(cross(html)).toContain('stroke="currentColor"');
    expect(cross(html)).toContain('M1.5 1.5L14.5 14.5M14.5 1.5L1.5 14.5');
    expect(html).not.toContain('✕');
    expect(html).toContain('text-ink');
  });

  it('is announced as Close unless told otherwise', () => {
    expect(html).toContain('aria-label="Close"');
    expect(
      renderToStaticMarkup(<CloseButton onClick={vi.fn()} label="Close full screen" />),
    ).toContain('aria-label="Close full screen"');
  });

  it('is the same cross over a full-screen photo, with no circle behind it', () => {
    const photo = {
      id: 'p',
      width: 3,
      height: 4,
      aspectRatio: 0.75,
      widths: [400],
      dominantColor: '#000000',
      originalFilename: 'p.jpg',
      bytesOriginal: 1,
      bytesWebp: 1,
    };
    const full = renderToStaticMarkup(
      <FullscreenPhoto
        photo={photo}
        imgBase="/seed"
        alt=""
        canGoBack={false}
        canGoForward={false}
        onBack={vi.fn()}
        onForward={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(cross(full)).toBe(cross(html));
    expect(/<button[^>]*aria-label="Close full screen"[^>]*>/.exec(full)?.[0]).not.toContain(
      'rounded-full',
    );
  });
});
