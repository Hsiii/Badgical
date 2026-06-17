'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, JSX } from 'react';
import {
    ChevronDown,
    Copy,
    Download,
    Languages,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    SunMoon,
    X,
} from 'lucide-react';

interface BadgeState {
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

interface EditorDraft {
    allCaps: boolean;
    smartRecolor: boolean;
    badgeColor: string;
    logoColor: string;
    name: string;
    preserveOriginalArtwork: boolean;
    source: string;
    textColor: string;
}

interface SvglRouteOptions {
    readonly dark: string;
    readonly light: string;
}

interface SvglResult {
    readonly category?: readonly string[] | string;
    readonly id: number;
    readonly route: string | SvglRouteOptions;
    readonly title: string;
}

interface SvglApiError {
    readonly error?: string;
}

type SvglSearchStatus = 'idle' | 'loading' | 'empty' | 'ready' | 'error';
type ColorMode = 'brand' | 'inverse' | 'custom';
type VariantMode = Exclude<ColorMode, 'custom'>;
type SelectionStatus = 'idle' | 'loading' | 'ready';
type LanguagePreference = 'en' | 'zh-Hant';
type ThemePreference = 'light' | 'dark' | 'system';
type PreferenceMenu = 'language' | 'theme';

const languagePreferenceLabels = {
    'en': 'EN',
    'zh-Hant': 'ZH-TW',
} as const satisfies Record<LanguagePreference, string>;

const themePreferenceLabels = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
} as const satisfies Record<ThemePreference, string>;

const defaultBadgeDraft: EditorDraft = {
    allCaps: false,
    smartRecolor: false,
    badgeColor: '#5968c9',
    logoColor: '#ffffff',
    name: '',
    preserveOriginalArtwork: false,
    source: '',
    textColor: '#ffffff',
};

const defaultStates: readonly BadgeState[] = [];

const badgeHeight = 28;
const logoSize = 16;
const logoX = 6;
const logoY = 6;
const textStart = 30;
const minBadgeWidth = 90;
const textPadding = 16;
const textSize = 10;
const frameSeconds = 2.4;
const minFrameDelaySeconds = 0.4;
const maxFrameDelaySeconds = 8;
const maxFrames = 20;
const maxSvglResults = 8;
const logoEdgeCanvasSize = 64;
const logoEdgeAlphaThreshold = 24;
const logoEdgeColorDistance = 72;
const githubUrl = 'https://github.com/Hsiii/Badgical';
const svglUrl = 'https://svgl.app';
const defaultExportFolder = 'assets/badges/';
const defaultExportRepo = 'username/repo';
const exportFileName = 'animated-badge.svg';

function GitHubMark(): JSX.Element {
    return (
        <svg
            aria-hidden='true'
            fill='currentColor'
            height='24'
            viewBox='0 0 24 24'
            width='24'
            xmlns='http://www.w3.org/2000/svg'
        >
            <path d='M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.69.08-.69 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.24 2.75.12 3.04.73.8 1.17 1.83 1.17 3.08 0 4.42-2.69 5.39-5.25 5.67.42.36.78 1.06.78 2.14v3.16c0 .31.21.67.79.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z' />
        </svg>
    );
}

const escapeXml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');

const compactNumber = (value: number): string =>
    Number(value.toFixed(2)).toString();

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

const minifySvgSource = (source: string): string =>
    source
        .trim()
        .replaceAll(/<!--[\S\s]*?-->/g, '')
        .replaceAll(/>\s+</g, '><')
        .replaceAll(/\s{2,}/g, ' ')
        .replaceAll(/\s+\/>/g, '/>')
        .replaceAll(';}', '}')
        .replaceAll(/:\s+/g, ':')
        .replaceAll(/,\s+/g, ',');

const ensureSvgNamespace = (source: string): string => {
    if (
        !/^<svg\b/iu.test(source) ||
        /\sxmlns=(["'])http:\/\/www\.w3\.org\/2000\/svg\1/iu.test(source)
    ) {
        return source;
    }

    return source.replace(
        /^<svg\b/iu,
        '<svg xmlns="http://www.w3.org/2000/svg"'
    );
};

const isSvgSource = (source: string): boolean =>
    /^<svg\b[\S\s]*<\/svg>$/iu.test(minifySvgSource(source));

const compactColor = (color: string): string =>
    color.replace(/^#([\dA-Fa-f])\1([\dA-Fa-f])\2([\dA-Fa-f])\3$/, '#$1$2$3');

const colorizeSvgContent = (content: string, color: string): string =>
    content
        .replaceAll(
            /\sfill=(["'])(?!none|transparent|currentColor)(.*?)\1/giu,
            ` fill="${escapeXml(color)}"`
        )
        .replaceAll(
            /\sstroke=(["'])(?!none|transparent|currentColor)(.*?)\1/giu,
            ` stroke="${escapeXml(color)}"`
        )
        .replaceAll(/<stop\b[^>]*>/giu, (match) =>
            match.replaceAll(
                /\sstop-color=(["'])(.*?)\1/giu,
                ` stop-color="${escapeXml(color)}"`
            )
        );

const inlineSvgArtwork = (
    source: string,
    logoColor: string,
    preserveOriginalArtwork = false,
    smartRecolorBadgeColor?: string
): string => {
    const svgSource = minifySvgSource(source)
        .replaceAll(/<\?xml[\S\s]*?\?>/g, '')
        .replaceAll(/<!doctype[\S\s]*?>/gi, '');
    const svgMatch = /^<svg\b([^>]*)>([\S\s]*)<\/svg>$/iu.exec(svgSource);

    if (svgMatch === null) {
        return `<image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${escapeXml(toDataUri(source))}"/>`;
    }

    const [, attributes, content] = svgMatch;
    const viewBox = /\bviewBox=(["'])(.*?)\1/u.exec(attributes)?.[2];
    const viewBoxAttribute =
        viewBox === undefined ? '' : ` viewBox="${escapeXml(viewBox)}"`;

    if (preserveOriginalArtwork) {
        const artworkContent =
            smartRecolorBadgeColor === undefined
                ? content
                : smartRecolorSvgContent(content, smartRecolorBadgeColor);

        return `<svg x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}"${viewBoxAttribute}>${artworkContent}</svg>`;
    }

    return `<svg x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}"${viewBoxAttribute}><g fill="${escapeXml(logoColor)}" stroke="${escapeXml(logoColor)}" style="color:${escapeXml(logoColor)}">${colorizeSvgContent(content, logoColor)}</g></svg>`;
};

const toDataUri = (source: string): string => {
    const encodedSource = encodeURIComponent(
        ensureSvgNamespace(minifySvgSource(source))
    )
        .replaceAll("'", '%27')
        .replaceAll('"', '%22');

    return `data:image/svg+xml,${encodedSource}`;
};

const getReadableInk = (color: string): string => {
    const normalizedColor = color.trim().replace('#', '');

    if (!/^[\dA-Fa-f]{6}$/.test(normalizedColor)) {
        return '#ffffff';
    }

    const red = Number.parseInt(normalizedColor.slice(0, 2), 16);
    const green = Number.parseInt(normalizedColor.slice(2, 4), 16);
    const blue = Number.parseInt(normalizedColor.slice(4, 6), 16);
    const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

    return luminance > 150 ? '#1f2328' : '#ffffff';
};

const normalizeHexInput = (value: string): string | undefined => {
    const normalizedValue = value.trim();
    const fullHexMatch = /^#?([\dA-Fa-f]{6})$/u.exec(normalizedValue);

    if (fullHexMatch !== null) {
        return `#${fullHexMatch[1]}`;
    }

    const shortHexMatch = /^#?([\dA-Fa-f]{3})$/u.exec(normalizedValue);

    if (shortHexMatch === null) {
        return undefined;
    }

    const [, hexValue] = shortHexMatch;

    return `#${hexValue[0]}${hexValue[0]}${hexValue[1]}${hexValue[1]}${hexValue[2]}${hexValue[2]}`;
};

interface RgbColor {
    readonly blue: number;
    readonly green: number;
    readonly red: number;
}

interface HsvColor {
    readonly hue: number;
    readonly saturation: number;
    readonly value: number;
}

const getRgbColor = (color: string): RgbColor | undefined => {
    const namedColor = {
        black: '#000000',
        white: '#ffffff',
    }[color.trim().toLowerCase()];
    const normalizedColor = normalizeHexInput(namedColor ?? color);

    if (normalizedColor === undefined) {
        return undefined;
    }

    return {
        blue: Number.parseInt(normalizedColor.slice(5, 7), 16),
        green: Number.parseInt(normalizedColor.slice(3, 5), 16),
        red: Number.parseInt(normalizedColor.slice(1, 3), 16),
    };
};

const getHexChannel = (value: number): string =>
    Math.round(Math.min(255, Math.max(0, value)))
        .toString(16)
        .padStart(2, '0');

const getHexColor = ({ blue, green, red }: RgbColor): string =>
    `#${getHexChannel(red)}${getHexChannel(green)}${getHexChannel(blue)}`;

const getHsvColor = ({ blue, green, red }: RgbColor): HsvColor => {
    const normalizedRed = red / 255;
    const normalizedGreen = green / 255;
    const normalizedBlue = blue / 255;
    const maxChannel = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
    const minChannel = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
    const delta = maxChannel - minChannel;
    let hue = 0;

    if (delta !== 0) {
        if (maxChannel === normalizedRed) {
            hue = 60 * (((normalizedGreen - normalizedBlue) / delta) % 6);
        } else if (maxChannel === normalizedGreen) {
            hue = 60 * ((normalizedBlue - normalizedRed) / delta + 2);
        } else {
            hue = 60 * ((normalizedRed - normalizedGreen) / delta + 4);
        }
    }

    return {
        hue: Math.round((hue + 360) % 360),
        saturation: maxChannel === 0 ? 0 : delta / maxChannel,
        value: maxChannel,
    };
};

const getRgbFromHsv = ({ hue, saturation, value }: HsvColor): RgbColor => {
    const chroma = value * saturation;
    const huePrime = hue / 60;
    const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
    const match = value - chroma;
    let red = 0;
    let green = 0;
    let blue = 0;

    if (huePrime >= 0 && huePrime < 1) {
        red = chroma;
        green = x;
    } else if (huePrime < 2) {
        red = x;
        green = chroma;
    } else if (huePrime < 3) {
        green = chroma;
        blue = x;
    } else if (huePrime < 4) {
        green = x;
        blue = chroma;
    } else if (huePrime < 5) {
        red = x;
        blue = chroma;
    } else {
        red = chroma;
        blue = x;
    }

    return {
        blue: (blue + match) * 255,
        green: (green + match) * 255,
        red: (red + match) * 255,
    };
};

const getColorDistance = (
    red: number,
    green: number,
    blue: number,
    color: RgbColor
): number =>
    Math.hypot(red - color.red, green - color.green, blue - color.blue);

const getRelativeLuminance = (color: RgbColor): number =>
    (color.red * 299 + color.green * 587 + color.blue * 114) / 255_000;

const getGrayHex = (luminance: number): string => {
    const boundedLuminance = Math.min(1, Math.max(0, luminance));
    const channel = Math.round(boundedLuminance * 255)
        .toString(16)
        .padStart(2, '0');

    return `#${channel}${channel}${channel}`;
};

const getSmartRecolorPaint = (
    paintColor: string,
    badgeColor: string
): string | undefined => {
    const paint = getRgbColor(paintColor);
    const badge = getRgbColor(badgeColor);

    if (paint === undefined || badge === undefined) {
        return undefined;
    }

    const paintLuminance = getRelativeLuminance(paint);
    const badgeLuminance = getRelativeLuminance(badge);

    if (badgeLuminance < 0.5) {
        return paintLuminance <= badgeLuminance + 0.1
            ? '#ffffff'
            : getGrayHex(Math.max(0.12, Math.min(0.42, 1 - paintLuminance)));
    }

    return paintLuminance >= badgeLuminance - 0.1
        ? '#1f2328'
        : getGrayHex(Math.min(0.88, Math.max(0.58, 1 - paintLuminance)));
};

const smartRecolorSvgPaint = (
    match: string,
    attribute: string,
    quote: string,
    paintColor: string,
    badgeColor: string
): string => {
    const smartColor = getSmartRecolorPaint(paintColor, badgeColor);

    return smartColor === undefined
        ? match
        : ` ${attribute}=${quote}${escapeXml(smartColor)}${quote}`;
};

const smartRecolorSvgContent = (content: string, badgeColor: string): string =>
    content
        .replaceAll(
            /\s(fill|stroke)=(["'])(?!none|transparent|currentColor)(.*?)\2/giu,
            (match, attribute: string, quote: string, paintColor: string) =>
                smartRecolorSvgPaint(
                    match,
                    attribute,
                    quote,
                    paintColor,
                    badgeColor
                )
        )
        .replaceAll(/<stop\b[^>]*>/giu, (match) =>
            match.replaceAll(
                /\s(stop-color)=(["'])(.*?)\2/giu,
                (
                    stopMatch,
                    attribute: string,
                    quote: string,
                    paintColor: string
                ) =>
                    smartRecolorSvgPaint(
                        stopMatch,
                        attribute,
                        quote,
                        paintColor,
                        badgeColor
                    )
            )
        );

const hasTransparentNeighbor = (
    pixels: Uint8ClampedArray,
    x: number,
    y: number
): boolean => {
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
        for (let xOffset = -1; xOffset <= 1; xOffset++) {
            if (xOffset === 0 && yOffset === 0) {
                continue;
            }

            const neighborX = x + xOffset;
            const neighborY = y + yOffset;

            if (
                neighborX < 0 ||
                neighborX >= logoEdgeCanvasSize ||
                neighborY < 0 ||
                neighborY >= logoEdgeCanvasSize
            ) {
                return true;
            }

            const alphaIndex =
                (neighborY * logoEdgeCanvasSize + neighborX) * 4 + 3;

            if (pixels[alphaIndex] <= logoEdgeAlphaThreshold) {
                return true;
            }
        }
    }

    return false;
};

const loadSvgImage = async (source: string): Promise<HTMLImageElement> =>
    await new Promise((resolve, reject) => {
        const image = new Image();

        image.addEventListener('load', () => {
            resolve(image);
        });
        image.addEventListener('error', () => {
            reject(new Error('SVG logo rasterization failed'));
        });
        image.src = toDataUri(source);
    });

const logoColorTouchesBadgeEdge = async (
    source: string,
    badgeColor: string
): Promise<boolean> => {
    if (!isSvgSource(source)) {
        return false;
    }

    const badgeRgb = getRgbColor(badgeColor);

    if (badgeRgb === undefined) {
        return false;
    }

    const canvas = document.createElement('canvas');
    canvas.width = logoEdgeCanvasSize;
    canvas.height = logoEdgeCanvasSize;

    const context = canvas.getContext('2d', {
        willReadFrequently: true,
    });

    if (context === null) {
        return false;
    }

    try {
        const image = await loadSvgImage(source);

        context.clearRect(0, 0, logoEdgeCanvasSize, logoEdgeCanvasSize);
        context.drawImage(image, 0, 0, logoEdgeCanvasSize, logoEdgeCanvasSize);
    } catch {
        return false;
    }

    const pixels = context.getImageData(
        0,
        0,
        logoEdgeCanvasSize,
        logoEdgeCanvasSize
    ).data;

    for (let y = 0; y < logoEdgeCanvasSize; y++) {
        for (let x = 0; x < logoEdgeCanvasSize; x++) {
            const pixelIndex = (y * logoEdgeCanvasSize + x) * 4;
            const alpha = pixels[pixelIndex + 3];

            if (
                alpha > logoEdgeAlphaThreshold &&
                getColorDistance(
                    pixels[pixelIndex],
                    pixels[pixelIndex + 1],
                    pixels[pixelIndex + 2],
                    badgeRgb
                ) < logoEdgeColorDistance &&
                hasTransparentNeighbor(pixels, x, y)
            ) {
                return true;
            }
        }
    }

    return false;
};

const materializeState = (state: BadgeState, _index: number): BadgeState => {
    const badgeColor =
        state.badgeColor.trim() === ''
            ? defaultBadgeDraft.badgeColor
            : state.badgeColor.trim();
    const defaultInk = getReadableInk(badgeColor);

    return {
        ...state,
        allCaps: state.allCaps ?? false,
        smartRecolor: state.smartRecolor ?? false,
        badgeColor,
        logoColor:
            state.logoColor.trim() === '' ? defaultInk : state.logoColor.trim(),
        name:
            state.name.trim() === '' || /^frame$/iu.test(state.name.trim())
                ? defaultBadgeDraft.name
                : state.name.trim(),
        source:
            state.source.trim() === ''
                ? defaultBadgeDraft.source
                : state.source.trim(),
        preserveOriginalArtwork: state.preserveOriginalArtwork ?? false,
        textColor:
            state.textColor.trim() === '' ? defaultInk : state.textColor.trim(),
    };
};

const getDisplayName = (state: BadgeState): string =>
    state.allCaps === true ? state.name.toUpperCase() : state.name;

const normalizeStates = (
    states: readonly BadgeState[]
): readonly BadgeState[] =>
    states
        .map((state, index) => materializeState(state, index))
        .filter(
            (state) =>
                state.name !== '' &&
                state.badgeColor !== '' &&
                state.logoColor !== '' &&
                state.source !== '' &&
                state.textColor !== ''
        );

const getBadgeWidth = (states: readonly BadgeState[]): number => {
    let longestName = 0;

    for (const state of states) {
        longestName = Math.max(longestName, state.name.length);
    }

    return Math.max(
        minBadgeWidth,
        textStart + textPadding + Math.ceil(longestName * 7)
    );
};

const buildAnimationSteps = (stateCount: number): string => {
    if (stateCount < 2) {
        return '0%,100%{transform:translateY(0)}';
    }

    const totalFrames = stateCount;
    const holdShare = 0.72;

    return Array.from({ length: stateCount }, (_value, index) => {
        const frameStart = (index / totalFrames) * 100;
        const frameHoldEnd = ((index + holdShare) / totalFrames) * 100;
        const frameEnd = ((index + 1) / totalFrames) * 100;
        const offset = index * badgeHeight;

        return `${compactNumber(frameStart)}%,${compactNumber(frameHoldEnd)}%{transform:translateY(-${offset}px)}${compactNumber(frameEnd)}%{transform:translateY(-${offset + badgeHeight}px)}`;
    }).join('');
};

const buildBadgeSvg = (
    states: readonly BadgeState[],
    frameDelaySeconds = frameSeconds,
    preserveOriginalArtwork = false
): string => {
    const visibleStates = normalizeStates(states);

    if (visibleStates.length === 0) {
        return '';
    }

    const firstState = visibleStates[0];
    const width = getBadgeWidth(visibleStates);
    const textX = (textStart + width) / 2;
    const animatedStates =
        visibleStates.length > 1
            ? [...visibleStates, firstState]
            : visibleStates;
    const duration = Math.max(
        visibleStates.length * frameDelaySeconds,
        frameDelaySeconds
    );
    const slots = animatedStates
        .map((state, index) => {
            const slotY = index * badgeHeight;
            const textAttributes =
                visibleStates.length === 1
                    ? ` font-size="${textSize}" font-weight="700"`
                    : '';

            const preservesArtwork =
                preserveOriginalArtwork ||
                state.preserveOriginalArtwork === true;
            const smartRecolorBadgeColor =
                preservesArtwork && state.smartRecolor === true
                    ? state.badgeColor
                    : undefined;
            const content = `<rect width="${width}" height="${badgeHeight}" fill="${escapeXml(compactColor(state.badgeColor))}"/>${inlineSvgArtwork(state.source, state.logoColor, preservesArtwork, smartRecolorBadgeColor)}<text fill="${escapeXml(compactColor(state.textColor))}" x="${textX}" y="18" text-anchor="middle"${textAttributes}>${escapeXml(getDisplayName(state))}</text>`;

            if (visibleStates.length === 1) {
                return content;
            }

            return `<g class="f"${slotY === 0 ? '' : ` transform="translate(0 ${slotY})"`}>${content}</g>`;
        })
        .join('');
    const animationStyle =
        visibleStates.length > 1
            ? `.s{animation:a ${duration}s ease-in-out 1.2s infinite}@keyframes a{${buildAnimationSteps(visibleStates.length)}}@media (prefers-reduced-motion:reduce){.s{animation:none}.f:nth-child(n+2){display:none}}`
            : '';
    const body = visibleStates.length > 1 ? `<g class="s">${slots}</g>` : slots;
    const style =
        visibleStates.length > 1
            ? `<style>text{font:700 ${textSize}px sans-serif}${animationStyle}</style>`
            : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${badgeHeight}" viewBox="0 0 ${width} ${badgeHeight}">${style}${body}</svg>`;
};

const buildSingleBadgeSvg = (
    state: BadgeState,
    index: number,
    preserveOriginalArtwork = false
): string =>
    buildBadgeSvg(
        [materializeState(state, index)],
        frameSeconds,
        preserveOriginalArtwork
    );

const getSvglRoute = (route: string | SvglRouteOptions): string =>
    typeof route === 'string' ? route : route.light;

const isSvglNotFoundResponse = (
    response: Response,
    payload: SvglApiError
): boolean =>
    response.status === 404 &&
    payload.error?.includes('SVG not found') === true;

const isSvglApiError = (payload: unknown): payload is SvglApiError =>
    typeof payload === 'object' && payload !== null && 'error' in payload;

const isSvglResultList = (payload: unknown): payload is readonly SvglResult[] =>
    typeof payload === 'object' &&
    payload !== null &&
    'length' in payload &&
    'slice' in payload &&
    typeof payload.length === 'number' &&
    typeof payload.slice === 'function';

const getSvglSourceUrl = (route: string | SvglRouteOptions): string => {
    const svgRoute = getSvglRoute(route);

    try {
        const { pathname } = new URL(svgRoute);
        const svgName = pathname.split('/').at(-1) ?? '';

        return `https://api.svgl.app/svg/${svgName}`;
    } catch {
        return svgRoute;
    }
};

const sortCopy = <Value,>(
    values: readonly Value[],
    compare: (leftValue: Value, rightValue: Value) => number
): readonly Value[] => {
    const sortedValues = [...values];

    // eslint-disable-next-line unicorn/no-array-sort
    return sortedValues.sort(compare);
};

const getColorWeight = (color: string): number => {
    const normalizedColor = normalizeHexInput(color);

    if (normalizedColor === undefined) {
        return -1;
    }

    const normalizedValue = normalizedColor.replace('#', '');
    const red = Number.parseInt(normalizedValue.slice(0, 2), 16);
    const green = Number.parseInt(normalizedValue.slice(2, 4), 16);
    const blue = Number.parseInt(normalizedValue.slice(4, 6), 16);
    const maxChannel = Math.max(red, green, blue);
    const minChannel = Math.min(red, green, blue);
    const saturation = maxChannel - minChannel;
    const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
    const neutralPenalty =
        luminance < 32 || luminance > 232 || saturation < 24 ? 255 : 0;

    return saturation - neutralPenalty;
};

const getPrimarySvgColor = (source: string): string | undefined => {
    const colors = source.match(/#[\dA-Fa-f]{3}(?:[\dA-Fa-f]{3})?\b/gu) ?? [];
    const sortedColors = sortCopy(
        [
            ...new Set(
                colors
                    .map((color) => normalizeHexInput(color))
                    .filter((color): color is string => color !== undefined)
            ),
        ],
        (leftColor, rightColor) =>
            getColorWeight(rightColor) - getColorWeight(leftColor)
    );
    const primaryColor = sortedColors[0];

    return primaryColor;
};

const sortSvglResults = (
    searchResults: readonly SvglResult[],
    searchTerm: string
): readonly SvglResult[] => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    return sortCopy(searchResults, (leftResult, rightResult) => {
        const leftTitle = leftResult.title.trim().toLowerCase();
        const rightTitle = rightResult.title.trim().toLowerCase();
        const leftExact = leftTitle === normalizedTerm;
        const rightExact = rightTitle === normalizedTerm;

        if (leftExact !== rightExact) {
            return leftExact ? -1 : 1;
        }

        return leftTitle.localeCompare(rightTitle);
    });
};

export function App(): JSX.Element {
    const [states, setStates] = useState(defaultStates);
    const [exportCopyState, setExportCopyState] = useState<'idle' | 'markdown'>(
        'idle'
    );
    const [query, setQuery] = useState('');
    const [catalogResults, setCatalogResults] = useState<readonly SvglResult[]>(
        []
    );
    const [results, setResults] = useState<readonly SvglResult[]>([]);
    const [catalogStatus, setCatalogStatus] =
        useState<SvglSearchStatus>('loading');
    const [searchStatus, setSearchStatus] = useState<SvglSearchStatus>('ready');
    const [selectedResult, setSelectedResult] = useState<
        SvglResult | undefined
    >(undefined);
    const [selectionStatus, setSelectionStatus] =
        useState<SelectionStatus>('idle');
    const [draft, setDraft] = useState(defaultBadgeDraft);
    const [brandColor, setBrandColor] = useState(defaultBadgeDraft.badgeColor);
    const [colorMode, setColorMode] = useState<ColorMode>('brand');
    const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [exportFolder, setExportFolder] = useState(defaultExportFolder);
    const [exportRepo, setExportRepo] = useState(defaultExportRepo);
    const [sourceDraft, setSourceDraft] = useState(defaultBadgeDraft.source);
    const [languagePreference, setLanguagePreference] =
        useState<LanguagePreference>('en');
    const [themePreference, setThemePreference] =
        useState<ThemePreference>('system');
    const [openPreferenceMenu, setOpenPreferenceMenu] = useState<
        PreferenceMenu | undefined
    >(undefined);
    const [frameDelaySeconds, setFrameDelaySeconds] = useState(frameSeconds);
    const [frameSettingsOpen, setFrameSettingsOpen] = useState(false);
    const [deleteCandidateId, setDeleteCandidateId] = useState<
        string | undefined
    >(undefined);
    const [editingFrameId, setEditingFrameId] = useState<string | undefined>(
        undefined
    );
    const searchInputReference = useRef<HTMLInputElement | undefined>(
        undefined
    );
    const resultsReference = useRef<HTMLDivElement | undefined>(undefined);
    const badgeSvg = useMemo(
        () => buildBadgeSvg(states, frameDelaySeconds),
        [frameDelaySeconds, states]
    );
    const previewSource = useMemo(
        () => (badgeSvg === '' ? '' : toDataUri(badgeSvg)),
        [badgeSvg]
    );
    const materializedDraft = materializeState(
        {
            ...draft,
            id: 'draft-frame',
        },
        0
    );
    const hasActiveDraft =
        editingFrameId !== undefined ||
        (selectedResult !== undefined && selectionStatus === 'ready');
    const draftLogoSource =
        hasActiveDraft && isSvgSource(materializedDraft.source)
            ? toDataUri(materializedDraft.source)
            : undefined;
    useEffect(() => {
        const systemThemeQuery = globalThis.matchMedia(
            '(prefers-color-scheme: dark)'
        );
        const applyThemePreference = (): void => {
            let activeTheme = themePreference;

            if (themePreference === 'system') {
                activeTheme = systemThemeQuery.matches ? 'dark' : 'light';
            }

            document.documentElement.dataset.theme = activeTheme;
        };

        applyThemePreference();

        if (themePreference !== 'system') {
            return undefined;
        }

        systemThemeQuery.addEventListener('change', applyThemePreference);

        return (): void => {
            systemThemeQuery.removeEventListener(
                'change',
                applyThemePreference
            );
        };
    }, [themePreference]);

    useEffect(() => {
        const abortController = new AbortController();

        setCatalogStatus('loading');
        fetch('https://api.svgl.app', {
            signal: abortController.signal,
        })
            .then(async (response) => {
                const payload = (await response.json()) as unknown;

                if (!response.ok) {
                    throw new Error('SVGL catalog failed');
                }

                if (!isSvglResultList(payload)) {
                    throw new TypeError('SVGL catalog payload invalid');
                }

                return payload;
            })
            .then((catalog) => {
                setCatalogResults(sortSvglResults(catalog, ''));
                setCatalogStatus(catalog.length === 0 ? 'empty' : 'ready');
            })
            .catch((error: unknown) => {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                setCatalogResults([]);
                setCatalogStatus('error');
            });

        return (): void => {
            abortController.abort();
        };
    }, []);

    useEffect(() => {
        const searchTerm = query.trim();

        if (searchTerm === '') {
            setResults([]);
            setSearchStatus('ready');
            setSelectedResult(undefined);
            setSelectionStatus('idle');
            return undefined;
        }

        const abortController = new AbortController();
        setSearchStatus('loading');
        const timeoutId = globalThis.setTimeout(
            () => {
                fetch(
                    `https://api.svgl.app?search=${encodeURIComponent(searchTerm)}`,
                    {
                        signal: abortController.signal,
                    }
                )
                    .then(async (response) => {
                        const payload = (await response.json()) as unknown;

                        if (
                            !response.ok &&
                            isSvglApiError(payload) &&
                            isSvglNotFoundResponse(response, payload)
                        ) {
                            return [];
                        }

                        if (!response.ok) {
                            throw new Error('SVGL search failed');
                        }

                        if (!isSvglResultList(payload)) {
                            throw new TypeError('SVGL search payload invalid');
                        }

                        return payload;
                    })
                    .then((searchResults) => {
                        const visibleResults = sortSvglResults(
                            searchResults,
                            searchTerm
                        ).slice(0, maxSvglResults);

                        setResults(visibleResults);
                        setSearchStatus(
                            visibleResults.length === 0 ? 'empty' : 'ready'
                        );
                        setSelectedResult((currentResult) =>
                            visibleResults.some(
                                (result) => result.id === currentResult?.id
                            )
                                ? currentResult
                                : undefined
                        );
                    })
                    .catch((error: unknown) => {
                        if (
                            error instanceof DOMException &&
                            error.name === 'AbortError'
                        ) {
                            return;
                        }

                        setResults([]);
                        setSearchStatus('error');
                        setSelectedResult(undefined);
                    });
            },
            320,
            undefined
        );

        return (): void => {
            abortController.abort();
            globalThis.clearTimeout(timeoutId);
        };
    }, [query]);

    useEffect(() => {
        const resultElement = resultsReference.current;

        if (resultElement === undefined) {
            return;
        }

        resultElement.scrollTop = 0;
    }, [query]);

    useEffect(() => {
        if (!draft.preserveOriginalArtwork) {
            setDraft((currentDraft) =>
                currentDraft.smartRecolor
                    ? { ...currentDraft, smartRecolor: false }
                    : currentDraft
            );
            return undefined;
        }

        let isCurrent = true;
        const { badgeColor, source } = draft;

        logoColorTouchesBadgeEdge(source, badgeColor)
            .then((smartRecolor) => {
                if (!isCurrent) {
                    return;
                }

                setDraft((currentDraft) =>
                    currentDraft.source === source &&
                    currentDraft.badgeColor === badgeColor &&
                    currentDraft.preserveOriginalArtwork &&
                    currentDraft.smartRecolor !== smartRecolor
                        ? { ...currentDraft, smartRecolor }
                        : currentDraft
                );
            })
            .catch(() => {
                if (!isCurrent) {
                    return;
                }

                setDraft((currentDraft) =>
                    currentDraft.smartRecolor
                        ? { ...currentDraft, smartRecolor: false }
                        : currentDraft
                );
            });

        return (): void => {
            isCurrent = false;
        };
    }, [draft.badgeColor, draft.preserveOriginalArtwork, draft.source]);

    const applyColorMode = (
        nextBrandColor: string,
        mode: ColorMode
    ): Pick<
        EditorDraft,
        | 'smartRecolor'
        | 'badgeColor'
        | 'logoColor'
        | 'preserveOriginalArtwork'
        | 'textColor'
    > => {
        const contrastColor = getReadableInk(nextBrandColor);

        if (mode === 'inverse') {
            return {
                smartRecolor: false,
                badgeColor: contrastColor,
                logoColor: nextBrandColor,
                preserveOriginalArtwork: true,
                textColor: nextBrandColor,
            };
        }

        if (mode === 'custom') {
            return {
                smartRecolor: draft.smartRecolor,
                badgeColor: draft.badgeColor,
                logoColor: draft.logoColor,
                preserveOriginalArtwork: draft.preserveOriginalArtwork,
                textColor: draft.textColor,
            };
        }

        return {
            smartRecolor: draft.smartRecolor,
            badgeColor: nextBrandColor,
            logoColor: nextBrandColor,
            preserveOriginalArtwork: true,
            textColor: contrastColor,
        };
    };

    const setDraftBrandColor = (
        nextBrandColor: string,
        mode: ColorMode = colorMode
    ): void => {
        setDraft((currentDraft) => ({
            ...currentDraft,
            ...applyColorMode(nextBrandColor, mode),
        }));
    };

    const selectColorMode = (mode: ColorMode): void => {
        setColorMode(mode);
        setDraftBrandColor(brandColor, mode);
    };

    const updateDraftColor = (value: string): void => {
        const normalizedColor = normalizeHexInput(value);

        if (normalizedColor === undefined) {
            return;
        }

        setBrandColor(normalizedColor);
        setDraft((currentDraft) => ({
            ...currentDraft,
            badgeColor: normalizedColor,
            textColor: getReadableInk(normalizedColor),
        }));
        setColorMode('custom');
    };

    const updateDraftColorChannel = (
        channel: keyof RgbColor,
        value: string
    ): void => {
        const currentColor =
            getRgbColor(draft.badgeColor) ??
            getRgbColor(defaultBadgeDraft.badgeColor);
        const channelValue = Number.parseInt(value, 10);

        if (
            currentColor === undefined ||
            Number.isNaN(channelValue) ||
            channelValue < 0 ||
            channelValue > 255
        ) {
            return;
        }

        updateDraftColor(
            getHexColor({
                ...currentColor,
                [channel]: channelValue,
            })
        );
    };

    const updateDraftHue = (value: string): void => {
        const currentColor =
            getRgbColor(draft.badgeColor) ??
            getRgbColor(defaultBadgeDraft.badgeColor);
        const hue = Number.parseInt(value, 10);

        if (
            currentColor === undefined ||
            Number.isNaN(hue) ||
            hue < 0 ||
            hue > 360
        ) {
            return;
        }

        const currentHsv = getHsvColor(currentColor);

        updateDraftColor(
            getHexColor(
                getRgbFromHsv({
                    ...currentHsv,
                    hue,
                    saturation: Math.max(currentHsv.saturation, 0.72),
                })
            )
        );
    };

    const updateDraftSaturationValue = (
        saturation: number,
        value: number
    ): void => {
        const currentColor =
            getRgbColor(draft.badgeColor) ??
            getRgbColor(defaultBadgeDraft.badgeColor);

        if (currentColor === undefined) {
            return;
        }

        const currentHsv = getHsvColor(currentColor);

        updateDraftColor(
            getHexColor(
                getRgbFromHsv({
                    ...currentHsv,
                    saturation: clampUnit(saturation),
                    value: clampUnit(value),
                })
            )
        );
    };

    const chooseSearchResult = (result: SvglResult): void => {
        setSelectedResult(result);
        setSelectionStatus('loading');
        setEditingFrameId(undefined);
        fetch(getSvglSourceUrl(result.route))
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('SVGL source failed');
                }

                return await response.text();
            })
            .then(async (source) => {
                const extractedBrandColor =
                    getPrimarySvgColor(source) ?? defaultBadgeDraft.badgeColor;
                const modeDraft = applyColorMode(
                    extractedBrandColor,
                    colorMode
                );
                const smartRecolor = await logoColorTouchesBadgeEdge(
                    source,
                    modeDraft.badgeColor
                );

                return {
                    smartRecolor: modeDraft.preserveOriginalArtwork
                        ? smartRecolor
                        : false,
                    extractedBrandColor,
                    modeDraft,
                    source,
                };
            })
            .then(
                ({ smartRecolor, extractedBrandColor, modeDraft, source }) => {
                    setBrandColor(extractedBrandColor);
                    setDraft((currentDraft) => ({
                        ...currentDraft,
                        ...modeDraft,
                        smartRecolor,
                        name: result.title,
                        source,
                    }));
                    setSourceDraft(source);
                    setExportCopyState('idle');
                    setSelectionStatus('ready');
                }
            )
            .catch(() => {
                setSelectionStatus('idle');
            });
    };

    const openSourceDialog = (): void => {
        setSourceDraft(draft.source);
        setSourceDialogOpen(true);
    };

    const saveSourceDialog = (): void => {
        const extractedBrandColor =
            getPrimarySvgColor(sourceDraft) ?? defaultBadgeDraft.badgeColor;

        setBrandColor(extractedBrandColor);
        setDraft((currentDraft) => ({
            ...currentDraft,
            ...applyColorMode(extractedBrandColor, colorMode),
            source: sourceDraft,
        }));
        setSourceDialogOpen(false);
        setExportCopyState('idle');
    };

    const editFrame = (state: BadgeState): void => {
        const nextDraft = materializeState(state, 0);

        setDraft({
            allCaps: nextDraft.allCaps ?? false,
            smartRecolor: nextDraft.smartRecolor ?? false,
            badgeColor: nextDraft.badgeColor,
            logoColor: nextDraft.logoColor,
            name: nextDraft.name,
            preserveOriginalArtwork: nextDraft.preserveOriginalArtwork ?? false,
            source: nextDraft.source,
            textColor: nextDraft.textColor,
        });
        setBrandColor(
            getPrimarySvgColor(nextDraft.source) ?? nextDraft.badgeColor
        );
        setColorMode('custom');
        setEditingFrameId(state.id);
        setSourceDraft(nextDraft.source);
        setSelectionStatus('ready');
    };

    const addDraftFrame = (): void => {
        if (
            editingFrameId === undefined &&
            (selectedResult === undefined || states.length >= maxFrames)
        ) {
            return;
        }

        const nextState = materializeState(
            {
                ...draft,
                id: crypto.randomUUID(),
            },
            states.length
        );

        if (editingFrameId !== undefined) {
            setStates((currentStates) =>
                currentStates.map((state) =>
                    state.id === editingFrameId
                        ? { ...nextState, id: editingFrameId }
                        : state
                )
            );
            setEditingFrameId(undefined);
            setExportCopyState('idle');
            return;
        }

        setStates((currentStates) =>
            currentStates.length >= maxFrames
                ? currentStates
                : [...currentStates, nextState]
        );
        setExportCopyState('idle');
    };

    const updateFrameDelaySeconds = (value: string): void => {
        const nextDelay = Number.parseFloat(value);

        if (Number.isNaN(nextDelay)) {
            return;
        }

        setFrameDelaySeconds(
            Math.min(
                maxFrameDelaySeconds,
                Math.max(minFrameDelaySeconds, nextDelay)
            )
        );
    };

    const confirmDeleteState = (): void => {
        if (deleteCandidateId === undefined || states.length === 0) {
            setDeleteCandidateId(undefined);
            return;
        }

        const stateId = deleteCandidateId;
        const remainingStates = states.filter((state) => state.id !== stateId);

        setStates(remainingStates);

        setExportCopyState('idle');
        setDeleteCandidateId(undefined);
    };

    const downloadSvg = (): void => {
        if (badgeSvg === '') {
            return;
        }

        const blob = new Blob([badgeSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'animated-badge.svg';
        document.body.append(link);
        link.click();
        link.remove();
        globalThis.setTimeout(
            (objectUrl: string) => {
                URL.revokeObjectURL(objectUrl);
            },
            0,
            url
        );
    };

    const normalizedExportFolder = exportFolder
        .trim()
        .replace(/^\/+/u, '')
        .replaceAll(/\/{2,}/gu, '/');
    const exportPath =
        normalizedExportFolder === ''
            ? exportFileName
            : `${normalizedExportFolder.replace(/\/?$/u, '/')}${exportFileName}`;
    const trimmedExportRepo = exportRepo.trim();
    const normalizedExportRepo =
        trimmedExportRepo === '' ? defaultExportRepo : trimmedExportRepo;
    const rawGithubUrl = `https://raw.githubusercontent.com/${normalizedExportRepo}/HEAD/${exportPath}`;
    const readmeMarkdown = `![Animated badge](${rawGithubUrl})`;

    const copyReadmeMarkdown = (): void => {
        navigator.clipboard
            .writeText(readmeMarkdown)
            .then(() => {
                setExportCopyState('markdown');
            })
            .catch(() => {
                setExportCopyState('idle');
            });
    };

    const searchTerm = query.trim();
    const visibleResults = searchTerm === '' ? catalogResults : results;
    const resultStatus = searchTerm === '' ? catalogStatus : searchStatus;
    const resultsAreLoading = resultStatus === 'loading';
    const draftPrimaryColor =
        normalizeHexInput(draft.badgeColor) ?? defaultBadgeDraft.badgeColor;
    const draftPrimaryRgb =
        getRgbColor(draftPrimaryColor) ??
        getRgbColor(defaultBadgeDraft.badgeColor);
    const draftPrimaryHsv =
        draftPrimaryRgb === undefined
            ? { hue: 0, saturation: 0, value: 0 }
            : getHsvColor(draftPrimaryRgb);
    const draftPrimaryHueColor = getHexColor(
        getRgbFromHsv({
            hue: draftPrimaryHsv.hue,
            saturation: 1,
            value: 1,
        })
    );
    const colorPickerStyle = {
        '--color-control-hue': draftPrimaryHueColor,
        '--color-control-saturation': `${draftPrimaryHsv.saturation * 100}%`,
        '--color-control-value': `${(1 - draftPrimaryHsv.value) * 100}%`,
    } as CSSProperties;
    const variantPreviews = (
        [
            ['brand', 'Default'],
            ['inverse', 'Inverse'],
        ] as const satisfies ReadonlyArray<readonly [VariantMode, string]>
    ).map(([mode, label]) => {
        const variantDraft = {
            ...draft,
            ...applyColorMode(brandColor, mode),
            id: `variant-${mode}`,
        };

        return {
            label,
            mode,
            source: toDataUri(buildSingleBadgeSvg(variantDraft, 0)),
        };
    });
    const updateColorPadFromPoint = (
        clientX: number,
        clientY: number,
        element: HTMLElement
    ): void => {
        const rect = element.getBoundingClientRect();

        updateDraftSaturationValue(
            (clientX - rect.left) / rect.width,
            1 - (clientY - rect.top) / rect.height
        );
    };

    return (
        <main className='app'>
            <section aria-labelledby='builder-title' className='builder'>
                <header className='topbar'>
                    <a aria-label='Badgical' className='brand-badge' href='/'>
                        <span aria-hidden='true' className='brand-badge__icon'>
                            <img alt='' src='/badgical-spark.svg' />
                        </span>
                        <span className='brand-badge__word'>Badgical</span>
                    </a>
                    <h1 className='visually-hidden' id='builder-title'>
                        Badgical badge builder
                    </h1>
                    <div className='topbar-actions'>
                        <div className='preference-menu'>
                            <button
                                aria-expanded={
                                    openPreferenceMenu === 'language'
                                }
                                aria-haspopup='menu'
                                className='preference-trigger'
                                onClick={() => {
                                    setOpenPreferenceMenu((currentMenu) =>
                                        currentMenu === 'language'
                                            ? undefined
                                            : 'language'
                                    );
                                }}
                                type='button'
                            >
                                <Languages aria-hidden='true' size={16} />
                                <span>
                                    {
                                        languagePreferenceLabels[
                                            languagePreference
                                        ]
                                    }
                                </span>
                                <ChevronDown aria-hidden='true' size={16} />
                            </button>
                            {openPreferenceMenu === 'language' ? (
                                <div
                                    aria-label='Language'
                                    className='preference-options'
                                    role='menu'
                                >
                                    {(
                                        Object.entries(
                                            languagePreferenceLabels
                                        ) as Array<[LanguagePreference, string]>
                                    ).map(([value, label]) => (
                                        <button
                                            aria-checked={
                                                languagePreference === value
                                            }
                                            className='preference-option'
                                            key={value}
                                            onClick={() => {
                                                setLanguagePreference(value);
                                                setOpenPreferenceMenu(
                                                    undefined
                                                );
                                            }}
                                            role='menuitemradio'
                                            type='button'
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            ) : undefined}
                        </div>
                        <div className='preference-menu'>
                            <button
                                aria-expanded={openPreferenceMenu === 'theme'}
                                aria-haspopup='menu'
                                className='preference-trigger'
                                onClick={() => {
                                    setOpenPreferenceMenu((currentMenu) =>
                                        currentMenu === 'theme'
                                            ? undefined
                                            : 'theme'
                                    );
                                }}
                                type='button'
                            >
                                <SunMoon aria-hidden='true' size={16} />
                                <span>
                                    {themePreferenceLabels[themePreference]}
                                </span>
                                <ChevronDown aria-hidden='true' size={16} />
                            </button>
                            {openPreferenceMenu === 'theme' ? (
                                <div
                                    aria-label='Theme'
                                    className='preference-options'
                                    role='menu'
                                >
                                    {(
                                        Object.entries(
                                            themePreferenceLabels
                                        ) as Array<[ThemePreference, string]>
                                    ).map(([value, label]) => (
                                        <button
                                            aria-checked={
                                                themePreference === value
                                            }
                                            className='preference-option'
                                            key={value}
                                            onClick={() => {
                                                setThemePreference(value);
                                                setOpenPreferenceMenu(
                                                    undefined
                                                );
                                            }}
                                            role='menuitemradio'
                                            type='button'
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            ) : undefined}
                        </div>
                        <a
                            aria-label='Open Badgical on GitHub'
                            className='icon-button'
                            href={githubUrl}
                            rel='noreferrer'
                            target='_blank'
                            title='GitHub'
                        >
                            <GitHubMark />
                        </a>
                    </div>
                </header>

                <div className='builder__workspace'>
                    <section className='tool-panel'>
                        <section
                            aria-labelledby='content-title'
                            className='compose-panel'
                        >
                            <div className='search-block'>
                                <div className='visually-hidden'>
                                    <h2 id='content-title'>Badge Content</h2>
                                </div>

                                <section
                                    aria-label='Search brands'
                                    className='search-panel'
                                >
                                    <div
                                        className='search-shell'
                                        onClick={() => {
                                            searchInputReference.current?.focus();
                                        }}
                                    >
                                        <label className='search-field__input'>
                                            <Search
                                                aria-hidden='true'
                                                size={24}
                                            />
                                            <input
                                                aria-label='Search brand'
                                                autoFocus
                                                onChange={(event) => {
                                                    setQuery(
                                                        event.target.value
                                                    );
                                                    setSelectedResult(
                                                        undefined
                                                    );
                                                    setSelectionStatus('idle');
                                                }}
                                                placeholder='Search...'
                                                ref={(element) => {
                                                    searchInputReference.current =
                                                        element ?? undefined;
                                                }}
                                                value={query}
                                            />
                                        </label>
                                        <div
                                            className='search-actions'
                                            onClick={(event) => {
                                                event.stopPropagation();
                                            }}
                                        >
                                            <a
                                                className='powered-by'
                                                href={svglUrl}
                                                rel='noreferrer'
                                                target='_blank'
                                            >
                                                Powered by <span>Svgl</span>
                                            </a>
                                        </div>
                                    </div>

                                    <div
                                        aria-busy={resultsAreLoading}
                                        className='brand-results'
                                        ref={(element) => {
                                            resultsReference.current =
                                                element ?? undefined;
                                        }}
                                    >
                                        {visibleResults.length === 0 ? (
                                            <div
                                                aria-hidden='true'
                                                className='search-empty'
                                            />
                                        ) : (
                                            <div
                                                aria-label='SVGL logos'
                                                className='brand-results__canvas'
                                            >
                                                {visibleResults.map(
                                                    (result) => (
                                                        <button
                                                            aria-current={
                                                                result.id ===
                                                                selectedResult?.id
                                                                    ? 'true'
                                                                    : undefined
                                                            }
                                                            className='brand-result'
                                                            key={result.id}
                                                            onClick={() => {
                                                                chooseSearchResult(
                                                                    result
                                                                );
                                                            }}
                                                            type='button'
                                                        >
                                                            <img
                                                                alt=''
                                                                src={getSvglRoute(
                                                                    result.route
                                                                )}
                                                            />
                                                            <span>
                                                                {result.title}
                                                            </span>
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section
                                    aria-label='Advanced badge controls'
                                    className='advanced-panel'
                                >
                                    <div className='advanced-controls'>
                                        <h2 className='advanced-controls__title'>
                                            Custom Edits
                                        </h2>
                                        <div className='advanced-controls__left'>
                                            <div className='advanced-top-row'>
                                                <div className='field advanced-svg-field'>
                                                    <button
                                                        aria-label='Edit SVG source'
                                                        className='advanced-logo-preview'
                                                        onClick={
                                                            openSourceDialog
                                                        }
                                                        type='button'
                                                    >
                                                        {draftLogoSource ===
                                                        undefined ? (
                                                            <span
                                                                aria-hidden='true'
                                                                className='logo-placeholder'
                                                            />
                                                        ) : (
                                                            <img
                                                                alt=''
                                                                src={
                                                                    draftLogoSource
                                                                }
                                                            />
                                                        )}
                                                    </button>
                                                </div>

                                                <label className='field advanced-text-field'>
                                                    <span className='advanced-text-input'>
                                                        <input
                                                            aria-label='Badge text'
                                                            onChange={(
                                                                event
                                                            ) => {
                                                                setDraft(
                                                                    (
                                                                        currentDraft
                                                                    ) => ({
                                                                        ...currentDraft,
                                                                        name: event
                                                                            .target
                                                                            .value,
                                                                    })
                                                                );
                                                            }}
                                                            placeholder='Badge text'
                                                            value={draft.name}
                                                        />
                                                    </span>
                                                </label>
                                            </div>

                                            <div className='field advanced-color-field'>
                                                <div className='color-control'>
                                                    <div
                                                        className='color-control__visuals'
                                                        style={colorPickerStyle}
                                                    >
                                                        <button
                                                            aria-label={`Primary color saturation and brightness ${draftPrimaryColor}`}
                                                            className='color-control__pad'
                                                            onKeyDown={(
                                                                event
                                                            ) => {
                                                                const step =
                                                                    event.shiftKey
                                                                        ? 0.12
                                                                        : 0.04;

                                                                switch (
                                                                    event.key
                                                                ) {
                                                                    case 'ArrowLeft': {
                                                                        event.preventDefault();
                                                                        updateDraftSaturationValue(
                                                                            draftPrimaryHsv.saturation -
                                                                                step,
                                                                            draftPrimaryHsv.value
                                                                        );
                                                                        break;
                                                                    }

                                                                    case 'ArrowRight': {
                                                                        event.preventDefault();
                                                                        updateDraftSaturationValue(
                                                                            draftPrimaryHsv.saturation +
                                                                                step,
                                                                            draftPrimaryHsv.value
                                                                        );
                                                                        break;
                                                                    }

                                                                    case 'ArrowUp': {
                                                                        event.preventDefault();
                                                                        updateDraftSaturationValue(
                                                                            draftPrimaryHsv.saturation,
                                                                            draftPrimaryHsv.value +
                                                                                step
                                                                        );
                                                                        break;
                                                                    }

                                                                    case 'ArrowDown': {
                                                                        event.preventDefault();
                                                                        updateDraftSaturationValue(
                                                                            draftPrimaryHsv.saturation,
                                                                            draftPrimaryHsv.value -
                                                                                step
                                                                        );
                                                                        break;
                                                                    }

                                                                    default: {
                                                                        break;
                                                                    }
                                                                }
                                                            }}
                                                            onPointerDown={(
                                                                event
                                                            ) => {
                                                                event.currentTarget.setPointerCapture(
                                                                    event.pointerId
                                                                );
                                                                updateColorPadFromPoint(
                                                                    event.clientX,
                                                                    event.clientY,
                                                                    event.currentTarget
                                                                );
                                                            }}
                                                            onPointerMove={(
                                                                event
                                                            ) => {
                                                                if (
                                                                    event.buttons !==
                                                                    1
                                                                ) {
                                                                    return;
                                                                }

                                                                updateColorPadFromPoint(
                                                                    event.clientX,
                                                                    event.clientY,
                                                                    event.currentTarget
                                                                );
                                                            }}
                                                            type='button'
                                                        >
                                                            <span className='color-control__dot' />
                                                        </button>
                                                    </div>

                                                    <div className='color-control__inputs'>
                                                        <label className='color-control__hex-row'>
                                                            <span>Hex</span>
                                                            <input
                                                                aria-label='Primary hex'
                                                                onChange={(
                                                                    event
                                                                ) => {
                                                                    updateDraftColor(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    );
                                                                }}
                                                                value={
                                                                    draftPrimaryColor
                                                                }
                                                            />
                                                        </label>

                                                        <div className='color-control__rgb-row'>
                                                            <span>RGB</span>
                                                            <div className='color-control__rgb-group'>
                                                                <input
                                                                    aria-label='Primary red'
                                                                    max='255'
                                                                    min='0'
                                                                    onChange={(
                                                                        event
                                                                    ) => {
                                                                        updateDraftColorChannel(
                                                                            'red',
                                                                            event
                                                                                .target
                                                                                .value
                                                                        );
                                                                    }}
                                                                    type='number'
                                                                    value={
                                                                        draftPrimaryRgb?.red ??
                                                                        0
                                                                    }
                                                                />
                                                                <span>,</span>
                                                                <input
                                                                    aria-label='Primary green'
                                                                    max='255'
                                                                    min='0'
                                                                    onChange={(
                                                                        event
                                                                    ) => {
                                                                        updateDraftColorChannel(
                                                                            'green',
                                                                            event
                                                                                .target
                                                                                .value
                                                                        );
                                                                    }}
                                                                    type='number'
                                                                    value={
                                                                        draftPrimaryRgb?.green ??
                                                                        0
                                                                    }
                                                                />
                                                                <span>,</span>
                                                                <input
                                                                    aria-label='Primary blue'
                                                                    max='255'
                                                                    min='0'
                                                                    onChange={(
                                                                        event
                                                                    ) => {
                                                                        updateDraftColorChannel(
                                                                            'blue',
                                                                            event
                                                                                .target
                                                                                .value
                                                                        );
                                                                    }}
                                                                    type='number'
                                                                    value={
                                                                        draftPrimaryRgb?.blue ??
                                                                        0
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        <label className='color-control__hue-row'>
                                                            <span>Hue</span>
                                                            <input
                                                                aria-label='Primary color hue'
                                                                className='color-control__hue'
                                                                max='360'
                                                                min='0'
                                                                onChange={(
                                                                    event
                                                                ) => {
                                                                    updateDraftHue(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    );
                                                                }}
                                                                step='1'
                                                                type='range'
                                                                value={
                                                                    draftPrimaryHsv.hue
                                                                }
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className='advanced-preview-stack'>
                                        <div
                                            aria-label='Badge variants'
                                            className='variant-options'
                                        >
                                            {hasActiveDraft ? (
                                                variantPreviews.map(
                                                    (variant) => (
                                                        <button
                                                            aria-pressed={
                                                                colorMode ===
                                                                variant.mode
                                                            }
                                                            className='variant-card'
                                                            key={variant.mode}
                                                            onClick={() => {
                                                                selectColorMode(
                                                                    variant.mode
                                                                );
                                                            }}
                                                            type='button'
                                                        >
                                                            <img
                                                                alt=''
                                                                src={
                                                                    variant.source
                                                                }
                                                            />
                                                            <span>
                                                                {variant.label}
                                                            </span>
                                                        </button>
                                                    )
                                                )
                                            ) : (
                                                <div className='empty-state advanced-preview-empty'>
                                                    <p>
                                                        Pick a brand to preview
                                                        badge variants.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            className='button button--primary add-frame'
                                            disabled={
                                                editingFrameId === undefined &&
                                                (selectedResult === undefined ||
                                                    selectionStatus !==
                                                        'ready' ||
                                                    states.length >= maxFrames)
                                            }
                                            onClick={addDraftFrame}
                                            type='button'
                                        >
                                            {editingFrameId === undefined ? (
                                                <Plus
                                                    aria-hidden='true'
                                                    size={16}
                                                />
                                            ) : (
                                                <Pencil
                                                    aria-hidden='true'
                                                    size={16}
                                                />
                                            )}
                                            {editingFrameId === undefined
                                                ? 'Add Frame'
                                                : 'Update Frame'}
                                        </button>
                                    </div>
                                </section>
                            </div>
                        </section>

                        <aside
                            aria-labelledby='frames-title'
                            className='frame-rail'
                        >
                            <section className='frames'>
                                <div className='panel-heading'>
                                    <div className='panel-title-row'>
                                        <h2 id='frames-title'>Frames</h2>
                                        <span className='panel-meta'>
                                            {states.length}/{maxFrames}
                                        </span>
                                    </div>
                                    <div className='panel-menu'>
                                        <button
                                            aria-expanded={frameSettingsOpen}
                                            aria-label='Frame settings'
                                            className='icon-button panel-menu__button'
                                            onClick={() => {
                                                setFrameSettingsOpen(
                                                    (isOpen) => !isOpen
                                                );
                                            }}
                                            title='Frame settings'
                                            type='button'
                                        >
                                            <MoreHorizontal
                                                aria-hidden='true'
                                                size={20}
                                            />
                                        </button>
                                        {frameSettingsOpen ? (
                                            <div className='settings-popover'>
                                                <label className='field'>
                                                    <span>Animation delay</span>
                                                    <input
                                                        max={
                                                            maxFrameDelaySeconds
                                                        }
                                                        min={
                                                            minFrameDelaySeconds
                                                        }
                                                        onChange={(event) => {
                                                            updateFrameDelaySeconds(
                                                                event.target
                                                                    .value
                                                            );
                                                        }}
                                                        step='0.2'
                                                        type='range'
                                                        value={
                                                            frameDelaySeconds
                                                        }
                                                    />
                                                </label>
                                                <label className='settings-value-row'>
                                                    <input
                                                        aria-label='Animation delay seconds'
                                                        max={
                                                            maxFrameDelaySeconds
                                                        }
                                                        min={
                                                            minFrameDelaySeconds
                                                        }
                                                        onChange={(event) => {
                                                            updateFrameDelaySeconds(
                                                                event.target
                                                                    .value
                                                            );
                                                        }}
                                                        step='0.2'
                                                        type='number'
                                                        value={
                                                            frameDelaySeconds
                                                        }
                                                    />
                                                    <span>Sec</span>
                                                </label>
                                            </div>
                                        ) : undefined}
                                    </div>
                                </div>

                                <div
                                    className={
                                        states.length === 0
                                            ? 'frame-list frame-list--empty'
                                            : 'frame-list'
                                    }
                                >
                                    {states.length === 0 ? (
                                        <div className='empty-state frame-list__empty'>
                                            <p>
                                                Pick a brand and add the first
                                                frame.
                                            </p>
                                        </div>
                                    ) : undefined}
                                    {states.map((state, index) => {
                                        const materializedState =
                                            materializeState(state, index);
                                        const frameBadge = toDataUri(
                                            buildSingleBadgeSvg(
                                                materializedState,
                                                index
                                            )
                                        );

                                        return (
                                            <div
                                                aria-current={
                                                    editingFrameId === state.id
                                                        ? 'true'
                                                        : undefined
                                                }
                                                className='frame-card'
                                                key={state.id}
                                            >
                                                <img
                                                    alt={`${materializedState.name} badge`}
                                                    src={frameBadge}
                                                />
                                                <div className='frame-card__actions'>
                                                    <button
                                                        aria-label={`Edit ${materializedState.name}`}
                                                        className='frame-card__button'
                                                        onClick={() => {
                                                            editFrame(state);
                                                        }}
                                                        title='Edit frame'
                                                        type='button'
                                                    >
                                                        <Pencil
                                                            aria-hidden='true'
                                                            size={16}
                                                        />
                                                    </button>
                                                    <button
                                                        aria-label={`Delete ${materializedState.name}`}
                                                        className='frame-card__button'
                                                        onClick={() => {
                                                            setDeleteCandidateId(
                                                                state.id
                                                            );
                                                        }}
                                                        title='Delete frame'
                                                        type='button'
                                                    >
                                                        <X
                                                            aria-hidden='true'
                                                            size={16}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <section aria-label='Preview' className='output'>
                                <div className='panel-heading'>
                                    <h2>The Badgic</h2>
                                </div>
                                <div className='output__showcase'>
                                    <div className='preview'>
                                        {previewSource === '' ? (
                                            <span>
                                                Add frames to preview the
                                                animated badge.
                                            </span>
                                        ) : (
                                            <img
                                                alt='Generated animated badge preview'
                                                src={previewSource}
                                            />
                                        )}
                                    </div>

                                    <div className='output__actions'>
                                        <button
                                            aria-label='Export animated SVG'
                                            className='button button--primary'
                                            disabled={badgeSvg === ''}
                                            onClick={() => {
                                                setExportDialogOpen(true);
                                            }}
                                            title='Export'
                                            type='button'
                                        >
                                            <Download
                                                aria-hidden='true'
                                                size={16}
                                            />
                                            Export
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </aside>
                    </section>
                </div>
            </section>

            {deleteCandidateId === undefined ? undefined : (
                <div className='confirm-backdrop' role='presentation'>
                    <section
                        aria-labelledby='delete-frame-title'
                        aria-modal='true'
                        className='confirm-dialog'
                        role='dialog'
                    >
                        <div className='panel-heading'>
                            <h2 id='delete-frame-title'>Delete Frame</h2>
                        </div>
                        <p>This removes the frame from the badge animation.</p>
                        <div className='confirm-dialog__actions'>
                            <button
                                className='button button--secondary'
                                onClick={() => {
                                    setDeleteCandidateId(undefined);
                                }}
                                type='button'
                            >
                                Cancel
                            </button>
                            <button
                                className='button button--primary'
                                onClick={confirmDeleteState}
                                type='button'
                            >
                                Delete
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {sourceDialogOpen ? (
                <div className='confirm-backdrop' role='presentation'>
                    <section
                        aria-labelledby='source-dialog-title'
                        aria-modal='true'
                        className='confirm-dialog source-dialog'
                        role='dialog'
                    >
                        <div className='panel-heading'>
                            <h2 id='source-dialog-title'>SVG Source</h2>
                        </div>
                        <label className='field source-dialog__field'>
                            <span>Logo SVG</span>
                            <textarea
                                onChange={(event) => {
                                    setSourceDraft(event.target.value);
                                }}
                                value={sourceDraft}
                            />
                        </label>
                        <div className='confirm-dialog__actions'>
                            <button
                                className='button button--secondary'
                                onClick={() => {
                                    setSourceDialogOpen(false);
                                }}
                                type='button'
                            >
                                Cancel
                            </button>
                            <button
                                className='button button--primary'
                                onClick={saveSourceDialog}
                                type='button'
                            >
                                Save
                            </button>
                        </div>
                    </section>
                </div>
            ) : undefined}

            {exportDialogOpen ? (
                <div className='confirm-backdrop' role='presentation'>
                    <section
                        aria-labelledby='export-dialog-title'
                        aria-modal='true'
                        className='confirm-dialog export-dialog'
                        role='dialog'
                    >
                        <div className='panel-heading'>
                            <h2 id='export-dialog-title'>Export Badge</h2>
                        </div>

                        <div className='export-guide'>
                            <p>
                                Download the SVG, place it at{' '}
                                <code>{exportPath}</code> in{' '}
                                <code>{normalizedExportRepo}</code>, then paste
                                the README Markdown below.
                            </p>
                        </div>

                        <div className='export-fields'>
                            <label className='field'>
                                <span>Repository</span>
                                <input
                                    onChange={(event) => {
                                        setExportRepo(event.target.value);
                                        setExportCopyState('idle');
                                    }}
                                    placeholder='username/repo'
                                    value={exportRepo}
                                />
                            </label>
                            <label className='field'>
                                <span>Folder</span>
                                <input
                                    onChange={(event) => {
                                        setExportFolder(event.target.value);
                                        setExportCopyState('idle');
                                    }}
                                    placeholder={defaultExportFolder}
                                    value={exportFolder}
                                />
                            </label>
                        </div>

                        <label className='field export-field'>
                            <span>README Markdown</span>
                            <textarea readOnly value={readmeMarkdown} />
                        </label>

                        <div className='confirm-dialog__actions export-dialog__actions'>
                            <button
                                className='button button--secondary'
                                onClick={() => {
                                    setExportDialogOpen(false);
                                }}
                                type='button'
                            >
                                Close
                            </button>
                            <button
                                className='button button--primary'
                                onClick={copyReadmeMarkdown}
                                type='button'
                            >
                                <Copy aria-hidden='true' size={16} />
                                {exportCopyState === 'markdown'
                                    ? 'Copied'
                                    : 'Copy Markdown'}
                            </button>
                            <button
                                className='button button--primary'
                                onClick={downloadSvg}
                                type='button'
                            >
                                <Download aria-hidden='true' size={16} />
                                Download SVG
                            </button>
                        </div>
                    </section>
                </div>
            ) : undefined}
        </main>
    );
}
