'use client';

import './App.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, JSX } from 'react';

import { AdvancedControls } from '@/components/AdvancedControls';
import { BrandSearchPanel } from '@/components/app/BrandSearchPanel';
import { Topbar } from '@/components/app/Topbar';
import {
    clampUnit,
    getHexColor,
    getHsvColor,
    getReadableInk,
    getRgbColor,
    getRgbFromHsv,
    normalizeHexInput,
} from '@/components/badge-builder/colors';
import {
    animationStartDelaySeconds,
    defaultBadgeDraft,
    defaultExportFolder,
    defaultExportRepo,
    defaultStates,
    exportFileName,
    frameSeconds,
    maxAnimationStartDelaySeconds,
    maxFrameDelaySeconds,
    maxFrames,
    maxSvglResults,
    maxTransitionSeconds,
    minAnimationStartDelaySeconds,
    minFrameDelaySeconds,
    minTransitionSeconds,
    transitionSeconds,
} from '@/components/badge-builder/constants';
import { logoColorTouchesBadgeEdge } from '@/components/badge-builder/smart-recolor';
import {
    buildBadgeSvg,
    buildSingleBadgeSvg,
    ensureSvgNamespace,
    isSvgSource,
    materializeState,
    toDataUri,
} from '@/components/badge-builder/svg';
import {
    getPrimarySvgColor,
    getSvglSourceUrl,
    isSvglApiError,
    isSvglNotFoundResponse,
    isSvglResultList,
    sortSvglResults,
} from '@/components/badge-builder/svgl';
import type {
    AnimationType,
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
} from '@/components/badge-builder/types';
import { BuilderDialogs } from '@/components/BuilderDialogs';
import { FrameRail } from '@/components/FrameRail';
import { uiCopy } from '@/components/i18n';
import { OutputPreview } from '@/components/OutputPreview';

function getClientLanguagePreference(): LanguagePreference {
    const runtimeWindow = (globalThis as { readonly window?: Window }).window;

    if (runtimeWindow === undefined) {
        return 'en';
    }

    const { navigator } = runtimeWindow;
    const browserLanguages =
        navigator.languages.length > 0
            ? navigator.languages
            : [navigator.language];

    return browserLanguages.some((language) =>
        language.toLowerCase().startsWith('zh')
    )
        ? 'zh-Hant'
        : 'en';
}

interface AppProps {
    readonly initialLanguagePreference: LanguagePreference;
    readonly initialLanguageResolved: boolean;
}

const serializeSvgElement = (element: SVGSVGElement): string =>
    ensureSvgNamespace(new XMLSerializer().serializeToString(element));

export function App({
    initialLanguagePreference,
    initialLanguageResolved,
}: AppProps): JSX.Element {
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
    const [, setSelectionStatus] = useState<SelectionStatus>('idle');
    const [draft, setDraft] = useState(defaultBadgeDraft);
    const [brandColor, setBrandColor] = useState(defaultBadgeDraft.badgeColor);
    const [colorMode, setColorMode] = useState<ColorMode>('brand');
    const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [startExistingDialogOpen, setStartExistingDialogOpen] =
        useState(false);
    const [exportFolder, setExportFolder] = useState(defaultExportFolder);
    const [exportRepo, setExportRepo] = useState(defaultExportRepo);
    const [sourceDraft, setSourceDraft] = useState(defaultBadgeDraft.source);
    const [languagePreference, setLanguagePreference] =
        useState<LanguagePreference>(initialLanguagePreference);
    const [languageResolved, setLanguageResolved] = useState(
        initialLanguageResolved
    );
    const [themePreference, setThemePreference] =
        useState<ThemePreference>('system');
    const [openPreferenceMenu, setOpenPreferenceMenu] = useState<
        PreferenceMenu | undefined
    >(undefined);
    const [animationDelaySeconds, setAnimationDelaySeconds] = useState(
        animationStartDelaySeconds
    );
    const [transitionLengthSeconds, setTransitionLengthSeconds] =
        useState(transitionSeconds);
    const [frameLengthSeconds, setFrameLengthSeconds] = useState(frameSeconds);
    const [animationType, setAnimationType] = useState<AnimationType>('slot');
    const [frameSettingsOpen, setFrameSettingsOpen] = useState(false);
    const [deleteCandidateId, setDeleteCandidateId] = useState<
        string | undefined
    >(undefined);
    const [editingFrameId, setEditingFrameId] = useState<string | undefined>(
        undefined
    );
    const copy = uiCopy[languagePreference];
    const searchInputReference = useRef<HTMLInputElement | undefined>(
        undefined
    );
    const existingBadgeInputReference = useRef<HTMLInputElement | undefined>(
        undefined
    );
    const resultsReference = useRef<HTMLDivElement | undefined>(undefined);
    const badgeSvg = useMemo(
        () =>
            buildBadgeSvg(
                states,
                frameLengthSeconds,
                false,
                animationType,
                animationDelaySeconds,
                transitionLengthSeconds
            ),
        [
            animationDelaySeconds,
            animationType,
            frameLengthSeconds,
            states,
            transitionLengthSeconds,
        ]
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
    const draftLogoSource = isSvgSource(materializedDraft.source)
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
        if (languageResolved) {
            return;
        }

        setLanguagePreference(getClientLanguagePreference());
        setLanguageResolved(true);
    }, [languageResolved]);

    useEffect(() => {
        if (!languageResolved) {
            return;
        }

        document.documentElement.lang = languagePreference;

        const url = new URL(globalThis.location.href);

        if (languagePreference === 'en') {
            url.searchParams.delete('lang');
        } else {
            url.searchParams.set('lang', languagePreference);
        }

        globalThis.history.replaceState(
            undefined,
            '',
            `${url.pathname}${url.search}${url.hash}`
        );
    }, [languagePreference, languageResolved]);

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
        mode: ColorMode,
        baseDraft: EditorDraft = draft
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
                smartRecolor: baseDraft.smartRecolor,
                badgeColor: baseDraft.badgeColor,
                logoColor: baseDraft.logoColor,
                preserveOriginalArtwork: baseDraft.preserveOriginalArtwork,
                textColor: baseDraft.textColor,
            };
        }

        return {
            smartRecolor: baseDraft.smartRecolor,
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
            ...applyColorMode(nextBrandColor, mode, currentDraft),
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
        const selectionColorMode = colorMode === 'custom' ? 'brand' : colorMode;

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
                    selectionColorMode
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
                    setColorMode(selectionColorMode);
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
            ...applyColorMode(extractedBrandColor, colorMode, currentDraft),
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
        if (editingFrameId === undefined && states.length >= maxFrames) {
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

    const updateAnimationDelaySeconds = (value: string): void => {
        const nextDelay = Number.parseFloat(value);

        if (Number.isNaN(nextDelay)) {
            return;
        }

        setAnimationDelaySeconds(
            Math.min(
                maxAnimationStartDelaySeconds,
                Math.max(minAnimationStartDelaySeconds, nextDelay)
            )
        );
    };

    const updateTransitionLengthSeconds = (value: string): void => {
        const nextLength = Number.parseFloat(value);

        if (Number.isNaN(nextLength)) {
            return;
        }

        setTransitionLengthSeconds(
            Math.min(
                Math.min(maxTransitionSeconds, frameLengthSeconds),
                Math.max(minTransitionSeconds, nextLength)
            )
        );
    };

    const updateFrameLengthSeconds = (value: string): void => {
        const nextLength = Number.parseFloat(value);

        if (Number.isNaN(nextLength)) {
            return;
        }

        const clampedLength = Math.min(
            maxFrameDelaySeconds,
            Math.max(minFrameDelaySeconds, nextLength)
        );

        setFrameLengthSeconds(clampedLength);
        setTransitionLengthSeconds((currentLength) =>
            Math.min(currentLength, clampedLength)
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

    const parseExistingBadgeStates = (source: string): BadgeState[] => {
        const document = new DOMParser().parseFromString(
            source,
            'image/svg+xml'
        );

        if (document.querySelector('parsererror') !== null) {
            return [];
        }

        const frameElements = [...document.querySelectorAll('g.f')];
        const importedStates = frameElements
            .map((frameElement, index): BadgeState | undefined => {
                const badgeColor =
                    frameElement.querySelector('rect')?.getAttribute('fill') ??
                    defaultBadgeDraft.badgeColor;
                const textElement = frameElement.querySelector('text');
                const sourceElement = frameElement.querySelector('svg');
                const name =
                    textElement?.textContent.trim() ??
                    `Frame ${String(index + 1)}`;

                if (sourceElement === null && name === '') {
                    return undefined;
                }

                return {
                    allCaps: false,
                    smartRecolor: false,
                    badgeColor,
                    id: crypto.randomUUID(),
                    logoColor:
                        textElement?.getAttribute('fill') ??
                        defaultBadgeDraft.logoColor,
                    name,
                    preserveOriginalArtwork: sourceElement !== null,
                    source:
                        sourceElement === null
                            ? ''
                            : serializeSvgElement(sourceElement),
                    textColor:
                        textElement?.getAttribute('fill') ??
                        getReadableInk(badgeColor),
                };
            })
            .filter((state): state is BadgeState => state !== undefined);

        if (importedStates.length > 1) {
            const [firstState] = importedStates;
            const lastState = importedStates.at(-1);

            if (
                lastState !== undefined &&
                firstState.name === lastState.name &&
                firstState.badgeColor === lastState.badgeColor &&
                firstState.source === lastState.source &&
                firstState.textColor === lastState.textColor
            ) {
                return importedStates.slice(0, -1);
            }
        }

        return importedStates;
    };

    const openExistingBadgePicker = (): void => {
        existingBadgeInputReference.current?.click();
    };

    const uploadExistingBadge = (
        event: ChangeEvent<HTMLInputElement>
    ): void => {
        const input = event.currentTarget;
        const file = input.files?.[0];

        if (file === undefined) {
            return;
        }

        file.text().then(
            (source) => {
                const importedStates = parseExistingBadgeStates(source);

                input.value = '';

                if (importedStates.length === 0) {
                    return;
                }

                const [firstState] = importedStates;
                const nextDraft = materializeState(firstState, 0);

                setStates(importedStates);
                setDraft({
                    allCaps: nextDraft.allCaps ?? false,
                    smartRecolor: nextDraft.smartRecolor ?? false,
                    badgeColor: nextDraft.badgeColor,
                    logoColor: nextDraft.logoColor,
                    name: nextDraft.name,
                    preserveOriginalArtwork:
                        nextDraft.preserveOriginalArtwork ?? false,
                    source: nextDraft.source,
                    textColor: nextDraft.textColor,
                });
                setBrandColor(nextDraft.badgeColor);
                setColorMode('custom');
                setSourceDraft(nextDraft.source);
                setSelectedResult(undefined);
                setEditingFrameId(undefined);
                setExportCopyState('idle');
            },
            () => {
                input.value = '';
            }
        );
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
    const badgeNames = states.map((state) => materializeState(state, 0).name);
    const readmeAltText = copy.readmeAlt(badgeNames);
    const readmeMarkdown = `![${readmeAltText}](${rawGithubUrl})`;

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
            ['brand', copy.variantDefault],
            ['inverse', copy.variantInverse],
        ] as const satisfies ReadonlyArray<readonly [VariantMode, string]>
    ).map(([mode, label]) => {
        const variantDraft = {
            ...draft,
            ...applyColorMode(brandColor, mode, draft),
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
                    copy={copy}
                    languagePreference={languagePreference}
                    openPreferenceMenu={openPreferenceMenu}
                    setLanguagePreference={setLanguagePreference}
                    setOpenPreferenceMenu={setOpenPreferenceMenu}
                    setStartExistingDialogOpen={setStartExistingDialogOpen}
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
                                    <h2 id='content-title'>
                                        {copy.contentTitle}
                                    </h2>
                                </div>

                                <BrandSearchPanel
                                    chooseSearchResult={chooseSearchResult}
                                    copy={copy}
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

                                <AdvancedControls
                                    addDraftFrame={addDraftFrame}
                                    colorMode={colorMode}
                                    colorPickerStyle={colorPickerStyle}
                                    copy={copy}
                                    draft={draft}
                                    draftLogoSource={draftLogoSource}
                                    draftPrimaryColor={draftPrimaryColor}
                                    draftPrimaryHsv={draftPrimaryHsv}
                                    draftPrimaryRgb={draftPrimaryRgb}
                                    editingFrameId={editingFrameId}
                                    openSourceDialog={openSourceDialog}
                                    selectColorMode={selectColorMode}
                                    setDraft={setDraft}
                                    statesLength={states.length}
                                    updateColorPadFromPoint={
                                        updateColorPadFromPoint
                                    }
                                    updateDraftColor={updateDraftColor}
                                    updateDraftColorChannel={
                                        updateDraftColorChannel
                                    }
                                    updateDraftHue={updateDraftHue}
                                    updateDraftSaturationValue={
                                        updateDraftSaturationValue
                                    }
                                    variantPreviews={variantPreviews}
                                />
                            </div>
                        </section>

                        <aside
                            aria-labelledby='frames-title'
                            className='frame-rail'
                        >
                            <FrameRail
                                copy={copy}
                                editFrame={editFrame}
                                editingFrameId={editingFrameId}
                                setDeleteCandidateId={setDeleteCandidateId}
                                states={states}
                            />

                            <OutputPreview
                                animationDelaySeconds={animationDelaySeconds}
                                animationType={animationType}
                                badgeSvg={badgeSvg}
                                copy={copy}
                                frameLengthSeconds={frameLengthSeconds}
                                frameSettingsOpen={frameSettingsOpen}
                                openPreferenceMenu={openPreferenceMenu}
                                previewSource={previewSource}
                                setAnimationType={setAnimationType}
                                setExportDialogOpen={setExportDialogOpen}
                                setFrameSettingsOpen={setFrameSettingsOpen}
                                setOpenPreferenceMenu={setOpenPreferenceMenu}
                                transitionLengthSeconds={
                                    transitionLengthSeconds
                                }
                                updateAnimationDelaySeconds={
                                    updateAnimationDelaySeconds
                                }
                                updateFrameLengthSeconds={
                                    updateFrameLengthSeconds
                                }
                                updateTransitionLengthSeconds={
                                    updateTransitionLengthSeconds
                                }
                            />
                        </aside>
                    </section>
                </div>
            </section>

            <input
                accept='.svg,image/svg+xml'
                aria-label='Upload existing animated badge'
                className='visually-hidden'
                onChange={uploadExistingBadge}
                ref={(element) => {
                    existingBadgeInputReference.current = element ?? undefined;
                }}
                type='file'
            />

            <BuilderDialogs
                confirmDeleteState={confirmDeleteState}
                copy={copy}
                copyReadmeMarkdown={copyReadmeMarkdown}
                deleteCandidateId={deleteCandidateId}
                downloadSvg={downloadSvg}
                exportCopyState={exportCopyState}
                exportDialogOpen={exportDialogOpen}
                exportFolder={exportFolder}
                exportPath={exportPath}
                exportRepo={exportRepo}
                normalizedExportRepo={normalizedExportRepo}
                openExistingBadgePicker={openExistingBadgePicker}
                saveSourceDialog={saveSourceDialog}
                setDeleteCandidateId={setDeleteCandidateId}
                setExportCopyState={setExportCopyState}
                setExportDialogOpen={setExportDialogOpen}
                setExportFolder={setExportFolder}
                setExportRepo={setExportRepo}
                setSourceDialogOpen={setSourceDialogOpen}
                setSourceDraft={setSourceDraft}
                setStartExistingDialogOpen={setStartExistingDialogOpen}
                sourceDialogOpen={sourceDialogOpen}
                sourceDraft={sourceDraft}
                startExistingDialogOpen={startExistingDialogOpen}
            />
        </main>
    );
}
