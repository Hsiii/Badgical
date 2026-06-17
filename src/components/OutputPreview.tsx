import './OutputPreview.css';

import type { JSX } from 'react';
import { Download } from 'lucide-react';

interface OutputPreviewProps {
    readonly badgeSvg: string;
    readonly previewSource: string;
    readonly setExportDialogOpen: (isOpen: boolean) => void;
}

export function OutputPreview({
    badgeSvg,
    previewSource,
    setExportDialogOpen,
}: OutputPreviewProps): JSX.Element {
    return (
        <section aria-label='Preview' className='output'>
            <div className='panel-heading'>
                <h2>The Badgic</h2>
            </div>
            <div className='output__showcase'>
                <div className='preview'>
                    {previewSource === '' ? (
                        <span>Add frames to preview the animated badge.</span>
                    ) : (
                        <img
                            alt='Generated animated badge preview'
                            src={previewSource}
                        />
                    )}
                </div>

                <div className='output__actions'>
                    <button
                        aria-label='Export animated SVG'
                        className='button button--primary'
                        disabled={badgeSvg === ''}
                        onClick={() => {
                            setExportDialogOpen(true);
                        }}
                        title='Export'
                        type='button'
                    >
                        <Download aria-hidden='true' size={16} />
                        Export
                    </button>
                </div>
            </div>
        </section>
    );
}
