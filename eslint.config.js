import { builtinModules } from 'node:module';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const NOT_IN_A_WORKER =
  'The site runs as a Cloudflare Worker without nodejs_compat: only build/, server.ts and adapters/node.ts may use Node.';

export default tseslint.config(
  { ignores: ['node_modules/', 'out/', '.cache/', '.wrangler/'] },
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
    // The shared path of the site, which the Worker bundles.
    files: ['src/site/**/*.ts', 'src/enums.ts', 'src/canonical.ts'],
    ignores: ['src/site/build/**', 'src/site/server.ts', 'src/site/adapters/node.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [{ group: ['node:*'], message: NOT_IN_A_WORKER }],
          paths: builtinModules.filter((m) => !m.startsWith('node:')).map((name) => ({ name, message: NOT_IN_A_WORKER })),
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['Buffer', 'process', '__dirname', '__filename', 'require', 'global', 'setImmediate'].map((name) => ({
          name,
          message: NOT_IN_A_WORKER,
        })),
      ],
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
        navigator: 'readonly', localStorage: 'readonly', Intl: 'readonly',
      },
    },
  },
);
