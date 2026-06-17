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
    textPadding,
    textSize,
    textStart,
} from '@/components/badge-builder/constants';
import type { BadgeState } from '@/components/badge-builder/types';

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
