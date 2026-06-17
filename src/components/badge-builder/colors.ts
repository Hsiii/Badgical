import type { HsvColor, RgbColor } from '@/components/badge-builder/types';

export const clampUnit = (value: number): number =>
    Math.min(1, Math.max(0, value));

export const getReadableInk = (color: string): string => {
    const normalizedColor = color.trim().replace('#', '');

    if (!/^[\dA-Fa-f]{6}$/.test(normalizedColor)) {
        return '#ffffff';
    }

    const red = Number.parseInt(normalizedColor.slice(0, 2), 16);
    const green = Number.parseInt(normalizedColor.slice(2, 4), 16);
    const blue = Number.parseInt(normalizedColor.slice(4, 6), 16);
    const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

    return luminance > 150 ? '#1f2328' : '#ffffff';
};

export const normalizeHexInput = (value: string): string | undefined => {
    const normalizedValue = value.trim();
    const fullHexMatch = /^#?([\dA-Fa-f]{6})$/u.exec(normalizedValue);

    if (fullHexMatch !== null) {
        return `#${fullHexMatch[1]}`;
    }

    const shortHexMatch = /^#?([\dA-Fa-f]{3})$/u.exec(normalizedValue);

    if (shortHexMatch === null) {
        return undefined;
    }

    const [, hexValue] = shortHexMatch;

    return `#${hexValue[0]}${hexValue[0]}${hexValue[1]}${hexValue[1]}${hexValue[2]}${hexValue[2]}`;
};

export const getRgbColor = (color: string): RgbColor | undefined => {
    const namedColor = {
        black: '#000000',
        white: '#ffffff',
    }[color.trim().toLowerCase()];
    const normalizedColor = normalizeHexInput(namedColor ?? color);

    if (normalizedColor === undefined) {
        return undefined;
    }

    return {
        blue: Number.parseInt(normalizedColor.slice(5, 7), 16),
        green: Number.parseInt(normalizedColor.slice(3, 5), 16),
        red: Number.parseInt(normalizedColor.slice(1, 3), 16),
    };
};

export const getHexChannel = (value: number): string =>
    Math.round(Math.min(255, Math.max(0, value)))
        .toString(16)
        .padStart(2, '0');

export const getHexColor = ({ blue, green, red }: RgbColor): string =>
    `#${getHexChannel(red)}${getHexChannel(green)}${getHexChannel(blue)}`;

export const getHsvColor = ({ blue, green, red }: RgbColor): HsvColor => {
    const normalizedRed = red / 255;
    const normalizedGreen = green / 255;
    const normalizedBlue = blue / 255;
    const maxChannel = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
    const minChannel = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
    const delta = maxChannel - minChannel;
    let hue = 0;

    if (delta !== 0) {
        if (maxChannel === normalizedRed) {
            hue = 60 * (((normalizedGreen - normalizedBlue) / delta) % 6);
        } else if (maxChannel === normalizedGreen) {
            hue = 60 * ((normalizedBlue - normalizedRed) / delta + 2);
        } else {
            hue = 60 * ((normalizedRed - normalizedGreen) / delta + 4);
        }
    }

    return {
        hue: Math.round((hue + 360) % 360),
        saturation: maxChannel === 0 ? 0 : delta / maxChannel,
        value: maxChannel,
    };
};

export const getRgbFromHsv = ({
    hue,
    saturation,
    value,
}: HsvColor): RgbColor => {
    const chroma = value * saturation;
    const huePrime = hue / 60;
    const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
    const match = value - chroma;
    let red = 0;
    let green = 0;
    let blue = 0;

    if (huePrime >= 0 && huePrime < 1) {
        red = chroma;
        green = x;
    } else if (huePrime < 2) {
        red = x;
        green = chroma;
    } else if (huePrime < 3) {
        green = chroma;
        blue = x;
    } else if (huePrime < 4) {
        green = x;
        blue = chroma;
    } else if (huePrime < 5) {
        red = x;
        blue = chroma;
    } else {
        red = chroma;
        blue = x;
    }

    return {
        blue: (blue + match) * 255,
        green: (green + match) * 255,
        red: (red + match) * 255,
    };
};

export const getColorDistance = (
    red: number,
    green: number,
    blue: number,
    color: RgbColor
): number =>
    Math.hypot(red - color.red, green - color.green, blue - color.blue);

export const getRelativeLuminance = (color: RgbColor): number =>
    (color.red * 299 + color.green * 587 + color.blue * 114) / 255_000;

export const getGrayHex = (luminance: number): string => {
    const boundedLuminance = Math.min(1, Math.max(0, luminance));
    const channel = Math.round(boundedLuminance * 255)
        .toString(16)
        .padStart(2, '0');

    return `#${channel}${channel}${channel}`;
};
