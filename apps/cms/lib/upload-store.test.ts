import { describe, expect, it, vi } from 'vitest';

import type { Converted } from './browser-image.ts';
import type { ConvertResponse } from './upload-protocol.ts';
import { createUploadStore, type Deps } from './upload-store.ts';

const converted = (width = 1360): Converted => ({
  width,
  height: 2040,
  aspectRatio: width / 2040,
  dominantColor: '#808080',
  widths: [400, 800, 1200],
  variants: new Map(),
  bytesWebp: 698_000,
});

const jpeg = (name: string) => new File([new Uint8Array(1000)], name, { type: 'image/jpeg' });
const heic = (name: string) => new File([new Uint8Array(10)], name, { type: 'image/heic' });

/** A promise whose ending the test decides, so a photo can be held "in flight". */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Convert and upload stay open until the test says so. `finish(name)` lets one
 * photo through both stages and gives it the next photo id.
 */
function setup(overrides: Partial<Deps> = {}) {
  const converting = new Map<string, ReturnType<typeof deferred<ConvertResponse>>>();
  const uploading = new Map<string, ReturnType<typeof deferred<string>>>();
  let nextId = 100;

  const deps: Deps = {
    convert: vi.fn((id: string) => {
      const d = deferred<ConvertResponse>();
      converting.set(id, d);
      return d.promise;
    }),
    upload: vi.fn((file: File) => {
      const d = deferred<string>();
      uploading.set(file.name, d);
      return d.promise;
    }),
    previewUrl: (file) => `blob:${file.name}`,
    ...overrides,
  };
  const store = createUploadStore(deps);

  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  return {
    store,
    deps,
    /** Lets the photo called `name` through conversion and upload. */
    async finish(name: string) {
      const item = store.getSnapshot().items.find((entry) => entry.filename === name);
      if (item === undefined) throw new Error(`no such item: ${name}`);
      converting.get(item.id)?.resolve({ id: item.id, ok: true, converted: converted() });
      await tick();
      const photoId = String(nextId);
      nextId += 1;
      uploading.get(name)?.resolve(photoId);
      await tick();
      return photoId;
    },
    async fail(name: string, message: string) {
      const item = store.getSnapshot().items.find((entry) => entry.filename === name);
      if (item === undefined) throw new Error(`no such item: ${name}`);
      converting.get(item.id)?.resolve({ id: item.id, ok: false, message });
      await tick();
    },
    stages: () =>
      Object.fromEntries(store.getSnapshot().items.map((item) => [item.filename, item.stage])),
    tick,
  };
}

describe('starting', () => {
  it('queues what is dropped and starts three at once, no more', () => {
    // docs/TECH.md 5.
    const { store, stages } = setup();
    store.add(
      '7',
      ['a', 'b', 'c', 'd', 'e'].map((n) => jpeg(`${n}.jpg`)),
    );
    expect(Object.values(stages()).filter((stage) => stage === 'converting')).toHaveLength(3);
    expect(Object.values(stages()).filter((stage) => stage === 'queued')).toHaveLength(2);
  });

  it('counts the limit across projects, because the CPU is shared', () => {
    const { store, stages } = setup();
    store.add('7', [jpeg('a.jpg'), jpeg('b.jpg')]);
    store.add('8', [jpeg('c.jpg'), jpeg('d.jpg')]);
    expect(Object.values(stages()).filter((stage) => stage === 'converting')).toHaveLength(3);
  });

  it('starts the next one when a slot frees up', async () => {
    const { store, finish, stages } = setup();
    store.add(
      '7',
      ['a', 'b', 'c', 'd'].map((n) => jpeg(`${n}.jpg`)),
    );
    expect(stages()['d.jpg']).toBe('queued');
    await finish('a.jpg');
    expect(stages()['d.jpg']).toBe('converting');
  });

  it('keeps ids apart when the same file name is dropped twice, across drops', () => {
    const { store } = setup();
    store.add('7', [jpeg('a.jpg')]);
    store.add('7', [jpeg('a.jpg')]);
    const ids = store.getSnapshot().items.map((item) => item.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('gives a refused file a row with the reason, and never starts it', () => {
    const { store, deps } = setup();
    store.add('7', [heic('phone.heic')]);
    const [item] = store.getSnapshot().items;
    expect(item?.stage).toBe('rejected');
    expect(item?.message).toContain('JPEG');
    expect(item?.previewUrl).toBeUndefined();
    expect(deps.convert).not.toHaveBeenCalled();
  });

  it('ignores an empty drop', () => {
    const { store } = setup();
    store.add('7', []);
    expect(store.getSnapshot().items).toEqual([]);
  });
});

describe('finishing', () => {
  it('moves a photo through converting and uploading to done, with what the server knows', async () => {
    const { store, finish } = setup();
    store.add('7', [jpeg('a.jpg')]);
    const photoId = await finish('a.jpg');
    const [item] = store.getSnapshot().items;
    expect(item).toMatchObject({ stage: 'done', photoId, width: 1360, height: 2040 });
    expect(item?.meta).toMatchObject({ id: photoId, filename: 'a.jpg', widths: [400, 800, 1200] });
  });

  it('keeps the dropped file as the thumbnail, keyed by the photo it became', async () => {
    const { store, finish } = setup();
    store.add('7', [jpeg('a.jpg')]);
    const photoId = await finish('a.jpg');
    expect(store.getSnapshot().previews[photoId]).toBe('blob:a.jpg');
  });

  it('leaves a failed photo on the table with its reason, and carries on with the rest', async () => {
    const { store, fail, finish, stages } = setup();
    store.add('7', [jpeg('a.jpg'), jpeg('b.jpg')]);
    await fail('a.jpg', 'Fotku se nepovedlo převést.');
    expect(stages()['a.jpg']).toBe('failed');
    expect(store.getSnapshot().items[0]?.message).toContain('nepovedlo');
    await finish('b.jpg');
    expect(stages()['b.jpg']).toBe('done');
  });

  it('turns a throwing upload into one failed row, with the reason', async () => {
    const { store, tick } = setup({
      convert: (id) => Promise.resolve({ id, ok: true, converted: converted() }),
      upload: () => Promise.reject(new Error('R2 odmítlo soubor (403).')),
    });
    store.add('7', [jpeg('a.jpg')]);
    await tick();
    await tick();
    expect(store.getSnapshot().items[0]).toMatchObject({
      stage: 'failed',
      message: 'R2 odmítlo soubor (403).',
    });
  });

  it('delivers nothing for a photo that failed to upload', async () => {
    const attach = vi.fn();
    const { store, tick } = setup({
      convert: (id) => Promise.resolve({ id, ok: true, converted: converted() }),
      upload: () => Promise.reject(new Error('x')),
    });
    store.registerAttacher('7', attach);
    store.add('7', [jpeg('a.jpg')]);
    await tick();
    await tick();
    expect(attach).not.toHaveBeenCalled();
  });
});

describe('where a finished photo goes', () => {
  it('hands it to whoever is registered for that project', async () => {
    const { store, finish } = setup();
    const attached: string[] = [];
    store.registerAttacher('7', (id) => attached.push(id));
    store.add('7', [jpeg('a.jpg')]);
    const photoId = await finish('a.jpg');
    expect(attached).toEqual([photoId]);
  });

  it('keeps projects apart', async () => {
    const { store, finish } = setup();
    const seven: string[] = [];
    const eight: string[] = [];
    store.registerAttacher('7', (id) => seven.push(id));
    store.registerAttacher('8', (id) => eight.push(id));
    store.add('8', [jpeg('a.jpg')]);
    const photoId = await finish('a.jpg');
    expect(seven).toEqual([]);
    expect(eight).toEqual([photoId]);
  });

  it('holds a photo that finishes while no grid is on screen, and hands it over on return', async () => {
    // The whole reason this store exists: she switches to Podrobnosti, the grid
    // unmounts, the photo finishes, and then she comes back.
    const { store, finish } = setup();
    const attached: string[] = [];
    const unregister = store.registerAttacher('7', (id) => attached.push(id));
    store.add('7', [jpeg('a.jpg'), jpeg('b.jpg')]);

    unregister();
    const first = await finish('a.jpg');
    const second = await finish('b.jpg');
    expect(attached).toEqual([]);

    store.registerAttacher('7', (id) => attached.push(id));
    expect(attached).toEqual([first, second]);
  });

  it('hands a waiting photo over only once', async () => {
    const { store, finish } = setup();
    store.add('7', [jpeg('a.jpg')]);
    const photoId = await finish('a.jpg');
    const first: string[] = [];
    const second: string[] = [];
    store.registerAttacher('7', (id) => first.push(id))();
    store.registerAttacher('7', (id) => second.push(id));
    expect(first).toEqual([photoId]);
    expect(second).toEqual([]);
  });

  it('does not let an old grid unregister the new one that replaced it', async () => {
    // React can mount the new grid before it unmounts the old one.
    const { store, finish } = setup();
    const attached: string[] = [];
    const unregisterOld = store.registerAttacher('7', () => undefined);
    store.registerAttacher('7', (id) => attached.push(id));
    unregisterOld();
    store.add('7', [jpeg('a.jpg')]);
    const photoId = await finish('a.jpg');
    expect(attached).toEqual([photoId]);
  });
});

describe('dismissing', () => {
  it('takes a failed row away', async () => {
    const { store, fail } = setup();
    store.add('7', [jpeg('a.jpg')]);
    await fail('a.jpg', 'x');
    store.dismiss(store.getSnapshot().items[0]!.id);
    expect(store.getSnapshot().items).toEqual([]);
  });

  it('takes a refused row away', () => {
    const { store } = setup();
    store.add('7', [heic('a.heic')]);
    store.dismiss(store.getSnapshot().items[0]!.id);
    expect(store.getSnapshot().items).toEqual([]);
  });

  it('will not drop one that is still moving or already arrived', async () => {
    const { store, finish } = setup();
    store.add('7', [jpeg('a.jpg'), jpeg('b.jpg')]);
    await finish('a.jpg');
    for (const item of store.getSnapshot().items) store.dismiss(item.id);
    // Neither the finished photo nor the one in flight was a row to dismiss.
    expect(store.getSnapshot().items).toHaveLength(2);
  });
});

describe('forgetting a deleted photo', () => {
  it('drops its row and its preview, and only its', async () => {
    const { store, finish } = setup();
    store.add('7', [jpeg('a.jpg'), jpeg('b.jpg')]);
    const first = await finish('a.jpg');
    const second = await finish('b.jpg');

    store.forget(first);

    expect(store.getSnapshot().items.map((item) => item.photoId)).toEqual([second]);
    expect(store.getSnapshot().previews[first]).toBeUndefined();
    expect(store.getSnapshot().previews[second]).toBe('blob:b.jpg');
  });

  it('keeps the count honest — three dropped, one deleted, two left', async () => {
    // Left in, the deleted one still counted: "3 z 3 hotovo" for a project of two.
    const { store, finish } = setup();
    store.add(
      '7',
      ['a', 'b', 'c'].map((n) => jpeg(`${n}.jpg`)),
    );
    const [a] = await Promise.all([finish('a.jpg'), finish('b.jpg'), finish('c.jpg')]);
    store.forget(a);
    expect(store.getSnapshot().items.filter((item) => item.stage === 'done')).toHaveLength(2);
  });

  it('is harmless for a photo it never heard of', () => {
    const { store } = setup();
    expect(() => {
      store.forget('999');
    }).not.toThrow();
  });
});

describe('knowing when it is busy', () => {
  it('tells the page when uploading starts and when it ends', async () => {
    const onBusyChange = vi.fn();
    const { store, finish } = setup({ onBusyChange });
    expect(onBusyChange).not.toHaveBeenCalled();
    store.add('7', [jpeg('a.jpg')]);
    expect(onBusyChange).toHaveBeenLastCalledWith(true);
    await finish('a.jpg');
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
    expect(onBusyChange).toHaveBeenCalledTimes(2);
  });

  it('stays busy while any photo is still queued, not only while one is running', async () => {
    const onBusyChange = vi.fn();
    const { store, finish } = setup({ onBusyChange });
    store.add(
      '7',
      ['a', 'b', 'c', 'd'].map((n) => jpeg(`${n}.jpg`)),
    );
    await finish('a.jpg');
    expect(store.isBusy()).toBe(true);
    expect(onBusyChange).toHaveBeenCalledTimes(1);
  });

  it('is not busy because of a refused file', () => {
    const { store } = setup();
    store.add('7', [heic('a.heic')]);
    expect(store.isBusy()).toBe(false);
  });
});

describe('subscribing', () => {
  it('tells listeners on every change, and stops when they leave', async () => {
    const { store, finish } = setup();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.add('7', [jpeg('a.jpg')]);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    const calls = listener.mock.calls.length;
    await finish('a.jpg');
    expect(listener.mock.calls.length).toBe(calls);
  });

  it('hands out a new snapshot object per change, which is what useSyncExternalStore needs', () => {
    const { store } = setup();
    const before = store.getSnapshot();
    store.add('7', [jpeg('a.jpg')]);
    expect(store.getSnapshot()).not.toBe(before);
    // ...and the same one when nothing happened in between.
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });
});

describe('settled', () => {
  it('is true for a project with nothing in flight', async () => {
    const { store, finish } = setup();
    expect(store.settled('7')).toBe(true);
    store.add('7', [jpeg('a.jpg')]);
    expect(store.settled('7')).toBe(false);
    await finish('a.jpg');
    expect(store.settled('7')).toBe(true);
  });

  it('is about one project, not all of them', () => {
    const { store } = setup();
    store.add('8', [jpeg('a.jpg')]);
    expect(store.settled('7')).toBe(true);
    expect(store.settled('8')).toBe(false);
  });
});
