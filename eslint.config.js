const tseslint = require('typescript-eslint');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = tseslint.config(
  { ignores: ['public/**', '.cache/**', '.sources/**', 'node_modules/**', 'src/data/generated/**', 'coverage/**', 'playwright-report/**', 'test-results/**', 'Reports/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  { files: ['**/*.{js,mjs,cjs}'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
);
