import { useEffect, useState } from "react";
import { getBookPosition, getCachedBookPosition } from "@/utils/openingBook";

type ResolvedBookPosition = {
    fen: string;
    isBook: boolean;
};

/**
 * Whether the given position belongs to the opening book, resolved lazily.
 *
 * Uses the same cache as the move list, so the board does not trigger extra
 * lookups for positions that are already known.
 */
export function useBookPosition(fen: string | null | undefined): boolean {
    const [resolved, setResolved] = useState<ResolvedBookPosition | null>(null);

    useEffect(() => {
        if (!fen) {
            return;
        }

        const cached = getCachedBookPosition(fen);
        if (cached !== undefined) {
            setResolved((prev) =>
                prev?.fen === fen && prev.isBook === cached ? prev : { fen, isBook: cached },
            );
            return;
        }

        let cancelled = false;
        getBookPosition(fen).then((isBook) => {
            if (!cancelled) {
                setResolved({ fen, isBook });
            }
        });

        return () => {
            cancelled = true;
        };
    }, [fen]);

    if (!fen) {
        return false;
    }
    // Never reuse the answer of the previous position: it only applies to its own FEN.
    if (resolved?.fen === fen) {
        return resolved.isBook;
    }
    return getCachedBookPosition(fen) ?? false;
}
