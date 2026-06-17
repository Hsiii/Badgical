import './FrameRail.css';

import type { JSX } from 'react';
import { MoreHorizontal, Pencil, X } from 'lucide-react';

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

interface FrameRailProps {
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
    editFrame,
    editingFrameId,
    frameDelaySeconds,
    frameSettingsOpen,
    setDeleteCandidateId,
    setFrameSettingsOpen,
    states,
    updateFrameDelaySeconds,
}: FrameRailProps): JSX.Element {
    return (
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
                            setFrameSettingsOpen((isOpen) => !isOpen);
                        }}
                        title='Frame settings'
                        type='button'
                    >
                        <MoreHorizontal aria-hidden='true' size={20} />
                    </button>
                    {frameSettingsOpen ? (
                        <div className='settings-popover'>
                            <label className='field'>
                                <span>Animation delay</span>
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
                                    aria-label='Animation delay seconds'
                                    max={maxFrameDelaySeconds}
                                    min={minFrameDelaySeconds}
                                    onChange={(event) => {
                                        updateFrameDelaySeconds(
                                            event.target.value
                                        );
                                    }}
                                    step='0.2'
                                    type='number'
                                    value={frameDelaySeconds}
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
                        <p>Pick a brand and add the first frame.</p>
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
                                    <Pencil aria-hidden='true' size={16} />
                                </button>
                                <button
                                    aria-label={`Delete ${materializedState.name}`}
                                    className='frame-card__button'
                                    onClick={() => {
                                        setDeleteCandidateId(state.id);
                                    }}
                                    title='Delete frame'
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
