import { normalizeHexInput } from '@/components/badge-builder/colors';
import type {
    SvglApiError,
    SvglResult,
    SvglRouteOptions,
} from '@/components/badge-builder/types';

export const getSvglRoute = (route: string | SvglRouteOptions): string =>
    typeof route === 'string' ? route : route.light;

export const isSvglNotFoundResponse = (
    response: Response,
    payload: SvglApiError
): boolean =>
    response.status === 404 &&
    payload.error?.includes('SVG not found') === true;

export const isSvglApiError = (payload: unknown): payload is SvglApiError =>
    typeof payload === 'object' && payload !== null && 'error' in payload;

export const isSvglResultList = (
    payload: unknown
): payload is readonly SvglResult[] =>
    typeof payload === 'object' &&
    payload !== null &&
    'length' in payload &&
    'slice' in payload &&
    typeof payload.length === 'number' &&
    typeof payload.slice === 'function';

export const getSvglSourceUrl = (route: string | SvglRouteOptions): string => {
    const svgRoute = getSvglRoute(route);

    try {
        const { pathname } = new URL(svgRoute);
        const svgName = pathname.split('/').at(-1) ?? '';

        return `https://api.svgl.app/svg/${svgName}`;
    } catch {
        return svgRoute;
    }
};

export const sortCopy = <Value>(
    values: readonly Value[],
    compare: (leftValue: Value, rightValue: Value) => number
): readonly Value[] => {
    const sortedValues = [...values];

    // eslint-disable-next-line unicorn/no-array-sort
    return sortedValues.sort(compare);
};

export const getColorWeight = (color: string): number => {
    const normalizedColor = normalizeHexInput(color);

    if (normalizedColor === undefined) {
        return -1;
    }

    const normalizedValue = normalizedColor.replace('#', '');
    const red = Number.parseInt(normalizedValue.slice(0, 2), 16);
    const green = Number.parseInt(normalizedValue.slice(2, 4), 16);
    const blue = Number.parseInt(normalizedValue.slice(4, 6), 16);
    const maxChannel = Math.max(red, green, blue);
    const minChannel = Math.min(red, green, blue);
    const saturation = maxChannel - minChannel;
    const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
    const neutralPenalty =
        luminance < 32 || luminance > 232 || saturation < 24 ? 255 : 0;

    return saturation - neutralPenalty;
};

export const getPrimarySvgColor = (source: string): string | undefined => {
    const colors = source.match(/#[\dA-Fa-f]{3}(?:[\dA-Fa-f]{3})?\b/gu) ?? [];
    const sortedColors = sortCopy(
        [
            ...new Set(
                colors
                    .map((color) => normalizeHexInput(color))
                    .filter((color): color is string => color !== undefined)
            ),
        ],
        (leftColor, rightColor) =>
            getColorWeight(rightColor) - getColorWeight(leftColor)
    );
    const primaryColor = sortedColors[0];

    return primaryColor;
};

export const sortSvglResults = (
    searchResults: readonly SvglResult[],
    searchTerm: string
): readonly SvglResult[] => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    return sortCopy(searchResults, (leftResult, rightResult) => {
        const leftTitle = leftResult.title.trim().toLowerCase();
        const rightTitle = rightResult.title.trim().toLowerCase();
        const leftExact = leftTitle === normalizedTerm;
        const rightExact = rightTitle === normalizedTerm;

        if (leftExact !== rightExact) {
            return leftExact ? -1 : 1;
        }

        return leftTitle.localeCompare(rightTitle);
    });
};
