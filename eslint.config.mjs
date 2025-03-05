import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: [
      'node_modules', 
      'bin',
      'dist',
      '__tests__',
      'babel.config.js',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^(e|err|error|_)$',
        'varsIgnorePattern': '^(e|err|error|_)$',
        'caughtErrorsIgnorePattern': '^(e|err|error|_)$'
      }],
      '@typescript-eslint/no-require-imports': 'off'
    },
  }
);