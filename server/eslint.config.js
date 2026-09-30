const js = require('@eslint/js');
const globals = require('globals');

/**
 * ESLint do servidor. O cliente ja tinha lint (npm run lint -w client), e o
 * servidor nao: os 30 arquivos de `src/` — inclusive os que montam as
 * regras de permissao e o calculo de pontos — passavam sem nenhuma
 * verificacao estatica.
 *
 * CommonJS e Node, nao browser: `module`, `require`, `process` e os
 * timers sao legitimidos aqui e seriam falsos positivos na config do cliente.
 */
module.exports = [
  { ignores: ['node_modules', 'data', 'src/seeders/dados/*.json'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.node },
      sourceType: 'commonjs',
    },
    rules: {
      ...js.configs.recommended.rules,

      // `catch (e) {}` sem usar o erro e comum em seeders e em caminhos que
      // ja registraram a falha; `no-unused-vars` nao deve brigar por isso.
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],

      // Nao usada em lugar nenhum do servidor; se aparecer, e erro de
      // digitacao e nao esquecimento benigno.
      'no-undef': 'error',
    },
  },
  {
    // Os testes usam `node:test`, com globals proprio.
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
];
