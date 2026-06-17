import { completeConfigBase } from 'eslint-config-complete';

export default [
    ...completeConfigBase,

    {
        ignores: [
            '.next/**',
            'dist/**',
            'next-env.d.ts',
            'node_modules/**',
            'packages/create-hsi-app/**',
            'scripts/**',
        ],
    },

    {
        rules: {
            '@stylistic/quotes': [
                'error',
                'single',
                {
                    avoidEscape: true,
                },
            ],
            'import-x/no-unassigned-import': [
                'error',
                {
                    allow: ['**/*.css'],
                },
            ],
        },
    },

    {
        files: ['src/app/**/*.tsx'],
        rules: {
            'import-x/no-default-export': 'off',
            'n/file-extension-in-import': 'off',
        },
    },

    {
        files: ['src/**/index.{ts,tsx}'],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'ExportAllDeclaration',
                    message:
                        'Do not use barrel files; import modules directly.',
                },
                {
                    selector: 'ExportNamedDeclaration',
                    message:
                        'Do not use barrel files; import modules directly.',
                },
            ],
        },
    },
];
