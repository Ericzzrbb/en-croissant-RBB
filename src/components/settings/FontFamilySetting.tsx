import { ActionIcon, Autocomplete, Group, Stack, Text, Tooltip } from "@mantine/core";
import { IconReload } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { customFontFamilyAtom } from "@/state/atoms";
import { DEFAULT_FONT_FAMILY, sanitizeFontFamily } from "@/utils/background";

const FONT_FAMILIES = [
  "serif",
  "sans-serif",
  "system-ui",
  "monospace",
  "Georgia, serif",
  "Times New Roman, serif",
  "Arial, sans-serif",
  "Segoe UI, sans-serif",
  "Microsoft YaHei, sans-serif",
  "SimSun, serif",
  "Noto Sans SC, sans-serif",
  "Courier New, monospace",
];

export default function FontFamilySetting() {
  const { t } = useTranslation();
  const [fontFamily, setFontFamily] = useAtom(customFontFamilyAtom);
  const appliedFontFamily = sanitizeFontFamily(fontFamily);

  return (
    <Stack gap={6} w="15rem">
      <Group gap={4} wrap="nowrap">
        <Autocomplete
          style={{ flex: 1 }}
          data={FONT_FAMILIES}
          value={fontFamily}
          onChange={setFontFamily}
          placeholder={t("Settings.Appearance.FontFamily.System")}
          aria-label={t("Settings.Appearance.FontFamily")}
        />
        <Tooltip label={t("Settings.Appearance.FontFamily.Reset")}>
          <ActionIcon
            variant="default"
            onClick={() => setFontFamily(DEFAULT_FONT_FAMILY)}
            disabled={!fontFamily}
            aria-label={t("Settings.Appearance.FontFamily.Reset")}
          >
            <IconReload size="1.1rem" />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Text
        size="sm"
        truncate
        style={appliedFontFamily ? { fontFamily: appliedFontFamily } : undefined}
      >
        Aa Bb Cc 123 汉字
      </Text>
    </Stack>
  );
}
