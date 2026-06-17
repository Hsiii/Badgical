import './FrameRail.css';

import type { JSX } from 'react';
import { X } from 'lucide-react';

import { maxFrames } from '@/components/badge-builder/constants';
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
    readonly setDeleteCandidateId: (id: string | undefined) => void;
    readonly states: readonly BadgeState[];
}

export function FrameRail({
    copy,
    editFrame,
    editingFrameId,
    setDeleteCandidateId,
    states,
}: FrameRailProps): JSX.Element {
    return (
        <section className='frames'>
            <div className='panel-heading'>
                <div className='panel-title-row'>
                    <h2 id='frames-title'>{copy.frames}</h2>
                    <span className='panel-meta'>
                        {states.length}/{maxFrames}
                    </span>
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
