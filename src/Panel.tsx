import { ButtonItem, ConfirmModal, DropdownItem, Field, Focusable, Navigation, PanelSection, PanelSectionRow, ToggleField, showModal } from "@decky/ui";
import { FC, ReactNode } from "react";
import { mb, mhz, pct, temp, tempColor, usageColor, watts } from "./format";
import { useStore } from "./hooks";
import { useUpdates } from "./updates";
import { t, tBatteryStatus } from "./i18n";
import { PROCESS_ROUTE } from "./ProcessPage";
import { Group } from "./types";

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

/** Full-width, focusable text block for sentences (a label/value Field squeezes them into half the width). */
const Note: FC<{ color?: string; children: ReactNode }> = ({ color, children }) => (
  <PanelSectionRow>
    <Focusable style={{ color, fontSize: 13, lineHeight: 1.35, padding: "6px 0", width: "100%" }}>{children}</Focusable>
  </PanelSectionRow>
);

const INTERVALS = [500, 1000, 2000, 5000];
const groups = (): { key: Group; label: string }[] => [
  { key: "cpu", label: t("section_cpu") },
  { key: "gpu", label: t("section_gpu") },
  { key: "mem", label: t("section_memory") },
  { key: "battery", label: t("group_battery") },
  { key: "fan", label: t("section_fan") },
];

const UpdateSection: FC<{ u: ReturnType<typeof useUpdates> }> = ({ u }) => {
  const { state, busy, message, check, install } = u;
  const isTest = state?.latest_kind === "test";
  return (
    <PanelSection title={t("section_updates")}>
      <Row label={t("current_version")} color={state?.current_kind === "test" ? "#ffb300" : undefined}>
        {state
          ? `v${state.current}` +
            (state.current_kind === "test" && state.current_commit
              ? ` · ${t("test_label", { c: state.current_commit })}` // REQ-664
              : !state.current_kind && state.current_commit ? ` · ${state.current_commit}` : "")
          : "—"}
      </Row>
      {state?.available && (
        <Row label={t("latest_version")} color={isTest ? "#ffb300" : "#4caf50"}>
          v{state.latest}{isTest && state.commit ? ` · ${t("test_label", { c: state.commit })}` : ""}
        </Row>
      )}
      {state?.checked && !state.available && !state.error && <Row label={t("status")}>{t("up_to_date")}</Row>}
      {state && !state.checked && <Row label={t("status")}>{t("not_checked")}</Row>}
      {message && <Note>{message}</Note>}
      <PanelSectionRow>
        {state?.available ? (
          <ButtonItem layout="below" disabled={busy !== null} onClick={install}>
            {busy === "install" ? t("installing") : t(isTest ? "install_test" : "install_update", { v: `v${state.latest}` })}
          </ButtonItem>
        ) : (
          <ButtonItem layout="below" disabled={busy !== null} onClick={check}>
            {busy === "check" ? t("checking") : t("check_now")}
          </ButtonItem>
        )}
      </PanelSectionRow>
    </PanelSection>
  );
};

const OpenProcesses: FC = () => (
  <PanelSection title={t("section_processes")}>
    <PanelSectionRow>
      <ButtonItem
        layout="below"
        onClick={() => { Navigation.CloseSideMenus(); Navigation.Navigate(PROCESS_ROUTE); }}
      >
        {t("open_processes")}
      </ButtonItem>
    </PanelSectionRow>
  </PanelSection>
);

export const Panel: FC = () => {
  const store = useStore();
  const { stats: s, settings: cfg, error } = store;
  const updates = useUpdates();

  if (error && !s) {
    return (
      <PanelSection title={t("title")}>
        <Row label={t("status")}>{t("backend_unavailable")}</Row>
      </PanelSection>
    );
  }
  if (!s) {
    return (
      <PanelSection title={t("title")}>
        <Row label={t("status")}>{t("loading")}</Row>
      </PanelSection>
    );
  }

  return (
    <>
      <OpenProcesses />
      {cfg.show.cpu && s.cpu && (
        <PanelSection title={t("section_cpu")}>
          {s.cpu.usage !== undefined && <Row label={t("usage")} color={usageColor(s.cpu.usage)}>{pct(s.cpu.usage)}</Row>}
          {s.cpu.freq_mhz !== undefined && <Row label={t("frequency")}>{mhz(s.cpu.freq_mhz)}</Row>}
          {s.cpu.temp_c !== undefined && <Row label={t("temperature")} color={tempColor(s.cpu.temp_c)}>{temp(s.cpu.temp_c)}</Row>}
        </PanelSection>
      )}
      {cfg.show.gpu && s.gpu && (
        <PanelSection title={t("section_gpu")}>
          {s.gpu.usage !== undefined && <Row label={t("usage")} color={usageColor(s.gpu.usage)}>{pct(s.gpu.usage)}</Row>}
          {s.gpu.freq_mhz !== undefined && <Row label={t("clock")}>{mhz(s.gpu.freq_mhz)}</Row>}
          {s.gpu.temp_c !== undefined && <Row label={t("temperature")} color={tempColor(s.gpu.temp_c)}>{temp(s.gpu.temp_c)}</Row>}
          {s.gpu.power_w !== undefined && <Row label={t("power")}>{watts(s.gpu.power_w)}</Row>}
          {s.gpu.vram_total_mb !== undefined && (
            <Row label="VRAM">{mb(s.gpu.vram_used_mb)} / {mb(s.gpu.vram_total_mb)}</Row>
          )}
        </PanelSection>
      )}
      {cfg.show.mem && s.mem && (
        <PanelSection title={t("section_memory")}>
          <Row label="RAM" color={usageColor(s.mem.percent)}>{mb(s.mem.used_mb)} / {mb(s.mem.total_mb)} ({pct(s.mem.percent)})</Row>
          {s.swap && <Row label="Swap">{mb(s.swap.used_mb)} / {mb(s.swap.total_mb)}</Row>}
        </PanelSection>
      )}
      {cfg.show.battery && s.battery && (
        <PanelSection title={t("section_battery")}>
          {s.battery.percent !== undefined && <Row label={t("charge")}>{pct(s.battery.percent)}</Row>}
          {s.battery.status && <Row label={t("state")}>{tBatteryStatus(s.battery.status)}</Row>}
          {s.battery.power_w !== undefined && <Row label={t("consumption")}>{watts(s.battery.power_w)}</Row>}
        </PanelSection>
      )}
      {cfg.show.fan && s.fan && (
        <PanelSection title={t("section_fan")}>
          <Row label={t("rotation")}>{s.fan.rpm} RPM</Row>
        </PanelSection>
      )}

      <PanelSection title={t("section_settings")}>
        <PanelSectionRow>
          <DropdownItem
            label={t("update_interval")}
            rgOptions={INTERVALS.map((v) => ({ data: v, label: v < 1000 ? `${v} ms` : `${v / 1000} s` }))}
            selectedOption={cfg.interval_ms}
            onChange={(o) => store.update((c) => ({ ...c, interval_ms: o.data }))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={t("test_channel")}
            checked={cfg.test_channel}
            onChange={(v) => {
              if (!v) { store.update((c) => ({ ...c, test_channel: false })).then(() => updates.check()); return; }
              // REQ-651: turning it ON needs an explicit, controller-friendly confirmation.
              showModal(
                <ConfirmModal
                  strTitle={t("test_enable_title")}
                  strDescription={t("test_channel_warning")}
                  strOKButtonText={t("test_enable_ok")}
                  strCancelButtonText={t("test_enable_cancel")}
                  onOK={() => { store.update((c) => ({ ...c, test_channel: true })).then(() => updates.check()); }}
                />
              );
            }}
          />
        </PanelSectionRow>
        {cfg.test_channel && <Note color="#ffb300">{t("test_channel_hint")}</Note>}
        <PanelSectionRow>
          <ToggleField
            label={t("auto_check")}
            checked={cfg.auto_check}
            onChange={(v) => store.update((c) => ({ ...c, auto_check: v }))}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label="Idioma / Language" /* fixed and bilingual on purpose (REQ-511) */
            rgOptions={[
              { data: "auto", label: t("lang_auto") },
              { data: "en", label: "English" },
              { data: "pt-BR", label: "Português (Brasil)" },
              { data: "es", label: "Español" },
            ]}
            selectedOption={cfg.language}
            onChange={(o) => store.update((c) => ({ ...c, language: o.data }))}
          />
        </PanelSectionRow>
        {groups().map(({ key, label }) => (
          <PanelSectionRow key={key}>
            <ToggleField
              label={label}
              checked={cfg.show[key]}
              onChange={(v) => store.update((c) => ({ ...c, show: { ...c.show, [key]: v } }))}
            />
          </PanelSectionRow>
        ))}
      </PanelSection>
      <UpdateSection u={updates} />
    </>
  );
};
