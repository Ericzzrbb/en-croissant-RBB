import {
  ActionIcon,
  Box,
  Button,
  ColorInput,
  Group,
  Slider,
  Stack,
  Switch,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPhoto, IconReload, IconTrash, IconX } from "@tabler/icons-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  customBackgroundBrightnessAtom,
  customBackgroundColorAtom,
  customBackgroundEnabledAtom,
  customBackgroundImageAtom,
  customBackgroundOpacityAtom,
  panelOpacityAtom,
} from "@/state/atoms";
import {
  BACKGROUND_IMAGE_EXTENSIONS,
  backgroundImageFileName,
  backgroundLayerStyle,
  DEFAULT_BACKGROUND_BRIGHTNESS,
  DEFAULT_BACKGROUND_OPACITY,
  DEFAULT_PANEL_OPACITY,
} from "@/utils/background";
import {
  BackgroundImageError,
  backgroundImageUrl,
  deleteBackgroundImage,
  importBackgroundImage,
} from "@/utils/customBackground";
import classes from "./CustomBackgroundSettings.module.css";

const COLOR_SWATCHES = [
  "#1A1B1E",
  "#25262B",
  "#2C2E33",
  "#373A40",
  "#101113",
  "#FFFFFF",
  "#F8F9FA",
  "#E9ECEF",
  "#228BE6",
  "#15AABF",
  "#40C057",
  "#BE4BDB",
];

export default function CustomBackgroundSettings() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useAtom(customBackgroundEnabledAtom);
  const [image, setImage] = useAtom(customBackgroundImageAtom);
  const [opacity, setOpacity] = useAtom(customBackgroundOpacityAtom);
  const [brightness, setBrightness] = useAtom(customBackgroundBrightnessAtom);
  const [color, setColor] = useAtom(customBackgroundColorAtom);
  const [panelOpacity, setPanelOpacity] = useAtom(panelOpacityAtom);
  const [busy, setBusy] = useState(false);

  const imageUrl = useMemo(() => backgroundImageUrl(image), [image]);

  async function chooseImage() {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Images",
          extensions: [...BACKGROUND_IMAGE_EXTENSIONS],
        },
      ],
    });
    if (typeof selected !== "string") return;

    setBusy(true);
    try {
      const previous = image;
      const stored = await importBackgroundImage(selected);
      setImage(stored);
      setEnabled(true);
      if (previous) {
        void deleteBackgroundImage(previous);
      }
    } catch (error) {
      const code = error instanceof BackgroundImageError ? error.code : "failed";
      notifications.show({
        color: "red",
        title: t("Common.Error"),
        message: t(
          code === "unsupported"
            ? "Settings.Appearance.Background.InvalidType"
            : "Settings.Appearance.Background.ImportFailed",
        ),
      });
    } finally {
      setBusy(false);
    }
  }

  function removeImage() {
    const previous = image;
    setImage("");
    if (!color) {
      setEnabled(false);
    }
    if (previous) {
      void deleteBackgroundImage(previous);
    }
  }

  function reset() {
    const previous = image;
    setImage("");
    setEnabled(false);
    setOpacity(DEFAULT_BACKGROUND_OPACITY);
    setBrightness(DEFAULT_BACKGROUND_BRIGHTNESS);
    setPanelOpacity(DEFAULT_PANEL_OPACITY);
    setColor("");
    if (previous) {
      void deleteBackgroundImage(previous);
    }
  }

  return (
    <Stack gap="sm" w="22rem">
      <Group justify="space-between" wrap="nowrap">
        <Switch
          label={t("Settings.Appearance.Background.Enable")}
          checked={enabled}
          onChange={(event) => setEnabled(event.currentTarget.checked)}
        />
        <Group gap={4} wrap="nowrap">
          <Button
            size="xs"
            variant="default"
            leftSection={<IconPhoto size="1rem" />}
            onClick={chooseImage}
            loading={busy}
          >
            {image
              ? t("Settings.Appearance.Background.Change")
              : t("Settings.Appearance.Background.Choose")}
          </Button>
          {image && (
            <Tooltip label={t("Settings.Appearance.Background.Remove")}>
              <ActionIcon
                variant="default"
                color="red"
                onClick={removeImage}
                disabled={busy}
                aria-label={t("Settings.Appearance.Background.Remove")}
              >
                <IconTrash size="1.1rem" />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label={t("Settings.Appearance.Background.Reset")}>
            <ActionIcon
              variant="default"
              onClick={reset}
              disabled={busy}
              aria-label={t("Settings.Appearance.Background.Reset")}
            >
              <IconReload size="1.1rem" />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Box className={classes.preview}>
        <div
          className={classes.previewLayer}
          style={backgroundLayerStyle({ imageUrl, color, opacity, brightness })}
        />
        <Text className={classes.previewLabel} size="xs">
          {t("Settings.Appearance.Background.Preview")}
        </Text>
      </Box>

      <Text size="xs" c="dimmed" truncate>
        {image
          ? backgroundImageFileName(image)
          : t("Settings.Appearance.Background.None")}
      </Text>

      <div>
        <Group justify="space-between" gap="xs">
          <Text size="xs" c="dimmed">
            {t("Settings.Appearance.Background.Opacity")}
          </Text>
          <Text size="xs" c="dimmed">
            {opacity}%
          </Text>
        </Group>
        <Slider
          min={0}
          max={100}
          step={5}
          value={opacity}
          onChange={setOpacity}
          disabled={!enabled}
          aria-label={t("Settings.Appearance.Background.Opacity")}
        />
      </div>

      <div>
        <Group justify="space-between" gap="xs">
          <Text size="xs" c="dimmed">
            {t("Settings.Appearance.Background.Brightness")}
          </Text>
          <Text size="xs" c="dimmed">
            {brightness}%
          </Text>
        </Group>
        <Slider
          min={0}
          max={200}
          step={5}
          value={brightness}
          onChange={setBrightness}
          disabled={!enabled}
          aria-label={t("Settings.Appearance.Background.Brightness")}
        />
      </div>

      <div>
        <Group justify="space-between" gap="xs">
          <Text size="xs" c="dimmed">
            {t("Settings.Appearance.Background.PanelOpacity")}
          </Text>
          <Text size="xs" c="dimmed">
            {panelOpacity}%
          </Text>
        </Group>
        <Slider
          min={0}
          max={100}
          step={5}
          value={panelOpacity}
          onChange={setPanelOpacity}
          disabled={!enabled}
          aria-label={t("Settings.Appearance.Background.PanelOpacity")}
        />
      </div>

      <Group gap="xs" wrap="nowrap" align="flex-end">
        <ColorInput
          style={{ flex: 1 }}
          label={t("Settings.Appearance.Background.Color")}
          value={color}
          onChange={setColor}
          format="hex"
          swatches={COLOR_SWATCHES}
          disabled={!enabled}
          aria-label={t("Settings.Appearance.Background.Color")}
        />
        <Tooltip label={t("Settings.Appearance.Background.ColorDefault")}>
          <ActionIcon
            variant="default"
            onClick={() => setColor("")}
            disabled={!enabled || !color}
            aria-label={t("Settings.Appearance.Background.ColorDefault")}
          >
            <IconX size="1.1rem" />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Stack>
  );
}
