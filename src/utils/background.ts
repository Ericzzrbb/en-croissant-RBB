import type { CSSProperties } from "react";

/**
 * Helpers for the custom app background.
 *
 * The background is a fixed layer painted behind the whole UI. It is made of an
 * optional image, painted over an optional base color, and can be dimmed
 * (opacity) and lightened/darkened (brightness). This module is deliberately
 * free of Tauri imports so it can be unit tested in isolation; the file-system
 * side lives in `customBackground.ts`.
 */

export const BACKGROUND_IMAGE_EXTENSIONS = [
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "bmp",
    "avif",
    "svg",
] as const;

export const DEFAULT_BACKGROUND_OPACITY = 100;
export const DEFAULT_BACKGROUND_BRIGHTNESS = 100;
/** Opacity of the app shell and panels over the custom background. */
export const DEFAULT_PANEL_OPACITY = 75;
/** Empty means the Mantine/system default font. */
export const DEFAULT_FONT_FAMILY = "";

/** Returns the lower-case extension when it is a supported background image. */
export function backgroundFileExtension(path: string): string | null {
    const match = /\.([A-Za-z0-9]+)\s*$/.exec(path.trim());
    if (!match) return null;
    const extension = match[1].toLowerCase();
    return (BACKGROUND_IMAGE_EXTENSIONS as readonly string[]).includes(extension)
        ? extension
        : null;
}

export function isSupportedBackgroundImage(path: string): boolean {
    return backgroundFileExtension(path) !== null;
}

/** Last path segment, for showing the selected image in the settings UI. */
export function backgroundImageFileName(path: string): string {
    const normalized = path.replace(/\\/g, "/");
    const name = normalized.slice(normalized.lastIndexOf("/") + 1);
    return name || path;
}

export function clampBackgroundOpacity(value: number): number {
    if (!Number.isFinite(value)) return DEFAULT_BACKGROUND_OPACITY;
    return Math.min(100, Math.max(0, value));
}

export function clampBackgroundBrightness(value: number): number {
    if (!Number.isFinite(value)) return DEFAULT_BACKGROUND_BRIGHTNESS;
    return Math.min(200, Math.max(0, value));
}

/**
 * Font families end up in a CSS custom property, so characters that could start
 * a new declaration (or break out of the surrounding markup) are dropped.
 */
export function sanitizeFontFamily(value: string): string {
    return value
        .replace(/[;{}<>\\]/g, "")
        .replace(/[\r\n\t]+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, 200);
}

/**
 * Accepts only hex colors (with or without alpha), since the color is embedded
 * in a `color-mix()` expression for the translucent panels.
 */
export function sanitizeBackgroundColor(value: string): string {
    const trimmed = value.trim();
    return /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed) ? trimmed : "";
}

/** Quotes a URL so it can be embedded in a CSS `url()` token. */
export function cssUrl(value: string): string {
    const escaped = value
        .replace(/\\/g, "%5C")
        .replace(/"/g, "%22")
        .replace(/[\r\n]/g, "");
    return `url("${escaped}")`;
}

export type BackgroundAppearance = {
    imageUrl?: string | null;
    /** Base color; when empty the app theme color shows through. */
    color?: string | null;
    /** 0 - 100. */
    opacity?: number;
    /** 0 - 200, where 100 is the original image. */
    brightness?: number;
};

/**
 * CSS for one background layer. Shared by the real background and by the
 * settings preview so both always look the same.
 */
export function backgroundLayerStyle({
    imageUrl,
    color,
    opacity,
    brightness,
}: BackgroundAppearance): CSSProperties {
    const style: CSSProperties = {
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        opacity: clampBackgroundOpacity(opacity ?? DEFAULT_BACKGROUND_OPACITY) / 100,
        filter: `brightness(${clampBackgroundBrightness(
            brightness ?? DEFAULT_BACKGROUND_BRIGHTNESS,
        )}%)`,
    };

    if (color) {
        style.backgroundColor = color;
    }
    if (imageUrl) {
        style.backgroundImage = cssUrl(imageUrl);
    }

    return style;
}
