import { ButtonItem, DropdownItem, Field, Navigation, PanelSection, PanelSectionRow, ToggleField } from "@decky/ui";
import { FC, ReactNode } from "react";
import { mb, mhz, pct, temp, tempColor, usageColor, watts } from "./format";
import { useStore } from "./hooks";
import { PROCESS_ROUTE } from "./ProcessPage";
import { Group, Position } from "./types";

const Val: FC<{ color?: string; children: ReactNode }> = ({ color, children }) => (
  <span style={{ color, fontVariantNumeric: "tabular-nums" }}>{children}</span>
);

// Every reading is a focusable Field so D-pad can scroll through (REQ-102).
const Row: FC<{ label: string; color?: string; children: ReactNode }> = ({ label, color, children }) => (
  <PanelSectionRow>
    <Field label={label} focusable>
      <Val color={color}>{children}</Val>
    </Field>
  </PanelSectionRow>
);

const INTERVALS = [500, 1000, 2000, 5000];
const POSITIONS: { data: Position; label: string }[] = [
  { data: "top-left", label: "Superior esquerdo" },
  { data: "top-right", label: "Superior direito" },
  { data: "bottom-left", label: "Inferior esquerdo" },
  { data: "bottom-right", label: "Inferior direito" },
];
const GROUPS: { key: Group; label: string }[] = [
  { key: "cpu", label: "CPU" },
  { key: "gpu", label: "GPU" },
  { key: "mem", label: "Memória" },
  { key: "battery", label: "Bateria / consumo" },
  { key: "fan", label: "Ventoinha" },
];

const OpenProcesses: FC = () => (
  <PanelSection title="Processos">
    <PanelSectionRow>
      <ButtonItem
        layout="below"
        onClick={() => { Navigation.CloseSideMenus(); Navigation.Navigate(PROCESS_ROUTE); }}
      >
        Consumo por processo
      </ButtonItem>
    </PanelSectionRow>
  </PanelSection>
);

export const Panel: FC = () => {
  const store = useStore();
  const { stats: s, settings: cfg, error } = store;

  if (error && !s) {
    return (
      <PanelSection title="Monitor do Sistema">
        <Row label="Status">Backend indisponível</Row>
      </PanelSection>
    );
  }
  if (!s) {
    return (
      <PanelSection title="Monitor do Sistema">
        <Row label="Status">Carregando…</Row>
      </PanelSection>
    );
  }

  return (
    <>
      <OpenProcesses />
      {cfg.show.cpu && s.cpu && (
        <PanelSection title="CPU">
          {s.cpu.usage !== undefined && <Row label="Uso" color={usageColor(s.cpu.usage)}>{pct(s.cpu.usage)}</Row>}
          {s.cpu.freq_mhz !== undefined && <Row label="Frequência">{mhz(s.cpu.freq_mhz)}</Row>}
          {s.cpu.temp_c !== undefined && <Row label="Temperatura" color={tempColor(s.cpu.temp_c)}>{temp(s.cpu.temp_c)}</Row>}
        </PanelSection>
      )}
      {cfg.show.gpu && s.gpu && (
        <PanelSection title="GPU">
          {s.gpu.usage !== undefined && <Row label="Uso" color={usageColor(s.gpu.usage)}>{pct(s.gpu.usage)}</Row>}
          {s.gpu.freq_mhz !== undefined && <Row label="Clock">{mhz(s.gpu.freq_mhz)}</Row>}
          {s.gpu.temp_c !== undefined && <Row label="Temperatura" color={tempColor(s.gpu.temp_c)}>{temp(s.gpu.temp_c)}</Row>}
          {s.gpu.power_w !== undefined && <Row label="Potência">{watts(s.gpu.power_w)}</Row>}
          {s.gpu.vram_total_mb !== undefined && (
            <Row label="VRAM">{mb(s.gpu.vram_used_mb)} / {mb(s.gpu.vram_total_mb)}</Row>
          )}
        </PanelSection>
      )}
      {cfg.show.mem && s.mem && (
        <PanelSection title="Memória">
          <Row label="RAM" color={usageColor(s.mem.percent)}>{mb(s.mem.used_mb)} / {mb(s.mem.total_mb)} ({pct(s.mem.percent)})</Row>
          {s.swap && <Row label="Swap">{mb(s.swap.used_mb)} / {mb(s.swap.total_mb)}</Row>}
        </PanelSection>
      )}
      {cfg.show.battery && s.battery && (
        <PanelSection title="Bateria">
          {s.battery.percent !== undefined && <Row label="Carga">{pct(s.battery.percent)}</Row>}
          {s.battery.status && <Row label="Estado">{s.battery.status}</Row>}
          {s.battery.power_w !== undefined && <Row label="Consumo">{watts(s.battery.power_w)}</Row>}
        </PanelSection>
      )}
      {cfg.show.fan && s.fan && (
        <PanelSection title="Ventoinha">
          <Row label="Rotação">{s.fan.rpm} RPM</Row>
        </PanelSection>
      )}

      <PanelSection title="Configurações">
        <PanelSectionRow>
          <DropdownItem
            label="Intervalo de atualização"
            rgOptions={INTERVALS.map((v) => ({ data: v, label: v < 1000 ? `${v} ms` : `${v / 1000} s` }))}
            selectedOption={cfg.interval_ms}
            onChange={(o) => store.update((c) => ({ ...c, interval_ms: o.data }))}
          />
        </PanelSectionRow>
        {GROUPS.map(({ key, label }) => (
          <PanelSectionRow key={key}>
            <ToggleField
              label={label}
              checked={cfg.show[key]}
              onChange={(v) => store.update((c) => ({ ...c, show: { ...c.show, [key]: v } }))}
            />
          </PanelSectionRow>
        ))}
        <PanelSectionRow>
          <ToggleField
            label="Overlay no jogo"
            checked={cfg.overlay.enabled}
            onChange={(v) => store.update((c) => ({ ...c, overlay: { ...c.overlay, enabled: v } }))}
          />
        </PanelSectionRow>
        {cfg.overlay.enabled && (
          <>
            <PanelSectionRow>
              <DropdownItem
                label="Posição do overlay"
                rgOptions={POSITIONS}
                selectedOption={cfg.overlay.position}
                onChange={(o) => store.update((c) => ({ ...c, overlay: { ...c.overlay, position: o.data } }))}
              />
            </PanelSectionRow>
            <PanelSectionRow>
              <ToggleField
                label="Overlay compacto"
                checked={cfg.overlay.compact}
                onChange={(v) => store.update((c) => ({ ...c, overlay: { ...c.overlay, compact: v } }))}
              />
            </PanelSectionRow>
          </>
        )}
      </PanelSection>
    </>
  );
};
