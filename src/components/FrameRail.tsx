import './FrameRail.css';

import { useEffect, useRef, useState } from 'react';
import type { JSX, MouseEvent, PointerEvent } from 'react';
import { GripVertical, X } from 'lucide-react';

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
    readonly moveFrame: (draggedFrameId: string, targetFrameId: string) => void;
    readonly setDeleteCandidateId: (id: string | undefined) => void;
    readonly states: readonly BadgeState[];
}

const getFrameIdFromPoint = (
    clientX: number,
    clientY: number
): string | undefined => {
    const frameElement = document
        .elementFromPoint(clientX, clientY)
        ?.closest<HTMLElement>('[data-frame-id]');

    return frameElement?.dataset.frameId;
};

export function FrameRail({
    copy,
    editFrame,
    editingFrameId,
    moveFrame,
    setDeleteCandidateId,
    states,
}: FrameRailProps): JSX.Element {
    const [draggedFrameId, setDraggedFrameId] = useState<string | undefined>(
        undefined
    );
    const draggedFrameIdReference = useRef<string | undefined>(undefined);
    const [dropTargetFrameId, setDropTargetFrameId] = useState<
        string | undefined
    >(undefined);

    const clearDragState = (): void => {
        draggedFrameIdReference.current = undefined;
        setDraggedFrameId(undefined);
        setDropTargetFrameId(undefined);
    };

    const updateDropTargetFromPoint = (
        clientX: number,
        clientY: number
    ): void => {
        const targetFrameId = getFrameIdFromPoint(clientX, clientY);
        const currentDraggedFrameId = draggedFrameIdReference.current;

        if (
            currentDraggedFrameId === undefined ||
            targetFrameId === undefined ||
            targetFrameId === currentDraggedFrameId
        ) {
            setDropTargetFrameId(undefined);
            return;
        }

        setDropTargetFrameId(targetFrameId);
    };

    const commitDropFromPoint = (clientX: number, clientY: number): void => {
        const targetFrameId = getFrameIdFromPoint(clientX, clientY);
        const currentDraggedFrameId = draggedFrameIdReference.current;

        if (
            currentDraggedFrameId !== undefined &&
            targetFrameId !== undefined &&
            targetFrameId !== currentDraggedFrameId
        ) {
            moveFrame(currentDraggedFrameId, targetFrameId);
        }

        clearDragState();
    };

    useEffect(() => {
        const handlePointerMove = (event: globalThis.PointerEvent): void => {
            updateDropTargetFromPoint(event.clientX, event.clientY);
        };
        const handlePointerUp = (event: globalThis.PointerEvent): void => {
            commitDropFromPoint(event.clientX, event.clientY);
        };
        const handleMouseMove = (event: globalThis.MouseEvent): void => {
            updateDropTargetFromPoint(event.clientX, event.clientY);
        };
        const handleMouseUp = (event: globalThis.MouseEvent): void => {
            commitDropFromPoint(event.clientX, event.clientY);
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return (): void => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    });

    const handleFramePointerDown = (
        event: PointerEvent<HTMLButtonElement>,
        frameId: string
    ): void => {
        event.currentTarget.setPointerCapture(event.pointerId);
        draggedFrameIdReference.current = frameId;
        setDraggedFrameId(frameId);
    };

    const handleFrameMouseDown = (
        event: MouseEvent<HTMLButtonElement>,
        frameId: string
    ): void => {
        event.preventDefault();
        draggedFrameIdReference.current = frameId;
        setDraggedFrameId(frameId);
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
                            data-dragging={
                                draggedFrameId === state.id ? 'true' : undefined
                            }
                            data-drop-target={
                                dropTargetFrameId === state.id
                                    ? 'true'
                                    : undefined
                            }
                            data-frame-id={state.id}
                            key={state.id}
                        >
                            <button
                                aria-label={copy.reorderFrame(
                                    materializedState.name
                                )}
                                className='frame-card__drag-handle'
                                onMouseDown={(event) => {
                                    handleFrameMouseDown(event, state.id);
                                }}
                                onPointerCancel={clearDragState}
                                onPointerDown={(event) => {
                                    handleFramePointerDown(event, state.id);
                                }}
                                title={copy.reorderFrame(
                                    materializedState.name
                                )}
                                type='button'
                            >
                                <GripVertical aria-hidden='true' size={16} />
                            </button>
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
