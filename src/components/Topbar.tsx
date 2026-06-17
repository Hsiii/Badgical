import type { Dispatch, JSX, SetStateAction } from 'react';
import { ChevronDown, Languages, SunMoon } from 'lucide-react';

import {
    githubUrl,
    languagePreferenceLabels,
    themePreferenceLabels,
} from './badge-builder/domain.js';
import type {
    LanguagePreference,
    PreferenceMenu,
    ThemePreference,
} from './badge-builder/domain.js';
import { GitHubMark } from './GitHubMark.js';

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

export function Topbar({
    languagePreference,
    openPreferenceMenu,
    setLanguagePreference,
    setOpenPreferenceMenu,
    setThemePreference,
    themePreference,
}: TopbarProps): JSX.Element {
    return (
        <header className='topbar'>
            <a aria-label='Badgical' className='brand-badge' href='/'>
                <span aria-hidden='true' className='brand-badge__icon'>
                    <img alt='' src='/badgical-spark.svg' />
                </span>
                <span className='brand-badge__word'>Badgical</span>
            </a>
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
                <a
                    aria-label='Open Badgical on GitHub'
                    className='icon-button'
                    href={githubUrl}
                    rel='noreferrer'
                    target='_blank'
                    title='GitHub'
                >
                    <GitHubMark />
                </a>
            </div>
        </header>
    );
}
