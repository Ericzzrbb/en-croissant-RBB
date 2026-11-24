import { ActionIcon, Box, Button, Group, Loader, Progress } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { memo, useCallback, useEffect, useRef } from "react";
import { useProgress } from "@/hooks/useProgress";
import classes from "./ProgressButton.module.css";

type Props = {
  id: string;
  initInstalled: boolean;
  onClick: (id: string) => void;
  onCancel?: () => void;
  leftIcon?: React.ReactNode;
  labels: {
    completed: string;
    action: string;
    inProgress: string;
    finalizing?: string;
  };
  disabled?: boolean;
  redoable?: boolean;
  inProgress: boolean;
  setInProgress: (inProgress: boolean) => void;
};

function ProgressButton({
  id,
  initInstalled,
  onClick,
  onCancel,
  leftIcon,
  labels,
  disabled,
  redoable,
  inProgress,
  setInProgress,
}: Props) {
  const { progress, finished, isActive, clear, item } = useProgress(id);
  const completed = initInstalled || finished;

  const showProgress = isActive || inProgress;

  // Whether this component saw the operation start. A progress item that is
  // left unfinished after the operation stopped is stale (the command failed or
  // was cancelled), and keeping it would leave the button disabled forever.
  const started = useRef(false);
  useEffect(() => {
    if (inProgress) {
      started.current = true;
    }
  }, [inProgress]);

  useEffect(() => {
    if (finished) {
      setInProgress(false);
      return;
    }

    if (!inProgress && started.current && item) {
      const timeout = setTimeout(clear, 1000);
      return () => clearTimeout(timeout);
    }
  }, [clear, finished, inProgress, item, setInProgress]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
    clear();
    setInProgress(false);
  }, [onCancel, clear, setInProgress]);

  let label: string;
  if (completed) {
    label = labels.completed;
  } else if (progress === 0 && !showProgress) {
    label = labels.action;
  } else if (progress === 100) {
    label = labels.finalizing ?? labels.inProgress;
  } else if (progress > 0) {
    // A percentage makes long running jobs (game reports, engine downloads)
    // clearly different from a frozen app.
    label = `${labels.inProgress} ${Math.round(progress)}%`;
  } else {
    label = labels.inProgress;
  }

  return (
    <Group gap="xs" wrap="nowrap">
      <Button
        fullWidth
        onClick={() => {
          onClick(id);
        }}
        disabled={showProgress || (completed && !redoable) || disabled}
        leftSection={
          <Box className={classes.label}>
            {showProgress && !completed ? <Loader size="0.875rem" color="white" /> : leftIcon}
          </Box>
        }
        autoContrast
      >
        <span className={classes.label}>{label}</span>
        {!completed && progress !== 0 && (
          <Progress
            pos="absolute"
            h="100%"
            value={progress}
            className={classes.progress}
            radius="sm"
          />
        )}
      </Button>
      {showProgress && onCancel && (
        <ActionIcon variant="default" size="lg" onClick={handleCancel} title="Cancel">
          <IconX size="1rem" />
        </ActionIcon>
      )}
    </Group>
  );
}

export default memo(ProgressButton);
