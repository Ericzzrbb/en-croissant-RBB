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
  sanitizeBackgroundColor,
} from "@/utils/background";
import { backgroundImageUrl } from "@/utils/customBackground";
import classes from "./CustomBackground.module.css";

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
    if (!enabled) {
      root.style.removeProperty("--app-panel-background");
      return;
    }

    // The app shell and panels use the background theme color at a user
    // configurable opacity, letting the custom background show through.
    const base = sanitizeBackgroundColor(color) || "var(--mantine-color-body)";
    root.style.setProperty(
      "--app-panel-background",
      `color-mix(in srgb, ${base} ${clampBackgroundOpacity(panelOpacity)}%, transparent)`,
    );

    return () => {
      root.style.removeProperty("--app-panel-background");
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
