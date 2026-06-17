import './Topbar.css';

import { useEffect, useState } from 'react';
import type { Dispatch, JSX, SetStateAction } from 'react';
import { ChevronDown, Languages, Star, SunMoon } from 'lucide-react';

import { GitHubMark } from '@/components/app/GitHubMark';
import {
    githubUrl,
    languagePreferenceLabels,
    themePreferenceLabels,
} from '@/components/badge-builder/constants';
import type {
    LanguagePreference,
    PreferenceMenu,
    ThemePreference,
} from '@/components/badge-builder/types';

interface TopbarProps {
    readonly languagePreference: LanguagePreference;
    readonly openPreferenceMenu: PreferenceMenu | undefined;
    readonly setLanguagePreference: Dispatch<
        SetStateAction<LanguagePreference>
    >;
    readonly setOpenPreferenceMenu: Dispatch<
        SetStateAction<PreferenceMenu | undefined>
    >;
    readonly setThemePreference: Dispatch<SetStateAction<ThemePreference>>;
    readonly themePreference: ThemePreference;
}

const githubRepositoryApiUrl = 'https://api.github.com/repos/Hsiii/Badgical';

interface GitHubRepositoryPayload {
    readonly stargazers_count: number;
}

function isGitHubRepositoryPayload(
    payload: unknown
): payload is GitHubRepositoryPayload {
    return (
        typeof payload === 'object' &&
        payload !== null &&
        'stargazers_count' in payload &&
        typeof payload.stargazers_count === 'number'
    );
}

function formatStarCount(starCount: number): string {
    return new Intl.NumberFormat('en-US').format(starCount);
}

export function Topbar({
    languagePreference,
    openPreferenceMenu,
    setLanguagePreference,
    setOpenPreferenceMenu,
    setThemePreference,
    themePreference,
}: TopbarProps): JSX.Element {
    const [starCount, setStarCount] = useState<number | undefined>(undefined);

    useEffect(() => {
        const abortController = new AbortController();

        fetch(githubRepositoryApiUrl, {
            headers: {
                Accept: 'application/vnd.github+json',
            },
            signal: abortController.signal,
        })
            .then(async (response) => {
                const payload = (await response.json()) as unknown;

                if (!response.ok || !isGitHubRepositoryPayload(payload)) {
                    throw new Error('GitHub repository payload invalid');
                }

                return payload.stargazers_count;
            })
            .then((nextStarCount) => {
                setStarCount(nextStarCount);
            })
            .catch((error: unknown) => {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                setStarCount(undefined);
            });

        return (): void => {
            abortController.abort();
        };
    }, []);

    const formattedStarCount =
        starCount === undefined ? undefined : formatStarCount(starCount);

    return (
        <header className='topbar'>
            <div className='brand-cluster'>
                <a aria-label='Badgical' className='brand-badge' href='/'>
                    <span aria-hidden='true' className='brand-badge__icon'>
                        <img alt='' src='/badgical-spark.svg' />
                    </span>
                    <span className='brand-badge__word'>Badgical</span>
                </a>
                <a
                    aria-label={
                        formattedStarCount === undefined
                            ? 'Open Badgical on GitHub'
                            : `Open Badgical on GitHub, ${formattedStarCount} stars`
                    }
                    className='icon-button github-link'
                    href={githubUrl}
                    rel='noreferrer'
                    target='_blank'
                    title='GitHub'
                >
                    <GitHubMark />
                    <span aria-hidden='true' className='github-star-bubble'>
                        <Star fill='currentColor' size={14} />
                        {formattedStarCount ?? '--'}
                    </span>
                </a>
            </div>
            <h1 className='visually-hidden' id='builder-title'>
                Badgical badge builder
            </h1>
            <div className='topbar-actions'>
                <div className='preference-menu'>
                    <button
                        aria-expanded={openPreferenceMenu === 'language'}
                        aria-haspopup='menu'
                        className='preference-trigger'
                        onClick={() => {
                            setOpenPreferenceMenu((currentMenu) =>
                                currentMenu === 'language'
                                    ? undefined
                                    : 'language'
                            );
                        }}
                        type='button'
                    >
                        <Languages aria-hidden='true' size={16} />
                        <span>
                            {languagePreferenceLabels[languagePreference]}
                        </span>
                        <ChevronDown aria-hidden='true' size={16} />
                    </button>
                    {openPreferenceMenu === 'language' ? (
                        <div
                            aria-label='Language'
                            className='preference-options'
                            role='menu'
                        >
                            {(
                                Object.entries(
                                    languagePreferenceLabels
                                ) as Array<[LanguagePreference, string]>
                            ).map(([value, label]) => (
                                <button
                                    aria-checked={languagePreference === value}
                                    className='preference-option'
                                    key={value}
                                    onClick={() => {
                                        setLanguagePreference(value);
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
                <div className='preference-menu'>
                    <button
                        aria-expanded={openPreferenceMenu === 'theme'}
                        aria-haspopup='menu'
                        className='preference-trigger'
                        onClick={() => {
                            setOpenPreferenceMenu((currentMenu) =>
                                currentMenu === 'theme' ? undefined : 'theme'
                            );
                        }}
                        type='button'
                    >
                        <SunMoon aria-hidden='true' size={16} />
                        <span>{themePreferenceLabels[themePreference]}</span>
                        <ChevronDown aria-hidden='true' size={16} />
                    </button>
                    {openPreferenceMenu === 'theme' ? (
                        <div
                            aria-label='Theme'
                            className='preference-options'
                            role='menu'
                        >
                            {(
                                Object.entries(themePreferenceLabels) as Array<
                                    [ThemePreference, string]
                                >
                            ).map(([value, label]) => (
                                <button
                                    aria-checked={themePreference === value}
                                    className='preference-option'
                                    key={value}
                                    onClick={() => {
                                        setThemePreference(value);
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
        </header>
    );
}
