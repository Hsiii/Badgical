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
        id: 'react',
        name: 'React',
        color: '#61dafb',
        source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.2" fill="#1f2328"/><g fill="none" stroke="#1f2328" stroke-width="1.25"><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/></g></svg>',
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
        const newState: BadgeState = {
            id: crypto.randomUUID(),
            ...emptyDraft,
        };

        setStates((currentStates) => [...currentStates, newState]);
        openEditor(newState);
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
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <main className='app'>
            <section aria-labelledby='builder-title' className='builder'>
                <header className='topbar'>
                    <p className='topbar__brand'>Badgical</p>
                    <h1 className='builder__title' id='builder-title'>
                        Badge animation
                    </h1>
                    <p className='topbar__meta'>
                        {states.length}{' '}
                        {states.length === 1 ? 'frame' : 'frames'}
                    </p>
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
                            onClick={addState}
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
                                    disabled={badgeSvg === ''}
                                    onClick={copySvg}
                                    type='button'
                                >
                                    <Copy aria-hidden='true' size={16} />
                                    {copyState === 'copied' ? 'Copied' : 'Copy'}
                                </button>
                                <button
                                    disabled={badgeSvg === ''}
                                    onClick={downloadSvg}
                                    type='button'
                                >
                                    <Download aria-hidden='true' size={16} />
                                    Download
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
