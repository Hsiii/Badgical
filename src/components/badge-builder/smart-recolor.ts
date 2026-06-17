import {
    getColorDistance,
    getRgbColor,
} from '@/components/badge-builder/colors';
import {
    logoEdgeAlphaThreshold,
    logoEdgeCanvasSize,
    logoEdgeColorDistance,
} from '@/components/badge-builder/constants';
import { isSvgSource, toDataUri } from '@/components/badge-builder/svg';

export const hasTransparentNeighbor = (
    pixels: Uint8ClampedArray,
    x: number,
    y: number
): boolean => {
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
        for (let xOffset = -1; xOffset <= 1; xOffset++) {
            if (xOffset === 0 && yOffset === 0) {
                continue;
            }

            const neighborX = x + xOffset;
            const neighborY = y + yOffset;

            if (
                neighborX < 0 ||
                neighborX >= logoEdgeCanvasSize ||
                neighborY < 0 ||
                neighborY >= logoEdgeCanvasSize
            ) {
                return true;
            }

            const alphaIndex =
                (neighborY * logoEdgeCanvasSize + neighborX) * 4 + 3;

            if (pixels[alphaIndex] <= logoEdgeAlphaThreshold) {
                return true;
            }
        }
    }

    return false;
};

export const loadSvgImage = async (source: string): Promise<HTMLImageElement> =>
    await new Promise((resolve, reject) => {
        const image = new Image();

        image.addEventListener('load', () => {
            resolve(image);
        });
        image.addEventListener('error', () => {
            reject(new Error('SVG logo rasterization failed'));
        });
        image.src = toDataUri(source);
    });

export const logoColorTouchesBadgeEdge = async (
    source: string,
    badgeColor: string
): Promise<boolean> => {
    if (!isSvgSource(source)) {
        return false;
    }

    const badgeRgb = getRgbColor(badgeColor);

    if (badgeRgb === undefined) {
        return false;
    }

    const canvas = document.createElement('canvas');
    canvas.width = logoEdgeCanvasSize;
    canvas.height = logoEdgeCanvasSize;

    const context = canvas.getContext('2d', {
        willReadFrequently: true,
    });

    if (context === null) {
        return false;
    }

    try {
        const image = await loadSvgImage(source);

        context.clearRect(0, 0, logoEdgeCanvasSize, logoEdgeCanvasSize);
        context.drawImage(image, 0, 0, logoEdgeCanvasSize, logoEdgeCanvasSize);
    } catch {
        return false;
    }

    const pixels = context.getImageData(
        0,
        0,
        logoEdgeCanvasSize,
        logoEdgeCanvasSize
    ).data;

    for (let y = 0; y < logoEdgeCanvasSize; y++) {
        for (let x = 0; x < logoEdgeCanvasSize; x++) {
            const pixelIndex = (y * logoEdgeCanvasSize + x) * 4;
            const alpha = pixels[pixelIndex + 3];

            if (
                alpha > logoEdgeAlphaThreshold &&
                getColorDistance(
                    pixels[pixelIndex],
                    pixels[pixelIndex + 1],
                    pixels[pixelIndex + 2],
                    badgeRgb
                ) < logoEdgeColorDistance &&
                hasTransparentNeighbor(pixels, x, y)
            ) {
                return true;
            }
        }
    }

    return false;
};
