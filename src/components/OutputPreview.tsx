import './OutputPreview.css';

import type { Dispatch, JSX, SetStateAction } from 'react';
import { ChevronDown, Download, WandSparkles } from 'lucide-react';

import type {
    AnimationType,
    PreferenceMenu,
} from '@/components/badge-builder/types';
import type { UiCopy } from '@/components/i18n';

interface OutputPreviewProps {
    readonly animationType: AnimationType;
    readonly badgeSvg: string;
    readonly copy: UiCopy;
    readonly openPreferenceMenu: PreferenceMenu | undefined;
    readonly previewSource: string;
    readonly setAnimationType: Dispatch<SetStateAction<AnimationType>>;
    readonly setExportDialogOpen: (isOpen: boolean) => void;
    readonly setOpenPreferenceMenu: Dispatch<
        SetStateAction<PreferenceMenu | undefined>
    >;
}

export function OutputPreview({
    animationType,
    badgeSvg,
    copy,
    openPreferenceMenu,
    previewSource,
    setAnimationType,
    setExportDialogOpen,
    setOpenPreferenceMenu,
}: OutputPreviewProps): JSX.Element {
    return (
        <section aria-labelledby='output-title' className='output'>
            <div className='panel-heading'>
                <h2 id='output-title'>{copy.badgePreviewTitle}</h2>
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
                                Object.entries(copy.animationLabels) as Array<
                                    [AnimationType, string]
                                >
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
