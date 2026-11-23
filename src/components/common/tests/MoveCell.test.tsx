import { MantineProvider } from "@mantine/core";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import type { Annotation } from "@/utils/annotation";
import MoveBadge from "../MoveBadge";
import MoveCell from "../MoveCell";

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom does not implement matchMedia, Mantine's color scheme needs it
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(ui: ReactNode) {
  act(() => root.render(<MantineProvider>{ui}</MantineProvider>));
}

function moveCell({
  move = "e4",
  badge,
  onClick = () => undefined,
  annotations = [],
}: {
  move?: string;
  badge?: ReactNode;
  onClick?: () => void;
  annotations?: Annotation[];
}) {
  return (
    <MoveCell
      move={move}
      annotations={annotations}
      isStart={false}
      isCurrentVariation={false}
      onClick={onClick}
      onContextMenu={() => undefined}
      badge={badge}
    />
  );
}

test("renders a classification badge next to the move notation", () => {
  render(moveCell({ badge: <MoveBadge classification="best" /> }));

  const button = container.querySelector("button");
  expect(button).not.toBeNull();
  // the SAN is still fully readable
  expect(button?.textContent).toContain("e4");
  // and the badge is rendered as its own element
  const badge = button?.querySelector('[role="img"]');
  expect(badge?.getAttribute("aria-label")).toBe("Best");
  expect(badge?.textContent).toContain("★");
});

test("does not repeat the annotation glyph that the badge already shows", () => {
  render(moveCell({ badge: <MoveBadge classification="best" />, annotations: ["?"] }));

  // the mistake glyph is replaced by the badge, not duplicated next to it
  expect(container.querySelector("button")?.textContent).toBe("e4★");
});

test("keeps annotations that have no badge equivalent", () => {
  render(moveCell({ badge: <MoveBadge classification="best" />, annotations: ["N"] }));

  expect(container.querySelector("button")?.textContent).toBe("e4N★");
});

test("renders one badge per classification", () => {
  const classifications = [
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
  ] as const;

  render(
    <div>
      {classifications.map((classification) => (
        <div key={classification} data-testid={classification}>
          {moveCell({ badge: <MoveBadge classification={classification} /> })}
        </div>
      ))}
    </div>,
  );

  for (const classification of classifications) {
    const wrapper = container.querySelector(`[data-testid="${classification}"]`);
    const badge = wrapper?.querySelector('[role="img"]');
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute("aria-label")).not.toBe("");
    // every badge has a visible glyph or icon
    expect(badge?.children.length).toBeGreaterThan(0);
  }
});

test("keeps the move clickable when a badge is present", () => {
  let clicks = 0;
  render(moveCell({ badge: <MoveBadge classification="blunder" />, onClick: () => clicks++ }));

  const button = container.querySelector("button");
  act(() => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(clicks).toBe(1);
});

test("renders no badge when the move has no classification", () => {
  render(moveCell({}));

  expect(container.querySelector("button")?.textContent).toContain("e4");
  expect(container.querySelector('[role="img"]')).toBeNull();
});

test("renders a neutral placeholder for moves that are not analyzed yet", () => {
  render(moveCell({ badge: <MoveBadge classification={null} /> }));

  const badge = container.querySelector('[role="img"]');
  expect(badge).not.toBeNull();
  expect(badge?.getAttribute("aria-label")).toBe("Not analyzed");
  // nothing is drawn inside a neutral badge
  expect(badge?.children.length).toBe(0);
  expect(container.querySelector("button")?.textContent).toBe("e4");
});
