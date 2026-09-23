import { describe, expect, it } from 'vitest';

import { overlayFromPath } from './use-route.ts';

describe('overlayFromPath', () => {
  it('reads a project detail, with or without the trailing slash', () => {
    expect(overlayFromPath('/work/fog/')).toEqual({ kind: 'project', slug: 'fog' });
    expect(overlayFromPath('/work/fog')).toEqual({ kind: 'project', slug: 'fog' });
  });

  it('reads Information', () => {
    expect(overlayFromPath('/information/')).toEqual({ kind: 'information' });
    expect(overlayFromPath('/information')).toEqual({ kind: 'information' });
  });

  it('leaves the grid alone on the homepage', () => {
    expect(overlayFromPath('/')).toEqual({ kind: 'none' });
  });

  it('does not mistake a deeper path for a project', () => {
    expect(overlayFromPath('/work/fog/extra/')).toEqual({ kind: 'none' });
    expect(overlayFromPath('/work/')).toEqual({ kind: 'none' });
    expect(overlayFromPath('/work')).toEqual({ kind: 'none' });
  });
});
