import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import pluginQuery from '@tanstack/eslint-plugin-query';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const AXIOS = {
  name: 'axios',
  message: 'Use `api` from @/app/shared/utils/api-request inside a feature api.ts.',
};
const REACT = { name: 'react', message: 'This layer must not depend on React.' };
const TANSTACK = { name: '@tanstack/react-query', message: 'This layer must not depend on TanStack Query.' };

/** A `no-restricted-imports` block for one layer; always includes the axios ban. */
function layer(files, { paths = [], patterns = [] }, ignores = []) {
  return {
    files,
    ignores,
    rules: { 'no-restricted-imports': ['error', { paths: [AXIOS, ...paths], patterns }] },
  };
}

export default defineConfig([
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
      eslintConfigPrettier,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'boundaries/elements': [
        { type: 'shared', pattern: 'src/app/shared/**' },
        { type: 'feature', pattern: 'src/app/pages/*/**' },
      ],
    },
    plugins: {
      boundaries,
      '@tanstack/query': pluginQuery,
      '@stylistic': stylistic,
    },
    rules: {
      ...boundaries.configs.recommended.rules,
      ...pluginQuery.configs['flat/recommended'][0].rules,

      // Architecture
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            // Shared code never depends on a feature. Layer rules inside features are below (no-restricted-imports).
            {
              from: { element: { type: 'shared' } },
              disallow: { to: { element: { type: 'feature' } } },
            },
          ],
        },
      ],

      // Code shape: nudges, not gates. Warnings point at the pattern; use judgement.
      'no-nested-ternary': 'warn',
      'no-else-return': 'warn',
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'SpreadElement > ConditionalExpression',
          message:
            'No conditional spreads. Build the object/array with `if` + assignment/push, or a typed helper.',
        },
        {
          selector: 'SpreadElement > LogicalExpression',
          message: 'No `...(cond && x)` spreads. Build the object/array with `if` + assignment/push.',
        },
        {
          selector: "ConditionalExpression[test.operator='instanceof'][test.right.name='Error']",
          message: 'Use getErrorMessage(cause, fallback) from @/app/shared/utils/error-message.',
        },
        {
          selector: 'TSAsExpression > TSNeverKeyword',
          message: '`as never` hides a type error. Fix the type or add a type guard.',
        },
      ],

      // TypeScript: discourage type escapes
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // TypeScript
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // React
      'react/no-array-index-key': 'warn',
      'react/jsx-no-useless-fragment': 'warn',

      // Consistent whitespace
      '@stylistic/no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxBOF: 0,
          maxEOF: 0,
        },
      ],
      '@stylistic/padding-line-between-statements': [
        'error',

        // Keep consecutive variable declarations together.
        {
          blankLine: 'any',
          prev: ['const', 'let'],
          next: ['const', 'let'],
        },

        // Separate variable declarations from subsequent operations.
        {
          blankLine: 'always',
          prev: ['const', 'let'],
          next: '*',
        },

        // Separate return statements from preceding operations.
        {
          blankLine: 'always',
          prev: '*',
          next: 'return',
        },

        // Separate function and class declarations from surrounding code.
        {
          blankLine: 'always',
          prev: '*',
          next: ['function', 'class'],
        },
        {
          blankLine: 'always',
          prev: ['function', 'class'],
          next: '*',
        },
      ],
    },
  },

  // Layers inside a feature. Dependency direction: components → hooks → queries → api; lib/ is pure.
  // Each block restates the axios ban because a later `no-restricted-imports` replaces an earlier one.
  layer(['src/**/*.{ts,tsx}'], {}, ['src/app/shared/utils/api-request.ts']),
  layer(['src/app/pages/**/api.ts'], {
    paths: [REACT, TANSTACK],
    patterns: [{ regex: '/(hooks|components|lib)/|/queries$', message: 'api.ts only sends requests.' }],
  }),
  layer(['src/app/pages/**/queries.ts'], {
    paths: [REACT],
    patterns: [
      { regex: '/(hooks|components)/', message: 'queries.ts only combines keys with api functions.' },
    ],
  }),
  layer(['src/app/pages/**/hooks/**/*.ts'], {
    patterns: [
      { regex: '^@/app/pages/.*/components/', message: 'Hooks must not depend on feature components.' },
    ],
  }),
  layer(['src/app/pages/**/lib/**/*.ts'], {
    paths: [REACT, TANSTACK],
    patterns: [
      { regex: '^react-', message: 'lib/ must stay framework-free.' },
      {
        regex: '/(hooks|components)/|/(api|queries)$',
        message: 'lib/ is pure logic; it imports types and other lib only.',
      },
    ],
  }),
  layer(
    [
      'src/app/pages/**/components/**/*.tsx',
      'src/app/pages/**/page.tsx',
      'src/app/pages/**/widgets/**/*.tsx',
    ],
    {
      paths: [
        {
          name: '@tanstack/react-query',
          importNames: ['useQuery', 'useMutation', 'useQueryClient', 'useSuspenseQuery', 'useQueries'],
          message: 'Wrap queries in hooks/use-x-queries.ts and mutations in hooks/use-x-mutations.ts.',
        },
      ],
      patterns: [
        { regex: '/(api|queries)$', message: 'Components use hooks; only hooks import api.ts / queries.ts.' },
      ],
    },
  ),
]);
