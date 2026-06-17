import './OutputPreview.css';

import type { JSX } from 'react';
import { Download } from 'lucide-react';

import type { UiCopy } from '@/components/i18n';

interface OutputPreviewProps {
    readonly badgeSvg: string;
    readonly copy: UiCopy;
    readonly previewSource: string;
    readonly setExportDialogOpen: (isOpen: boolean) => void;
}

export function OutputPreview({
    badgeSvg,
    copy,
    previewSource,
    setExportDialogOpen,
}: OutputPreviewProps): JSX.Element {
    return (
        <section aria-labelledby='output-title' className='output'>
            <div className='panel-heading'>
                <h2 id='output-title'>{copy.badgePreviewTitle}</h2>
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
