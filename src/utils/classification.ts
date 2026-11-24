import type { Color } from "chessops";
import type { BestMoves, ScoreValue } from "@/bindings";
import type { Annotation } from "./annotation";
import { getWinChance, normalizeScore } from "./score";

/**
 * Chess.com style move classifications.
 *
 * The report generator only stores chess annotations (`?!`, `??`, ...) and the
 * engine evaluation of every position, so the classification is derived from
 * those two sources instead of being part of the PGN data model. This keeps the
 * existing report generation logic untouched while giving the move list a
 * dedicated, stable classification for every move.
 */
export type MoveClassification =
    | "brilliant"
    | "great"
    | "best"
    | "excellent"
    | "good"
    | "book"
    | "inaccuracy"
    | "mistake"
    | "miss"
    | "blunder";

export type ClassificationInfo = {
    /** Human readable name, kept in English like the Chess.com terminology. */
    name: string;
    /** Short glyph rendered inside the badge. */
    symbol: string;
    /** Badge background color. */
    color: string;
    /** Badge foreground color. */
    textColor: string;
    /** Short explanation used in the badge tooltip. */
    description: string;
    /** Stable ordering, e.g. when several classifications are listed. */
    order: number;
};

export const CLASSIFICATION_INFO: Record<MoveClassification, ClassificationInfo> = {
    brilliant: {
        name: "Brilliant",
        symbol: "!!",
        color: "#26c2a3",
        textColor: "#ffffff",
        description: "A sacrifice reported by the game report (!!)",
        order: 0,
    },
    great: {
        name: "Great",
        symbol: "!",
        color: "#5b8bb0",
        textColor: "#ffffff",
        description: "A key move, often the only good one",
        order: 1,
    },
    best: {
        name: "Best",
        symbol: "★",
        color: "#4f9d8c",
        textColor: "#ffffff",
        description: "The engine's first choice",
        order: 2,
    },
    excellent: {
        name: "Excellent",
        symbol: "✓",
        color: "#6fae9b",
        textColor: "#ffffff",
        description: "Almost as good as the best move",
        order: 3,
    },
    good: {
        name: "Good",
        symbol: "✓",
        color: "#8aa87f",
        textColor: "#ffffff",
        description: "A solid move",
        order: 4,
    },
    book: {
        name: "Book",
        symbol: "B",
        color: "#a88865",
        textColor: "#ffffff",
        description: "A known opening move",
        order: 5,
    },
    inaccuracy: {
        name: "Inaccuracy",
        symbol: "?!",
        color: "#f2c14e",
        textColor: "#3d2c06",
        description: "A small step in the wrong direction",
        order: 6,
    },
    mistake: {
        name: "Mistake",
        symbol: "?",
        color: "#e6912c",
        textColor: "#ffffff",
        description: "A serious error that hurts the position",
        order: 7,
    },
    miss: {
        name: "Miss",
        symbol: "✗",
        color: "#ff6b5e",
        textColor: "#ffffff",
        description: "A missed chance to punish the opponent or to win",
        order: 8,
    },
    blunder: {
        name: "Blunder",
        symbol: "??",
        color: "#c9362f",
        textColor: "#ffffff",
        description: "A game changing error",
        order: 9,
    },
};

/**
 * Classifications in the order they are listed in the game report summary.
 * Mirrors `CLASSIFICATION_INFO.order`.
 */
export const MOVE_CLASSIFICATIONS: MoveClassification[] = [
    "brilliant",
    "great",
    "best",
    "excellent",
    "good",
    "book",
    "inaccuracy",
    "mistake",
    "miss",
    "blunder",
];

/**
 * Win percentage loss thresholds, matching the ones used by `getAnnotation` so
 * that the badge and the classical annotation never contradict each other.
 */
export const CLASSIFICATION_THRESHOLDS = {
    /** Above this win% loss a move is an inaccuracy. */
    inaccuracy: 5,
    /** Above this win% loss a move is a mistake. */
    mistake: 10,
    /** Above this win% loss a move is a blunder. */
    blunder: 20,
    /** Up to this win% loss a move is almost as good as the best one. */
    excellent: 2,
    /** Centipawn advantage (mover's point of view) considered "winning". */
    winning: 200,
};

/** Win% gap between the first and the second engine choice used by `getAnnotation`. */
const ONLY_GOOD_MOVE_GAP = 10;

const ANNOTATION_CLASSIFICATIONS: Partial<Record<Annotation, MoveClassification>> = {
    "!!": "brilliant",
    "!": "good",
    "!?": "good",
    "?!": "inaccuracy",
    "?": "mistake",
    "??": "blunder",
    "⊗": "miss",
    "□": "great",
};

/** Classifications that a book move replaces, like on Chess.com. */
const BOOK_OVERRIDES: ReadonlySet<MoveClassification> = new Set(["best", "excellent", "good"]);

/** Win% lost by playing a move, from the mover's point of view. */
export function getWinChanceLoss(before: ScoreValue, after: ScoreValue, color: Color): number {
    const beforeCP = normalizeScore(before, color);
    const afterCP = normalizeScore(after, color);
    return Math.max(0, getWinChance(beforeCP) - getWinChance(afterCP));
}

/** Classification encoded by a classical chess annotation, if any. */
export function getAnnotationClassification(
    annotation: Annotation | "" | null | undefined,
): MoveClassification | null {
    if (!annotation) {
        return null;
    }
    return ANNOTATION_CLASSIFICATIONS[annotation] ?? null;
}

/**
 * Whether the engine's first choice is clearly better than the second one,
 * i.e. the played move was the only good move in the position.
 */
export function isOnlyGoodMove(engineMoves: BestMoves[] | undefined, color: Color): boolean {
    if (!engineMoves || engineMoves.length < 2) {
        return false;
    }
    const best = normalizeScore(engineMoves[0].score.value, color);
    const second = normalizeScore(engineMoves[1].score.value, color);
    return getWinChance(best) - getWinChance(second) > ONLY_GOOD_MOVE_GAP;
}

export type MoveClassificationInput = {
    /** Annotation produced by the report generator or read from the PGN. */
    annotation?: Annotation | null;
    /** Evaluation of the position before the move, White's point of view. */
    evalBefore?: ScoreValue | null;
    /** Evaluation of the position after the move, White's point of view. */
    evalAfter?: ScoreValue | null;
    /** Color of the player that made the move. */
    color: Color;
    /** SAN of the played move, used to detect the engine's first choice. */
    playedMoveSan?: string | null;
    /** Engine lines of the position before the move (the first one is the best move). */
    engineMoves?: BestMoves[] | null;
    /** The played move is the engine's first choice. */
    isBestMove?: boolean;
    /** The engine's first choice is clearly better than every alternative. */
    isOnlyGoodMove?: boolean;
    /** The resulting position is a known opening position. */
    isBook?: boolean;
};

/**
 * Classify a single move. Evaluation based classification wins over the
 * annotation fallback, and a book move replaces the "neutral positive"
 * classifications, like on Chess.com.
 *
 * `!!` (Brilliant) is special: it is never derived from the evaluation, it is
 * only taken from the game report annotation, so the badge always matches what
 * the report says.
 */
export function getMoveClassification(input: MoveClassificationInput): MoveClassification | null {
    if (input.annotation === "!!") {
        return "brilliant";
    }

    const classification =
        classifyFromEvaluation(input) ?? getAnnotationClassification(input.annotation);

    if (input.isBook && (classification === null || BOOK_OVERRIDES.has(classification))) {
        return "book";
    }

    return classification;
}

/**
 * Resolve the badge of a move from the best data available, in this order:
 *
 * 1. a `!!` annotation (Brilliant is only ever taken from the report/PGN, never
 *    computed from the evaluation),
 * 2. the classification stored by the game report,
 * 3. a live classification computed from the engine lines of the position
 *    before the move and the evaluation stored for the resulting position
 *    (report, PGN `[%eval]` comments or engine analysis),
 * 4. the annotations of the move,
 * 5. the opening book.
 */
export function resolveMoveClassification({
    classification,
    annotations,
    isBook = false,
    evalBefore,
    evalAfter,
    color,
    engineMoves,
    playedMoveSan,
}: {
    classification?: MoveClassification | null;
    annotations?: readonly Annotation[];
    isBook?: boolean;
    evalBefore?: ScoreValue | null;
    evalAfter?: ScoreValue | null;
    color?: Color;
    engineMoves?: BestMoves[] | null;
    playedMoveSan?: string | null;
}): MoveClassification | null {
    if (annotations?.includes("!!")) {
        return "brilliant";
    }

    let base = classification ?? null;

    if (!base && color) {
        base = classifyFromEvaluation({
            evalBefore,
            evalAfter,
            color,
            engineMoves,
            playedMoveSan,
        });
    }

    if (!base) {
        base = getAnnotationsClassification(annotations);
    }

    if (isBook && (base === null || BOOK_OVERRIDES.has(base))) {
        return "book";
    }

    return base;
}

function getAnnotationsClassification(
    annotations: readonly Annotation[] | undefined,
): MoveClassification | null {
    if (!annotations) {
        return null;
    }
    for (const annotation of annotations) {
        const classification = ANNOTATION_CLASSIFICATIONS[annotation];
        if (classification) {
            return classification;
        }
    }
    return null;
}

function classifyFromEvaluation({
    evalBefore,
    evalAfter,
    color,
    engineMoves,
    playedMoveSan,
    isBestMove,
    isOnlyGoodMove: isOnlyGoodMoveOverride,
}: MoveClassificationInput): MoveClassification | null {
    const isBest =
        isBestMove ?? (!!playedMoveSan && engineMoves?.[0]?.sanMoves[0] === playedMoveSan);
    // The engine's runner-up choice is "Excellent"; every other move that does
    // not lose anything is a plain "Good".
    const isSecondBest = !!playedMoveSan && engineMoves?.[1]?.sanMoves[0] === playedMoveSan;
    const onlyGoodMove = isOnlyGoodMoveOverride ?? isOnlyGoodMove(engineMoves ?? undefined, color);

    if (!evalBefore || !evalAfter) {
        // Without the evaluation of both positions only the engine's own
        // choices can be classified, e.g. when the engine analyzed the position
        // before the move but has not evaluated the resulting position yet.
        if (isBest) {
            return onlyGoodMove ? "great" : "best";
        }
        if (isSecondBest) {
            return "excellent";
        }
        return null;
    }

    const beforeCP = normalizeScore(evalBefore, color);
    const loss = getWinChanceLoss(evalBefore, evalAfter, color);

    if (loss > CLASSIFICATION_THRESHOLDS.blunder) {
        // Throwing away a winning position is a "miss", losing a level position
        // is a plain blunder.
        return beforeCP >= CLASSIFICATION_THRESHOLDS.winning ? "miss" : "blunder";
    }
    if (loss > CLASSIFICATION_THRESHOLDS.mistake) {
        return beforeCP >= CLASSIFICATION_THRESHOLDS.winning ? "miss" : "mistake";
    }
    if (loss > CLASSIFICATION_THRESHOLDS.inaccuracy) {
        return "inaccuracy";
    }
    if (onlyGoodMove) {
        return "great";
    }
    if (isBest) {
        return "best";
    }
    // The engine's runner-up, or any move that is practically as good as the
    // first choice, is "Excellent".
    if (isSecondBest || loss <= CLASSIFICATION_THRESHOLDS.excellent) {
        return "excellent";
    }
    return "good";
}
