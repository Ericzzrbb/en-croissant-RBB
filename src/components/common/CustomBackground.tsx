import { useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import {
  customBackgroundActiveAtom,
  customBackgroundBrightnessAtom,
  customBackgroundColorAtom,
  customBackgroundEnabledAtom,
  customBackgroundImageAtom,
  customBackgroundOpacityAtom,
  panelOpacityAtom,
} from "@/state/atoms";
import {
  backgroundLayerStyle,
  clampBackgroundOpacity,
  contrastColorForBackground,
  sanitizeBackgroundColor,
} from "@/utils/background";
import { backgroundImageUrl } from "@/utils/customBackground";
import classes from "./CustomBackground.module.css";

const BACKGROUND_VARIABLES = [
  "--app-panel-background",
  "--mantine-color-default",
  "--mantine-color-default-hover",
  "--mantine-color-default-color",
  "--mantine-color-default-border",
] as const;

/**
 * Paints the user's custom background behind the application. The layer is
 * fixed and non-interactive; the app content is stacked above it by App.
 *
 * The `--app-panel-background` variable makes the app shell and panels share
 * the background theme color while letting a little of the image through.
 */
export default function CustomBackground() {
  const active = useAtomValue(customBackgroundActiveAtom);
  const enabled = useAtomValue(customBackgroundEnabledAtom);
  const image = useAtomValue(customBackgroundImageAtom);
  const color = useAtomValue(customBackgroundColorAtom);
  const opacity = useAtomValue(customBackgroundOpacityAtom);
  const brightness = useAtomValue(customBackgroundBrightnessAtom);
  const panelOpacity = useAtomValue(panelOpacityAtom);

  const imageUrl = useMemo(() => backgroundImageUrl(image), [image]);

  useEffect(() => {
    const root = document.documentElement;
    for (const variable of BACKGROUND_VARIABLES) {
      root.style.removeProperty(variable);
    }
    if (!enabled) return;

    const customColor = sanitizeBackgroundColor(color);
    const base = customColor || "var(--mantine-color-body)";
    const text = customColor
      ? contrastColorForBackground(customColor)
      : "var(--mantine-color-text)";

    // The app shell and panels use the background theme color at a user
    // configurable opacity, letting the custom background show through.
    root.style.setProperty(
      "--app-panel-background",
      `color-mix(in srgb, ${base} ${clampBackgroundOpacity(panelOpacity)}%, transparent)`,
    );

    // Default-variant buttons, action icons and similar controls normally use
    // the near-black `--mantine-color-default`; match them to the background
    // theme color and pick a readable text color.
    root.style.setProperty("--mantine-color-default", base);
    root.style.setProperty("--mantine-color-default-color", text);
    root.style.setProperty(
      "--mantine-color-default-hover",
      `color-mix(in srgb, ${base} 88%, ${text})`,
    );
    root.style.setProperty(
      "--mantine-color-default-border",
      `color-mix(in srgb, ${base} 82%, ${text})`,
    );

    return () => {
      for (const variable of BACKGROUND_VARIABLES) {
        root.style.removeProperty(variable);
      }
    };
  }, [enabled, color, panelOpacity]);

  if (!active) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={classes.layer}
      style={backgroundLayerStyle({ imageUrl, color, opacity, brightness })}
    />
  );
}
