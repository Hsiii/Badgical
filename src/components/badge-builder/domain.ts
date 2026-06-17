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
export const textPadding = 16;
export const textSize = 10;
export const frameSeconds = 2.4;
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

export const escapeXml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');

export const compactNumber = (value: number): string =>
    Number(value.toFixed(2)).toString();

export const clampUnit = (value: number): number =>
    Math.min(1, Math.max(0, value));

export const minifySvgSource = (source: string): string =>
    source
        .trim()
        .replaceAll(/<!--[\S\s]*?-->/g, '')
        .replaceAll(/>\s+</g, '><')
        .replaceAll(/\s{2,}/g, ' ')
        .replaceAll(/\s+\/>/g, '/>')
        .replaceAll(';}', '}')
        .replaceAll(/:\s+/g, ':')
        .replaceAll(/,\s+/g, ',');

export const ensureSvgNamespace = (source: string): string => {
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

export const isSvgSource = (source: string): boolean =>
    /^<svg\b[\S\s]*<\/svg>$/iu.test(minifySvgSource(source));

export const compactColor = (color: string): string =>
    color.replace(/^#([\dA-Fa-f])\1([\dA-Fa-f])\2([\dA-Fa-f])\3$/, '#$1$2$3');

export const colorizeSvgContent = (content: string, color: string): string =>
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

export const inlineSvgArtwork = (
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

export const toDataUri = (source: string): string => {
    const encodedSource = encodeURIComponent(
        ensureSvgNamespace(minifySvgSource(source))
    )
        .replaceAll("'", '%27')
        .replaceAll('"', '%22');

    return `data:image/svg+xml,${encodedSource}`;
};

export const getReadableInk = (color: string): string => {
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

export const normalizeHexInput = (value: string): string | undefined => {
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

export const getRgbColor = (color: string): RgbColor | undefined => {
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

export const getHexChannel = (value: number): string =>
    Math.round(Math.min(255, Math.max(0, value)))
        .toString(16)
        .padStart(2, '0');

export const getHexColor = ({ blue, green, red }: RgbColor): string =>
    `#${getHexChannel(red)}${getHexChannel(green)}${getHexChannel(blue)}`;

export const getHsvColor = ({ blue, green, red }: RgbColor): HsvColor => {
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

export const getRgbFromHsv = ({
    hue,
    saturation,
    value,
}: HsvColor): RgbColor => {
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

export const getColorDistance = (
    red: number,
    green: number,
    blue: number,
    color: RgbColor
): number =>
    Math.hypot(red - color.red, green - color.green, blue - color.blue);

export const getRelativeLuminance = (color: RgbColor): number =>
    (color.red * 299 + color.green * 587 + color.blue * 114) / 255_000;

export const getGrayHex = (luminance: number): string => {
    const boundedLuminance = Math.min(1, Math.max(0, luminance));
    const channel = Math.round(boundedLuminance * 255)
        .toString(16)
        .padStart(2, '0');

    return `#${channel}${channel}${channel}`;
};

export const getSmartRecolorPaint = (
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

export const smartRecolorSvgPaint = (
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

export const smartRecolorSvgContent = (
    content: string,
    badgeColor: string
): string =>
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

export const hasTransparentNeighbor = (
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

export const loadSvgImage = async (source: string): Promise<HTMLImageElement> =>
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

export const logoColorTouchesBadgeEdge = async (
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

export const materializeState = (
    state: BadgeState,
    _index: number
): BadgeState => {
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

export const getDisplayName = (state: BadgeState): string =>
    state.allCaps === true ? state.name.toUpperCase() : state.name;

export const normalizeStates = (
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

export const getBadgeWidth = (states: readonly BadgeState[]): number => {
    let longestName = 0;

    for (const state of states) {
        longestName = Math.max(longestName, state.name.length);
    }

    return Math.max(
        minBadgeWidth,
        textStart + textPadding + Math.ceil(longestName * 7)
    );
};

export const buildAnimationSteps = (stateCount: number): string => {
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

export const buildBadgeSvg = (
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

export const buildSingleBadgeSvg = (
    state: BadgeState,
    index: number,
    preserveOriginalArtwork = false
): string =>
    buildBadgeSvg(
        [materializeState(state, index)],
        frameSeconds,
        preserveOriginalArtwork
    );

export const getSvglRoute = (route: string | SvglRouteOptions): string =>
    typeof route === 'string' ? route : route.light;

export const isSvglNotFoundResponse = (
    response: Response,
    payload: SvglApiError
): boolean =>
    response.status === 404 &&
    payload.error?.includes('SVG not found') === true;

export const isSvglApiError = (payload: unknown): payload is SvglApiError =>
    typeof payload === 'object' && payload !== null && 'error' in payload;

export const isSvglResultList = (
    payload: unknown
): payload is readonly SvglResult[] =>
    typeof payload === 'object' &&
    payload !== null &&
    'length' in payload &&
    'slice' in payload &&
    typeof payload.length === 'number' &&
    typeof payload.slice === 'function';

export const getSvglSourceUrl = (route: string | SvglRouteOptions): string => {
    const svgRoute = getSvglRoute(route);

    try {
        const { pathname } = new URL(svgRoute);
        const svgName = pathname.split('/').at(-1) ?? '';

        return `https://api.svgl.app/svg/${svgName}`;
    } catch {
        return svgRoute;
    }
};

export const sortCopy = <Value>(
    values: readonly Value[],
    compare: (leftValue: Value, rightValue: Value) => number
): readonly Value[] => {
    const sortedValues = [...values];

    // eslint-disable-next-line unicorn/no-array-sort
    return sortedValues.sort(compare);
};

export const getColorWeight = (color: string): number => {
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

export const getPrimarySvgColor = (source: string): string | undefined => {
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

export const sortSvglResults = (
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
