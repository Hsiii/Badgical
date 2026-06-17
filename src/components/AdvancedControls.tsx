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
    SelectionStatus,
    SvglResult,
    VariantMode,
} from '@/components/badge-builder/types';

interface VariantPreview {
    readonly label: string;
    readonly mode: VariantMode;
    readonly source: string;
}

interface AdvancedControlsProps {
    readonly addDraftFrame: () => void;
    readonly colorMode: ColorMode;
    readonly colorPickerStyle: CSSProperties;
    readonly draft: EditorDraft;
    readonly draftLogoSource: string | undefined;
    readonly draftPrimaryColor: string;
    readonly draftPrimaryHsv: HsvColor;
    readonly draftPrimaryRgb: RgbColor | undefined;
    readonly editingFrameId: string | undefined;
    readonly hasActiveDraft: boolean;
    readonly openSourceDialog: () => void;
    readonly selectColorMode: (mode: VariantMode) => void;
    readonly selectedResult: SvglResult | undefined;
    readonly selectionStatus: SelectionStatus;
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
    draft,
    draftLogoSource,
    draftPrimaryColor,
    draftPrimaryHsv,
    draftPrimaryRgb,
    editingFrameId,
    hasActiveDraft,
    openSourceDialog,
    selectColorMode,
    selectedResult,
    selectionStatus,
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
            aria-label='Advanced badge controls'
            className='advanced-panel'
        >
            <div className='advanced-controls'>
                <h2 className='advanced-controls__title'>Custom Edits</h2>
                <div className='advanced-controls__left'>
                    <div className='advanced-top-row'>
                        <div className='field advanced-svg-field'>
                            <button
                                aria-label='Edit SVG source'
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
                                    aria-label='Badge text'
                                    onChange={(event) => {
                                        setDraft((currentDraft) => ({
                                            ...currentDraft,
                                            name: event.target.value,
                                        }));
                                    }}
                                    placeholder='Badge text'
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
                                    aria-label={`Primary color saturation and brightness ${draftPrimaryColor}`}
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
                                                    draftPrimaryHsv.value + step
                                                );
                                                break;
                                            }

                                            case 'ArrowDown': {
                                                event.preventDefault();
                                                updateDraftSaturationValue(
                                                    draftPrimaryHsv.saturation,
                                                    draftPrimaryHsv.value - step
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
                                            aria-label='Primary hex'
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
                                                    aria-label='Primary red'
                                                    inputMode='numeric'
                                                    onChange={(event) => {
                                                        updateDraftColorChannel(
                                                            'red',
                                                            event.target.value
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
                                                    aria-label='Primary green'
                                                    inputMode='numeric'
                                                    onChange={(event) => {
                                                        updateDraftColorChannel(
                                                            'green',
                                                            event.target.value
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
                                                    aria-label='Primary blue'
                                                    inputMode='numeric'
                                                    onChange={(event) => {
                                                        updateDraftColorChannel(
                                                            'blue',
                                                            event.target.value
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
                                        aria-label='Primary color hue'
                                        className='color-control__hue'
                                        max='360'
                                        min='0'
                                        onChange={(event) => {
                                            updateDraftHue(event.target.value);
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
            </div>

            <div className='advanced-preview-stack'>
                <div aria-label='Badge variants' className='variant-options'>
                    {hasActiveDraft ? (
                        variantPreviews.map((variant) => (
                            <button
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
                        ))
                    ) : (
                        <div className='empty-state advanced-preview-empty'>
                            <p>Pick a brand to preview badge variants.</p>
                        </div>
                    )}
                </div>

                <button
                    className='button button--primary add-frame'
                    disabled={
                        editingFrameId === undefined &&
                        (selectedResult === undefined ||
                            selectionStatus !== 'ready' ||
                            statesLength >= maxFrames)
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
                        ? 'Add Frame'
                        : 'Update Frame'}
                </button>
            </div>
        </section>
    );
}
