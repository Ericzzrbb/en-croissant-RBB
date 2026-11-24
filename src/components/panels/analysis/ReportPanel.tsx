import { Grid, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { IconZoomCheck } from "@tabler/icons-react";
import cx from "clsx";
import { useAtom, useAtomValue } from "jotai";
import React, { useCallback, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { commands } from "@/bindings";
import { BookPositionsProvider, useBookPositions } from "@/components/common/BookPositionsContext";
import EvalChart from "@/components/common/EvalChart";
import MoveBadge from "@/components/common/MoveBadge";
import ProgressButton from "@/components/common/ProgressButton";
import { TreeStateContext } from "@/components/common/TreeStateContext";
import { activeTabAtom, currentReportModalOpenAtom } from "@/state/atoms";
import { getGameStats, getMainLine } from "@/utils/chess";
import {
  CLASSIFICATION_INFO,
  MOVE_CLASSIFICATIONS,
  type MoveClassification,
} from "@/utils/classification";
import classes from "./AnalysisPanel.module.css";
import ReportModal from "./ReportModal";

function ReportPanel() {
  const { t } = useTranslation();

  const activeTab = useAtomValue(activeTabAtom);

  const store = useContext(TreeStateContext)!;
  const root = useStore(store, (s) => s.root);
  const [reportingMode, setReportingMode] = useAtom(currentReportModalOpenAtom);

  const inProgress = useStore(store, (s) => s.report.inProgress);
  const setInProgress = useStore(store, (s) => s.setReportInProgress);

  const stats = useMemo(() => getGameStats(root), [root]);

  const handleCancel = useCallback(() => {
    commands.cancelAnalysis(`report_${activeTab}`);
  }, [activeTab]);

  const openReportingMode = useCallback(() => {
    setReportingMode(true);
  }, [setReportingMode]);

  const closeReportingMode = useCallback(() => {
    setReportingMode(false);
  }, [setReportingMode]);

  return (
    <ScrollArea offsetScrollbars>
      <ReportModal
        tab={activeTab!}
        initialFen={root.fen}
        moves={getMainLine(root)}
        reportingMode={reportingMode}
        closeReportingMode={closeReportingMode}
        setInProgress={setInProgress}
      />
      <Stack mb="lg" gap="0.4rem" mr="xs">
        <ProgressButton
          id={`report_${activeTab}`}
          redoable
          disabled={root.children.length === 0}
          leftIcon={<IconZoomCheck size="0.875rem" />}
          onClick={openReportingMode}
          onCancel={handleCancel}
          initInstalled={false}
          labels={{
            action: t("Board.Analysis.GenerateReport"),
            completed: t("Board.Analysis.ReportGenerated"),
            inProgress: t("Board.Analysis.GeneratingReport"),
          }}
          inProgress={inProgress}
          setInProgress={setInProgress}
        />

        {stats.whiteAccuracy > 0 && stats.blackAccuracy > 0 && (
          <Group grow>
            <AccuracyCard
              color={t("Common.WHITE")}
              accuracy={stats.whiteAccuracy}
              cpl={stats.whiteCPL}
            />
            <AccuracyCard
              color={t("Common.BLACK")}
              accuracy={stats.blackAccuracy}
              cpl={stats.blackCPL}
            />
          </Group>
        )}

        <Paper withBorder p="md">
          <EvalChart isAnalysing={inProgress} startAnalysis={openReportingMode} />
        </Paper>

        <BookPositionsProvider>
          <GameStats />
        </BookPositionsProvider>
      </Stack>
    </ScrollArea>
  );
}

function GameStats() {
  const { t } = useTranslation();

  const store = useContext(TreeStateContext)!;
  const root = useStore(store, (s) => s.root);
  const bookFens = useBookPositions();
  const goToMove = useStore(store, (s) => s.goToMove);

  const stats = useMemo(() => getGameStats(root, bookFens), [root, bookFens]);

  // Written as literal keys so the i18n extractor picks them up.
  const labels: Record<MoveClassification, string> = {
    brilliant: t("Board.Analysis.Classification.Brilliant"),
    great: t("Board.Analysis.Classification.Great"),
    best: t("Board.Analysis.Classification.Best"),
    excellent: t("Board.Analysis.Classification.Excellent"),
    good: t("Board.Analysis.Classification.Good"),
    book: t("Board.Analysis.Classification.Book"),
    inaccuracy: t("Board.Analysis.Classification.Inaccuracy"),
    mistake: t("Board.Analysis.Classification.Mistake"),
    miss: t("Board.Analysis.Classification.Miss"),
    blunder: t("Board.Analysis.Classification.Blunder"),
  };

  return (
    <Paper withBorder>
      <Grid columns={12} align="center" p="md">
        {MOVE_CLASSIFICATIONS.map((classification) => {
          const { color } = CLASSIFICATION_INFO[classification];
          const stat = stats.classifications[classification];
          const w = stat.white;
          const b = stat.black;
          return (
            <React.Fragment key={classification}>
              <Grid.Col
                className={cx(w > 0 && classes.label)}
                span={3}
                style={{ textAlign: "center" }}
                c={w > 0 ? color : undefined}
                onClick={() => {
                  if (stat.whitePath) {
                    goToMove(stat.whitePath);
                  }
                }}
              >
                {w}
              </Grid.Col>
              <Grid.Col span={2} style={{ display: "flex", justifyContent: "center" }}>
                <MoveBadge classification={classification} />
              </Grid.Col>
              <Grid.Col span={4} c={w + b > 0 ? color : undefined}>
                {labels[classification]}
              </Grid.Col>
              <Grid.Col
                className={cx(b > 0 && classes.label)}
                span={3}
                style={{ textAlign: "center" }}
                c={b > 0 ? color : undefined}
                onClick={() => {
                  if (stat.blackPath) {
                    goToMove(stat.blackPath);
                  }
                }}
              >
                {b}
              </Grid.Col>
            </React.Fragment>
          );
        })}
      </Grid>
    </Paper>
  );
}

function AccuracyCard({ color, cpl, accuracy }: { color: string; cpl: number; accuracy: number }) {
  const { t } = useTranslation();

  return (
    <Paper withBorder p="xs">
      <Group justify="space-between">
        <Stack gap={0} align="start">
          <Text c="dimmed">{color}</Text>
          <Text fz="sm">{cpl.toFixed(1)} ACPL</Text>
        </Stack>
        <Stack gap={0} align="center">
          <Text fz="xl" lh="normal">
            {accuracy.toFixed(1)}%
          </Text>
          <Text fz="sm" c="dimmed" lh="normal">
            {t("Board.Analysis.Accuracy")}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}
export default ReportPanel;
