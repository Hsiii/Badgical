import { useMemo, useState } from 'react';
import type { ChangeEvent, JSX } from 'react';
import { Copy, Download, Plus, Trash2 } from 'lucide-react';

interface BadgeState {
    id: string;
    name: string;
    color: string;
    source: string;
}

const defaultStates: readonly BadgeState[] = [
    {
        id: 'react',
        name: 'React',
        color: '#61dafb',
        source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.2" fill="#1f2328"/><g fill="none" stroke="#1f2328" stroke-width="1.25"><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/></g></svg>',
    },
    {
        id: 'bun',
        name: 'Bun',
        color: '#f4d8ae',
        source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12.5" r="9" fill="#1f2328"/><circle cx="9" cy="11" r="1.2" fill="#fff"/><circle cx="15" cy="11" r="1.2" fill="#fff"/><path d="M8.5 15c1.8 1.5 5.2 1.5 7 0" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M7.8 5.6 6 3.6M16.2 5.6 18 3.6" stroke="#1f2328" stroke-width="1.6" stroke-linecap="round"/></svg>',
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

const escapeXml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');

const toDataUri = (source: string): string => {
    const encodedSource = encodeURIComponent(source)
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
        return '0%, 100% { transform: translateY(0); }';
    }

    const totalFrames = stateCount + 1;
    const holdShare = 0.72;

    return Array.from({ length: totalFrames }, (_value, index) => {
        const frameStart = (index / totalFrames) * 100;
        const frameHoldEnd = ((index + holdShare) / totalFrames) * 100;
        const frameEnd = ((index + 1) / totalFrames) * 100;
        const offset = index * badgeHeight;

        return `${frameStart.toFixed(2)}%, ${frameHoldEnd.toFixed(2)}% { transform: translateY(-${offset}px); }
      ${frameEnd.toFixed(2)}% { transform: translateY(-${offset + badgeHeight}px); }`;
    }).join('\n      ');
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
    const label =
        visibleStates.length > 1
            ? `${firstState.name} swapping with ${visibleStates
                  .slice(1)
                  .map((state) => state.name)
                  .join(', ')}`
            : firstState.name;

    const slots = animatedStates
        .map((state, index) => {
            const slotY = index * badgeHeight;
            const ink = getReadableInk(state.color);

            return `<g class="slot" transform="translate(0 ${slotY})">
      <rect width="${width}" height="${badgeHeight}" fill="${escapeXml(state.color)}"/>
      <image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${escapeXml(
          toDataUri(state.source)
      )}"/>
      <text fill="${ink}" x="${textX}" y="18" text-anchor="middle">${escapeXml(
          state.name.toUpperCase()
      )}</text>
    </g>`;
        })
        .join('\n    ');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${badgeHeight}" viewBox="0 0 ${width} ${badgeHeight}" role="img" aria-label="${escapeXml(label)}">
  <title>${escapeXml(visibleStates.map((state) => state.name).join(' / '))}</title>
  <style>
    .stack { animation: swap ${duration}s ease-in-out 1.2s infinite; }
    .slot text { font: 700 ${textSize}px Verdana, Geneva, DejaVu Sans, sans-serif; text-rendering: geometricPrecision; }
    @keyframes swap {
      ${buildAnimationSteps(visibleStates.length)}
    }
    @media (prefers-reduced-motion: reduce) {
      .stack { animation: none; }
      .slot:nth-child(n+2) { display: none; }
    }
  </style>
  <clipPath id="badge-clip"><rect width="${width}" height="${badgeHeight}"/></clipPath>
  <g clip-path="url(#badge-clip)">
    <g class="stack">
    ${slots}
    </g>
  </g>
</svg>`;
};

export function App(): JSX.Element {
    const [states, setStates] = useState(defaultStates);
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
    const badgeSvg = useMemo(() => buildBadgeSvg(states), [states]);
    const previewSource = useMemo(
        () => (badgeSvg === '' ? '' : toDataUri(badgeSvg)),
        [badgeSvg]
    );

    const updateState = (
        id: string,
        field: keyof Omit<BadgeState, 'id'>,
        event: Readonly<ChangeEvent<HTMLInputElement | HTMLTextAreaElement>>
    ): void => {
        setStates((currentStates) =>
            currentStates.map((state) =>
                state.id === id
                    ? {
                          ...state,
                          [field]: event.target.value,
                      }
                    : state
            )
        );
        setCopyState('idle');
    };

    const addState = (): void => {
        setStates((currentStates) => [
            ...currentStates,
            {
                id: crypto.randomUUID(),
                name: 'State',
                color: '#000000',
                source: '',
            },
        ]);
    };

    const removeState = (id: string): void => {
        setStates((currentStates) =>
            currentStates.length > 1
                ? currentStates.filter((state) => state.id !== id)
                : currentStates
        );
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
                <div className='builder__intro'>
                    <p className='builder__eyebrow'>Badgical</p>
                    <h1 className='builder__title' id='builder-title'>
                        Animated badge builder
                    </h1>
                </div>

                <div className='builder__workspace'>
                    <form className='state-list'>
                        {states.map((state, index) => (
                            <fieldset className='state-card' key={state.id}>
                                <legend>State {index + 1}</legend>
                                <label className='field field--source'>
                                    <span>SVG source</span>
                                    <textarea
                                        onChange={(event) => {
                                            updateState(
                                                state.id,
                                                'source',
                                                event
                                            );
                                        }}
                                        value={state.source}
                                    />
                                </label>
                                <label className='field'>
                                    <span>Name</span>
                                    <input
                                        onChange={(event) => {
                                            updateState(
                                                state.id,
                                                'name',
                                                event
                                            );
                                        }}
                                        value={state.name}
                                    />
                                </label>
                                <label className='field'>
                                    <span>Color</span>
                                    <input
                                        onChange={(event) => {
                                            updateState(
                                                state.id,
                                                'color',
                                                event
                                            );
                                        }}
                                        type='color'
                                        value={state.color}
                                    />
                                </label>
                                <button
                                    aria-label={`Remove state ${index + 1}`}
                                    className='icon-button state-card__remove'
                                    onClick={() => {
                                        removeState(state.id);
                                    }}
                                    title='Remove state'
                                    type='button'
                                >
                                    <Trash2 aria-hidden='true' size={16} />
                                </button>
                            </fieldset>
                        ))}

                        <button
                            className='add-state'
                            onClick={addState}
                            type='button'
                        >
                            <Plus aria-hidden='true' size={16} />
                            Add state
                        </button>
                    </form>

                    <aside aria-label='Generated badge' className='output'>
                        <div className='preview'>
                            {previewSource === '' ? (
                                <span>
                                    Preview appears after one complete state.
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
                                {copyState === 'copied' ? 'Copied' : 'Copy SVG'}
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

                        <textarea
                            aria-label='Generated SVG source'
                            className='output__source'
                            readOnly
                            value={badgeSvg}
                        />
                    </aside>
                </div>
            </section>
        </main>
    );
}
