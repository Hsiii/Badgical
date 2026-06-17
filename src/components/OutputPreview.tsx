import './OutputPreview.css';

import type { Dispatch, JSX, KeyboardEvent, SetStateAction } from 'react';
import { ChevronDown, Download, Timer, WandSparkles } from 'lucide-react';

import {
    maxFrameDelaySeconds,
    minFrameDelaySeconds,
} from '@/components/badge-builder/constants';
import type {
    AnimationType,
    PreferenceMenu,
} from '@/components/badge-builder/types';
import type { UiCopy } from '@/components/i18n';

interface OutputPreviewProps {
    readonly animationType: AnimationType;
    readonly badgeSvg: string;
    readonly copy: UiCopy;
    readonly frameDelaySeconds: number;
    readonly frameSettingsOpen: boolean;
    readonly openPreferenceMenu: PreferenceMenu | undefined;
    readonly previewSource: string;
    readonly setAnimationType: Dispatch<SetStateAction<AnimationType>>;
    readonly setExportDialogOpen: (isOpen: boolean) => void;
    readonly setFrameSettingsOpen: (
        updater: (isOpen: boolean) => boolean
    ) => void;
    readonly setOpenPreferenceMenu: Dispatch<
        SetStateAction<PreferenceMenu | undefined>
    >;
    readonly statesLength: number;
    readonly updateFrameDelaySeconds: (value: string) => void;
}

export function OutputPreview({
    animationType,
    badgeSvg,
    copy,
    frameDelaySeconds,
    frameSettingsOpen,
    openPreferenceMenu,
    previewSource,
    setAnimationType,
    setExportDialogOpen,
    setFrameSettingsOpen,
    setOpenPreferenceMenu,
    statesLength,
    updateFrameDelaySeconds,
}: OutputPreviewProps): JSX.Element {
    const frameCount = Math.max(statesLength, 1);
    const animationLengthSeconds = frameDelaySeconds * frameCount;
    const minAnimationLengthSeconds = minFrameDelaySeconds * frameCount;
    const maxAnimationLengthSeconds = maxFrameDelaySeconds * frameCount;

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

    const updateAnimationLengthSeconds = (value: string): void => {
        const nextLength = Number.parseFloat(value);

        if (Number.isNaN(nextLength)) {
            return;
        }

        const clampedLength = Math.min(
            maxAnimationLengthSeconds,
            Math.max(minAnimationLengthSeconds, nextLength)
        );

        updateFrameDelaySeconds((clampedLength / frameCount).toFixed(1));
    };

    const handleLengthKeyDown = (
        event: KeyboardEvent<HTMLInputElement>
    ): void => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
            return;
        }

        event.preventDefault();

        const direction = event.key === 'ArrowUp' ? 1 : -1;
        const step = event.shiftKey ? 1 : 0.2;
        const nextLength = Math.min(
            maxAnimationLengthSeconds,
            Math.max(
                minAnimationLengthSeconds,
                animationLengthSeconds + direction * step
            )
        );

        updateAnimationLengthSeconds(nextLength.toFixed(1));
    };

    return (
        <section aria-labelledby='output-title' className='output'>
            <div className='panel-heading'>
                <h2 id='output-title'>{copy.badgePreviewTitle}</h2>
                <div className='output-heading-actions'>
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
                            <Timer aria-hidden='true' size={16} />
                        </button>
                        {frameSettingsOpen ? (
                            <div className='settings-popover'>
                                <label className='settings-value-field'>
                                    <span>{copy.animationDelay}</span>
                                    <span className='settings-value-row'>
                                        <input
                                            aria-label={
                                                copy.animationDelaySeconds
                                            }
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
                                    </span>
                                </label>
                                <label className='settings-value-field'>
                                    <span>{copy.animationLength}</span>
                                    <span className='settings-value-row'>
                                        <input
                                            aria-label={
                                                copy.animationLengthSeconds
                                            }
                                            inputMode='decimal'
                                            max={maxAnimationLengthSeconds}
                                            min={minAnimationLengthSeconds}
                                            onChange={(event) => {
                                                updateAnimationLengthSeconds(
                                                    event.target.value
                                                );
                                            }}
                                            onKeyDown={handleLengthKeyDown}
                                            pattern='[0-9]*[.]?[0-9]*'
                                            step='0.2'
                                            type='text'
                                            value={animationLengthSeconds.toFixed(
                                                1
                                            )}
                                        />
                                        <span>{copy.secondsUnit}</span>
                                    </span>
                                </label>
                            </div>
                        ) : undefined}
                    </div>

                    <div className='preference-menu output-animation-menu'>
                        <button
                            aria-expanded={openPreferenceMenu === 'animation'}
                            aria-haspopup='menu'
                            className='preference-trigger'
                            onClick={() => {
                                setOpenPreferenceMenu((currentMenu) =>
                                    currentMenu === 'animation'
                                        ? undefined
                                        : 'animation'
                                );
                            }}
                            title={copy.animationType}
                            type='button'
                        >
                            <WandSparkles aria-hidden='true' size={16} />
                            <span>{copy.animationLabels[animationType]}</span>
                            <ChevronDown aria-hidden='true' size={16} />
                        </button>
                        {openPreferenceMenu === 'animation' ? (
                            <div
                                aria-label={copy.animationType}
                                className='preference-options'
                                role='menu'
                            >
                                {(
                                    Object.entries(
                                        copy.animationLabels
                                    ) as Array<[AnimationType, string]>
                                ).map(([value, label]) => (
                                    <button
                                        aria-checked={animationType === value}
                                        className='preference-option'
                                        key={value}
                                        onClick={() => {
                                            setAnimationType(value);
                                            setOpenPreferenceMenu(undefined);
                                        }}
                                        role='menuitemradio'
                                        type='button'
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        ) : undefined}
                    </div>
                </div>
            </div>
            <div className='output__showcase'>
                <div aria-live='polite' className='preview'>
                    {previewSource === '' ? (
                        <span>{copy.noPreviewFrames}</span>
                    ) : (
                        <img
                            alt={copy.generatedPreviewAlt}
                            src={previewSource}
                        />
                    )}
                </div>

                <div className='output__actions'>
                    <button
                        aria-label={copy.exportAnimatedSvg}
                        className='button button--primary'
                        disabled={badgeSvg === ''}
                        onClick={() => {
                            setExportDialogOpen(true);
                        }}
                        title={copy.export}
                        type='button'
                    >
                        <Download aria-hidden='true' size={16} />
                        {copy.export}
                    </button>
                </div>
            </div>
        </section>
    );
}
