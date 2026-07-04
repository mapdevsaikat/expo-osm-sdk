module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'prettier',
  ],
  settings: {
    react: { version: 'detect' },
  },
  env: {
    es2021: true,
    node: true,
    browser: true,
    jest: true,
  },
  globals: {
    __DEV__: 'readonly',
  },
  rules: {
    // The SDK bridges untyped native payloads; `any` is unavoidable at the boundary
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-var-requires': 'off',
    'no-empty': ['error', { allowEmptyCatch: true }],
    // Not needed with the automatic JSX runtime / TypeScript
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  ignorePatterns: ['build/', 'node_modules/', 'coverage/', 'example/', '*.config.js'],
};
