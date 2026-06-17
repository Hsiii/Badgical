import type {
    AnimationType,
    LanguagePreference,
    ThemePreference,
} from '@/components/badge-builder/types';

export interface UiCopy {
    readonly addFrame: string;
    readonly advancedControlsLabel: string;
    readonly animationDelay: string;
    readonly animationDelaySeconds: string;
    readonly animationLabels: Record<AnimationType, string>;
    readonly animationType: string;
    readonly badgePreviewTitle: string;
    readonly badgeText: string;
    readonly badgeVariantsLabel: string;
    readonly builderTitle: string;
    readonly cancel: string;
    readonly chooseAssetFolder: string;
    readonly chooseTargetRepo: string;
    readonly close: string;
    readonly copied: string;
    readonly copyMarkdown: string;
    readonly contentTitle: string;
    readonly customEdits: string;
    readonly delete: string;
    readonly deleteFrame: (name: string) => string;
    readonly deleteFrameDescription: string;
    readonly deleteFrameTitle: string;
    readonly downloadSvg: string;
    readonly editFrame: (name: string) => string;
    readonly editSvgSource: string;
    readonly editSvgSourceDescription: string;
    readonly export: string;
    readonly exportAnimatedSvg: string;
    readonly exportBadge: string;
    readonly exportGuide: (path: string, repo: string) => string;
    readonly frameSettings: string;
    readonly frames: string;
    readonly generatedPreviewAlt: string;
    readonly githubLabel: (stars?: string) => string;
    readonly language: string;
    readonly logoSvg: string;
    readonly noPreviewFrames: string;
    readonly noVariantPreview: string;
    readonly pickFirstFrame: string;
    readonly poweredBy: string;
    readonly primaryBlue: string;
    readonly primaryColorHue: string;
    readonly primaryColorSaturation: (color: string) => string;
    readonly primaryGreen: string;
    readonly primaryHex: string;
    readonly primaryRed: string;
    readonly readmeAlt: (names: readonly string[]) => string;
    readonly readmeMarkdown: string;
    readonly save: string;
    readonly searchBrand: string;
    readonly searchBrands: string;
    readonly searchPlaceholder: string;
    readonly secondsUnit: string;
    readonly selectVariant: (label: string) => string;
    readonly svglLogos: string;
    readonly theme: string;
    readonly themeLabels: Record<ThemePreference, string>;
    readonly updateFrame: string;
    readonly variantDefault: string;
    readonly variantInverse: string;
}

const englishListFormatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
});

const traditionalChineseListFormatter = new Intl.ListFormat('zh-Hant', {
    style: 'long',
    type: 'conjunction',
});

export const uiCopy = {
    'en': {
        addFrame: 'Add Frame',
        advancedControlsLabel: 'Advanced badge controls',
        animationDelay: 'Animation delay',
        animationDelaySeconds: 'Animation delay seconds',
        animationLabels: {
            slot: 'Slot',
            carousel: 'Carousel',
        },
        animationType: 'Animation type',
        badgePreviewTitle: 'Badge Preview',
        badgeText: 'Badge text',
        badgeVariantsLabel: 'Badge variants',
        builderTitle: 'Badgical badge builder',
        cancel: 'Cancel',
        chooseAssetFolder: 'Choose asset folder',
        chooseTargetRepo: 'Choose target repo',
        close: 'Close',
        copied: 'Copied',
        copyMarkdown: 'Copy Markdown',
        contentTitle: 'Badge Content',
        customEdits: 'Custom Edits',
        delete: 'Delete',
        deleteFrame: (name) => `Delete ${name}`,
        deleteFrameDescription:
            'This removes the frame from the badge animation.',
        deleteFrameTitle: 'Delete Frame',
        downloadSvg: 'Download SVG',
        editFrame: (name) => `Edit ${name}`,
        editSvgSource: 'Edit SVG Source',
        editSvgSourceDescription:
            'Edit the raw SVG source used for this badge frame.',
        export: 'Export',
        exportAnimatedSvg: 'Export animated SVG',
        exportBadge: 'Export Badge',
        exportGuide: (path, repo) =>
            `Download the SVG and put it in ${path} in ${repo}. Then put the generated Markdown in that repository README.`,
        frameSettings: 'Frame settings',
        frames: 'Frames',
        generatedPreviewAlt: 'Generated animated badge preview',
        githubLabel: (stars) =>
            stars === undefined
                ? 'Open Badgical on GitHub'
                : `Open Badgical on GitHub, ${stars} stars`,
        language: 'Language',
        logoSvg: 'Logo SVG',
        noPreviewFrames: 'Add frames to preview the animated badge.',
        noVariantPreview: 'Pick a brand to preview badge variants.',
        pickFirstFrame: 'Pick a brand and add the first frame.',
        poweredBy: 'Powered by',
        primaryBlue: 'Primary blue',
        primaryColorHue: 'Primary color hue',
        primaryColorSaturation: (color) =>
            `Primary color saturation and brightness ${color}`,
        primaryGreen: 'Primary green',
        primaryHex: 'Primary hex',
        primaryRed: 'Primary red',
        readmeAlt: (names) =>
            names.length === 0
                ? 'Animated badge'
                : `Animated badge cycling through ${englishListFormatter.format(names)}`,
        readmeMarkdown: 'README Markdown',
        save: 'Save',
        searchBrand: 'Search brand',
        searchBrands: 'Search brands',
        searchPlaceholder: 'Search...',
        secondsUnit: 'Sec',
        selectVariant: (label) => `Select ${label} badge variant`,
        svglLogos: 'SVGL logos',
        theme: 'Theme',
        themeLabels: {
            light: 'Light',
            dark: 'Dark',
            system: 'System',
        },
        updateFrame: 'Update Frame',
        variantDefault: 'Default',
        variantInverse: 'Inverse',
    },
    'zh-Hant': {
        addFrame: '\u65B0\u589E\u5F71\u683C',
        advancedControlsLabel: '\u9032\u968E\u5FBD\u7AE0\u63A7\u5236',
        animationDelay: '\u52D5\u756B\u5EF6\u9072',
        animationDelaySeconds: '\u52D5\u756B\u5EF6\u9072\u79D2\u6578',
        animationLabels: {
            slot: '\u5377\u52D5',
            carousel: '\u8F2A\u64AD',
        },
        animationType: '\u52D5\u756B\u985E\u578B',
        badgePreviewTitle: '\u5FBD\u7AE0\u9810\u89BD',
        badgeText: '\u5FBD\u7AE0\u6587\u5B57',
        badgeVariantsLabel: '\u5FBD\u7AE0\u6A23\u5F0F',
        builderTitle: 'Badgical \u5FBD\u7AE0\u7522\u751F\u5668',
        cancel: '\u53D6\u6D88',
        chooseAssetFolder: '\u9078\u64C7\u7D20\u6750\u8CC7\u6599\u593E',
        chooseTargetRepo: '\u9078\u64C7\u76EE\u6A19\u5132\u5B58\u5EAB',
        close: '\u95DC\u9589',
        copied: '\u5DF2\u8907\u88FD',
        copyMarkdown: '\u8907\u88FD Markdown',
        contentTitle: '\u5FBD\u7AE0\u5167\u5BB9',
        customEdits: '\u81EA\u8A02\u7DE8\u8F2F',
        delete: '\u522A\u9664',
        deleteFrame: (name) => `\u522A\u9664 ${name}`,
        deleteFrameDescription:
            '\u9019\u6703\u5F9E\u5FBD\u7AE0\u52D5\u756B\u4E2D\u79FB\u9664\u6B64\u5F71\u683C\u3002',
        deleteFrameTitle: '\u522A\u9664\u5F71\u683C',
        downloadSvg: '\u4E0B\u8F09 SVG',
        editFrame: (name) => `\u7DE8\u8F2F ${name}`,
        editSvgSource: '\u7DE8\u8F2F SVG \u539F\u59CB\u78BC',
        editSvgSourceDescription:
            '\u7DE8\u8F2F\u6B64\u5FBD\u7AE0\u5F71\u683C\u4F7F\u7528\u7684\u539F\u59CB SVG\u3002',
        export: '\u532F\u51FA',
        exportAnimatedSvg: '\u532F\u51FA\u52D5\u756B SVG',
        exportBadge: '\u532F\u51FA\u5FBD\u7AE0',
        exportGuide: (path, repo) =>
            `\u4E0B\u8F09 SVG \u4E26\u653E\u5230 ${repo} \u7684 ${path}\u3002\u63A5\u8457\u628A\u7522\u751F\u7684 Markdown \u653E\u9032\u8A72\u5132\u5B58\u5EAB\u7684 README\u3002`,
        frameSettings: '\u5F71\u683C\u8A2D\u5B9A',
        frames: '\u5F71\u683C',
        generatedPreviewAlt:
            '\u7522\u751F\u7684\u52D5\u756B\u5FBD\u7AE0\u9810\u89BD',
        githubLabel: (stars) =>
            stars === undefined
                ? '\u5728 GitHub \u958B\u555F Badgical'
                : `\u5728 GitHub \u958B\u555F Badgical\uFF0C${stars} \u9846\u661F`,
        language: '\u8A9E\u8A00',
        logoSvg: 'Logo SVG',
        noPreviewFrames:
            '\u65B0\u589E\u5F71\u683C\u4EE5\u9810\u89BD\u52D5\u756B\u5FBD\u7AE0\u3002',
        noVariantPreview:
            '\u9078\u64C7\u54C1\u724C\u4EE5\u9810\u89BD\u5FBD\u7AE0\u6A23\u5F0F\u3002',
        pickFirstFrame:
            '\u9078\u64C7\u54C1\u724C\u4E26\u65B0\u589E\u7B2C\u4E00\u500B\u5F71\u683C\u3002',
        poweredBy: '\u8CC7\u6599\u4F86\u6E90',
        primaryBlue: '\u4E3B\u8981\u85CD\u8272',
        primaryColorHue: '\u4E3B\u8981\u984F\u8272\u8272\u76F8',
        primaryColorSaturation: (color) =>
            `\u4E3B\u8981\u984F\u8272\u98FD\u548C\u5EA6\u8207\u4EAE\u5EA6 ${color}`,
        primaryGreen: '\u4E3B\u8981\u7DA0\u8272',
        primaryHex: '\u4E3B\u8981\u5341\u516D\u9032\u4F4D\u8272\u78BC',
        primaryRed: '\u4E3B\u8981\u7D05\u8272',
        readmeAlt: (names) =>
            names.length === 0
                ? '\u52D5\u756B\u5FBD\u7AE0'
                : `\u8F2A\u64AD ${traditionalChineseListFormatter.format(names)} \u7684\u52D5\u756B\u5FBD\u7AE0`,
        readmeMarkdown: 'README Markdown',
        save: '\u5132\u5B58',
        searchBrand: '\u641C\u5C0B\u54C1\u724C',
        searchBrands: '\u641C\u5C0B\u54C1\u724C',
        searchPlaceholder: '\u641C\u5C0B...',
        secondsUnit: '\u79D2',
        selectVariant: (label) =>
            `\u9078\u64C7${label}\u5FBD\u7AE0\u6A23\u5F0F`,
        svglLogos: 'SVGL \u6A19\u8A8C',
        theme: '\u4E3B\u984C',
        themeLabels: {
            light: '\u6DFA\u8272',
            dark: '\u6DF1\u8272',
            system: '\u7CFB\u7D71',
        },
        updateFrame: '\u66F4\u65B0\u5F71\u683C',
        variantDefault: '\u9810\u8A2D',
        variantInverse: '\u53CD\u76F8',
    },
} as const satisfies Record<LanguagePreference, UiCopy>;

export const getSupportedLanguagePreference = (
    value: string | undefined
): LanguagePreference | undefined =>
    value === 'en' || value === 'zh-Hant' ? value : undefined;
