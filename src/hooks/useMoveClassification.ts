import { useAtomValue } from "jotai";
import { useContext } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { TreeStateContext } from "@/components/common/TreeStateContext";
import { positionEngineLinesFamily } from "@/state/atoms";
import { getVariationLine } from "@/utils/chess";
import { resolveMoveClassification, type MoveClassification } from "@/utils/classification";

/**
 * Classification of the move at `movePath`, computed from the best data
 * available and kept up to date while the game is analyzed:
 *
 * - the classification stored by a game report,
 * - the engine lines of the position before the move (best move / only move),
 * - the evaluation of the resulting position (report, `[%eval]` PGN comments
 *   or live engine analysis),
 * - the annotations of the move and the opening book.
 */
export function useMoveClassification({
    movePath,
    isBook = false,
}: {
    movePath: number[];
    /** Whether the resulting position is a known opening position. */
    isBook?: boolean;
}): MoveClassification | null {
    const store = useContext(TreeStateContext)!;
    const rootFen = useStore(store, (s) => s.root.fen);
    const parentMoves = useStore(
        store,
        useShallow((s) => getVariationLine(s.root, movePath.slice(0, -1))),
    );
    const node = useStore(store, (s) => s.getNode(movePath));
    const parentScore = useStore(store, (s) => s.getNode(movePath.slice(0, -1))?.score ?? null);
    const parentLines = useAtomValue(
        positionEngineLinesFamily({ fen: rootFen, gameMoves: parentMoves }),
    );

    if (movePath.length === 0 || !node?.san) {
        return null;
    }

    return resolveMoveClassification({
        classification: node.classification,
        annotations: node.annotations,
        isBook,
        evalBefore: parentLines?.[0]?.score.value ?? parentScore?.value ?? null,
        evalAfter: node.score?.value ?? null,
        color: node.halfMoves % 2 === 1 ? "white" : "black",
        engineMoves: parentLines,
        playedMoveSan: node.san,
    });
}
