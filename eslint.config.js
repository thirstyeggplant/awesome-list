import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/', 'out/', '.cache/'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // The site's scripts run in the browser as they are, without a build step.
    files: ['src/site/assets/**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      sourceType: 'script',
      globals: {
        window: 'readonly', document: 'readonly', location: 'readonly', history: 'readonly',
        fetch: 'readonly', AbortController: 'readonly', Map: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
      },
    },
  },
);
