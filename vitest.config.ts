import { defineConfig } from 'vitest/config';

export default defineConfig({
  /*
   * apps/web/tsconfig.json sets jsx: 'preserve' because Next compiles its own
   * JSX. Vite would otherwise refuse to transform .tsx files there, so tell it
   * outright rather than leaving app components untestable.
   */
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    include: ['{apps,packages}/*/**/*.test.{ts,tsx}'],
    // Real tests arrive with the grid algorithm (F1, task 4).
    passWithNoTests: true,
  },
});
