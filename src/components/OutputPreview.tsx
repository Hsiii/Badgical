import './OutputPreview.css';

import type { Dispatch, JSX, KeyboardEvent, SetStateAction } from 'react';
import { ChevronDown, Download, Timer, WandSparkles } from 'lucide-react';

import {
    maxAnimationStartDelaySeconds,
    maxFrameDelaySeconds,
    maxTransitionSeconds,
    minAnimationStartDelaySeconds,
    minFrameDelaySeconds,
    minTransitionSeconds,
} from '@/components/badge-builder/constants';
import type {
    AnimationType,
    PreferenceMenu,
} from '@/components/badge-builder/types';
import type { UiCopy } from '@/components/i18n';

interface OutputPreviewProps {
    readonly animationDelaySeconds: number;
    readonly animationType: AnimationType;
    readonly badgeSvg: string;
    readonly copy: UiCopy;
    readonly downloadFileName: string;
    readonly frameLengthSeconds: number;
    readonly frameSettingsOpen: boolean;
    readonly downloadSvg: () => void;
    readonly openPreferenceMenu: PreferenceMenu | undefined;
    readonly previewSource: string;
    readonly setAnimationType: Dispatch<SetStateAction<AnimationType>>;
    readonly setFrameSettingsOpen: (
        updater: (isOpen: boolean) => boolean
    ) => void;
    readonly setOpenPreferenceMenu: Dispatch<
        SetStateAction<PreferenceMenu | undefined>
    >;
    readonly transitionLengthSeconds: number;
    readonly updateAnimationDelaySeconds: (value: string) => void;
    readonly updateFrameLengthSeconds: (value: string) => void;
    readonly updateTransitionLengthSeconds: (value: string) => void;
}

export function OutputPreview({
    animationDelaySeconds,
    animationType,
    badgeSvg,
    copy,
    downloadFileName,
    frameLengthSeconds,
    frameSettingsOpen,
    downloadSvg,
    openPreferenceMenu,
    previewSource,
    setAnimationType,
    setFrameSettingsOpen,
    setOpenPreferenceMenu,
    transitionLengthSeconds,
    updateAnimationDelaySeconds,
    updateFrameLengthSeconds,
    updateTransitionLengthSeconds,
}: OutputPreviewProps): JSX.Element {
    const handleTimingKeyDown = (
        event: KeyboardEvent<HTMLInputElement>,
        value: number,
        min: number,
        max: number,
        updateValue: (value: string) => void
    ): void => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
            return;
        }

        event.preventDefault();

        const direction = event.key === 'ArrowUp' ? 1 : -1;
        const step = event.shiftKey ? 1 : 0.2;
        const nextValue = Math.min(
            max,
            Math.max(min, value + direction * step)
        );

        updateValue(nextValue.toFixed(1));
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
                                            max={maxAnimationStartDelaySeconds}
                                            min={minAnimationStartDelaySeconds}
                                            onChange={(event) => {
                                                updateAnimationDelaySeconds(
                                                    event.target.value
                                                );
                                            }}
                                            onKeyDown={(event) => {
                                                handleTimingKeyDown(
                                                    event,
                                                    animationDelaySeconds,
                                                    minAnimationStartDelaySeconds,
                                                    maxAnimationStartDelaySeconds,
                                                    updateAnimationDelaySeconds
                                                );
                                            }}
                                            pattern='[0-9]*[.]?[0-9]*'
                                            step='0.2'
                                            type='text'
                                            value={animationDelaySeconds}
                                        />
                                        <span>{copy.secondsUnit}</span>
                                    </span>
                                </label>
                                <label className='settings-value-field'>
                                    <span>{copy.transitionLength}</span>
                                    <span className='settings-value-row'>
                                        <input
                                            aria-label={
                                                copy.transitionLengthSeconds
                                            }
                                            inputMode='decimal'
                                            max={Math.min(
                                                maxTransitionSeconds,
                                                frameLengthSeconds
                                            )}
                                            min={minTransitionSeconds}
                                            onChange={(event) => {
                                                updateTransitionLengthSeconds(
                                                    event.target.value
                                                );
                                            }}
                                            onKeyDown={(event) => {
                                                handleTimingKeyDown(
                                                    event,
                                                    transitionLengthSeconds,
                                                    minTransitionSeconds,
                                                    Math.min(
                                                        maxTransitionSeconds,
                                                        frameLengthSeconds
                                                    ),
                                                    updateTransitionLengthSeconds
                                                );
                                            }}
                                            pattern='[0-9]*[.]?[0-9]*'
                                            step='0.2'
                                            type='text'
                                            value={transitionLengthSeconds}
                                        />
                                        <span>{copy.secondsUnit}</span>
                                    </span>
                                </label>
                                <label className='settings-value-field'>
                                    <span>{copy.frameLength}</span>
                                    <span className='settings-value-row'>
                                        <input
                                            aria-label={copy.frameLengthSeconds}
                                            inputMode='decimal'
                                            max={maxFrameDelaySeconds}
                                            min={minFrameDelaySeconds}
                                            onChange={(event) => {
                                                updateFrameLengthSeconds(
                                                    event.target.value
                                                );
                                            }}
                                            onKeyDown={(event) => {
                                                handleTimingKeyDown(
                                                    event,
                                                    frameLengthSeconds,
                                                    minFrameDelaySeconds,
                                                    maxFrameDelaySeconds,
                                                    updateFrameLengthSeconds
                                                );
                                            }}
                                            pattern='[0-9]*[.]?[0-9]*'
                                            step='0.2'
                                            type='text'
                                            value={frameLengthSeconds}
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
                        aria-label={copy.downloadFile(downloadFileName)}
                        className='button button--primary'
                        disabled={badgeSvg === ''}
                        onClick={downloadSvg}
                        title={copy.downloadFile(downloadFileName)}
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
