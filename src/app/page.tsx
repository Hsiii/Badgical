import type { JSX } from 'react';

import { getSupportedLanguagePreference } from '@/components/i18n';
import { App } from '../components/App';

interface PageProps {
    readonly searchParams?: Promise<
        Record<string, string | readonly string[] | undefined>
    >;
}

export default async function Page({
    searchParams,
}: PageProps): Promise<JSX.Element> {
    const parameters = await searchParams;
    const languageParameter = parameters?.lang;
    const urlLanguage = getSupportedLanguagePreference(
        typeof languageParameter === 'string' ? languageParameter : undefined
    );

    return (
        <App
            initialLanguagePreference={urlLanguage ?? 'en'}
            initialLanguageResolved={urlLanguage !== undefined}
        />
    );
}
