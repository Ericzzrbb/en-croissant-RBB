import { createContext, useContext, useEffect, useState } from "react";
import { useStore } from "zustand";
import { getBookPosition, getCachedBookPosition } from "@/utils/openingBook";
import type { TreeNode } from "@/utils/treeReducer";
import { TreeStateContext } from "./TreeStateContext";

/** How many plies from the start are checked against the opening book. */
const MAX_BOOK_PLY = 24;

const EMPTY: ReadonlySet<string> = new Set();

const BookPositionsContext = createContext<ReadonlySet<string>>(EMPTY);

function collectMainLineFens(root: TreeNode): string[] {
  const fens: string[] = [];
  let node: TreeNode | undefined = root;
  while (node && fens.length <= MAX_BOOK_PLY) {
    fens.push(node.fen);
    node = node.children[0];
  }
  return fens;
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of b) {
    if (!a.has(value)) {
      return false;
    }
  }
  return true;
}

/**
 * Resolves which positions of the current game are part of the opening book
 * (the same table the opening name comes from) and shares them with the move
 * list, so opening moves can be labelled as "Book".
 */
export function BookPositionsProvider({ children }: { children: React.ReactNode }) {
  const store = useContext(TreeStateContext)!;
  const root = useStore(store, (s) => s.root);
  const [bookFens, setBookFens] = useState<ReadonlySet<string>>(EMPTY);

  useEffect(() => {
    const fens = collectMainLineFens(root);
    if (fens.length <= 1) {
      // No moves yet, nothing can be a book move.
      setBookFens((prev) => (prev.size === 0 ? prev : EMPTY));
      return;
    }

    let cancelled = false;
    const unknown = fens.filter((fen) => getCachedBookPosition(fen) === undefined);

    Promise.all(unknown.map((fen) => getBookPosition(fen)))
      .then(() => {
        if (cancelled) {
          return;
        }
        const next = new Set(fens.filter((fen) => getCachedBookPosition(fen)));
        setBookFens((prev) => (sameSet(prev, next) ? prev : next));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [root]);

  return <BookPositionsContext.Provider value={bookFens}>{children}</BookPositionsContext.Provider>;
}

/** FENs of the currently displayed game that are part of the opening book. */
export function useBookPositions(): ReadonlySet<string> {
  return useContext(BookPositionsContext);
}
