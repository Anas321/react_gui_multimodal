import { Linecut } from "../types";

interface calculateInclinedLineEndpointsParams {
    linecut: Linecut;
    imageWidth: number;
    imageHeight: number;
}

export function calculateInclinedLineEndpoints({
    linecut,
    imageWidth,
    imageHeight
}: calculateInclinedLineEndpointsParams) {
    // Convert angle to radians and calculate direction vector
    // Note: Negate dy because y-axis is reversed in the display
    const radians = (linecut.angle * Math.PI) / 180;
    const dx = Math.cos(radians);
    const dy = -Math.sin(radians);  // Negated for reversed y-axis

    const intersections = [];

    // Left boundary (x = 0)
    if (dx !== 0) {
        const t = -linecut.position / dx;
        const y = linecut.positionY! + t * dy;
        if (y >= 0 && y <= imageHeight) {
            intersections.push([0, y]);
        }
    }

    // Right boundary (x = imageWidth)
    if (dx !== 0) {
        const t = (imageWidth - linecut.position) / dx;
        const y = linecut.positionY! + t * dy;
        if (y >= 0 && y <= imageHeight) {
            intersections.push([imageWidth, y]);
        }
    }

    // Top boundary (y = 0)
    if (dy !== 0) {
        const t = -linecut.positionY! / dy;
        const x = linecut.position + t * dx;
        if (x >= 0 && x <= imageWidth) {
            intersections.push([x, 0]);
        }
    }

    // Bottom boundary (y = imageHeight)
    if (dy !== 0) {
        const t = (imageHeight - linecut.positionY!) / dy;
        const x = linecut.position + t * dx;
        if (x >= 0 && x <= imageWidth) {
            intersections.push([x, imageHeight]);
        }
    }

    // Sort intersections by x-coordinate to ensure consistent line direction
    intersections.sort((a, b) => a[0] - b[0]);

    if (intersections.length >= 2) {
        return {
            x0: intersections[0][0],
            y0: intersections[0][1],
            x1: intersections[1][0],
            y1: intersections[1][1],
        };
    }

    return null;
}
