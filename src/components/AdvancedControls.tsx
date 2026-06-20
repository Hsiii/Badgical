import './AdvancedControls.css';

import { useEffect, useState } from 'react';
import type {
    CSSProperties,
    Dispatch,
    JSX,
    KeyboardEvent,
    SetStateAction,
} from 'react';
import { Pencil, Pipette, Plus } from 'lucide-react';

import { normalizeHexInput } from '@/components/badge-builder/colors';
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
    readonly setSmartRecolorEnabled: (enabled: boolean) => void;
    readonly smartRecolorEnabled: boolean;
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

interface EyeDropperInstance {
    readonly open: () => Promise<{
        readonly sRGBHex: string;
    }>;
}

interface EyeDropperConstructor {
    readonly prototype: EyeDropperInstance;
    new (): {
        readonly open: EyeDropperInstance['open'];
    };
}

function getEyeDropperConstructor(): EyeDropperConstructor | undefined {
    return (
        globalThis as typeof globalThis & {
            readonly EyeDropper?: EyeDropperConstructor;
        }
    ).EyeDropper;
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

const getRgbInputValue = (
    color: RgbColor | undefined,
    channel: keyof RgbColor
): string => String(color?.[channel] ?? 0);

const getRgbInputValues = (
    color: RgbColor | undefined
): Record<keyof RgbColor, string> => ({
    blue: getRgbInputValue(color, 'blue'),
    green: getRgbInputValue(color, 'green'),
    red: getRgbInputValue(color, 'red'),
});

const normalizeRgbInput = (value: string): number | undefined => {
    const trimmedValue = value.trim();

    if (!/^\d+$/u.test(trimmedValue)) {
        return undefined;
    }

    return Math.min(255, Math.max(0, Number.parseInt(trimmedValue, 10)));
};

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
    setSmartRecolorEnabled,
    smartRecolorEnabled,
    statesLength,
    updateColorPadFromPoint,
    updateDraftColor,
    updateDraftColorChannel,
    updateDraftHue,
    updateDraftSaturationValue,
    variantPreviews,
}: AdvancedControlsProps): JSX.Element {
    const [eyeDropperSupported, setEyeDropperSupported] = useState(false);
    const [hexInput, setHexInput] = useState(draftPrimaryColor);
    const [rgbInputs, setRgbInputs] = useState(() =>
        getRgbInputValues(draftPrimaryRgb)
    );

    useEffect(() => {
        setEyeDropperSupported(getEyeDropperConstructor() !== undefined);
    }, []);

    useEffect(() => {
        setHexInput(draftPrimaryColor);
    }, [draftPrimaryColor]);

    useEffect(() => {
        setRgbInputs(getRgbInputValues(draftPrimaryRgb));
    }, [draftPrimaryRgb?.blue, draftPrimaryRgb?.green, draftPrimaryRgb?.red]);

    const commitHexInput = (): void => {
        const normalizedColor = normalizeHexInput(hexInput);

        if (normalizedColor === undefined) {
            setHexInput(draftPrimaryColor);
            return;
        }

        setHexInput(normalizedColor);
        updateDraftColor(normalizedColor);
    };

    const resetRgbChannelInput = (channel: keyof RgbColor): void => {
        setRgbInputs({
            ...rgbInputs,
            [channel]: getRgbInputValue(draftPrimaryRgb, channel),
        });
    };

    const commitRgbChannelInput = (channel: keyof RgbColor): void => {
        const normalizedValue = normalizeRgbInput(rgbInputs[channel]);

        if (normalizedValue === undefined) {
            resetRgbChannelInput(channel);
            return;
        }

        setRgbInputs({
            ...rgbInputs,
            [channel]: String(normalizedValue),
        });
        updateDraftColorChannel(channel, String(normalizedValue));
    };

    const handleRgbChannelKeyDown = (
        event: KeyboardEvent<HTMLInputElement>,
        channel: keyof RgbColor,
        currentValue: number | undefined
    ): void => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commitRgbChannelInput(channel);
            return;
        }

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
                Math.max(0, (currentValue ?? 0) + direction * step)
            );

            setRgbInputs({
                ...rgbInputs,
                [channel]: String(nextValue),
            });
            updateDraftColorChannel(channel, String(nextValue));
        }
    };

    const pickScreenColor = (): void => {
        const EyeDropper = getEyeDropperConstructor();

        if (EyeDropper === undefined) {
            return;
        }

        new EyeDropper()
            .open()
            .then(({ sRGBHex }) => {
                updateDraftColor(sRGBHex);
            })
            .catch(() => undefined);
    };

    return (
        <section
            aria-label={copy.advancedControlsLabel}
            className='advanced-panel'
        >
            <div className='advanced-controls'>
                <div className='advanced-controls__header'>
                    <h2 className='advanced-controls__title'>
                        {copy.customEdits}
                    </h2>
                    <label className='advanced-controls__smart-recolor'>
                        <input
                            checked={smartRecolorEnabled}
                            onChange={(event) => {
                                setSmartRecolorEnabled(event.target.checked);
                            }}
                            type='checkbox'
                        />
                        <span>{copy.smartRecolor}</span>
                    </label>
                </div>
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
                                                onBlur={commitHexInput}
                                                onChange={(event) => {
                                                    setHexInput(
                                                        event.target.value
                                                    );
                                                }}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault();
                                                        commitHexInput();
                                                    }
                                                }}
                                                value={hexInput}
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
                                                        onBlur={() => {
                                                            commitRgbChannelInput(
                                                                'red'
                                                            );
                                                        }}
                                                        onChange={(event) => {
                                                            setRgbInputs({
                                                                ...rgbInputs,
                                                                red: event
                                                                    .target
                                                                    .value,
                                                            });
                                                        }}
                                                        onKeyDown={(event) => {
                                                            handleRgbChannelKeyDown(
                                                                event,
                                                                'red',
                                                                normalizeRgbInput(
                                                                    rgbInputs.red
                                                                )
                                                            );
                                                        }}
                                                        pattern='[0-9]*'
                                                        type='text'
                                                        value={rgbInputs.red}
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
                                                        onBlur={() => {
                                                            commitRgbChannelInput(
                                                                'green'
                                                            );
                                                        }}
                                                        onChange={(event) => {
                                                            setRgbInputs({
                                                                ...rgbInputs,
                                                                green: event
                                                                    .target
                                                                    .value,
                                                            });
                                                        }}
                                                        onKeyDown={(event) => {
                                                            handleRgbChannelKeyDown(
                                                                event,
                                                                'green',
                                                                normalizeRgbInput(
                                                                    rgbInputs.green
                                                                )
                                                            );
                                                        }}
                                                        pattern='[0-9]*'
                                                        type='text'
                                                        value={rgbInputs.green}
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
                                                        onBlur={() => {
                                                            commitRgbChannelInput(
                                                                'blue'
                                                            );
                                                        }}
                                                        onChange={(event) => {
                                                            setRgbInputs({
                                                                ...rgbInputs,
                                                                blue: event
                                                                    .target
                                                                    .value,
                                                            });
                                                        }}
                                                        onKeyDown={(event) => {
                                                            handleRgbChannelKeyDown(
                                                                event,
                                                                'blue',
                                                                normalizeRgbInput(
                                                                    rgbInputs.blue
                                                                )
                                                            );
                                                        }}
                                                        pattern='[0-9]*'
                                                        type='text'
                                                        value={rgbInputs.blue}
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
                                        <button
                                            aria-label={copy.pickScreenColor}
                                            className='icon-button color-control__eyedropper'
                                            disabled={!eyeDropperSupported}
                                            onClick={pickScreenColor}
                                            title={copy.pickScreenColor}
                                            type='button'
                                        >
                                            <Pipette
                                                aria-hidden='true'
                                                size={16}
                                            />
                                        </button>
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
