'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, JSX } from 'react';
import { Copy, Download, MoreHorizontal, Pencil, Plus, X } from 'lucide-react';

import {
    buildBadgeSvg,
    buildSingleBadgeSvg,
    clampUnit,
    defaultBadgeDraft,
    defaultExportFolder,
    defaultExportRepo,
    defaultStates,
    exportFileName,
    frameSeconds,
    getHexColor,
    getHsvColor,
    getPrimarySvgColor,
    getReadableInk,
    getRgbColor,
    getRgbFromHsv,
    getSvglSourceUrl,
    isSvglApiError,
    isSvglNotFoundResponse,
    isSvglResultList,
    isSvgSource,
    logoColorTouchesBadgeEdge,
    materializeState,
    maxFrameDelaySeconds,
    maxFrames,
    maxSvglResults,
    minFrameDelaySeconds,
    normalizeHexInput,
    sortSvglResults,
    toDataUri,
} from '@/components/badge-builder/domain';
import type {
    BadgeState,
    ColorMode,
    EditorDraft,
    LanguagePreference,
    PreferenceMenu,
    RgbColor,
    SelectionStatus,
    SvglResult,
    SvglSearchStatus,
    ThemePreference,
    VariantMode,
} from '@/components/badge-builder/domain';
import { BrandSearchPanel } from '@/components/BrandSearchPanel';
import { Topbar } from '@/components/Topbar';

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
                <Topbar
                    languagePreference={languagePreference}
                    openPreferenceMenu={openPreferenceMenu}
                    setLanguagePreference={setLanguagePreference}
                    setOpenPreferenceMenu={setOpenPreferenceMenu}
                    setThemePreference={setThemePreference}
                    themePreference={themePreference}
                />

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

                                <BrandSearchPanel
                                    chooseSearchResult={chooseSearchResult}
                                    query={query}
                                    resultsAreLoading={resultsAreLoading}
                                    searchInputElement={
                                        searchInputReference.current
                                    }
                                    selectedResult={selectedResult}
                                    setQuery={setQuery}
                                    setResultsElement={(element) => {
                                        resultsReference.current = element;
                                    }}
                                    setSearchInputElement={(element) => {
                                        searchInputReference.current = element;
                                    }}
                                    setSelectedResult={setSelectedResult}
                                    setSelectionStatus={setSelectionStatus}
                                    visibleResults={visibleResults}
                                />

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
