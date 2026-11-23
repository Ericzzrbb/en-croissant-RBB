import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir, resolve } from "@tauri-apps/api/path";
import { copyFile, exists, mkdir, remove } from "@tauri-apps/plugin-fs";
import { backgroundFileExtension } from "@/utils/background";

export type BackgroundImageErrorCode = "unsupported" | "failed";

export class BackgroundImageError extends Error {
    readonly code: BackgroundImageErrorCode;

    constructor(code: BackgroundImageErrorCode, detail?: string) {
        super(detail ?? code);
        this.name = "BackgroundImageError";
        this.code = code;
    }
}

/**
 * Directory holding the copies of the user's background images. Copies (instead
 * of referencing the original file) keep the background working when the
 * original is moved or deleted.
 */
export async function getBackgroundsDir(): Promise<string> {
    // Live in the app data directory: it is always writable by the app (the
    // pieces directory can point at a location the user may have moved).
    const dir = await resolve(await appDataDir(), "backgrounds");
    if (!(await exists(dir))) {
        await mkdir(dir, { recursive: true });
    }
    return dir;
}

/** URL usable in an `<img>`/CSS `url()` for a stored background image path. */
export function backgroundImageUrl(path: string): string | null {
    if (!path) return null;
    if (/^(https?:|data:|blob:|asset:)/i.test(path)) {
        return path;
    }
    try {
        return convertFileSrc(path);
    } catch {
        return path;
    }
}

/**
 * Copies the selected image into the backgrounds directory and returns the
 * stored path. The original file is never modified.
 */
export async function importBackgroundImage(sourcePath: string): Promise<string> {
    const extension = backgroundFileExtension(sourcePath);
    if (!extension) {
        throw new BackgroundImageError("unsupported");
    }

    try {
        const dir = await getBackgroundsDir();
        // A unique name avoids stale webview caches when the image is replaced.
        const destination = await resolve(dir, `background-${Date.now()}.${extension}`);
        await copyFile(sourcePath, destination);
        return destination;
    } catch (error) {
        if (error instanceof BackgroundImageError) throw error;
        throw new BackgroundImageError("failed", String(error));
    }
}

/**
 * Deletes a stored background image. Paths outside of the backgrounds directory
 * are ignored so the app can never remove the user's original file.
 */
export async function deleteBackgroundImage(path: string): Promise<void> {
    if (!path) return;

    try {
        const dir = await getBackgroundsDir();
        const normalizedPath = path.replace(/\\/g, "/").toLowerCase();
        const normalizedDir = dir.replace(/\\/g, "/").toLowerCase();
        if (!normalizedPath.startsWith(`${normalizedDir}/`)) return;
        if (await exists(path)) {
            await remove(path);
        }
    } catch {
        // A missing file is not an error: the background setting is cleared
        // either way.
    }
}
