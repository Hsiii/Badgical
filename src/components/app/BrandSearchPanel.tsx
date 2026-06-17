import './BrandSearchPanel.css';

import type { JSX } from 'react';
import { Search } from 'lucide-react';

import { svglUrl } from '@/components/badge-builder/constants';
import { getSvglRoute } from '@/components/badge-builder/svgl';
import type {
    SelectionStatus,
    SvglResult,
} from '@/components/badge-builder/types';
import type { UiCopy } from '@/components/i18n';

interface BrandSearchPanelProps {
    readonly chooseSearchResult: (result: SvglResult) => void;
    readonly copy: UiCopy;
    readonly query: string;
    readonly resultsAreLoading: boolean;
    readonly searchInputElement: HTMLInputElement | undefined;
    readonly selectedResult: SvglResult | undefined;
    readonly setQuery: (query: string) => void;
    readonly setResultsElement: (element: HTMLDivElement | undefined) => void;
    readonly setSearchInputElement: (
        element: HTMLInputElement | undefined
    ) => void;
    readonly setSelectedResult: (result: SvglResult | undefined) => void;
    readonly setSelectionStatus: (status: SelectionStatus) => void;
    readonly visibleResults: readonly SvglResult[];
}

export function BrandSearchPanel({
    chooseSearchResult,
    copy,
    query,
    resultsAreLoading,
    searchInputElement,
    selectedResult,
    setQuery,
    setResultsElement,
    setSearchInputElement,
    setSelectedResult,
    setSelectionStatus,
    visibleResults,
}: BrandSearchPanelProps): JSX.Element {
    return (
        <section aria-label={copy.searchBrands} className='search-panel'>
            <div
                className='search-shell'
                onClick={() => {
                    searchInputElement?.focus();
                }}
            >
                <label className='search-field__input'>
                    <Search aria-hidden='true' size={24} />
                    <input
                        aria-label={copy.searchBrand}
                        autoFocus
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setSelectedResult(undefined);
                            setSelectionStatus('idle');
                        }}
                        placeholder={copy.searchPlaceholder}
                        ref={(element) => {
                            setSearchInputElement(element ?? undefined);
                        }}
                        value={query}
                    />
                </label>
                <div
                    className='search-actions'
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                >
                    <a
                        className='powered-by'
                        href={svglUrl}
                        rel='noreferrer'
                        target='_blank'
                    >
                        {copy.poweredBy} <span>Svgl</span>
                    </a>
                </div>
            </div>

            <div
                aria-busy={resultsAreLoading}
                aria-live='polite'
                className='brand-results'
                ref={(element) => {
                    setResultsElement(element ?? undefined);
                }}
            >
                {visibleResults.length === 0 ? (
                    <div aria-hidden='true' className='search-empty' />
                ) : (
                    <div
                        aria-label={copy.svglLogos}
                        className='brand-results__canvas'
                    >
                        {visibleResults.map((result) => (
                            <button
                                aria-current={
                                    result.id === selectedResult?.id
                                        ? 'true'
                                        : undefined
                                }
                                className='brand-result'
                                key={result.id}
                                onClick={() => {
                                    chooseSearchResult(result);
                                }}
                                type='button'
                            >
                                <img
                                    alt={`${result.title} logo`}
                                    src={getSvglRoute(result.route)}
                                />
                                <span>{result.title}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
