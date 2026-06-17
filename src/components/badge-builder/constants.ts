import type {
    BadgeState,
    EditorDraft,
    LanguagePreference,
    ThemePreference,
} from '@/components/badge-builder/types';

export const languagePreferenceLabels = {
    'en': 'EN',
    'zh-Hant': 'ZH-TW',
} as const satisfies Record<LanguagePreference, string>;

export const themePreferenceLabels = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
} as const satisfies Record<ThemePreference, string>;

export const defaultBadgeDraft: EditorDraft = {
    allCaps: false,
    smartRecolor: false,
    badgeColor: '#5968c9',
    logoColor: '#ffffff',
    name: '',
    preserveOriginalArtwork: false,
    source: '',
    textColor: '#ffffff',
};

export const defaultStates: readonly BadgeState[] = [];

export const badgeHeight = 28;
export const logoSize = 16;
export const logoX = 6;
export const logoY = 6;
export const textStart = 30;
export const minBadgeWidth = 90;
export const textSize = 10;
export const frameSeconds = 2.4;
export const animationStartDelaySeconds = 1.2;
export const transitionSeconds = 0.7;
export const minAnimationStartDelaySeconds = 0;
export const maxAnimationStartDelaySeconds = 8;
export const minTransitionSeconds = 0;
export const maxTransitionSeconds = 4;
export const minFrameDelaySeconds = 0.4;
export const maxFrameDelaySeconds = 8;
export const maxFrames = 20;
export const maxSvglResults = 8;
export const logoEdgeCanvasSize = 64;
export const logoEdgeAlphaThreshold = 24;
export const logoEdgeColorDistance = 72;
export const githubUrl = 'https://github.com/Hsiii/Badgical';
export const svglUrl = 'https://svgl.app';
export const defaultExportFolder = 'assets/badges/';
export const defaultExportRepo = 'username/repo';
export const exportFileName = 'animated-badge.svg';
