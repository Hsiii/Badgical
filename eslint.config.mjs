import { completeConfigBase } from 'eslint-config-complete';

export default [
    ...completeConfigBase,

    {
        ignores: [
            '.next/**',
            'dist/**',
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
];
