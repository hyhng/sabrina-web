import config from '@payload-config';
import '@payloadcms/next/css';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import type { ServerFunctionClient } from 'payload';
import type { ReactNode } from 'react';

import { importMap } from './admin/importMap.js';
// The one agreed exception to CLAUDE.md rule 9 — see the header of that file.
import '../../styles/payload-exceptions.css';

/** Payload's own layout. Nothing of ours belongs in here beyond the import above. */
const serverFunction: ServerFunctionClient = async function serverFunction(args) {
  'use server';
  return handleServerFunctions({ ...args, config, importMap });
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
