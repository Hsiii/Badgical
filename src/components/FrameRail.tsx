import './FrameRail.css';

import type { JSX, KeyboardEvent } from 'react';
import { MoreHorizontal, X } from 'lucide-react';

import {
    maxFrameDelaySeconds,
    maxFrames,
    minFrameDelaySeconds,
} from '@/components/badge-builder/constants';
import {
    buildSingleBadgeSvg,
    materializeState,
    toDataUri,
} from '@/components/badge-builder/svg';
import type { BadgeState } from '@/components/badge-builder/types';
import type { UiCopy } from '@/components/i18n';

interface FrameRailProps {
    readonly copy: UiCopy;
    readonly editFrame: (state: BadgeState) => void;
    readonly editingFrameId: string | undefined;
    readonly frameDelaySeconds: number;
    readonly frameSettingsOpen: boolean;
    readonly setDeleteCandidateId: (id: string | undefined) => void;
    readonly setFrameSettingsOpen: (
        updater: (isOpen: boolean) => boolean
    ) => void;
    readonly states: readonly BadgeState[];
    readonly updateFrameDelaySeconds: (value: string) => void;
}

export function FrameRail({
    copy,
    editFrame,
    editingFrameId,
    frameDelaySeconds,
    frameSettingsOpen,
    setDeleteCandidateId,
    setFrameSettingsOpen,
    states,
    updateFrameDelaySeconds,
}: FrameRailProps): JSX.Element {
    const handleDelayKeyDown = (
        event: KeyboardEvent<HTMLInputElement>
    ): void => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
            return;
        }

        event.preventDefault();

        const direction = event.key === 'ArrowUp' ? 1 : -1;
        const step = event.shiftKey ? 1 : 0.2;
        const nextDelay = Math.min(
            maxFrameDelaySeconds,
            Math.max(minFrameDelaySeconds, frameDelaySeconds + direction * step)
        );

        updateFrameDelaySeconds(nextDelay.toFixed(1));
    };

    return (
        <section className='frames'>
            <div className='panel-heading'>
                <div className='panel-title-row'>
                    <h2 id='frames-title'>{copy.frames}</h2>
                    <span className='panel-meta'>
                        {states.length}/{maxFrames}
                    </span>
                </div>
                <div className='panel-menu'>
                    <button
                        aria-expanded={frameSettingsOpen}
                        aria-label={copy.frameSettings}
                        className='icon-button panel-menu__button'
                        onClick={() => {
                            setFrameSettingsOpen((isOpen) => !isOpen);
                        }}
                        title={copy.frameSettings}
                        type='button'
                    >
                        <MoreHorizontal aria-hidden='true' size={20} />
                    </button>
                    {frameSettingsOpen ? (
                        <div className='settings-popover'>
                            <label className='field'>
                                <span>{copy.animationDelay}</span>
                                <input
                                    max={maxFrameDelaySeconds}
                                    min={minFrameDelaySeconds}
                                    onChange={(event) => {
                                        updateFrameDelaySeconds(
                                            event.target.value
                                        );
                                    }}
                                    step='0.2'
                                    type='range'
                                    value={frameDelaySeconds}
                                />
                            </label>
                            <label className='settings-value-row'>
                                <input
                                    aria-label={copy.animationDelaySeconds}
                                    inputMode='decimal'
                                    max={maxFrameDelaySeconds}
                                    min={minFrameDelaySeconds}
                                    onChange={(event) => {
                                        updateFrameDelaySeconds(
                                            event.target.value
                                        );
                                    }}
                                    onKeyDown={handleDelayKeyDown}
                                    pattern='[0-9]*[.]?[0-9]*'
                                    step='0.2'
                                    type='text'
                                    value={frameDelaySeconds}
                                />
                                <span>{copy.secondsUnit}</span>
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
                        <p>{copy.pickFirstFrame}</p>
                    </div>
                ) : undefined}
                {states.map((state, index) => {
                    const materializedState = materializeState(state, index);
                    const frameBadge = toDataUri(
                        buildSingleBadgeSvg(materializedState, index)
                    );

                    return (
                        <div
                            aria-current={
                                editingFrameId === state.id ? 'true' : undefined
                            }
                            className='frame-card'
                            key={state.id}
                        >
                            <button
                                aria-label={copy.editFrame(
                                    materializedState.name
                                )}
                                className='frame-card__edit'
                                onClick={() => {
                                    editFrame(state);
                                }}
                                type='button'
                            >
                                <img
                                    alt=''
                                    aria-hidden='true'
                                    src={frameBadge}
                                />
                            </button>
                            <div className='frame-card__actions'>
                                <button
                                    aria-label={copy.deleteFrame(
                                        materializedState.name
                                    )}
                                    className='frame-card__button'
                                    onClick={() => {
                                        setDeleteCandidateId(state.id);
                                    }}
                                    title={copy.deleteFrame(
                                        materializedState.name
                                    )}
                                    type='button'
                                >
                                    <X aria-hidden='true' size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
