import './BuilderDialogs.css';

import { useEffect, useRef } from 'react';
import type { ChangeEvent, JSX, KeyboardEvent } from 'react';
import { Upload, X } from 'lucide-react';

import type { UiCopy } from '@/components/i18n';

interface BuilderDialogsProps {
    readonly confirmDeleteState: () => void;
    readonly copy: UiCopy;
    readonly deleteCandidateId: string | undefined;
    readonly openExistingBadgePicker: () => void;
    readonly saveSourceDialog: () => void;
    readonly setDeleteCandidateId: (id: string | undefined) => void;
    readonly setSourceDialogOpen: (isOpen: boolean) => void;
    readonly setSourceDraft: (source: string) => void;
    readonly setStartExistingDialogOpen: (isOpen: boolean) => void;
    readonly sourceDialogOpen: boolean;
    readonly sourceDraft: string;
    readonly startExistingDialogOpen: boolean;
}

export function BuilderDialogs({
    confirmDeleteState,
    copy,
    deleteCandidateId,
    openExistingBadgePicker,
    saveSourceDialog,
    setDeleteCandidateId,
    setSourceDialogOpen,
    setSourceDraft,
    setStartExistingDialogOpen,
    sourceDialogOpen,
    sourceDraft,
    startExistingDialogOpen,
}: BuilderDialogsProps): JSX.Element {
    const deleteDialogReference = useRef<HTMLElement | undefined>(undefined);
    const deleteConfirmButtonReference = useRef<HTMLButtonElement | undefined>(
        undefined
    );
    const deleteReturnFocusReference = useRef<HTMLElement | undefined>(
        undefined
    );

    useEffect(() => {
        if (deleteCandidateId === undefined) {
            return undefined;
        }

        deleteReturnFocusReference.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : undefined;
        deleteConfirmButtonReference.current?.focus();

        return (): void => {
            const returnFocusElement = deleteReturnFocusReference.current;

            if (returnFocusElement?.isConnected === true) {
                returnFocusElement.focus();
            }

            deleteReturnFocusReference.current = undefined;
        };
    }, [deleteCandidateId]);

    const uploadSourceFile = (event: ChangeEvent<HTMLInputElement>): void => {
        const input = event.currentTarget;
        const file = input.files?.[0];

        if (file === undefined) {
            return;
        }

        file.text().then(
            (source) => {
                setSourceDraft(source);
                input.value = '';
            },
            () => {
                input.value = '';
            }
        );
    };

    const handleDeleteDialogKeyDown = (
        event: KeyboardEvent<HTMLElement>
    ): void => {
        if (event.key === 'Escape') {
            event.preventDefault();
            setDeleteCandidateId(undefined);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            confirmDeleteState();
            return;
        }

        if (event.key !== 'Tab') {
            return;
        }

        const dialogElement = deleteDialogReference.current;

        if (dialogElement === undefined) {
            return;
        }

        const focusableElements = [
            ...dialogElement.querySelectorAll<HTMLButtonElement>(
                'button:not(:disabled)'
            ),
        ];

        if (focusableElements.length === 0) {
            return;
        }

        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement =
            focusableElements.at(-1) ?? firstFocusableElement;

        if (
            event.shiftKey &&
            document.activeElement === firstFocusableElement
        ) {
            event.preventDefault();
            lastFocusableElement.focus();
            return;
        }

        if (
            !event.shiftKey &&
            document.activeElement === lastFocusableElement
        ) {
            event.preventDefault();
            firstFocusableElement.focus();
        }
    };

    return (
        <>
            {deleteCandidateId === undefined ? undefined : (
                <div className='confirm-backdrop' role='presentation'>
                    <section
                        aria-describedby='delete-frame-description'
                        aria-labelledby='delete-frame-title'
                        aria-modal='true'
                        className='confirm-dialog'
                        onKeyDown={handleDeleteDialogKeyDown}
                        ref={(element) => {
                            deleteDialogReference.current =
                                element ?? undefined;
                        }}
                        role='dialog'
                    >
                        <div className='panel-heading'>
                            <h2 id='delete-frame-title'>
                                {copy.deleteFrameTitle}
                            </h2>
                        </div>
                        <p id='delete-frame-description'>
                            {copy.deleteFrameDescription}
                        </p>
                        <div className='confirm-dialog__actions'>
                            <button
                                className='button button--secondary'
                                onClick={() => {
                                    setDeleteCandidateId(undefined);
                                }}
                                type='button'
                            >
                                {copy.cancel}
                            </button>
                            <button
                                className='button button--primary'
                                onClick={confirmDeleteState}
                                ref={(element) => {
                                    deleteConfirmButtonReference.current =
                                        element ?? undefined;
                                }}
                                type='button'
                            >
                                {copy.delete}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {startExistingDialogOpen ? (
                <div className='confirm-backdrop' role='presentation'>
                    <section
                        aria-describedby='start-existing-description'
                        aria-labelledby='start-existing-title'
                        aria-modal='true'
                        className='confirm-dialog'
                        role='dialog'
                    >
                        <div className='panel-heading'>
                            <h2 id='start-existing-title'>
                                Start from existing
                            </h2>
                        </div>
                        <p id='start-existing-description'>
                            This will overwrite all current edits and frames.
                            Continue?
                        </p>
                        <div className='confirm-dialog__actions'>
                            <button
                                className='button button--secondary'
                                onClick={() => {
                                    setStartExistingDialogOpen(false);
                                }}
                                type='button'
                            >
                                {copy.cancel}
                            </button>
                            <button
                                className='button button--primary'
                                onClick={() => {
                                    setStartExistingDialogOpen(false);
                                    openExistingBadgePicker();
                                }}
                                type='button'
                            >
                                Continue
                            </button>
                        </div>
                    </section>
                </div>
            ) : undefined}

            {sourceDialogOpen ? (
                <div className='confirm-backdrop' role='presentation'>
                    <section
                        aria-describedby='source-dialog-description'
                        aria-labelledby='source-dialog-title'
                        aria-modal='true'
                        className='confirm-dialog source-dialog'
                        role='dialog'
                    >
                        <div className='panel-heading'>
                            <h2 id='source-dialog-title'>
                                {copy.editSvgSource}
                            </h2>
                            <button
                                aria-label={copy.close}
                                className='icon-button dialog-close-button'
                                onClick={() => {
                                    setSourceDialogOpen(false);
                                }}
                                type='button'
                            >
                                <X aria-hidden='true' size={16} />
                            </button>
                        </div>
                        <p
                            className='visually-hidden'
                            id='source-dialog-description'
                        >
                            {copy.editSvgSourceDescription}
                        </p>
                        <label className='field source-dialog__field'>
                            <textarea
                                aria-label={copy.logoSvg}
                                onChange={(event) => {
                                    setSourceDraft(event.target.value);
                                }}
                                value={sourceDraft}
                            />
                        </label>
                        <div className='confirm-dialog__actions'>
                            <label className='button button--secondary source-dialog__upload'>
                                <Upload aria-hidden='true' size={16} />
                                {copy.uploadSvgSource}
                                <input
                                    accept='.svg,image/svg+xml'
                                    aria-label={copy.uploadSvgSource}
                                    className='visually-hidden'
                                    onChange={uploadSourceFile}
                                    type='file'
                                />
                            </label>
                            <button
                                className='button button--primary'
                                onClick={saveSourceDialog}
                                type='button'
                            >
                                {copy.save}
                            </button>
                        </div>
                    </section>
                </div>
            ) : undefined}
        </>
    );
}
