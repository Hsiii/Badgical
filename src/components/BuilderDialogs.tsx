import './BuilderDialogs.css';

import type { Dispatch, JSX, SetStateAction } from 'react';
import { Copy, Download } from 'lucide-react';

import { defaultExportFolder } from '@/components/badge-builder/constants';

interface BuilderDialogsProps {
    readonly confirmDeleteState: () => void;
    readonly copyReadmeMarkdown: () => void;
    readonly deleteCandidateId: string | undefined;
    readonly downloadSvg: () => void;
    readonly exportCopyState: 'idle' | 'markdown';
    readonly exportDialogOpen: boolean;
    readonly exportFolder: string;
    readonly exportPath: string;
    readonly exportRepo: string;
    readonly normalizedExportRepo: string;
    readonly readmeMarkdown: string;
    readonly saveSourceDialog: () => void;
    readonly setDeleteCandidateId: (id: string | undefined) => void;
    readonly setExportCopyState: Dispatch<SetStateAction<'idle' | 'markdown'>>;
    readonly setExportDialogOpen: (isOpen: boolean) => void;
    readonly setExportFolder: (folder: string) => void;
    readonly setExportRepo: (repo: string) => void;
    readonly setSourceDialogOpen: (isOpen: boolean) => void;
    readonly setSourceDraft: (source: string) => void;
    readonly sourceDialogOpen: boolean;
    readonly sourceDraft: string;
}

export function BuilderDialogs({
    confirmDeleteState,
    copyReadmeMarkdown,
    deleteCandidateId,
    downloadSvg,
    exportCopyState,
    exportDialogOpen,
    exportFolder,
    exportPath,
    exportRepo,
    normalizedExportRepo,
    readmeMarkdown,
    saveSourceDialog,
    setDeleteCandidateId,
    setExportCopyState,
    setExportDialogOpen,
    setExportFolder,
    setExportRepo,
    setSourceDialogOpen,
    setSourceDraft,
    sourceDialogOpen,
    sourceDraft,
}: BuilderDialogsProps): JSX.Element {
    return (
        <>
            {deleteCandidateId === undefined ? undefined : (
                <div className='confirm-backdrop' role='presentation'>
                    <section
                        aria-labelledby='delete-frame-title'
                        aria-modal='true'
                        className='confirm-dialog'
                        role='dialog'
                    >
                        <div className='panel-heading'>
                            <h2 id='delete-frame-title'>Delete Frame</h2>
                        </div>
                        <p>This removes the frame from the badge animation.</p>
                        <div className='confirm-dialog__actions'>
                            <button
                                className='button button--secondary'
                                onClick={() => {
                                    setDeleteCandidateId(undefined);
                                }}
                                type='button'
                            >
                                Cancel
                            </button>
                            <button
                                className='button button--primary'
                                onClick={confirmDeleteState}
                                type='button'
                            >
                                Delete
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {sourceDialogOpen ? (
                <div className='confirm-backdrop' role='presentation'>
                    <section
                        aria-labelledby='source-dialog-title'
                        aria-modal='true'
                        className='confirm-dialog source-dialog'
                        role='dialog'
                    >
                        <div className='panel-heading'>
                            <h2 id='source-dialog-title'>Edit SVG Source</h2>
                        </div>
                        <label className='field source-dialog__field'>
                            <textarea
                                aria-label='Logo SVG'
                                onChange={(event) => {
                                    setSourceDraft(event.target.value);
                                }}
                                value={sourceDraft}
                            />
                        </label>
                        <div className='confirm-dialog__actions'>
                            <button
                                className='button button--secondary'
                                onClick={() => {
                                    setSourceDialogOpen(false);
                                }}
                                type='button'
                            >
                                Cancel
                            </button>
                            <button
                                className='button button--primary'
                                onClick={saveSourceDialog}
                                type='button'
                            >
                                Save
                            </button>
                        </div>
                    </section>
                </div>
            ) : undefined}

            {exportDialogOpen ? (
                <div className='confirm-backdrop' role='presentation'>
                    <section
                        aria-labelledby='export-dialog-title'
                        aria-modal='true'
                        className='confirm-dialog export-dialog'
                        role='dialog'
                    >
                        <div className='panel-heading'>
                            <h2 id='export-dialog-title'>Export Badge</h2>
                        </div>

                        <div className='export-fields'>
                            <label className='field'>
                                <span>Choose target repo</span>
                                <input
                                    onChange={(event) => {
                                        setExportRepo(event.target.value);
                                        setExportCopyState('idle');
                                    }}
                                    placeholder='username/repo'
                                    value={exportRepo}
                                />
                            </label>
                            <label className='field'>
                                <span>Choose asset folder</span>
                                <input
                                    onChange={(event) => {
                                        setExportFolder(event.target.value);
                                        setExportCopyState('idle');
                                    }}
                                    placeholder={defaultExportFolder}
                                    value={exportFolder}
                                />
                            </label>
                        </div>

                        <p className='export-guide'>
                            Download the SVG and put it in{' '}
                            <code>{exportPath}</code> in{' '}
                            <code>{normalizedExportRepo}</code>. Then put the
                            generated Markdown in that repository README.
                        </p>

                        <label className='field export-field'>
                            <span>README Markdown</span>
                            <textarea readOnly value={readmeMarkdown} />
                        </label>

                        <div className='confirm-dialog__actions export-dialog__actions'>
                            <button
                                className='button button--secondary'
                                onClick={() => {
                                    setExportDialogOpen(false);
                                }}
                                type='button'
                            >
                                Close
                            </button>
                            <button
                                className='button button--primary'
                                onClick={copyReadmeMarkdown}
                                type='button'
                            >
                                <Copy aria-hidden='true' size={16} />
                                {exportCopyState === 'markdown'
                                    ? 'Copied'
                                    : 'Copy Markdown'}
                            </button>
                            <button
                                className='button button--primary'
                                onClick={downloadSvg}
                                type='button'
                            >
                                <Download aria-hidden='true' size={16} />
                                Download SVG
                            </button>
                        </div>
                    </section>
                </div>
            ) : undefined}
        </>
    );
}
