export interface BadgeState {
    allCaps?: boolean;
    smartRecolor?: boolean;
    badgeColor: string;
    id: string;
    logoColor: string;
    name: string;
    preserveOriginalArtwork?: boolean;
    source: string;
    textColor: string;
}

export interface EditorDraft {
    allCaps: boolean;
    smartRecolor: boolean;
    badgeColor: string;
    logoColor: string;
    name: string;
    preserveOriginalArtwork: boolean;
    source: string;
    textColor: string;
}

export interface SvglRouteOptions {
    readonly dark: string;
    readonly light: string;
}

export interface SvglResult {
    readonly category?: readonly string[] | string;
    readonly id: number;
    readonly route: string | SvglRouteOptions;
    readonly title: string;
}

export interface SvglApiError {
    readonly error?: string;
}

export type SvglSearchStatus = 'idle' | 'loading' | 'empty' | 'ready' | 'error';
export type ColorMode = 'brand' | 'inverse' | 'custom';
export type VariantMode = Exclude<ColorMode, 'custom'>;
export type SelectionStatus = 'idle' | 'loading' | 'ready';
export type LanguagePreference = 'en' | 'zh-Hant';
export type ThemePreference = 'light' | 'dark' | 'system';
export type PreferenceMenu = 'language' | 'theme';

export interface RgbColor {
    readonly blue: number;
    readonly green: number;
    readonly red: number;
}

export interface HsvColor {
    readonly hue: number;
    readonly saturation: number;
    readonly value: number;
}
