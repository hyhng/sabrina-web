import type { Endpoint } from 'payload';

import { deployHook, HOOK_MISSING, HOOK_REFUSED, STARTED } from '../lib/publish.ts';

/**
 * `POST /api/publish` — asks Cloudflare to rebuild the site
 * (docs/SPEC.md 8.7, docs/TECH.md 4.4).
 *
 * The deploy hook is a URL that means "build now"; it carries its own secret, so
 * it must stay on this side and never reach the browser. That is the only reason
 * this endpoint exists — the button could otherwise call Cloudflare directly.
 *
 * The time is recorded even though the build may still fail afterwards: what it
 * means is "the last time publishing was asked for", which is the honest thing
 * to show her and the only thing this side can know.
 */
export const publishEndpoint: Endpoint = {
  path: '/publish',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ message: 'Nejsi přihlášená.' }, { status: 403 });

    const hook = deployHook(process.env);
    if (hook === undefined) {
      // 503, not 500: nothing is broken, it is not set up yet.
      return Response.json({ message: HOOK_MISSING }, { status: 503 });
    }

    let response: Response;
    try {
      response = await fetch(hook, { method: 'POST' });
    } catch {
      return Response.json({ message: HOOK_REFUSED }, { status: 502 });
    }
    if (!response.ok) {
      req.payload.logger.error(`Deploy hook answered ${String(response.status)}`);
      return Response.json({ message: HOOK_REFUSED }, { status: 502 });
    }

    const at = new Date().toISOString();
    await req.payload.updateGlobal({
      slug: 'publish',
      data: { lastPublishedAt: at },
      overrideAccess: true,
    });

    return Response.json({ message: STARTED, lastPublishedAt: at });
  },
};
