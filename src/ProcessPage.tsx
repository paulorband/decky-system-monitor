import { callable } from "@decky/api";
import { DropdownItem, Field, Focusable, PanelSection, PanelSectionRow } from "@decky/ui";
import { CSSProperties, FC, useEffect, useState } from "react";
import { mb } from "./format";
import { useSettings } from "./hooks";
import { ProcGroup, ProcSort } from "./types";

export const PROCESS_ROUTE = "/system-monitor/processes";

const getProcesses = callable<[ProcSort, number], { processes: ProcGroup[] }>("get_processes");

// One column per metric (REQ-412). Same grid for header and rows keeps them aligned.
const GRID: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 70px 90px 100px", columnGap: 12, width: "100%", alignItems: "center" };
const NUM: CSSProperties = { textAlign: "right", fontVariantNumeric: "tabular-nums" };

const SORTS = [
  { data: "cpu" as ProcSort, label: "Uso de CPU" },
  { data: "mem" as ProcSort, label: "Memória (RAM)" },
];

/** REQ-412: game name from Steam when we have an app id; falls back to comm. */
function displayName(g: ProcGroup): string {
  if (g.app_id) {
    try {
      const o = (window as any).appStore?.GetAppOverviewByAppID?.(g.app_id);
      if (o?.display_name) return o.display_name;
    } catch { /* fall through */ }
    return `${g.name} (App ${g.app_id})`;
  }
  return g.name;
}

export const ProcessPage: FC = () => {
  const cfg = useSettings();
  const [sort, setSort] = useState<ProcSort>("cpu");
  const [rows, setRows] = useState<ProcGroup[] | null>(null);
  const [failed, setFailed] = useState(false);
  const interval = Math.max(1000, cfg.interval_ms); // REQ-413

  // Own timer, alive only while this page is mounted (REQ-413).
  useEffect(() => {
    let alive = true;
    let busy = false;
    const tick = async () => {
      if (busy) return;
      busy = true;
      try {
        const r = await getProcesses(sort, 15);
        if (alive) { setRows(r.processes); setFailed(false); }
      } catch {
        if (alive) setFailed(true);
      } finally { busy = false; }
    };
    tick();
    const id = setInterval(tick, interval);
    return () => { alive = false; clearInterval(id); };
  }, [sort, interval]);

  return (
    // Top margin clears the Steam header; B navigates back by default.
    <div style={{ marginTop: 40, height: "calc(100% - 40px)", overflowY: "auto" }}>
      <PanelSection title="Consumo por processo">
        <PanelSectionRow>
          <DropdownItem
            label="Ordenar por"
            rgOptions={SORTS}
            selectedOption={sort}
            onChange={(o) => setSort(o.data)}
          />
        </PanelSectionRow>
        {failed && !rows && (
          <PanelSectionRow><Field label="Status" focusable>Backend indisponível</Field></PanelSectionRow>
        )}
        {!rows && !failed && (
          <PanelSectionRow><Field label="Status" focusable>Carregando…</Field></PanelSectionRow>
        )}
        {rows && (
          <PanelSectionRow>
            <div style={{ ...GRID, opacity: 0.7, fontSize: 12, fontWeight: 600, textTransform: "uppercase", padding: "4px 0" }}>
              <span>Aplicativo</span>
              <span style={NUM}>Proc.</span>
              <span style={NUM}>CPU{sort === "cpu" ? " ▼" : ""}</span>
              <span style={NUM}>RAM{sort === "mem" ? " ▼" : ""}</span>
            </div>
          </PanelSectionRow>
        )}
        {rows?.map((g) => (
          <PanelSectionRow key={g.key}>
            <Field focusable childrenContainerWidth="max" bottomSeparator="none">
              <div style={GRID}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName(g)}</span>
                <span style={NUM}>{g.count}</span>
                <span style={{ ...NUM, color: g.cpu !== null && g.cpu >= 25 ? "#ffb300" : undefined }}>
                  {g.cpu === null ? "—" : `${g.cpu.toFixed(1)}%`}
                </span>
                <span style={NUM}>{mb(g.rss_mb)}</span>
              </div>
            </Field>
          </PanelSectionRow>
        ))}
        <PanelSectionRow>
          <Focusable style={{ opacity: 0.7, fontSize: 12, padding: "8px 0" }}>
            CPU = % da capacidade total. RAM = RSS (páginas compartilhadas contam em cada processo).
          </Focusable>
        </PanelSectionRow>
      </PanelSection>
    </div>
  );
};
