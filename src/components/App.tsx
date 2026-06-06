import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, JSX } from 'react';
import {
    ClipboardPaste,
    Copy,
    Download,
    FolderOpen,
    Plus,
    Search,
    X,
} from 'lucide-react';

interface BadgeState {
    allCaps?: boolean;
    id: string;
    name: string;
    color: string;
    source: string;
}

interface EditorDraft {
    color: string;
    name: string;
    source: string;
}

interface SvglRouteOptions {
    readonly dark: string;
    readonly light: string;
}

interface SvglResult {
    readonly id: number;
    readonly route: string | SvglRouteOptions;
    readonly title: string;
}

type SvglSearchStatus = 'idle' | 'loading' | 'empty' | 'ready' | 'error';
type EditorMode = 'color' | 'text' | 'source';

const defaultBadgeSource =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="badge-base" x1="5" x2="28" y1="28" y2="18" gradientUnits="userSpaceOnUse"><stop stop-color="#4654ad"/><stop offset="0.58" stop-color="#5968c9"/><stop offset="1" stop-color="#6f7fdd"/></linearGradient><linearGradient id="spark-fill" x1="10" x2="23" y1="20" y2="4" gradientUnits="userSpaceOnUse"><stop stop-color="#7c61c8"/><stop offset="0.62" stop-color="#9972d3"/><stop offset="1" stop-color="#dbdaec"/></linearGradient><path id="spark-shape" d="M15.52 2.24c.36-1.04 1.84-1.04 2.2 0l1.64 4.68a6.94 6.94 0 0 0 4.24 4.24l4.68 1.64c1.04.36 1.04 1.84 0 2.2l-4.68 1.64a6.94 6.94 0 0 0-4.24 4.24l-1.64 4.68c-.36 1.04-1.84 1.04-2.2 0l-1.64-4.68a6.94 6.94 0 0 0-4.24-4.24L4.96 15c-1.04-.36-1.04-1.84 0-2.2l4.68-1.64a6.94 6.94 0 0 0 4.24-4.24l1.64-4.68Z"/><g id="badge-shape"><rect x="3.2" y="20.8" width="26.8" height="9.2" rx="2.4"/><rect x="18.6" y="17.6" width="11.4" height="12.4" rx="2.4"/></g><mask id="base-cutout"><rect width="32" height="32" fill="#fff"/><use href="#spark-shape" stroke="#000" stroke-width="4.2"/></mask></defs><use href="#badge-shape" fill="url(#badge-base)" mask="url(#base-cutout)"/><use href="#spark-shape" fill="url(#spark-fill)"/></svg>';

const defaultBadgeDraft: EditorDraft = {
    color: '#5968c9',
    name: 'Badgical',
    source: defaultBadgeSource,
};

const defaultStates: readonly BadgeState[] = [
    {
        ...defaultBadgeDraft,
        id: 'badgical',
    },
];

const badgeHeight = 28;
const logoSize = 16;
const logoX = 6;
const logoY = 6;
const textStart = 30;
const minBadgeWidth = 90;
const textPadding = 16;
const textSize = 10;
const frameSeconds = 2.4;
const maxFrames = 5;
const maxSvglResults = 8;
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

const inlineSvgArtwork = (source: string): string => {
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

    return `<svg x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}"${viewBoxAttribute}>${content}</svg>`;
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

    return luminance > 150 ? '#1f2328' : '#fff';
};

const getColorChannels = (
    color: string
): { readonly blue: number; readonly green: number; readonly red: number } => {
    const normalizedColor = color.trim().replace('#', '');

    if (!/^[\dA-Fa-f]{6}$/.test(normalizedColor)) {
        return { blue: 0, green: 0, red: 0 };
    }

    return {
        blue: Number.parseInt(normalizedColor.slice(4, 6), 16),
        green: Number.parseInt(normalizedColor.slice(2, 4), 16),
        red: Number.parseInt(normalizedColor.slice(0, 2), 16),
    };
};

const getColorLuminance = (color: string): number => {
    const { blue, green, red } = getColorChannels(color);

    return (red * 299 + green * 587 + blue * 114) / 1000;
};

const getBadgeHoverFilter = (color: string): string =>
    getColorLuminance(color) > 225 ? 'brightness(0.96)' : 'brightness(1.08)';

const clampColorChannel = (value: number): number =>
    Math.min(Math.max(Math.round(value), 0), 255);

const channelToHex = (value: number): string =>
    clampColorChannel(value).toString(16).padStart(2, '0');

const rgbToHex = (red: number, green: number, blue: number): string =>
    `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}`;

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

const materializeState = (state: BadgeState, _index: number): BadgeState => ({
    ...state,
    allCaps: state.allCaps ?? true,
    color:
        state.color.trim() === ''
            ? defaultBadgeDraft.color
            : state.color.trim(),
    name:
        state.name.trim() === '' || /^frame$/iu.test(state.name.trim())
            ? defaultBadgeDraft.name
            : state.name.trim(),
    source:
        state.source.trim() === ''
            ? defaultBadgeDraft.source
            : state.source.trim(),
});

const getDisplayName = (state: BadgeState): string =>
    state.allCaps === false ? state.name : state.name.toUpperCase();

const normalizeStates = (
    states: readonly BadgeState[]
): readonly BadgeState[] =>
    states
        .map((state, index) => materializeState(state, index))
        .filter(
            (state) =>
                state.name !== '' && state.color !== '' && state.source !== ''
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
            const ink = getReadableInk(state.color);
            const textAttributes =
                visibleStates.length === 1
                    ? ` font-size="${textSize}" font-weight="700"`
                    : '';

            const content = `<rect width="${width}" height="${badgeHeight}" fill="${escapeXml(compactColor(state.color))}"/>${inlineSvgArtwork(state.source)}<text fill="${ink}" x="${textX}" y="18" text-anchor="middle"${textAttributes}>${escapeXml(getDisplayName(state))}</text>`;

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

const formatKilobytes = (bytes: number): string =>
    `${(bytes / 1024).toFixed(1)} KB`;

const getPrimarySvgColor = (source: string): string | undefined => {
    const colors = source.match(/#[\dA-Fa-f]{3}(?:[\dA-Fa-f]{3})?\b/gu) ?? [];
    const primaryColor = colors.find(
        (color) => !/^#(?:fff|ffffff|000|000000)$/iu.test(color)
    );

    return primaryColor;
};

const applySvglSourceToState = (
    state: BadgeState,
    result: SvglResult,
    source: string,
    editorMode: EditorMode
): BadgeState => {
    const primaryColor = getPrimarySvgColor(source);

    if (editorMode === 'color') {
        return {
            ...state,
            color: primaryColor ?? state.color,
        };
    }

    return {
        ...state,
        color: primaryColor ?? state.color,
        name:
            state.name === '' || /^frame$/iu.test(state.name)
                ? result.title
                : state.name,
        source,
    };
};

export function App(): JSX.Element {
    const [states, setStates] = useState(defaultStates);
    const [selectedFrameId, setSelectedFrameId] = useState(defaultStates[0].id);
    const [editorMode, setEditorMode] = useState<EditorMode>('color');
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
    const [svglQuery, setSvglQuery] = useState(defaultStates[0].name);
    const [svglResults, setSvglResults] = useState<readonly SvglResult[]>([]);
    const [svglStatus, setSvglStatus] = useState<SvglSearchStatus>('idle');
    const [selectedSvglResult, setSelectedSvglResult] = useState<
        SvglResult | undefined
    >(undefined);
    const [deleteCandidateId, setDeleteCandidateId] = useState<
        string | undefined
    >(undefined);
    const fileInputReference = useRef<HTMLInputElement | undefined>(undefined);
    const badgeSvg = useMemo(() => buildBadgeSvg(states), [states]);
    const previewSource = useMemo(
        () => (badgeSvg === '' ? '' : toDataUri(badgeSvg)),
        [badgeSvg]
    );
    const selectedFrame = useMemo(
        () => states.find((state) => state.id === selectedFrameId) ?? states[0],
        [selectedFrameId, states]
    );
    const selectedMaterializedFrame = materializeState(selectedFrame, 0);
    const selectedBadgeWidth = getBadgeWidth([selectedMaterializedFrame]);
    const selectedFrameHasSource = selectedFrame.source.trim() !== '';
    const selectedFrameChannels = getColorChannels(
        selectedMaterializedFrame.color
    );
    const selectedFrameInk = getReadableInk(selectedMaterializedFrame.color);
    const selectedFrameArtwork = selectedMaterializedFrame.source;
    const editorBadgeStyle = {
        '--badge-edit-bg': selectedMaterializedFrame.color,
        '--badge-edit-filter': getBadgeHoverFilter(
            selectedMaterializedFrame.color
        ),
        '--badge-logo-size-x': `${(logoSize / selectedBadgeWidth) * 100}%`,
        '--badge-logo-size-y': `${(logoSize / badgeHeight) * 100}%`,
        '--badge-logo-x': `${(logoX / selectedBadgeWidth) * 100}%`,
        '--badge-logo-y': `${(logoY / badgeHeight) * 100}%`,
        '--badge-text-left': `${(textStart / selectedBadgeWidth) * 100}%`,
        'aspectRatio': `${selectedBadgeWidth} / ${badgeHeight}`,
        'color': selectedFrameInk,
    } as CSSProperties;

    useEffect(() => {
        setSvglQuery(selectedFrame.name);
        setSvglResults([]);
        setSvglStatus('idle');
        setSelectedSvglResult(undefined);
    }, [selectedFrame.id, selectedFrame.name]);

    useEffect(() => {
        const query = svglQuery.trim();

        if (query === '') {
            setSvglResults([]);
            setSvglStatus('idle');
            setSelectedSvglResult(undefined);
            return undefined;
        }

        const abortController = new AbortController();
        setSvglStatus('loading');
        const timeoutId = globalThis.setTimeout(
            () => {
                fetch(
                    `https://api.svgl.app?search=${encodeURIComponent(query)}`,
                    {
                        signal: abortController.signal,
                    }
                )
                    .then(async (response) => {
                        if (!response.ok) {
                            throw new Error('SVGL search failed');
                        }

                        return (await response.json()) as readonly SvglResult[];
                    })
                    .then((results) => {
                        const visibleResults = results.slice(0, maxSvglResults);

                        setSvglResults(visibleResults);
                        setSvglStatus(
                            visibleResults.length === 0 ? 'empty' : 'ready'
                        );
                        setSelectedSvglResult((currentResult) =>
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

                        setSvglResults([]);
                        setSvglStatus('error');
                        setSelectedSvglResult(undefined);
                    });
            },
            320,
            undefined
        );

        return (): void => {
            abortController.abort();
            globalThis.clearTimeout(timeoutId);
        };
    }, [svglQuery]);

    const selectFrame = (state: BadgeState): void => {
        setSelectedFrameId(state.id);
        setCopyState('idle');
    };

    const updateSelectedFrameValue = (
        field: keyof EditorDraft,
        value: string
    ): void => {
        setStates((currentStates) =>
            currentStates.map((state) =>
                state.id === selectedFrame.id
                    ? {
                          ...state,
                          [field]: value,
                      }
                    : state
            )
        );
        if (field === 'name') {
            setSvglQuery(value);
        }
        setCopyState('idle');
    };

    const updateSelectedFrame = (
        field: keyof EditorDraft,
        event: Readonly<ChangeEvent<HTMLInputElement | HTMLTextAreaElement>>
    ): void => {
        updateSelectedFrameValue(field, event.target.value);
    };

    const updateSelectedFrameHex = (value: string): void => {
        const normalizedColor = normalizeHexInput(value);

        if (normalizedColor !== undefined) {
            updateSelectedFrameValue('color', normalizedColor);
        }
    };

    const updateSelectedFrameChannel = (
        channel: 'blue' | 'green' | 'red',
        value: string
    ): void => {
        const numericValue = Number.parseInt(value, 10);

        if (Number.isNaN(numericValue)) {
            return;
        }

        let { blue, green, red } = selectedFrameChannels;

        if (channel === 'blue') {
            blue = clampColorChannel(numericValue);
        }

        if (channel === 'green') {
            green = clampColorChannel(numericValue);
        }

        if (channel === 'red') {
            red = clampColorChannel(numericValue);
        }

        updateSelectedFrameValue('color', rgbToHex(red, green, blue));
    };

    const updateSelectedFrameAllCaps = (allCaps: boolean): void => {
        setStates((currentStates) =>
            currentStates.map((state) =>
                state.id === selectedFrame.id ? { ...state, allCaps } : state
            )
        );
        setCopyState('idle');
    };

    const addState = (): void => {
        if (states.length >= maxFrames) {
            return;
        }

        const newState: BadgeState = {
            id: crypto.randomUUID(),
            ...defaultBadgeDraft,
        };

        setStates((currentStates) => [...currentStates, newState]);
        setSelectedFrameId(newState.id);
        setEditorMode('color');
        setSvglQuery(newState.name);
        setSvglResults([]);
        setSvglStatus('idle');
        setSelectedSvglResult(undefined);
        setCopyState('idle');
    };

    const confirmDeleteState = (): void => {
        if (deleteCandidateId === undefined || states.length <= 1) {
            setDeleteCandidateId(undefined);
            return;
        }

        const stateId = deleteCandidateId;
        if (states.length <= 1) {
            return;
        }

        const removedIndex = states.findIndex((state) => state.id === stateId);
        const remainingStates = states.filter((state) => state.id !== stateId);

        setStates(remainingStates);

        if (stateId === selectedFrame.id) {
            const nextIndex = Math.min(
                Math.max(removedIndex, 0),
                remainingStates.length - 1
            );
            const nextState = remainingStates[nextIndex];

            setSelectedFrameId(nextState.id);
            setSvglQuery(nextState.name);
            setSvglResults([]);
            setSvglStatus('idle');
            setSelectedSvglResult(undefined);
        }

        setCopyState('idle');
        setDeleteCandidateId(undefined);
    };

    const pasteSource = (): void => {
        navigator.clipboard
            .readText()
            .then((text) => {
                setStates((currentStates) =>
                    currentStates.map((state) =>
                        state.id === selectedFrame.id
                            ? { ...state, source: text }
                            : state
                    )
                );
                setCopyState('idle');
            })
            .catch(() => undefined);
    };

    const openFilePicker = (): void => {
        fileInputReference.current?.click();
    };

    const readSourceFile = (
        event: Readonly<ChangeEvent<HTMLInputElement>>
    ): void => {
        const file = event.target.files?.[0];

        if (file === undefined) {
            return;
        }

        file.text()
            .then((text) => {
                setStates((currentStates) =>
                    currentStates.map((state) =>
                        state.id === selectedFrame.id
                            ? { ...state, source: text }
                            : state
                    )
                );
                setCopyState('idle');
            })
            .catch(() => undefined)
            .finally(() => {
                if (fileInputReference.current !== undefined) {
                    fileInputReference.current.value = '';
                }
            });
    };

    const cancelSvglSelection = (): void => {
        setSelectedSvglResult(undefined);
    };

    const chooseSvglResult = (): void => {
        if (selectedSvglResult === undefined) {
            return;
        }

        fetch(getSvglSourceUrl(selectedSvglResult.route))
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('SVGL source failed');
                }

                return await response.text();
            })
            .then((source) => {
                setStates((currentStates) =>
                    currentStates.map((state) =>
                        state.id === selectedFrame.id
                            ? applySvglSourceToState(
                                  state,
                                  selectedSvglResult,
                                  source,
                                  editorMode
                              )
                            : state
                    )
                );
                setCopyState('idle');
                setSvglResults([]);
                setSvglStatus('idle');
                setSelectedSvglResult(undefined);
            })
            .catch(() => undefined);
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

    const renderSvglSearch = (
        label: string,
        chooseLabel: string
    ): JSX.Element => (
        <section aria-label={label} className='svgl-search'>
            <label className='field'>
                <span>{label}</span>
                <div className='svgl-search__bar'>
                    <Search aria-hidden='true' size={16} />
                    <input
                        onChange={(event) => {
                            setSvglQuery(event.target.value);
                        }}
                        placeholder='React, Vite, GitHub...'
                        value={svglQuery}
                    />
                </div>
            </label>

            <div className='svgl-results'>
                {svglResults.length === 0 ? (
                    <p>
                        {svglStatus === 'loading'
                            ? 'Searching SVGL...'
                            : undefined}
                        {svglStatus === 'empty'
                            ? `No matching logos for "${svglQuery}". Try another name or paste SVG source.`
                            : undefined}
                        {svglStatus === 'error'
                            ? 'SVGL search is unavailable. Paste SVG source or try again.'
                            : undefined}
                        {svglStatus === 'idle'
                            ? 'Search SVGL to apply a logo.'
                            : undefined}
                    </p>
                ) : (
                    svglResults.map((result) => (
                        <button
                            aria-current={
                                result.id === selectedSvglResult?.id
                                    ? 'true'
                                    : undefined
                            }
                            className='svgl-result'
                            key={result.id}
                            onClick={() => {
                                setSelectedSvglResult(result);
                            }}
                            type='button'
                        >
                            <img alt='' src={getSvglRoute(result.route)} />
                            <span>{result.title}</span>
                        </button>
                    ))
                )}
            </div>

            <div className='svgl-actions'>
                <button
                    className='button button--secondary'
                    disabled={selectedSvglResult === undefined}
                    onClick={cancelSvglSelection}
                    type='button'
                >
                    Cancel
                </button>
                <button
                    className='button button--primary'
                    disabled={selectedSvglResult === undefined}
                    onClick={chooseSvglResult}
                    type='button'
                >
                    {chooseLabel}
                </button>
            </div>
        </section>
    );

    return (
        <main className='app'>
            <section aria-labelledby='builder-title' className='builder'>
                <header className='topbar'>
                    <a aria-label='Badgical' className='brand-badge' href='/'>
                        <span aria-hidden='true' className='brand-badge__icon'>
                            <img alt='' src='/badgical-spark.svg' />
                        </span>
                        <span>Badgical</span>
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
                            aria-labelledby='frames-title'
                            className='frame-rail'
                        >
                            <section
                                aria-labelledby='frames-title'
                                className='frames'
                            >
                                <div className='panel-heading'>
                                    <h2 id='frames-title'>Frames</h2>
                                    <span>
                                        {states.length}/{maxFrames}
                                    </span>
                                </div>

                                <div className='frame-list'>
                                    {states.map((state, index) => {
                                        const frameBadge = toDataUri(
                                            buildSingleBadgeSvg(state, index)
                                        );
                                        const frameLabel = materializeState(
                                            state,
                                            index
                                        ).name;

                                        return (
                                            <div
                                                aria-current={
                                                    state.id ===
                                                    selectedFrame.id
                                                        ? 'true'
                                                        : undefined
                                                }
                                                className='frame-card'
                                                key={state.id}
                                            >
                                                <button
                                                    className='frame-card__select'
                                                    onClick={() => {
                                                        selectFrame(state);
                                                    }}
                                                    type='button'
                                                >
                                                    <img
                                                        alt={`${frameLabel} badge`}
                                                        src={frameBadge}
                                                    />
                                                </button>
                                                <button
                                                    aria-label={`Delete ${frameLabel}`}
                                                    className='frame-card__delete'
                                                    disabled={
                                                        states.length <= 1
                                                    }
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

                                <button
                                    aria-label='Add frame'
                                    className='button button--primary add-frame'
                                    disabled={states.length >= maxFrames}
                                    onClick={addState}
                                    type='button'
                                >
                                    <Plus aria-hidden='true' size={16} />
                                    Add frame
                                </button>
                            </section>

                            <aside
                                aria-label='Generated badge'
                                className='output'
                            >
                                <div className='panel-heading'>
                                    <h2>Output</h2>
                                    <span>
                                        {formatKilobytes(badgeSvg.length)}
                                    </span>
                                </div>
                                <div className='output__showcase'>
                                    <div className='preview'>
                                        {previewSource === '' ? (
                                            <span>
                                                Add SVG artwork to start the
                                                animation loop.
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
                            </aside>
                        </section>

                        <section
                            aria-labelledby='frame-editor-title'
                            className='frame-editor'
                        >
                            <div className='panel-heading'>
                                <h2 id='frame-editor-title'>Edit Frame</h2>
                            </div>

                            <div
                                className='editable-badge'
                                data-editor-mode={editorMode}
                                style={editorBadgeStyle}
                            >
                                <button
                                    aria-label='Edit badge color'
                                    aria-pressed={editorMode === 'color'}
                                    className='editable-badge__color'
                                    onClick={() => {
                                        setEditorMode('color');
                                    }}
                                    type='button'
                                />
                                <div className='editable-badge__content'>
                                    <button
                                        aria-label='Edit logo SVG source'
                                        aria-pressed={editorMode === 'source'}
                                        className='editable-badge__logo'
                                        onClick={() => {
                                            setEditorMode('source');
                                        }}
                                        type='button'
                                    >
                                        <img
                                            alt=''
                                            src={toDataUri(
                                                selectedFrameArtwork
                                            )}
                                        />
                                    </button>
                                    <button
                                        aria-label='Edit badge text'
                                        aria-pressed={editorMode === 'text'}
                                        className='editable-badge__text'
                                        onClick={() => {
                                            setEditorMode('text');
                                        }}
                                        type='button'
                                    >
                                        {getDisplayName(
                                            selectedMaterializedFrame
                                        )}
                                    </button>
                                </div>
                            </div>

                            <section className='editor-drawer'>
                                {editorMode === 'color' ? (
                                    <div className='editor-drawer__split editor-drawer__split--color'>
                                        <div className='color-editor'>
                                            <div
                                                aria-hidden='true'
                                                className='color-editor__preview'
                                                style={{
                                                    backgroundColor:
                                                        selectedMaterializedFrame.color,
                                                }}
                                            />
                                            <label className='field'>
                                                <span>Hex</span>
                                                <input
                                                    onBlur={(event) => {
                                                        updateSelectedFrameHex(
                                                            event.target.value
                                                        );
                                                    }}
                                                    onChange={(event) => {
                                                        updateSelectedFrameHex(
                                                            event.target.value
                                                        );
                                                    }}
                                                    value={
                                                        selectedMaterializedFrame.color
                                                    }
                                                />
                                            </label>
                                            <div className='color-editor__rgb'>
                                                <label className='field'>
                                                    <span>R</span>
                                                    <div className='color-channel'>
                                                        <input
                                                            max='255'
                                                            min='0'
                                                            onChange={(
                                                                event
                                                            ) => {
                                                                updateSelectedFrameChannel(
                                                                    'red',
                                                                    event.target
                                                                        .value
                                                                );
                                                            }}
                                                            type='range'
                                                            value={
                                                                selectedFrameChannels.red
                                                            }
                                                        />
                                                        <input
                                                            max='255'
                                                            min='0'
                                                            onChange={(
                                                                event
                                                            ) => {
                                                                updateSelectedFrameChannel(
                                                                    'red',
                                                                    event.target
                                                                        .value
                                                                );
                                                            }}
                                                            type='number'
                                                            value={
                                                                selectedFrameChannels.red
                                                            }
                                                        />
                                                    </div>
                                                </label>
                                                <label className='field'>
                                                    <span>G</span>
                                                    <div className='color-channel'>
                                                        <input
                                                            max='255'
                                                            min='0'
                                                            onChange={(
                                                                event
                                                            ) => {
                                                                updateSelectedFrameChannel(
                                                                    'green',
                                                                    event.target
                                                                        .value
                                                                );
                                                            }}
                                                            type='range'
                                                            value={
                                                                selectedFrameChannels.green
                                                            }
                                                        />
                                                        <input
                                                            max='255'
                                                            min='0'
                                                            onChange={(
                                                                event
                                                            ) => {
                                                                updateSelectedFrameChannel(
                                                                    'green',
                                                                    event.target
                                                                        .value
                                                                );
                                                            }}
                                                            type='number'
                                                            value={
                                                                selectedFrameChannels.green
                                                            }
                                                        />
                                                    </div>
                                                </label>
                                                <label className='field'>
                                                    <span>B</span>
                                                    <div className='color-channel'>
                                                        <input
                                                            max='255'
                                                            min='0'
                                                            onChange={(
                                                                event
                                                            ) => {
                                                                updateSelectedFrameChannel(
                                                                    'blue',
                                                                    event.target
                                                                        .value
                                                                );
                                                            }}
                                                            type='range'
                                                            value={
                                                                selectedFrameChannels.blue
                                                            }
                                                        />
                                                        <input
                                                            max='255'
                                                            min='0'
                                                            onChange={(
                                                                event
                                                            ) => {
                                                                updateSelectedFrameChannel(
                                                                    'blue',
                                                                    event.target
                                                                        .value
                                                                );
                                                            }}
                                                            type='number'
                                                            value={
                                                                selectedFrameChannels.blue
                                                            }
                                                        />
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                        {renderSvglSearch(
                                            'Logo color',
                                            'Apply color'
                                        )}
                                    </div>
                                ) : undefined}

                                {editorMode === 'text' ? (
                                    <div className='editor-drawer__split editor-drawer__split--text'>
                                        <div className='text-options'>
                                            <label className='switch-field'>
                                                <span>All Caps</span>
                                                <input
                                                    checked={
                                                        selectedFrame.allCaps !==
                                                        false
                                                    }
                                                    onChange={(event) => {
                                                        updateSelectedFrameAllCaps(
                                                            event.target.checked
                                                        );
                                                    }}
                                                    type='checkbox'
                                                />
                                            </label>
                                        </div>
                                        <label className='field'>
                                            <span>Text</span>
                                            <input
                                                autoFocus
                                                onChange={(event) => {
                                                    updateSelectedFrame(
                                                        'name',
                                                        event
                                                    );
                                                }}
                                                value={selectedFrame.name}
                                            />
                                        </label>
                                    </div>
                                ) : undefined}

                                {editorMode === 'source' ? (
                                    <div className='editor-drawer__split editor-drawer__split--source'>
                                        <label className='field source-field'>
                                            <span>SVG source</span>
                                            {selectedFrameHasSource ? (
                                                <textarea
                                                    className='source-field__textarea'
                                                    onChange={(event) => {
                                                        updateSelectedFrame(
                                                            'source',
                                                            event
                                                        );
                                                    }}
                                                    value={selectedFrame.source}
                                                />
                                            ) : (
                                                <div className='source-empty'>
                                                    <button
                                                        className='button button--secondary'
                                                        onClick={pasteSource}
                                                        type='button'
                                                    >
                                                        <ClipboardPaste
                                                            aria-hidden='true'
                                                            size={16}
                                                        />
                                                        Paste
                                                    </button>
                                                    <button
                                                        className='button button--secondary'
                                                        onClick={openFilePicker}
                                                        type='button'
                                                    >
                                                        <FolderOpen
                                                            aria-hidden='true'
                                                            size={16}
                                                        />
                                                        Open file
                                                    </button>
                                                </div>
                                            )}
                                        </label>
                                        {renderSvglSearch('Logo', 'Choose')}
                                    </div>
                                ) : undefined}
                            </section>
                        </section>
                    </section>
                </div>

                <input
                    accept='.svg,image/svg+xml,text/plain'
                    className='visually-hidden'
                    onChange={readSourceFile}
                    ref={(element) => {
                        fileInputReference.current = element ?? undefined;
                    }}
                    type='file'
                />
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
