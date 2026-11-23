import { commands } from "@/bindings";

const cache = new Map<string, boolean>();
const pending = new Map<string, Promise<boolean>>();

/**
 * Whether a position is part of the opening book bundled with the app (the same
 * table the opening name is resolved from). Results are cached per FEN and
 * concurrent lookups share a single request.
 */
export function getBookPosition(fen: string): Promise<boolean> {
    const cached = cache.get(fen);
    if (cached !== undefined) {
        return Promise.resolve(cached);
    }
    const inFlight = pending.get(fen);
    if (inFlight) {
        return inFlight;
    }

    const request = (async () => {
        try {
            const result = await commands.getOpeningFromFen(fen);
            return result.status === "ok" && Boolean(result.data);
        } catch {
            return false;
        }
    })().then((isBook) => {
        cache.set(fen, isBook);
        pending.delete(fen);
        return isBook;
    });

    pending.set(fen, request);
    return request;
}

/** Cached answer for a position, if it was already resolved. */
export function getCachedBookPosition(fen: string): boolean | undefined {
    return cache.get(fen);
}
