import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/out/**', '**/dist/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Catches a hook called after an early return — which is exactly how the
  // carousel briefly broke, and nothing else would have noticed.
  reactHooks.configs.flat['recommended-latest'],
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // docs/TECH.md section 9: no `any` without a comment saying why — which
      // means an explicit eslint-disable, not a silent pass.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // docs/TECH.md section 9: no default exports in packages/.
    files: ['packages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
    },
  },
  prettier,
);
