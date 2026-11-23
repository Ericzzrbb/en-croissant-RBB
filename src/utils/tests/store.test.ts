import { Chess, parseUci } from "chessops";
import { makeFen } from "chessops/fen";
import { parseSan } from "chessops/san";
import { beforeEach, expect, test } from "vitest";
import { createTreeStore } from "@/state/store/tree";
import { createNode, defaultTree, type TreeState } from "@/utils/treeReducer";

const store = createTreeStore();

beforeEach(() => {
    store.setState(defaultTree());
});

const e4 = parseUci("e2e4")!;
const d5 = parseUci("d7d5")!;

const bestMoves = (san: string, value: number, multipv: number) => ({
    nodes: 1,
    depth: 20,
    score: { value: { type: "cp" as const, value }, wdl: null },
    uciMoves: ["a1a1"],
    sanMoves: [san],
    multipv,
    nps: 1,
});
const treeE4D5: () => TreeState = () => ({
    ...defaultTree(),
    position: [0, 0],
    root: {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        move: null,
        san: null,
        children: [
            {
                fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
                move: e4,
                san: "e4",
                children: [
                    {
                        fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
                        move: d5,
                        san: "d5",
                        clock: undefined,
                        children: [],
                        score: null,
                        depth: null,
                        halfMoves: 2,
                        shapes: [],
                        annotations: [],
                        comment: "",
                    },
                ],
                clock: undefined,
                score: null,
                depth: null,
                halfMoves: 1,
                shapes: [],
                annotations: [],
                comment: "",
            },
        ],
        score: null,
        depth: null,
        halfMoves: 0,
        shapes: [],
        annotations: [],
        comment: "",
    },
    report: {
        inProgress: false,
    },
});

const treeE4D5Nf3: () => TreeState = () => ({
    ...defaultTree(),
    position: [0, 0],
    root: {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        move: null,
        san: null,
        children: [
            {
                fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
                move: e4,
                san: "e4",
                children: [
                    {
                        fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
                        move: d5,
                        san: "d5",
                        clock: undefined,
                        children: [],
                        score: null,
                        depth: null,
                        halfMoves: 2,
                        shapes: [],
                        annotations: [],
                        comment: "",
                    },
                ],
                clock: undefined,
                score: null,
                depth: null,
                halfMoves: 1,
                shapes: [],
                annotations: [],
                comment: "",
            },
            {
                fen: "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1",
                move: parseUci("g1f3")!,
                san: "Nf3",
                children: [],
                clock: undefined,
                score: null,
                depth: null,
                halfMoves: 1,
                shapes: [],
                annotations: [],
                comment: "",
            },
        ],
        score: null,
        depth: null,
        halfMoves: 0,
        shapes: [],
        annotations: [],
        comment: "",
    },
    report: {
        inProgress: false,
    },
});

const getNewState = () => {
    const s = store.getState();
    return {
        root: s.root,
        position: s.position,
        headers: s.headers,
        dirty: s.dirty,
        report: {
            inProgress: false,
        },
    };
};

test("should handle save", () => {
    store.setState({ dirty: true });
    store.getState().save();

    expect(getNewState()).toStrictEqual({ ...defaultTree(), dirty: false });
});

test("should handle setState", () => {
    store.getState().setState(treeE4D5());
    expect(getNewState()).toStrictEqual(treeE4D5());
});

test("should handle reset", () => {
    store.setState(treeE4D5());
    store.getState().reset();
    expect(getNewState()).toStrictEqual(defaultTree());
});

test("should handle setHeaders", () => {
    store.getState().setHeaders({
        ...defaultTree().headers,
        orientation: "black",
        start: [1],
    });

    expect(getNewState()).toStrictEqual({
        ...defaultTree(),
        dirty: true,
        headers: {
            ...defaultTree().headers,
            orientation: "black",
            start: [1],
        },
    });
});

test("should handle setStart", () => {
    store.getState().setStart([1]);

    expect(getNewState()).toStrictEqual({
        ...defaultTree(),
        dirty: true,
        headers: { ...defaultTree().headers, start: [1] },
    });
});

test("should handle makeMove", () => {
    store.getState().makeMove({ payload: e4 });

    expect(getNewState()).toStrictEqual({
        ...defaultTree(),
        dirty: true,
        position: [0],
        root: {
            ...defaultTree().root,
            children: [
                {
                    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
                    move: e4,
                    san: "e4",
                    children: [],
                    score: null,
                    clock: undefined,
                    depth: null,
                    halfMoves: 1,
                    shapes: [],
                    annotations: [],
                    comment: "",
                },
            ],
        },
    });
});

test("should handle makeMoves", () => {
    store.getState().makeMoves({ payload: ["e4", "d5"] });

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        dirty: true,
        position: [0, 0],
    });
});

test("should handle goToStart", () => {
    store.setState(treeE4D5());
    store.getState().goToStart();

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        position: [],
    });
});

test("should handle goToEnd", () => {
    store.setState({ ...treeE4D5(), position: [] });
    store.getState().goToEnd();

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        position: [0, 0],
    });
});

test("should handle goToNext", () => {
    store.setState({ ...treeE4D5(), position: [] });
    store.getState().goToNext();

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        position: [0],
    });
});

test("should handle goToPrevious", () => {
    store.setState({ ...treeE4D5(), position: [0] });
    store.getState().goToPrevious();

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        position: [],
    });
});

test("should handle goToBranchEnd", () => {
    store.setState({ ...treeE4D5(), position: [] });
    store.getState().goToBranchEnd();

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        position: [0, 0],
    });
});

test("should handle goToBranchStart", () => {
    store.setState({ ...treeE4D5(), position: [0, 0] });
    store.getState().goToBranchStart();

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        position: [],
    });
});

test("should handle goToMove", () => {
    store.setState({ ...treeE4D5(), position: [] });
    store.getState().goToMove([0]);

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        position: [0],
    });
});

test("should handle deleteMove", () => {
    store.setState(treeE4D5());
    store.getState().deleteMove([0]);

    expect(getNewState()).toStrictEqual({ ...defaultTree(), dirty: true });
});

function variationFixture() {
    const tree = defaultTree();
    tree.root.children = ["e4", "d4", "c4"].map((san, index) => {
        const pos = Chess.default();
        const move = parseSan(pos, san)!;
        pos.play(move);
        const node = createNode({ fen: makeFen(pos.toSetup()), move, san, halfMoves: 1 });
        if (index > 0) {
            const reply = parseSan(pos, "e5")!;
            pos.play(reply);
            node.children.push(
                createNode({ fen: makeFen(pos.toSetup()), move: reply, san: "e5", halfMoves: 2 }),
            );
        }
        return node;
    });
    return tree;
}

test.each([
    [1, 2, 1],
    [2, 0, 1],
    [2, 1, 1],
] as const)("selected branch %i survives deleting sibling %i", (selected, deleted, expected) => {
    const tree = variationFixture();
    tree.position = [selected, 0];
    tree.headers.start = [selected, 0];
    const selectedFen = tree.root.children[selected].children[0].fen;
    store.setState(tree);
    store.getState().deleteMove([deleted]);
    expect(store.getState().position).toEqual([expected, 0]);
    expect(store.getState().currentNode()?.fen).toBe(selectedFen);
    expect(store.getState().headers.start).toEqual([expected, 0]);
});

test("deleting the selected variation returns to its parent and clears its start path", () => {
    const tree = variationFixture();
    tree.position = [1, 0];
    tree.headers.start = [1, 0];
    store.setState(tree);
    store.getState().deleteMove([1]);
    expect(store.getState().position).toEqual([]);
    expect(store.getState().currentNode().fen).toBe(tree.root.fen);
    expect(store.getState().headers.start).toBeUndefined();
});

test("deleting a later branch leaves an earlier selection and start unchanged", () => {
    const tree = variationFixture();
    tree.position = [0];
    tree.headers.start = [0];
    store.setState(tree);
    store.getState().deleteMove([2]);
    expect(store.getState().position).toEqual([0]);
    expect(store.getState().headers.start).toEqual([0]);
    expect(store.getState().currentNode().san).toBe("e4");
});

test("deleting within another branch leaves current and saved paths unchanged", () => {
    const tree = variationFixture();
    tree.position = [1, 0];
    tree.headers.start = [1, 0];
    store.setState(tree);
    store.getState().deleteMove([2, 0]);
    expect(store.getState().position).toEqual([1, 0]);
    expect(store.getState().headers.start).toEqual([1, 0]);
    expect(store.getState().currentNode().fen).toBe(tree.root.children[1].children[0].fen);
});

test("saved start is rebased even when the current selection is the parent", () => {
    const tree = variationFixture();
    tree.headers.start = [2, 0];
    store.setState(tree);
    store.getState().deleteMove([0]);
    expect(store.getState().position).toEqual([]);
    expect(store.getState().headers.start).toEqual([1, 0]);
    expect(store.getState().currentNode().fen).toBe(tree.root.fen);
});

test("should handle setAnnotation", () => {
    store.setState({ ...treeE4D5(), position: [0] });
    store.getState().setAnnotation("!");

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        dirty: true,
        position: [0],
        root: {
            ...treeE4D5().root,
            children: [
                {
                    ...treeE4D5().root.children[0],
                    annotations: ["!"],
                },
            ],
        },
    });
});

test("should handle setComment", () => {
    store.setState({ ...treeE4D5(), position: [0] });
    store.getState().setComment("test");

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        dirty: true,
        position: [0],
        root: {
            ...treeE4D5().root,
            children: [
                {
                    ...treeE4D5().root.children[0],
                    comment: "test",
                },
            ],
        },
    });
});

test("should handle setFen", () => {
    store.setState({ ...treeE4D5(), position: [0] });
    store.getState().setFen("rnbq1bnr/ppppkppp/8/4p3/4P3/8/PPPPKPPP/RNBQ1BNR w - - 2 3");

    expect(getNewState()).toStrictEqual({
        ...defaultTree(),
        dirty: true,
        root: {
            ...defaultTree().root,
            fen: "rnbq1bnr/ppppkppp/8/4p3/4P3/8/PPPPKPPP/RNBQ1BNR w - - 2 3",
        },
    });
});

test("should handle setScore", () => {
    store.setState({ ...treeE4D5(), position: [0] });
    store.getState().setScore({
        value: {
            type: "mate",
            value: 1,
        },
        wdl: null,
    });

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        dirty: true,
        position: [0],
        root: {
            ...treeE4D5().root,
            children: [
                {
                    ...treeE4D5().root.children[0],
                    score: {
                        value: {
                            type: "mate",
                            value: 1,
                        },
                        wdl: null,
                    },
                },
            ],
        },
    });
});

test("should handle setShapes", () => {
    store.setState({ ...treeE4D5(), position: [0] });
    store.getState().setShapes([
        {
            brush: "red",
            orig: "e4",
            dest: "d5",
        },
    ]);

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        dirty: true,
        position: [0],
        root: {
            ...treeE4D5().root,
            children: [
                {
                    ...treeE4D5().root.children[0],
                    shapes: [
                        {
                            brush: "red",
                            orig: "e4",
                            dest: "d5",
                        },
                    ],
                },
            ],
        },
    });
});

test("should handle addAnalysis", () => {
    store.setState({ ...treeE4D5(), position: [0] });
    store.getState().addAnalysis([
        {
            best: [
                {
                    depth: 1,
                    multipv: 1,
                    nodes: 1,
                    score: {
                        value: {
                            type: "cp",
                            value: 10,
                        },
                        wdl: null,
                    },
                    nps: 1000,
                    sanMoves: ["e4"],
                    uciMoves: ["e2e4"],
                },
            ],
            novelty: false,
            is_sacrifice: false,
        },
        {
            best: [
                {
                    depth: 1,
                    multipv: 1,
                    nodes: 1,
                    score: {
                        value: {
                            type: "cp",
                            value: 20,
                        },
                        wdl: null,
                    },
                    nps: 1000,
                    sanMoves: ["d5"],
                    uciMoves: ["d7d5"],
                },
            ],
            novelty: false,
            is_sacrifice: false,
        },
    ]);

    expect(getNewState()).toStrictEqual({
        ...treeE4D5(),
        dirty: true,
        position: [0],
        root: {
            ...treeE4D5().root,
            children: [
                {
                    ...treeE4D5().root.children[0],
                    // e4 is the engine's first choice, so the report tags it as best
                    classification: "best",
                    score: {
                        value: {
                            type: "cp",
                            value: 20,
                        },
                        wdl: null,
                    },
                },
            ],
            score: {
                value: {
                    type: "cp",
                    value: 10,
                },
                wdl: null,
            },
        },
    });
});

test("should clear the report classification when the user overrides the move quality", () => {
    const tree = treeE4D5();
    tree.root.children[0].classification = "best";
    store.setState({ ...tree, position: [0] });

    store.getState().setAnnotation("?!");

    expect(store.getState().root.children[0].classification).toBeNull();
    expect(store.getState().root.children[0].annotations).toContain("?!");
});

test("should keep the report classification for positional annotations", () => {
    const tree = treeE4D5();
    tree.root.children[0].classification = "best";
    store.setState({ ...tree, position: [0] });

    store.getState().setAnnotation("N");

    expect(store.getState().root.children[0].classification).toBe("best");
});

test("should classify the analyzed moves with the chess.com categories", () => {
    store.getState().makeMoves({ payload: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"] });

    const analysis = [
        {
            best: [bestMoves("e4", 20, 1), bestMoves("d4", 10, 2)],
            novelty: false,
            is_sacrifice: false,
        },
        {
            // the engine's runner up is e5, so playing it is "excellent"
            best: [bestMoves("Nc6", 25, 1), bestMoves("e5", 24, 2)],
            novelty: false,
            is_sacrifice: false,
        },
        {
            best: [bestMoves("Nf3", 30, 1), bestMoves("d4", -300, 2)],
            novelty: false,
            is_sacrifice: false,
        },
        {
            best: [bestMoves("Nc6", 35, 1), bestMoves("d6", 30, 2)],
            novelty: false,
            is_sacrifice: false,
        },
        {
            best: [bestMoves("Bb5", 250, 1), bestMoves("d4", 240, 2)],
            novelty: false,
            is_sacrifice: false,
        },
        {
            best: [bestMoves("a6", 30, 1), bestMoves("Nf6", 20, 2)],
            novelty: false,
            is_sacrifice: false,
        },
    ];

    store.getState().addAnalysis(analysis);

    const classifications: (string | null | undefined)[] = [];
    let node = store.getState().root;
    while (node.children.length > 0) {
        node = node.children[0];
        classifications.push(node.classification);
    }

    // best, excellent, great, mistake, miss
    expect(classifications).toEqual(["best", "excellent", "great", "mistake", "miss"]);
});

test("should take brilliant from the report annotation", () => {
    store.getState().makeMoves({ payload: ["e2e4", "e7e5"] });

    store.getState().addAnalysis([
        {
            best: [bestMoves("e4", 20, 1), bestMoves("d4", 10, 2)],
            novelty: false,
            is_sacrifice: false,
        },
        {
            // black to move: e5 is the engine's first choice and the runner up
            // is much worse, so the report can annotate it as a sacrifice
            best: [bestMoves("e5", 25, 1), bestMoves("Nc6", 300, 2)],
            novelty: false,
            is_sacrifice: false,
        },
        {
            best: [bestMoves("Nf3", 30, 1), bestMoves("d4", 20, 2)],
            novelty: false,
            is_sacrifice: true,
        },
    ]);

    const e5 = store.getState().root.children[0].children[0];
    expect(e5.annotations).toContain("!!");
    expect(e5.classification).toBe("brilliant");
});

test("should keep a PGN !! as brilliant after the report", () => {
    store.getState().makeMoves({ payload: ["e2e4"] });
    store.getState().setAnnotation("!!");

    store.getState().addAnalysis([
        {
            best: [bestMoves("e4", 20, 1), bestMoves("d4", 10, 2)],
            novelty: false,
            is_sacrifice: false,
        },
        {
            best: [bestMoves("e5", 25, 1), bestMoves("Nc6", 20, 2)],
            novelty: false,
            is_sacrifice: false,
        },
    ]);

    const e4 = store.getState().root.children[0];
    expect(e4.annotations).toContain("!!");
    // the report would classify it as "best", but `!!` always means brilliant
    expect(e4.classification).toBe("brilliant");
});

test("should handle promoteVariation", () => {
    store.setState(treeE4D5Nf3());
    store.getState().promoteVariation([1]);

    expect(getNewState()).toStrictEqual({
        ...treeE4D5Nf3(),
        dirty: true,
        position: [0],
        root: {
            ...treeE4D5Nf3().root,
            children: [
                {
                    ...treeE4D5Nf3().root.children[1],
                },
                {
                    ...treeE4D5Nf3().root.children[0],
                },
            ],
        },
    });
});
