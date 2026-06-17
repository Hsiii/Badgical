import './AdvancedControls.css';

import type {
    CSSProperties,
    Dispatch,
    JSX,
    KeyboardEvent,
    SetStateAction,
} from 'react';
import { Pencil, Plus } from 'lucide-react';

import { maxFrames } from '@/components/badge-builder/constants';
import type {
    ColorMode,
    EditorDraft,
    HsvColor,
    RgbColor,
    VariantMode,
} from '@/components/badge-builder/types';
import type { UiCopy } from '@/components/i18n';

interface VariantPreview {
    readonly label: string;
    readonly mode: VariantMode;
    readonly source: string;
}

interface AdvancedControlsProps {
    readonly addDraftFrame: () => void;
    readonly colorMode: ColorMode;
    readonly colorPickerStyle: CSSProperties;
    readonly copy: UiCopy;
    readonly draft: EditorDraft;
    readonly draftLogoSource: string | undefined;
    readonly draftPrimaryColor: string;
    readonly draftPrimaryHsv: HsvColor;
    readonly draftPrimaryRgb: RgbColor | undefined;
    readonly editingFrameId: string | undefined;
    readonly openSourceDialog: () => void;
    readonly selectColorMode: (mode: VariantMode) => void;
    readonly setDraft: Dispatch<SetStateAction<EditorDraft>>;
    readonly statesLength: number;
    readonly updateColorPadFromPoint: (
        clientX: number,
        clientY: number,
        element: HTMLElement
    ) => void;
    readonly updateDraftColor: (value: string) => void;
    readonly updateDraftColorChannel: (
        channel: keyof RgbColor,
        value: string
    ) => void;
    readonly updateDraftHue: (value: string) => void;
    readonly updateDraftSaturationValue: (
        saturation: number,
        value: number
    ) => void;
    readonly variantPreviews: readonly VariantPreview[];
}

function focusSiblingRgbInput(
    event: KeyboardEvent<HTMLInputElement>,
    direction: 1 | -1
) {
    const rgbGroup = event.currentTarget.closest('.color-control__rgb-group');

    if (rgbGroup === null) {
        return;
    }

    const rgbInputs = [...rgbGroup.querySelectorAll<HTMLInputElement>('input')];
    const currentIndex = rgbInputs.indexOf(event.currentTarget);
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= rgbInputs.length) {
        return;
    }

    const nextInput = rgbInputs[nextIndex];

    event.preventDefault();
    nextInput.focus();
    nextInput.select();
}

export function AdvancedControls({
    addDraftFrame,
    colorMode,
    colorPickerStyle,
    copy,
    draft,
    draftLogoSource,
    draftPrimaryColor,
    draftPrimaryHsv,
    draftPrimaryRgb,
    editingFrameId,
    openSourceDialog,
    selectColorMode,
    setDraft,
    statesLength,
    updateColorPadFromPoint,
    updateDraftColor,
    updateDraftColorChannel,
    updateDraftHue,
    updateDraftSaturationValue,
    variantPreviews,
}: AdvancedControlsProps): JSX.Element {
    const handleRgbChannelKeyDown = (
        event: KeyboardEvent<HTMLInputElement>,
        channel: keyof RgbColor,
        currentValue: number
    ): void => {
        if (event.key === 'ArrowLeft') {
            focusSiblingRgbInput(event, -1);
            return;
        }

        if (event.key === 'ArrowRight') {
            focusSiblingRgbInput(event, 1);
            return;
        }

        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();

            const direction = event.key === 'ArrowUp' ? 1 : -1;
            const step = event.shiftKey ? 10 : 1;
            const nextValue = Math.min(
                255,
                Math.max(0, currentValue + direction * step)
            );

            updateDraftColorChannel(channel, String(nextValue));
        }
    };

    return (
        <section
            aria-label={copy.advancedControlsLabel}
            className='advanced-panel'
        >
            <div className='advanced-controls'>
                <h2 className='advanced-controls__title'>{copy.customEdits}</h2>
                <div className='advanced-controls__body'>
                    <div className='advanced-controls__left'>
                        <div className='advanced-top-row'>
                            <div className='field advanced-svg-field'>
                                <button
                                    aria-label={copy.editSvgSource}
                                    className='advanced-logo-preview'
                                    onClick={openSourceDialog}
                                    type='button'
                                >
                                    {draftLogoSource === undefined ? (
                                        <span
                                            aria-hidden='true'
                                            className='logo-placeholder'
                                        />
                                    ) : (
                                        <img alt='' src={draftLogoSource} />
                                    )}
                                </button>
                            </div>

                            <label className='field advanced-text-field'>
                                <span className='advanced-text-input'>
                                    <input
                                        aria-label={copy.badgeText}
                                        onChange={(event) => {
                                            setDraft((currentDraft) => ({
                                                ...currentDraft,
                                                name: event.target.value,
                                            }));
                                        }}
                                        placeholder={copy.badgeText}
                                        value={draft.name}
                                    />
                                </span>
                            </label>
                        </div>

                        <div className='field advanced-color-field'>
                            <div className='color-control'>
                                <div
                                    className='color-control__visuals'
                                    style={colorPickerStyle}
                                >
                                    <button
                                        aria-label={copy.primaryColorSaturation(
                                            draftPrimaryColor
                                        )}
                                        className='color-control__pad'
                                        onKeyDown={(event) => {
                                            const step = event.shiftKey
                                                ? 0.12
                                                : 0.04;

                                            switch (event.key) {
                                                case 'ArrowLeft': {
                                                    event.preventDefault();
                                                    updateDraftSaturationValue(
                                                        draftPrimaryHsv.saturation -
                                                            step,
                                                        draftPrimaryHsv.value
                                                    );
                                                    break;
                                                }

                                                case 'ArrowRight': {
                                                    event.preventDefault();
                                                    updateDraftSaturationValue(
                                                        draftPrimaryHsv.saturation +
                                                            step,
                                                        draftPrimaryHsv.value
                                                    );
                                                    break;
                                                }

                                                case 'ArrowUp': {
                                                    event.preventDefault();
                                                    updateDraftSaturationValue(
                                                        draftPrimaryHsv.saturation,
                                                        draftPrimaryHsv.value +
                                                            step
                                                    );
                                                    break;
                                                }

                                                case 'ArrowDown': {
                                                    event.preventDefault();
                                                    updateDraftSaturationValue(
                                                        draftPrimaryHsv.saturation,
                                                        draftPrimaryHsv.value -
                                                            step
                                                    );
                                                    break;
                                                }

                                                default: {
                                                    break;
                                                }
                                            }
                                        }}
                                        onPointerDown={(event) => {
                                            event.currentTarget.setPointerCapture(
                                                event.pointerId
                                            );
                                            updateColorPadFromPoint(
                                                event.clientX,
                                                event.clientY,
                                                event.currentTarget
                                            );
                                        }}
                                        onPointerMove={(event) => {
                                            if (event.buttons !== 1) {
                                                return;
                                            }

                                            updateColorPadFromPoint(
                                                event.clientX,
                                                event.clientY,
                                                event.currentTarget
                                            );
                                        }}
                                        type='button'
                                    >
                                        <span className='color-control__dot' />
                                    </button>
                                </div>

                                <div className='color-control__inputs'>
                                    <div className='color-control__value-group'>
                                        <label className='color-control__hex-row'>
                                            <span>Hex</span>
                                            <input
                                                aria-label={copy.primaryHex}
                                                onChange={(event) => {
                                                    updateDraftColor(
                                                        event.target.value
                                                    );
                                                }}
                                                value={draftPrimaryColor}
                                            />
                                        </label>

                                        <div className='color-control__rgb-row'>
                                            <span>RGB</span>
                                            <div className='color-control__rgb-group'>
                                                <span className='color-control__rgb-slot'>
                                                    <input
                                                        aria-label={
                                                            copy.primaryRed
                                                        }
                                                        inputMode='numeric'
                                                        onChange={(event) => {
                                                            updateDraftColorChannel(
                                                                'red',
                                                                event.target
                                                                    .value
                                                            );
                                                        }}
                                                        onKeyDown={(event) => {
                                                            handleRgbChannelKeyDown(
                                                                event,
                                                                'red',
                                                                draftPrimaryRgb?.red ??
                                                                    0
                                                            );
                                                        }}
                                                        pattern='[0-9]*'
                                                        type='text'
                                                        value={
                                                            draftPrimaryRgb?.red ??
                                                            0
                                                        }
                                                    />
                                                </span>
                                                <span
                                                    aria-hidden='true'
                                                    className='color-control__rgb-separator'
                                                >
                                                    ,
                                                </span>
                                                <span className='color-control__rgb-slot'>
                                                    <input
                                                        aria-label={
                                                            copy.primaryGreen
                                                        }
                                                        inputMode='numeric'
                                                        onChange={(event) => {
                                                            updateDraftColorChannel(
                                                                'green',
                                                                event.target
                                                                    .value
                                                            );
                                                        }}
                                                        onKeyDown={(event) => {
                                                            handleRgbChannelKeyDown(
                                                                event,
                                                                'green',
                                                                draftPrimaryRgb?.green ??
                                                                    0
                                                            );
                                                        }}
                                                        pattern='[0-9]*'
                                                        type='text'
                                                        value={
                                                            draftPrimaryRgb?.green ??
                                                            0
                                                        }
                                                    />
                                                </span>
                                                <span
                                                    aria-hidden='true'
                                                    className='color-control__rgb-separator'
                                                >
                                                    ,
                                                </span>
                                                <span className='color-control__rgb-slot'>
                                                    <input
                                                        aria-label={
                                                            copy.primaryBlue
                                                        }
                                                        inputMode='numeric'
                                                        onChange={(event) => {
                                                            updateDraftColorChannel(
                                                                'blue',
                                                                event.target
                                                                    .value
                                                            );
                                                        }}
                                                        onKeyDown={(event) => {
                                                            handleRgbChannelKeyDown(
                                                                event,
                                                                'blue',
                                                                draftPrimaryRgb?.blue ??
                                                                    0
                                                            );
                                                        }}
                                                        pattern='[0-9]*'
                                                        type='text'
                                                        value={
                                                            draftPrimaryRgb?.blue ??
                                                            0
                                                        }
                                                    />
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <label className='color-control__hue-row'>
                                        <span>Hue</span>
                                        <input
                                            aria-label={copy.primaryColorHue}
                                            className='color-control__hue'
                                            max='360'
                                            min='0'
                                            onChange={(event) => {
                                                updateDraftHue(
                                                    event.target.value
                                                );
                                            }}
                                            step='1'
                                            type='range'
                                            value={draftPrimaryHsv.hue}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='advanced-preview-stack'>
                        <div
                            aria-label={copy.badgeVariantsLabel}
                            className='variant-options'
                        >
                            {variantPreviews.map((variant) => (
                                <button
                                    aria-label={copy.selectVariant(
                                        variant.label
                                    )}
                                    aria-pressed={colorMode === variant.mode}
                                    className='variant-card'
                                    key={variant.mode}
                                    onClick={() => {
                                        selectColorMode(variant.mode);
                                    }}
                                    type='button'
                                >
                                    <img alt='' src={variant.source} />
                                    <span>{variant.label}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            className='button button--primary add-frame'
                            disabled={
                                editingFrameId === undefined &&
                                statesLength >= maxFrames
                            }
                            onClick={addDraftFrame}
                            type='button'
                        >
                            {editingFrameId === undefined ? (
                                <Plus aria-hidden='true' size={16} />
                            ) : (
                                <Pencil aria-hidden='true' size={16} />
                            )}
                            {editingFrameId === undefined
                                ? copy.addFrame
                                : copy.updateFrame}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
