import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, JSX } from 'react';
import {
    ClipboardPaste,
    Copy,
    Download,
    FolderOpen,
    Pencil,
    Plus,
    X,
} from 'lucide-react';

interface BadgeState {
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

const defaultStates: readonly BadgeState[] = [
    {
        id: 'badgical',
        name: 'Badgical',
        color: '#5968c9',
        source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="spark-fill" x1="3" x2="21" y1="21" y2="3" gradientUnits="userSpaceOnUse"><stop stop-color="#5968c9"/><stop offset="0.52" stop-color="#9972d3"/><stop offset="1" stop-color="#dbdaec"/></linearGradient></defs><path fill="url(#spark-fill)" d="M11.1 1.9c.25-.72 1.27-.72 1.52 0l1.73 4.94a4.8 4.8 0 0 0 2.93 2.93l4.94 1.73c.72.25.72 1.27 0 1.52l-4.94 1.73a4.8 4.8 0 0 0-2.93 2.93l-1.73 4.94c-.25.72-1.27.72-1.52 0l-1.73-4.94a4.8 4.8 0 0 0-2.93-2.93L1.5 13.02c-.72-.25-.72-1.27 0-1.52l4.94-1.73a4.8 4.8 0 0 0 2.93-2.93L11.1 1.9Z"/><path fill="#fff" fill-opacity="0.82" d="m12 6.4 1.1 3.1a2.9 2.9 0 0 0 1.77 1.77L18 12.36l-3.13 1.1a2.9 2.9 0 0 0-1.77 1.77L12 18.35l-1.1-3.12a2.9 2.9 0 0 0-1.77-1.77L6 12.36l3.13-1.1A2.9 2.9 0 0 0 10.9 9.5L12 6.4Z"/></svg>',
    },
];

const emptyDraft: EditorDraft = {
    color: '#000000',
    name: 'Frame',
    source: '',
};

const placeholderSource =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="#1f2328" stroke-width="1.75" stroke-linecap="round"/></svg>';

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
const githubUrl = 'https://github.com/Hsiii/Badgical';

function GitHubMark(): JSX.Element {
    return (
        <svg
            aria-hidden='true'
            fill='currentColor'
            height='18'
            viewBox='0 0 24 24'
            width='18'
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

const normalizeStates = (
    states: readonly BadgeState[]
): readonly BadgeState[] =>
    states
        .map((state) => ({
            ...state,
            color: state.color.trim(),
            name: state.name.trim(),
            source: state.source.trim(),
        }))
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

    const totalFrames = stateCount + 1;
    const holdShare = 0.72;

    return Array.from({ length: totalFrames }, (_value, index) => {
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
        animatedStates.length * frameSeconds,
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

            const content = `<rect width="${width}" height="${badgeHeight}" fill="${escapeXml(compactColor(state.color))}"/>${inlineSvgArtwork(state.source)}<text fill="${ink}" x="${textX}" y="18" text-anchor="middle"${textAttributes}>${escapeXml(state.name.toUpperCase())}</text>`;

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
    buildBadgeSvg([
        {
            ...state,
            name: state.name === '' ? `Frame ${index + 1}` : state.name,
            source: state.source === '' ? placeholderSource : state.source,
        },
    ]);

export function App(): JSX.Element {
    const [states, setStates] = useState(defaultStates);
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
    const [editingId, setEditingId] = useState<string | undefined>(undefined);
    const [draft, setDraft] = useState(emptyDraft);
    const fileInputReference = useRef<HTMLInputElement | undefined>(undefined);
    const badgeSvg = useMemo(() => buildBadgeSvg(states), [states]);
    const previewSource = useMemo(
        () => (badgeSvg === '' ? '' : toDataUri(badgeSvg)),
        [badgeSvg]
    );

    const openEditor = (state: BadgeState): void => {
        setEditingId(state.id);
        setDraft({
            color: state.color,
            name: state.name,
            source: state.source,
        });
        setCopyState('idle');
    };

    const closeEditor = (): void => {
        setEditingId(undefined);
        setDraft(emptyDraft);
    };

    const updateDraft = (
        field: keyof EditorDraft,
        event: Readonly<ChangeEvent<HTMLInputElement | HTMLTextAreaElement>>
    ): void => {
        setDraft((currentDraft) => ({
            ...currentDraft,
            [field]: event.target.value,
        }));
    };

    const addState = (): void => {
        if (states.length >= maxFrames) {
            return;
        }

        const newState: BadgeState = {
            id: crypto.randomUUID(),
            ...emptyDraft,
        };

        setStates((currentStates) => [...currentStates, newState]);
    };

    const saveDraft = (): void => {
        if (editingId === undefined) {
            return;
        }

        setStates((currentStates) =>
            currentStates.map((state) =>
                state.id === editingId ? { ...state, ...draft } : state
            )
        );
        closeEditor();
    };

    const pasteSource = (): void => {
        navigator.clipboard
            .readText()
            .then((text) => {
                setDraft((currentDraft) => ({
                    ...currentDraft,
                    source: text,
                }));
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
                setDraft((currentDraft) => ({
                    ...currentDraft,
                    source: text,
                }));
            })
            .catch(() => undefined)
            .finally(() => {
                if (fileInputReference.current !== undefined) {
                    fileInputReference.current.value = '';
                }
            });
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
                        Badge animation
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
                    <section aria-label='Animation chain' className='chain'>
                        {states.map((state, index) => {
                            const singleBadgeSource = toDataUri(
                                buildSingleBadgeSvg(state, index)
                            );
                            const badgeLabel =
                                state.name === ''
                                    ? `Frame ${index + 1}`
                                    : state.name;

                            return (
                                <div className='chain__segment' key={state.id}>
                                    <div className='chain__node'>
                                        <img
                                            alt={`${badgeLabel} badge`}
                                            className='chain__badge'
                                            src={singleBadgeSource}
                                        />
                                        <button
                                            aria-label={`Edit frame ${index + 1}`}
                                            className='icon-button'
                                            onClick={() => {
                                                openEditor(state);
                                            }}
                                            title='Edit frame'
                                            type='button'
                                        >
                                            <Pencil
                                                aria-hidden='true'
                                                size={16}
                                            />
                                        </button>
                                    </div>
                                    <div
                                        aria-hidden='true'
                                        className='chain__line'
                                    />
                                </div>
                            );
                        })}

                        <button
                            aria-label='Add frame'
                            className='chain__add'
                            disabled={states.length >= maxFrames}
                            onClick={addState}
                            title={
                                states.length >= maxFrames
                                    ? 'Maximum 5 frames'
                                    : 'Add frame'
                            }
                            type='button'
                        >
                            <Plus aria-hidden='true' size={16} />
                        </button>
                    </section>

                    <aside aria-label='Generated badge' className='output'>
                        <div className='output__showcase'>
                            <div className='preview'>
                                {previewSource === '' ? (
                                    <span>
                                        Add SVG artwork to start the animation
                                        loop.
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
                                    disabled={badgeSvg === ''}
                                    onClick={copySvg}
                                    title={
                                        copyState === 'copied'
                                            ? 'Copied'
                                            : 'Copy'
                                    }
                                    type='button'
                                >
                                    <Copy aria-hidden='true' size={16} />
                                </button>
                                <button
                                    aria-label='Download animated SVG'
                                    disabled={badgeSvg === ''}
                                    onClick={downloadSvg}
                                    title='Download'
                                    type='button'
                                >
                                    <Download aria-hidden='true' size={16} />
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            {editingId === undefined ? undefined : (
                <div className='dialog-backdrop' role='presentation'>
                    <section
                        aria-labelledby='editor-title'
                        aria-modal='true'
                        className='dialog'
                        role='dialog'
                    >
                        <div className='dialog__header'>
                            <h2 className='dialog__title' id='editor-title'>
                                Edit frame
                            </h2>
                            <button
                                aria-label='Close editor'
                                className='icon-button'
                                onClick={closeEditor}
                                title='Close editor'
                                type='button'
                            >
                                <X aria-hidden='true' size={16} />
                            </button>
                        </div>

                        <div className='dialog__row'>
                            <label className='field'>
                                <span>Name</span>
                                <input
                                    onChange={(event) => {
                                        updateDraft('name', event);
                                    }}
                                    value={draft.name}
                                />
                            </label>
                            <label className='field field--color'>
                                <span>Color</span>
                                <input
                                    onChange={(event) => {
                                        updateDraft('color', event);
                                    }}
                                    type='color'
                                    value={draft.color}
                                />
                            </label>
                        </div>

                        <label className='field'>
                            <span>SVG source</span>
                            {draft.source === '' ? (
                                <div className='source-empty'>
                                    <button onClick={pasteSource} type='button'>
                                        <ClipboardPaste
                                            aria-hidden='true'
                                            size={16}
                                        />
                                        Paste
                                    </button>
                                    <button
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
                            ) : (
                                <textarea
                                    className='dialog__source'
                                    onChange={(event) => {
                                        updateDraft('source', event);
                                    }}
                                    value={draft.source}
                                />
                            )}
                        </label>

                        <div className='dialog__footer'>
                            <button
                                className='button button--secondary'
                                onClick={closeEditor}
                                type='button'
                            >
                                Cancel
                            </button>
                            <button
                                className='button button--primary'
                                onClick={saveDraft}
                                type='button'
                            >
                                Save
                            </button>
                        </div>

                        <input
                            accept='.svg,image/svg+xml,text/plain'
                            className='visually-hidden'
                            onChange={readSourceFile}
                            ref={(element) => {
                                fileInputReference.current =
                                    element ?? undefined;
                            }}
                            type='file'
                        />
                    </section>
                </div>
            )}
        </main>
    );
}
