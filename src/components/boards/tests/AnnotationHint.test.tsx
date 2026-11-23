import { MantineProvider } from "@mantine/core";
import { parseSquare } from "chessops";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import { CLASSIFICATION_INFO, type MoveClassification } from "@/utils/classification";
import AnnotationHint from "../AnnotationHint";

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

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
}

function hint(props: {
  square: string;
  classification?: MoveClassification | null;
  annotation?: "??" | "?!" | "";
}) {
  return (
    <AnnotationHint
      square={parseSquare(props.square)!}
      orientation="white"
      annotation={props.annotation ?? ""}
      classification={props.classification}
    />
  );
}

test("draws the classification badge with the same color as the move list", () => {
  render(hint({ square: "e4", classification: "blunder" }));

  const badge = container.querySelector('[role="img"]');
  expect(badge).not.toBeNull();
  expect(badge?.getAttribute("aria-label")).toBe("Blunder");
  expect(badge?.querySelector("title")?.textContent).toBe("Blunder");
  // the board badge uses the shared Chess.com palette, not its own colors
  expect(badge?.getAttribute("style")).toContain(hexToRgb(CLASSIFICATION_INFO.blunder.color));
  expect(badge?.querySelector("text")?.textContent).toBe(CLASSIFICATION_INFO.blunder.symbol);
});

test("draws the opening book badge with a book icon", () => {
  render(hint({ square: "e4", classification: "book" }));

  const badge = container.querySelector('[role="img"]');
  expect(badge?.getAttribute("aria-label")).toBe("Book");
  expect(badge?.getAttribute("style")).toContain(hexToRgb(CLASSIFICATION_INFO.book.color));
  expect(badge?.querySelector("path")).not.toBeNull();
  expect(badge?.querySelector("text")).toBeNull();
});

test("draws the thumb up badge for excellent moves", () => {
  render(hint({ square: "e4", classification: "excellent" }));

  const badge = container.querySelector('[role="img"]');
  expect(badge?.getAttribute("aria-label")).toBe("Excellent");
  expect(badge?.getAttribute("style")).toContain(hexToRgb(CLASSIFICATION_INFO.excellent.color));
  // drawn as an icon, not as a text glyph
  expect(badge?.querySelector("path")).not.toBeNull();
  expect(badge?.querySelector("text")).toBeNull();
});

test("positions the badge on the destination square", () => {
  render(hint({ square: "e4", classification: "best" }));

  const badge = container.querySelector('[role="img"]') as HTMLElement;
  // e4 in a white oriented board: 5th file, 4th rank (8x8 board of 12.5%)
  const squareBox = badge.parentElement?.parentElement as HTMLElement;
  expect(squareBox.style.left).toBe("50%");
  expect(squareBox.style.bottom).toBe("37.5%");
});

test("flips the badge position with the board orientation", () => {
  render(
    <AnnotationHint
      square={parseSquare("e4")!}
      orientation="black"
      annotation=""
      classification="best"
    />,
  );

  const badge = container.querySelector('[role="img"]') as HTMLElement;
  const squareBox = badge.parentElement?.parentElement as HTMLElement;
  expect(squareBox.style.left).toBe("37.5%");
  expect(squareBox.style.bottom).toBe("50%");
});

test("keeps the classical annotation hint when there is no classification", () => {
  render(hint({ square: "d5", annotation: "?!" }));

  const badge = container.querySelector('[role="img"]');
  expect(badge?.getAttribute("aria-label")).toBe("?!");
  expect(badge?.querySelector("title")?.textContent).toBe("?!");
  // annotation hints keep their own palette and glyph paths
  expect(badge?.querySelector("path")).not.toBeNull();
});
