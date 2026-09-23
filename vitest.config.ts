import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['{apps,packages}/*/**/*.test.{ts,tsx}'],
    // Real tests arrive with the grid algorithm (F1, task 4).
    passWithNoTests: true,
  },
});
