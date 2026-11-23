import { expect, test } from "vitest";
import type { Color } from "chessops";
import {
    getAnnotationClassification,
    getMoveClassification,
    getWinChanceLoss,
    resolveMoveClassification,
} from "../classification";

const cp = (value: number) => ({ type: "cp" as const, value });

type EngineLine = {
    depth: number;
    multipv: number;
    nodes: number;
    score: { value: { type: "cp"; value: number }; wdl: null };
    nps: number;
    sanMoves: string[];
    uciMoves: string[];
};

const line = (san: string, value: number): EngineLine => ({
    depth: 20,
    multipv: 1,
    nodes: 1,
    score: { value: cp(value), wdl: null },
    nps: 1,
    sanMoves: [san],
    uciMoves: ["a1a1"],
});

function classify(options: {
    before?: number;
    after?: number;
    color?: Color;
    best?: boolean;
    only?: boolean;
    book?: boolean;
    annotation?: "!" | "!!" | "?" | "??" | "!?" | "?!" | "⊗" | "□" | "";
    engineMoves?: EngineLine[];
    playedMoveSan?: string;
}) {
    return getMoveClassification({
        evalBefore: options.before === undefined ? null : cp(options.before),
        evalAfter: options.after === undefined ? null : cp(options.after),
        color: options.color ?? "white",
        isBestMove: options.best,
        isOnlyGoodMove: options.only,
        isBook: options.book,
        annotation: options.annotation,
        engineMoves: options.engineMoves,
        playedMoveSan: options.playedMoveSan,
    });
}

test("should compute the win chance loss from the mover's point of view", () => {
    expect(getWinChanceLoss(cp(0), cp(0), "white")).toBe(0);
    expect(getWinChanceLoss(cp(0), cp(-100), "white")).toBeCloseTo(9.09, 1);
    expect(getWinChanceLoss(cp(0), cp(100), "black")).toBeCloseTo(9.09, 1);
    // A move that improves the position does not have a negative loss
    expect(getWinChanceLoss(cp(0), cp(100), "white")).toBe(0);
});

test("should classify bad moves by win chance loss", () => {
    expect(classify({ before: 0, after: -700 })).toBe("blunder");
    expect(classify({ before: 0, after: -220 })).toBe("mistake");
    expect(classify({ before: 0, after: -100 })).toBe("inaccuracy");
});

test("should classify throwing away a winning position as a miss", () => {
    // +5 -> +1 keeps a big advantage but misses the win
    expect(classify({ before: 500, after: 100 })).toBe("miss");
    // Same loss from a level position is a blunder
    expect(classify({ before: 0, after: -700 })).toBe("blunder");
});

test("should classify good moves", () => {
    expect(classify({ before: 0, after: 10, best: true })).toBe("best");
    // the engine's runner-up is excellent
    expect(
        classify({
            engineMoves: [line("Nf3", 20), line("d4", 15)],
            playedMoveSan: "d4",
        }),
    ).toBe("excellent");
    // any move that is almost as good as the first choice is excellent too
    expect(classify({ before: 0, after: -20 })).toBe("excellent");
    expect(
        classify({
            before: 0,
            after: -10,
            engineMoves: [line("Nf3", 20), line("d4", 15), line("c4", 10)],
            playedMoveSan: "c4",
        }),
    ).toBe("excellent");
    // the rest of the non-losing moves are good
    expect(classify({ before: 0, after: -40 })).toBe("good");
    expect(
        classify({
            before: 0,
            after: -30,
            engineMoves: [line("Nf3", 20), line("d4", 15)],
            playedMoveSan: "e4",
        }),
    ).toBe("good");
    // a bad move is never excellent, even when it is the runner up
    expect(
        classify({
            before: 0,
            after: -700,
            engineMoves: [line("Nf3", 20), line("e4", -600)],
            playedMoveSan: "e4",
        }),
    ).toBe("blunder");
});

test("should take brilliant only from the report annotation", () => {
    // the engine's first choice is never promoted to brilliant by the evaluation
    expect(classify({ before: 0, after: 10, best: true })).toBe("best");
    // only the `!!` annotation of the report is brilliant
    expect(classify({ annotation: "!!" })).toBe("brilliant");
    // and it wins over the evaluation based classification
    expect(classify({ before: 0, after: 10, best: true, annotation: "!!" })).toBe("brilliant");
    expect(classify({ before: 0, after: -700, annotation: "!!" })).toBe("brilliant");
});

test("should classify only moves as great", () => {
    expect(classify({ before: 0, after: 10, best: true, only: true })).toBe("great");
    // a bad move is never great, even when it was the only good move
    expect(classify({ before: 0, after: -100, only: true })).toBe("inaccuracy");
});

test("should fall back to annotations when there is no evaluation", () => {
    expect(classify({ annotation: "!!" })).toBe("brilliant");
    expect(classify({ annotation: "!" })).toBe("good");
    expect(classify({ annotation: "?!" })).toBe("inaccuracy");
    expect(classify({ annotation: "?" })).toBe("mistake");
    expect(classify({ annotation: "??" })).toBe("blunder");
    expect(classify({ annotation: "⊗" })).toBe("miss");
    expect(classify({ annotation: "□" })).toBe("great");
    expect(classify({ annotation: "" })).toBeNull();
    expect(classify({})).toBeNull();
});

test("should prefer the evaluation based classification over the annotation", () => {
    expect(classify({ before: 0, after: 10, best: true, annotation: "??" })).toBe("best");
});

test("should mark opening book moves", () => {
    expect(classify({ book: true })).toBe("book");
    // Book replaces the neutral positive classifications, like on Chess.com
    expect(classify({ before: 0, after: 10, best: true, book: true })).toBe("book");
    // but never hides an actual mistake
    expect(classify({ before: 0, after: -220, book: true })).toBe("mistake");
});

test("should expose a mapping usable from the annotations only", () => {
    expect(getAnnotationClassification("??")).toBe("blunder");
    expect(getAnnotationClassification("")).toBeNull();
    expect(getAnnotationClassification(null)).toBeNull();
});

test("should resolve the badge of a move", () => {
    expect(resolveMoveClassification({})).toBeNull();
    expect(resolveMoveClassification({ annotations: [] })).toBeNull();
    expect(resolveMoveClassification({ annotations: ["?!"] })).toBe("inaccuracy");
    expect(resolveMoveClassification({ classification: "brilliant" })).toBe("brilliant");
    expect(resolveMoveClassification({ isBook: true })).toBe("book");
    expect(resolveMoveClassification({ classification: "best", isBook: true })).toBe("book");
    expect(resolveMoveClassification({ classification: "mistake", isBook: true })).toBe("mistake");
    // a stored classification wins over a stale annotation
    expect(resolveMoveClassification({ classification: "great", annotations: ["??"] })).toBe(
        "great",
    );
    // but `!!` (the report's brilliant annotation) always wins
    expect(resolveMoveClassification({ annotations: ["!!"] })).toBe("brilliant");
    expect(resolveMoveClassification({ classification: "good", annotations: ["!!"] })).toBe(
        "brilliant",
    );
});

test("should classify a move live from the engine evaluation", () => {
    // no report data, only the evaluation of both positions
    expect(
        resolveMoveClassification({
            annotations: [],
            color: "white",
            evalBefore: cp(0),
            evalAfter: cp(-220),
        }),
    ).toBe("mistake");
    expect(
        resolveMoveClassification({
            annotations: [],
            color: "white",
            evalBefore: cp(500),
            evalAfter: cp(100),
        }),
    ).toBe("miss");
    expect(
        resolveMoveClassification({
            annotations: [],
            color: "black",
            evalBefore: cp(0),
            evalAfter: cp(100),
        }),
    ).toBe("inaccuracy");
});

test("should detect the engine's first choice from the engine lines", () => {
    expect(
        classify({
            engineMoves: [line("Nf3", 20)],
            playedMoveSan: "Nf3",
        }),
    ).toBe("best");
    expect(
        classify({
            engineMoves: [line("Nf3", 20), line("d4", -300)],
            playedMoveSan: "Nf3",
        }),
    ).toBe("great");
    expect(
        classify({
            engineMoves: [line("Nf3", 20), line("d4", 10)],
            playedMoveSan: "Nf3",
        }),
    ).toBe("best");
    expect(
        classify({
            engineMoves: [line("Nf3", 20)],
            playedMoveSan: "e4",
        }),
    ).toBeNull();
});

test("should prefer the evaluated loss over the best move detection", () => {
    // the engine's first choice, but the stored evaluation says it lost the game
    expect(
        classify({
            before: 500,
            after: 0,
            engineMoves: [line("Nf3", 500)],
            playedMoveSan: "Nf3",
        }),
    ).toBe("miss");
});
