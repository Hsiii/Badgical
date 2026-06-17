import {
    getGrayHex,
    getReadableInk,
    getRelativeLuminance,
    getRgbColor,
} from '@/components/badge-builder/colors';
import {
    badgeHeight,
    defaultBadgeDraft,
    frameSeconds,
    logoSize,
    logoX,
    logoY,
    minBadgeWidth,
    textSize,
    textStart,
} from '@/components/badge-builder/constants';
import type {
    AnimationType,
    BadgeState,
} from '@/components/badge-builder/types';

export const escapeXml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');

export const compactNumber = (value: number): string =>
    Number(value.toFixed(2)).toString();

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

export const logoTextGap = textStart - logoX - logoSize;
export const estimatedCharacterWidth = 5.9;
export const estimatedChWidth = 6.4;
export const badgeInlinePadding = estimatedChWidth * 2;

const estimatedGlyphWidths = {
    ' ': 3,
    '!': 3.2,
    '"': 4,
    '#': 6.4,
    '$': 6.4,
    '%': 9.2,
    '&': 7.4,
    "'": 2.4,
    '(': 3.8,
    ')': 3.8,
    '*': 4.8,
    '+': 6.8,
    ',': 3,
    '-': 3.8,
    '.': 3,
    '/': 3.6,
    '0': estimatedChWidth,
    '1': estimatedChWidth,
    '2': estimatedChWidth,
    '3': estimatedChWidth,
    '4': estimatedChWidth,
    '5': estimatedChWidth,
    '6': estimatedChWidth,
    '7': estimatedChWidth,
    '8': estimatedChWidth,
    '9': estimatedChWidth,
    ':': 3.2,
    ';': 3.2,
    '<': 6.8,
    '=': 6.8,
    '>': 6.8,
    '?': 5.8,
    '@': 10.2,
    'A': 7.2,
    'B': 7,
    'C': 7.2,
    'D': 7.4,
    'E': 6.6,
    'F': 6.1,
    'G': 7.8,
    'H': 7.4,
    'I': 3.2,
    'J': 5.4,
    'K': 7,
    'L': 5.9,
    'M': 8.6,
    'N': 7.4,
    'O': 7.8,
    'P': 6.6,
    'Q': 7.8,
    'R': 7.2,
    'S': 6.6,
    'T': 6.2,
    'U': 7.4,
    'V': 7.1,
    'W': 9.4,
    'X': 7,
    'Y': 7,
    'Z': 6.6,
    '[': 3.4,
    '\\': 3.6,
    ']': 3.4,
    '^': 5.6,
    '_': 5.6,
    '`': 3.6,
    'a': 6,
    'b': 6.2,
    'c': 5.7,
    'd': 6.2,
    'e': 5.8,
    'f': 3.9,
    'g': 6.2,
    'h': 6.2,
    'i': 2.8,
    'j': 3.1,
    'k': 5.9,
    'l': 2.8,
    'm': 8.8,
    'n': 6.2,
    'o': 6.1,
    'p': 6.2,
    'q': 6.2,
    'r': 4.2,
    's': 5.2,
    't': 4,
    'u': 6.2,
    'v': 5.8,
    'w': 8.2,
    'x': 5.8,
    'y': 5.8,
    'z': 5.2,
    '{': 3.8,
    '|': 2.8,
    '}': 3.8,
    '~': 6.8,
} as const;

export const getEstimatedGlyphWidth = (character: string): number => {
    if (character in estimatedGlyphWidths) {
        return estimatedGlyphWidths[
            character as keyof typeof estimatedGlyphWidths
        ];
    }

    return /[\u2E80-\u9FFF]/u.test(character)
        ? textSize
        : estimatedCharacterWidth;
};

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

export const inlineSvgArtwork = (
    source: string,
    logoColor: string,
    preserveOriginalArtwork = false,
    smartRecolorBadgeColor?: string,
    artworkX = logoX
): string => {
    const svgSource = minifySvgSource(source)
        .replaceAll(/<\?xml[\S\s]*?\?>/g, '')
        .replaceAll(/<!doctype[\S\s]*?>/gi, '');
    const svgMatch = /^<svg\b([^>]*)>([\S\s]*)<\/svg>$/iu.exec(svgSource);

    if (svgMatch === null) {
        return `<image x="${compactNumber(artworkX)}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${escapeXml(toDataUri(source))}"/>`;
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

        return `<svg x="${compactNumber(artworkX)}" y="${logoY}" width="${logoSize}" height="${logoSize}"${viewBoxAttribute}>${artworkContent}</svg>`;
    }

    return `<svg x="${compactNumber(artworkX)}" y="${logoY}" width="${logoSize}" height="${logoSize}"${viewBoxAttribute}><g fill="${escapeXml(logoColor)}" stroke="${escapeXml(logoColor)}" style="color:${escapeXml(logoColor)}">${colorizeSvgContent(content, logoColor)}</g></svg>`;
};

export const toDataUri = (source: string): string => {
    const encodedSource = encodeURIComponent(
        ensureSvgNamespace(minifySvgSource(source))
    )
        .replaceAll("'", '%27')
        .replaceAll('"', '%22');

    return `data:image/svg+xml,${encodedSource}`;
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

export const getEstimatedTextWidth = (state: BadgeState): number => {
    let width = 0;

    for (const character of getDisplayName(state)) {
        width += getEstimatedGlyphWidth(character);
    }

    return Math.ceil(width);
};

export const getBadgeContentWidth = (state: BadgeState): number =>
    logoSize + logoTextGap + getEstimatedTextWidth(state);

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
    let longestContentWidth = 0;

    for (const state of states) {
        longestContentWidth = Math.max(
            longestContentWidth,
            getBadgeContentWidth(state)
        );
    }

    return Math.ceil(
        Math.max(minBadgeWidth, longestContentWidth + badgeInlinePadding)
    );
};

export const buildAnimationSteps = (
    stateCount: number,
    distance: number
): string => {
    if (stateCount < 2) {
        return '0%,100%{transform:translateY(0)}';
    }

    const totalFrames = stateCount;
    const holdShare = 0.72;

    return Array.from({ length: stateCount }, (_value, index) => {
        const frameStart = (index / totalFrames) * 100;
        const frameHoldEnd = ((index + holdShare) / totalFrames) * 100;
        const frameEnd = ((index + 1) / totalFrames) * 100;
        const offset = index * distance;

        return `${compactNumber(frameStart)}%,${compactNumber(frameHoldEnd)}%{transform:translateY(-${offset}px)}${compactNumber(frameEnd)}%{transform:translateY(-${offset + distance}px)}`;
    }).join('');
};

export const buildCarouselAnimationSteps = (
    stateCount: number,
    distance: number
): string => {
    if (stateCount < 2) {
        return '0%,100%{transform:translateX(0)}';
    }

    const totalFrames = stateCount;
    const holdShare = 0.72;

    return Array.from({ length: stateCount }, (_value, index) => {
        const frameStart = (index / totalFrames) * 100;
        const frameHoldEnd = ((index + holdShare) / totalFrames) * 100;
        const frameEnd = ((index + 1) / totalFrames) * 100;
        const offset = index * distance;

        return `${compactNumber(frameStart)}%,${compactNumber(frameHoldEnd)}%{transform:translateX(-${offset}px)}${compactNumber(frameEnd)}%{transform:translateX(-${offset + distance}px)}`;
    }).join('');
};

export const buildBadgeSvg = (
    states: readonly BadgeState[],
    frameDelaySeconds = frameSeconds,
    preserveOriginalArtwork = false,
    animationType: AnimationType = 'slot'
): string => {
    const visibleStates = normalizeStates(states);

    if (visibleStates.length === 0) {
        return '';
    }

    const firstState = visibleStates[0];
    const width = getBadgeWidth(visibleStates);
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
            const slotX = animationType === 'carousel' ? index * width : 0;
            const slotY =
                animationType === 'carousel' ? 0 : index * badgeHeight;
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
            const displayName = getDisplayName(state);
            const contentWidth = getBadgeContentWidth(state);
            const contentX = (width - contentWidth) / 2;
            const textX = logoSize + logoTextGap;
            const centeredContent = `<g transform="translate(${compactNumber(contentX)} 0)">${inlineSvgArtwork(state.source, state.logoColor, preservesArtwork, smartRecolorBadgeColor, 0)}<text fill="${escapeXml(compactColor(state.textColor))}" x="${compactNumber(textX)}" y="18" text-anchor="start"${textAttributes}>${escapeXml(displayName)}</text></g>`;
            const content = `<rect width="${width}" height="${badgeHeight}" fill="${escapeXml(compactColor(state.badgeColor))}"/>${centeredContent}`;

            if (visibleStates.length === 1) {
                return content;
            }

            const transform =
                slotX === 0 && slotY === 0
                    ? ''
                    : ` transform="translate(${compactNumber(slotX)} ${compactNumber(slotY)})"`;

            return `<g class="f"${transform}>${content}</g>`;
        })
        .join('');
    const animationSteps =
        animationType === 'carousel'
            ? buildCarouselAnimationSteps(visibleStates.length, width)
            : buildAnimationSteps(visibleStates.length, badgeHeight);
    const animationStyle =
        visibleStates.length > 1
            ? `.s{animation:a ${duration}s ease-in-out 1.2s infinite}@keyframes a{${animationSteps}}@media (prefers-reduced-motion:reduce){.s{animation:none}.f:nth-child(n+2){display:none}}`
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
