import { useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { Copy, Download, Plus, Search, X } from 'lucide-react';

interface BadgeState {
    allCaps?: boolean;
    badgeColor: string;
    id: string;
    logoColor: string;
    name: string;
    source: string;
    textColor: string;
}

interface EditorDraft {
    badgeColor: string;
    logoColor: string;
    name: string;
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
type EditableColorTarget = 'badgeColor' | 'logoColor' | 'textColor';

const defaultBadgeSource =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="badge-base" x1="5" x2="28" y1="28" y2="18" gradientUnits="userSpaceOnUse"><stop stop-color="#4654ad"/><stop offset="0.58" stop-color="#5968c9"/><stop offset="1" stop-color="#6f7fdd"/></linearGradient><linearGradient id="spark-fill" x1="8" x2="24" y1="22" y2="2" gradientUnits="userSpaceOnUse"><stop stop-color="#8550dd"/><stop offset="1" stop-color="#c6b7ff"/></linearGradient><path id="spark-shape" d="M15.52 2.24c.36-1.04 1.84-1.04 2.2 0l1.64 4.68a6.94 6.94 0 0 0 4.24 4.24l4.68 1.64c1.04.36 1.04 1.84 0 2.2l-4.68 1.64a6.94 6.94 0 0 0-4.24 4.24l-1.64 4.68c-.36 1.04-1.84 1.04-2.2 0l-1.64-4.68a6.94 6.94 0 0 0-4.24-4.24L4.96 15c-1.04-.36-1.04-1.84 0-2.2l4.68-1.64a6.94 6.94 0 0 0 4.24-4.24l1.64-4.68Z"/><g id="badge-shape"><rect x="3.2" y="20.8" width="26.8" height="9.2" rx="2.4"/><rect x="18.6" y="20.8" width="11.4" height="9.2" rx="2.4"/></g><mask id="base-cutout"><rect width="32" height="32" fill="#fff"/><use href="#spark-shape" stroke="#000" stroke-width="4.2"/></mask></defs><use href="#badge-shape" fill="url(#badge-base)" mask="url(#base-cutout)"/><use href="#spark-shape" fill="url(#spark-fill)"/></svg>';

const defaultBadgeDraft: EditorDraft = {
    badgeColor: '#5968c9',
    logoColor: '#ffffff',
    name: 'Badgical',
    source: defaultBadgeSource,
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
const maxFrames = 20;
const maxSvglResults = 8;
const maxFileSizeBytes = 20 * 1024;
const githubUrl = 'https://github.com/Hsiii/Badgical';

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

const inlineSvgArtwork = (source: string, logoColor: string): string => {
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

    return `<svg x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}"${viewBoxAttribute}><g fill="${escapeXml(logoColor)}" stroke="${escapeXml(logoColor)}" style="color:${escapeXml(logoColor)}">${colorizeSvgContent(content, logoColor)}</g></svg>`;
};

const toDataUri = (source: string): string => {
    const encodedSource = encodeURIComponent(minifySvgSource(source))
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

const materializeState = (state: BadgeState, _index: number): BadgeState => {
    const badgeColor =
        state.badgeColor.trim() === ''
            ? defaultBadgeDraft.badgeColor
            : state.badgeColor.trim();
    const defaultInk = getReadableInk(badgeColor);

    return {
        ...state,
        allCaps: state.allCaps ?? true,
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
        textColor:
            state.textColor.trim() === '' ? defaultInk : state.textColor.trim(),
    };
};

const getDisplayName = (state: BadgeState): string =>
    state.allCaps === false ? state.name : state.name.toUpperCase();

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

const buildBadgeSvg = (states: readonly BadgeState[]): string => {
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
        visibleStates.length * frameSeconds,
        frameSeconds
    );
    const slots = animatedStates
        .map((state, index) => {
            const slotY = index * badgeHeight;
            const textAttributes =
                visibleStates.length === 1
                    ? ` font-size="${textSize}" font-weight="700"`
                    : '';

            const content = `<rect width="${width}" height="${badgeHeight}" fill="${escapeXml(compactColor(state.badgeColor))}"/>${inlineSvgArtwork(state.source, state.logoColor)}<text fill="${escapeXml(compactColor(state.textColor))}" x="${textX}" y="18" text-anchor="middle"${textAttributes}>${escapeXml(getDisplayName(state))}</text>`;

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

const buildSingleBadgeSvg = (state: BadgeState, index: number): string =>
    buildBadgeSvg([materializeState(state, index)]);

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

const getSvglCategoryLabel = (result: SvglResult): string | undefined => {
    if (typeof result.category === 'string') {
        return result.category;
    }

    return result.category?.[0];
};

const formatKilobytes = (bytes: number): string =>
    `${(bytes / 1024).toFixed(1)} KB`;

const getPrimarySvgColor = (source: string): string | undefined => {
    const colors = source.match(/#[\dA-Fa-f]{3}(?:[\dA-Fa-f]{3})?\b/gu) ?? [];
    const primaryColor = colors.find(
        (color) => !/^#(?:fff|ffffff|000|000000)$/iu.test(color)
    );

    return primaryColor;
};

export function App(): JSX.Element {
    const [states, setStates] = useState(defaultStates);
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<readonly SvglResult[]>([]);
    const [searchStatus, setSearchStatus] = useState<SvglSearchStatus>('idle');
    const [selectedResult, setSelectedResult] = useState<
        SvglResult | undefined
    >(undefined);
    const [draft, setDraft] = useState(defaultBadgeDraft);
    const [colorMode, setColorMode] = useState<ColorMode>('brand');
    const [deleteCandidateId, setDeleteCandidateId] = useState<
        string | undefined
    >(undefined);
    const badgeSvg = useMemo(() => buildBadgeSvg(states), [states]);
    const previewSource = useMemo(
        () => (badgeSvg === '' ? '' : toDataUri(badgeSvg)),
        [badgeSvg]
    );
    const fileSizeWarning = badgeSvg.length > maxFileSizeBytes;
    const materializedDraft = materializeState(
        {
            allCaps: true,
            ...draft,
            id: 'draft-frame',
        },
        0
    );
    const draftPreviewSource = toDataUri(
        buildSingleBadgeSvg(materializedDraft, 0)
    );

    useEffect(() => {
        const searchTerm = query.trim();

        if (searchTerm === '') {
            setResults([]);
            setSearchStatus('idle');
            setSelectedResult(undefined);
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
                        const visibleResults = searchResults.slice(
                            0,
                            maxSvglResults
                        );

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

    const applyColorMode = (
        brandColor: string,
        mode: ColorMode
    ): Pick<EditorDraft, 'badgeColor' | 'logoColor' | 'textColor'> => {
        const contrastColor = getReadableInk(brandColor);
        const reverseContrastColor =
            contrastColor === '#ffffff' ? '#1f2328' : '#ffffff';

        if (mode === 'inverse') {
            return {
                badgeColor: contrastColor,
                logoColor: brandColor,
                textColor: reverseContrastColor,
            };
        }

        if (mode === 'custom') {
            return {
                badgeColor: draft.badgeColor,
                logoColor: draft.logoColor,
                textColor: draft.textColor,
            };
        }

        return {
            badgeColor: brandColor,
            logoColor: contrastColor,
            textColor: contrastColor,
        };
    };

    const setDraftBrandColor = (
        brandColor: string,
        mode: ColorMode = colorMode
    ): void => {
        setDraft((currentDraft) => ({
            ...currentDraft,
            ...applyColorMode(brandColor, mode),
        }));
    };

    const selectColorMode = (mode: ColorMode): void => {
        setColorMode(mode);
        setDraftBrandColor(draft.badgeColor, mode);
    };

    const updateDraftColor = (
        field: EditableColorTarget,
        value: string
    ): void => {
        const normalizedColor = normalizeHexInput(value);

        if (normalizedColor === undefined) {
            return;
        }

        setDraft((currentDraft) => ({
            ...currentDraft,
            [field]: normalizedColor,
        }));
        setColorMode('custom');
    };

    const chooseSearchResult = (result: SvglResult): void => {
        setSelectedResult(result);
        fetch(getSvglSourceUrl(result.route))
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('SVGL source failed');
                }

                return await response.text();
            })
            .then((source) => {
                const brandColor =
                    getPrimarySvgColor(source) ?? defaultBadgeDraft.badgeColor;

                setDraft((currentDraft) => ({
                    ...currentDraft,
                    ...applyColorMode(brandColor, colorMode),
                    name: result.title,
                    source,
                }));
                setCopyState('idle');
            })
            .catch(() => undefined);
    };

    const addDraftFrame = (): void => {
        if (selectedResult === undefined || states.length >= maxFrames) {
            return;
        }

        const nextState = materializeState(
            {
                allCaps: true,
                ...draft,
                id: crypto.randomUUID(),
            },
            states.length
        );

        setStates((currentStates) =>
            currentStates.length >= maxFrames
                ? currentStates
                : [...currentStates, nextState]
        );
        setCopyState('idle');
    };

    const confirmDeleteState = (): void => {
        if (deleteCandidateId === undefined || states.length === 0) {
            setDeleteCandidateId(undefined);
            return;
        }

        const stateId = deleteCandidateId;
        const remainingStates = states.filter((state) => state.id !== stateId);

        setStates(remainingStates);

        setCopyState('idle');
        setDeleteCandidateId(undefined);
    };

    const copySvg = (): void => {
        if (badgeSvg === '') {
            return;
        }

        navigator.clipboard
            .writeText(badgeSvg)
            .then(() => {
                setCopyState('copied');
            })
            .catch(() => {
                setCopyState('idle');
            });
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

    let searchMessage = 'Search for a brand to start.';

    if (searchStatus === 'loading') {
        searchMessage = 'Searching SVGL...';
    }

    if (searchStatus === 'empty') {
        searchMessage = `No SVGL logo titled "${query}". Try another brand.`;
    }

    if (searchStatus === 'error') {
        searchMessage = 'SVGL search is unavailable right now. Try again.';
    }

    let colorModeOffset = 0;

    if (colorMode === 'inverse') {
        colorModeOffset = 100;
    }

    if (colorMode === 'custom') {
        colorModeOffset = 200;
    }
    const colorModes: ReadonlyArray<{
        readonly label: string;
        readonly mode: ColorMode;
        readonly swatches: readonly string[];
    }> = [
        {
            label: 'Brand',
            mode: 'brand',
            swatches: [
                draft.badgeColor,
                getReadableInk(draft.badgeColor),
                getReadableInk(draft.badgeColor),
            ],
        },
        {
            label: 'Inverse',
            mode: 'inverse',
            swatches: [
                getReadableInk(draft.badgeColor),
                draft.badgeColor,
                getReadableInk(getReadableInk(draft.badgeColor)),
            ],
        },
        {
            label: 'Custom',
            mode: 'custom',
            swatches: [draft.badgeColor, draft.logoColor, draft.textColor],
        },
    ];
    const colorFields: ReadonlyArray<{
        readonly field: EditableColorTarget;
        readonly label: string;
        readonly value: string;
    }> = [
        { field: 'badgeColor', label: 'Badge', value: draft.badgeColor },
        { field: 'logoColor', label: 'Logo', value: draft.logoColor },
        { field: 'textColor', label: 'Text', value: draft.textColor },
    ];

    return (
        <main className='app'>
            <section aria-labelledby='builder-title' className='builder'>
                <header className='topbar'>
                    <a aria-label='Badgical' className='brand-badge' href='/'>
                        <span aria-hidden='true' className='brand-badge__icon'>
                            <img alt='' src='/badgical-spark.svg' />
                        </span>
                        <span className='brand-badge__word'>
                            <span className='brand-badge__cap'>B</span>
                            <span className='brand-badge__rest'>adgical</span>
                        </span>
                    </a>
                    <h1 className='visually-hidden' id='builder-title'>
                        Badgical badge builder
                    </h1>
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
                </header>

                <div className='builder__workspace'>
                    <section className='tool-panel'>
                        <section
                            aria-labelledby='search-title'
                            className='compose-panel'
                        >
                            <div className='search-block'>
                                <div className='panel-heading'>
                                    <h2 id='search-title'>Search</h2>
                                    <span>SVGL</span>
                                </div>

                                <label
                                    aria-label='Search brand'
                                    className='search-field'
                                >
                                    <Search aria-hidden='true' size={24} />
                                    <input
                                        autoFocus
                                        onChange={(event) => {
                                            setQuery(event.target.value);
                                        }}
                                        placeholder='Search a brand'
                                        value={query}
                                    />
                                </label>

                                <div className='brand-results'>
                                    {results.length === 0 ? (
                                        <div className='empty-state search-empty'>
                                            <p>{searchMessage}</p>
                                        </div>
                                    ) : (
                                        results.map((result) => (
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
                                                    chooseSearchResult(result);
                                                }}
                                                type='button'
                                            >
                                                <img
                                                    alt=''
                                                    src={getSvglRoute(
                                                        result.route
                                                    )}
                                                />
                                                <span>{result.title}</span>
                                                {getSvglCategoryLabel(
                                                    result
                                                ) === undefined ? undefined : (
                                                    <small>
                                                        {getSvglCategoryLabel(
                                                            result
                                                        )}
                                                    </small>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className='compose-bottom'>
                                <section
                                    aria-labelledby='color-title'
                                    className='color-block'
                                >
                                    <div className='panel-heading'>
                                        <h2 id='color-title'>Color</h2>
                                        <span>{draft.name}</span>
                                    </div>

                                    <div
                                        aria-label='Color mode'
                                        className='color-mode-switch'
                                        role='radiogroup'
                                    >
                                        <span
                                            aria-hidden='true'
                                            className='color-mode-switch__thumb'
                                            style={{
                                                transform: `translateX(${colorModeOffset}%)`,
                                            }}
                                        />
                                        {colorModes.map((modeOption) => (
                                            <button
                                                aria-checked={
                                                    colorMode ===
                                                    modeOption.mode
                                                }
                                                className='color-mode-option'
                                                key={modeOption.mode}
                                                onClick={() => {
                                                    selectColorMode(
                                                        modeOption.mode
                                                    );
                                                }}
                                                role='radio'
                                                type='button'
                                            >
                                                <span>{modeOption.label}</span>
                                                <span className='color-mode-option__swatches'>
                                                    {modeOption.swatches.map(
                                                        (color, index) => (
                                                            <span
                                                                aria-hidden='true'
                                                                className='swatch'
                                                                key={`${modeOption.mode}-${color}-${index}`}
                                                                style={{
                                                                    backgroundColor:
                                                                        color,
                                                                }}
                                                            />
                                                        )
                                                    )}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {colorMode === 'custom' ? (
                                        <div className='custom-colors'>
                                            {colorFields.map((colorField) => (
                                                <label
                                                    className='custom-color-field'
                                                    key={colorField.field}
                                                >
                                                    <span>
                                                        {colorField.label}
                                                    </span>
                                                    <input
                                                        aria-label={`${colorField.label} color`}
                                                        onChange={(event) => {
                                                            updateDraftColor(
                                                                colorField.field,
                                                                event.target
                                                                    .value
                                                            );
                                                        }}
                                                        type='color'
                                                        value={colorField.value}
                                                    />
                                                    <input
                                                        aria-label={`${colorField.label} hex`}
                                                        onChange={(event) => {
                                                            updateDraftColor(
                                                                colorField.field,
                                                                event.target
                                                                    .value
                                                            );
                                                        }}
                                                        value={colorField.value}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    ) : undefined}

                                    <div className='quick-edit'>
                                        <label className='field'>
                                            <span>Text</span>
                                            <input
                                                onChange={(event) => {
                                                    setDraft(
                                                        (currentDraft) => ({
                                                            ...currentDraft,
                                                            name: event.target
                                                                .value,
                                                        })
                                                    );
                                                }}
                                                placeholder='Badge text'
                                                value={draft.name}
                                            />
                                        </label>
                                        <div className='draft-preview'>
                                            <img
                                                alt='Draft badge preview'
                                                src={draftPreviewSource}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        className='button button--primary add-frame'
                                        disabled={
                                            selectedResult === undefined ||
                                            states.length >= maxFrames
                                        }
                                        onClick={addDraftFrame}
                                        type='button'
                                    >
                                        <Plus aria-hidden='true' size={16} />
                                        Add Frame
                                    </button>
                                </section>
                            </div>
                        </section>

                        <aside
                            aria-labelledby='frames-title'
                            className='frame-rail'
                        >
                            <section className='frames'>
                                <div className='panel-heading'>
                                    <h2 id='frames-title'>Frames</h2>
                                    <span>
                                        {states.length}/{maxFrames}
                                    </span>
                                </div>

                                <div className='frame-list'>
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
                                                className='frame-card'
                                                key={state.id}
                                            >
                                                <img
                                                    alt={`${materializedState.name} badge`}
                                                    src={frameBadge}
                                                />
                                                <button
                                                    aria-label={`Delete ${materializedState.name}`}
                                                    className='frame-card__delete'
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
                                        );
                                    })}
                                </div>
                            </section>

                            <section
                                aria-label='Generated badge'
                                className='output'
                            >
                                <div className='panel-heading'>
                                    <h2>Output</h2>
                                    <span
                                        className={
                                            fileSizeWarning
                                                ? 'file-size file-size--warn'
                                                : 'file-size'
                                        }
                                    >
                                        {formatKilobytes(badgeSvg.length)}
                                    </span>
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
                                            aria-label={
                                                copyState === 'copied'
                                                    ? 'Copied animated SVG'
                                                    : 'Copy animated SVG'
                                            }
                                            className='button button--primary'
                                            disabled={badgeSvg === ''}
                                            onClick={copySvg}
                                            title={
                                                copyState === 'copied'
                                                    ? 'Copied'
                                                    : 'Copy'
                                            }
                                            type='button'
                                        >
                                            <Copy
                                                aria-hidden='true'
                                                size={16}
                                            />
                                            {copyState === 'copied'
                                                ? 'Copied'
                                                : 'Copy'}
                                        </button>
                                        <button
                                            aria-label='Download animated SVG'
                                            className='button button--primary'
                                            disabled={badgeSvg === ''}
                                            onClick={downloadSvg}
                                            title='Download'
                                            type='button'
                                        >
                                            <Download
                                                aria-hidden='true'
                                                size={16}
                                            />
                                            Download
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
        </main>
    );
}
