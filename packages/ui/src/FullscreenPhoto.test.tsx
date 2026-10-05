import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { FullscreenPhoto } from './FullscreenPhoto.tsx';

const photo = {
  id: 'p',
  width: 1500,
  height: 2000,
  aspectRatio: 0.75,
  widths: [400, 800, 1600],
  dominantColor: '#372f2b',
  originalFilename: 'p.jpg',
  bytesOriginal: 1,
  bytesWebp: 1,
};

const render = (canGoBack: boolean, canGoForward: boolean) =>
  renderToStaticMarkup(
    <FullscreenPhoto
      photo={photo}
      imgBase="/seed"
      alt="T — photo 1"
      canGoBack={canGoBack}
      canGoForward={canGoForward}
      onBack={vi.fn()}
      onForward={vi.fn()}
      onClose={vi.fn()}
    />,
  );

describe('FullscreenPhoto', () => {
  it('covers the whole window on paper, above the detail', () => {
    expect(render(true, true)).toContain(
      'fixed inset-0 z-[60] flex items-center justify-center bg-paper',
    );
  });

  it('fits the whole photo from its ratio, clear of the arrows at the sides', () => {
    expect(render(true, true)).toContain(
      'width:min(calc(100vw - 192px), calc((100dvh - 80px) * 0.75));aspect-ratio:0.75',
    );
  });

  it('asks for a variant to suit the whole window', () => {
    expect(render(true, true)).toContain('sizes="100vw"');
  });

  it('has a close button and arrows only where there is somewhere to go', () => {
    expect(render(false, true)).toContain('aria-label="Close full screen"');
    expect(render(false, true)).not.toContain('Previous photo');
    expect(render(false, true)).toContain('Next photo');
    expect(render(true, false)).toContain('Previous photo');
    expect(render(true, false)).not.toContain('Next photo');
  });

  it('carries no title or meta, only the picture', () => {
    const html = render(true, true);
    expect(html).not.toContain('<h1');
    expect(html).not.toContain('Credits');
  });
});
