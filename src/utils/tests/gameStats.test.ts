import { expect, test } from "vitest";
import type { Score } from "@/bindings";
import { getGameStats } from "../chess";
import type { TreeNode } from "../treeReducer";

function score(cp: number): Score {
    return { value: { type: "cp", value: cp }, wdl: null };
}

function node(partial: Partial<TreeNode> & { fen: string; halfMoves: number }): TreeNode {
    return {
        move: null,
        san: null,
        children: [],
        score: null,
        depth: null,
        shapes: [],
        annotations: [],
        comment: "",
        ...partial,
    };
}

function game(): TreeNode {
    return node({
        fen: "start",
        halfMoves: 0,
        score: score(20),
        children: [
            node({
                fen: "after-e4",
                halfMoves: 1,
                san: "e4",
                classification: "best",
                score: score(30),
                children: [
                    node({
                        fen: "after-c5",
                        halfMoves: 2,
                        san: "c5",
                        classification: "blunder",
                        score: score(-100),
                    }),
                ],
            }),
        ],
    });
}

test("counts classifications per color and remembers the first move", () => {
    const { classifications } = getGameStats(game());

    expect(classifications.best).toMatchObject({ white: 1, black: 0, whitePath: [0] });
    expect(classifications.blunder).toMatchObject({ white: 0, black: 1, blackPath: [0, 0] });
    expect(classifications.brilliant).toMatchObject({ white: 0, black: 0, whitePath: null });
});

test("classifies from annotations when the report stored no classification", () => {
    const root = node({
        fen: "start",
        halfMoves: 0,
        children: [
            node({
                fen: "after-e4",
                halfMoves: 1,
                san: "e4",
                annotations: ["?!"],
            }),
        ],
    });

    expect(getGameStats(root).classifications.inaccuracy.white).toBe(1);
});

test("book positions replace the neutral positive classifications", () => {
    const root = game();
    root.children[0].classification = "good";

    const { classifications } = getGameStats(root, new Set(["after-e4"]));

    expect(classifications.book.white).toBe(1);
    expect(classifications.good.white).toBe(0);
});
