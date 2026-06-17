import type { JSX, ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Mansalva } from 'next/font/google';

import '../global.css';

// Next font loaders are named with uppercase identifiers.
// eslint-disable-next-line new-cap
const mansalva = Mansalva({
    subsets: ['latin'],
    weight: '400',
    variable: '--font-mansalva',
});

export const metadata: Metadata = {
    applicationName: 'Badgical',
    authors: [{ name: 'Hsi Chen', url: 'https://hsichen.dev' }],
    alternates: {
        canonical: '/',
        languages: {
            'en': '/',
            'zh-Hant': '/?lang=zh-Hant',
        },
    },
    creator: 'Hsi Chen',
    description:
        'Build animated SVG badges from SVGL logos, tune frame colors, and export README-ready Markdown.',
    icons: {
        apple: '/favicon.png',
        icon: [
            { url: '/badgical-spark.svg', type: 'image/svg+xml' },
            { sizes: '256x256', url: '/favicon.png', type: 'image/png' },
        ],
    },
    keywords: [
        'animated badge',
        'SVG badge',
        'README badge',
        'SVGL',
        'GitHub README',
        'badge builder',
    ],
    manifest: '/site.webmanifest',
    metadataBase: new URL('https://badgical.hsichen.dev'),
    openGraph: {
        description:
            'Build animated SVG badges from SVGL logos and export README-ready Markdown.',
        images: [
            {
                alt: 'Badgical spark logo',
                height: 256,
                url: '/favicon.png',
                width: 256,
            },
        ],
        locale: 'en_US',
        siteName: 'Badgical',
        title: 'Badgical',
        type: 'website',
        url: '/',
    },
    title: {
        default: 'Badgical',
        template: '%s | Badgical',
    },
    twitter: {
        card: 'summary',
        description:
            'Build animated SVG badges from SVGL logos and export README-ready Markdown.',
        images: ['/favicon.png'],
        title: 'Badgical',
    },
    verification: {
        google: 'U0MZAhyxx3hG4euT-pHfkimkVmT8oOu0dAlgD0OFoaQ',
    },
};

export const viewport: Viewport = {
    initialScale: 1,
    themeColor: [
        { color: '#f7f8ff', media: '(prefers-color-scheme: light)' },
        { color: '#111321', media: '(prefers-color-scheme: dark)' },
    ],
    width: 'device-width',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>): JSX.Element {
    return (
        <html className={mansalva.variable} lang='en'>
            <body>{children}</body>
        </html>
    );
}
