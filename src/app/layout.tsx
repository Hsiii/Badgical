import type { JSX, ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Mansalva } from 'next/font/google';

import '../global.css';
import '../components/App.css';

// Next font loaders are named with uppercase identifiers.
// eslint-disable-next-line new-cap
const mansalva = Mansalva({
    subsets: ['latin'],
    weight: '400',
    variable: '--font-mansalva',
});

export const metadata: Metadata = {
    title: 'Badgical',
    description: 'Build animated SVG badges from frame-by-frame logo states.',
    icons: {
        icon: '/badgical-spark.svg',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
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
