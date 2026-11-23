import { Box, Tooltip } from "@mantine/core";
import { IconBook, IconThumbUp } from "@tabler/icons-react";
import type { CSSProperties } from "react";
import { CLASSIFICATION_INFO, type MoveClassification } from "@/utils/classification";
import classes from "./MoveBadge.module.css";

/**
 * Small Chess.com style badge that classifies a single move.
 *
 * It is intentionally rendered as a plain `<span>` so it can live inside the
 * move button without stealing clicks, focus or keyboard navigation.
 *
 * With `classification === null` it renders a neutral "not analyzed yet" badge,
 * so every move always has a badge slot.
 */
function MoveBadge({ classification }: { classification: MoveClassification | null }) {
  if (!classification) {
    return (
      <Box
        component="span"
        className={`${classes.badge} ${classes.unknown}`}
        role="img"
        aria-label="Not analyzed"
      />
    );
  }

  const info = CLASSIFICATION_INFO[classification];
  const label = info.description ? `${info.name} - ${info.description}` : info.name;

  return (
    <Tooltip label={label} position="top" withArrow openDelay={200}>
      <Box
        component="span"
        className={classes.badge}
        style={
          {
            "--badge-bg": info.color,
            "--badge-fg": info.textColor,
          } as CSSProperties
        }
        role="img"
        aria-label={info.name}
      >
        {classification === "book" ? (
          <IconBook className={classes.icon} stroke={2.5} aria-hidden="true" />
        ) : classification === "excellent" ? (
          <IconThumbUp className={classes.icon} stroke={2.5} aria-hidden="true" />
        ) : (
          <span className={classes.glyph} aria-hidden="true">
            {info.symbol}
          </span>
        )}
      </Box>
    </Tooltip>
  );
}

export default MoveBadge;
