import test from "node:test";
import assert from "node:assert/strict";
import {
  DICTIONARIES, resolveLocale, mapLanguage, getLanguageInfo, getLanguageSources, setBackendLanguage, setLanguagePreference, t, tBatteryStatus, tProcesses, fmtNum,
} from "../src/i18n.ts";

test("REQ-502 steam language mapping", () => {
  assert.equal(resolveLocale("brazilian"), "pt-BR");
  assert.equal(resolveLocale("portuguese"), "pt-BR");
  assert.equal(resolveLocale("spanish"), "es");
  assert.equal(resolveLocale("latam"), "es");
  assert.equal(resolveLocale("english"), "en");
});

test("REQ-501 unsupported / missing -> English", () => {
  assert.equal(resolveLocale("german", "pt-BR"), "en"); // Steam is authoritative
  assert.equal(resolveLocale(undefined, "fr-FR"), "en");
  assert.equal(resolveLocale(undefined, undefined), "en");
  assert.equal(resolveLocale(null, ""), "en");
});

test("REQ-502 navigator fallback", () => {
  assert.equal(resolveLocale(undefined, "pt-PT"), "pt-BR");
  assert.equal(resolveLocale(undefined, "es-MX"), "es");
});

test("REQ-504 identical keys and no empty strings", () => {
  const base = Object.keys(DICTIONARIES.en).sort();
  for (const [loc, d] of Object.entries(DICTIONARIES)) {
    assert.deepEqual(Object.keys(d).sort(), base, loc);
    for (const [k, v] of Object.entries(d)) assert.ok(v.trim(), `${loc}.${k} empty`);
  }
});

test("translate, interpolate, plural, battery, numbers", () => {
  assert.equal(t("sort_by", undefined, "pt-BR"), "Ordenar por");
  assert.equal(t("app_fallback", { name: "x", id: 7 }, "es"), "x (App 7)");
  assert.equal(tProcesses(1, "en"), "1 process");
  assert.equal(tProcesses(2, "pt-BR"), "2 processos");
  assert.equal(tBatteryStatus("Not charging", "es"), "Sin cargar");
  assert.equal(tBatteryStatus("Weird", "es"), "Weird");
  assert.equal(fmtNum(1.5, 1, "en"), "1.5");
  assert.equal(fmtNum(1.5, 1, "pt-BR"), "1,5");
});


test("REQ-502 accepts both Steam names and BCP-47 codes", () => {
  for (const [tag, want] of [
    ["pt-BR", "pt-BR"], ["pt_BR", "pt-BR"], ["pt", "pt-BR"], ["PT-PT", "pt-BR"], ["brazilian", "pt-BR"],
    ["es", "es"], ["es-419", "es"], ["es-ES", "es"], ["latam", "es"], ["spanish", "es"],
    ["en", "en"], ["en-US", "en"], ["english", "en"],
    ["de", "en"], ["german", "en"], ["estonian", "en"], ["et", "en"], ["ptolemaic", "en"], ["", "en"],
  ]) assert.equal(mapLanguage(tag), want, tag);
});

test("REQ-509 auto order: Steam UI, then registry, then browser", () => {
  setLanguagePreference("auto");
  globalThis.LocalizationManager = { m_rgLocalesToUse: ["english"] };
  setBackendLanguage("brazilian");   // registry disagrees (the real Ally case)
  assert.deepEqual(getLanguageInfo(), { locale: "en", source: "steam-ui", raw: "english" });
  delete globalThis.LocalizationManager;
  assert.deepEqual(getLanguageInfo(), { locale: "pt-BR", source: "registry", raw: "brazilian" });
  setBackendLanguage(null);
  const src = getLanguageSources();
  assert.equal(src.steamUi, null); assert.equal(src.registry, null);
  assert.ok(["browser", "default"].includes(getLanguageInfo().source));
});

test("REQ-510 explicit choice beats every detection source", () => {
  globalThis.LocalizationManager = { m_rgLocalesToUse: ["english"] };
  setBackendLanguage("brazilian");
  for (const [pref, title] of [["en", "System Monitor"], ["pt-BR", "Monitor do Sistema"], ["es", "Monitor del sistema"]]) {
    setLanguagePreference(pref);
    assert.deepEqual(getLanguageInfo(), { locale: pref, source: "setting", raw: pref });
    assert.equal(t("title"), title);
  }
  setLanguagePreference("auto");
  assert.equal(getLanguageInfo().source, "steam-ui");
  setLanguagePreference("fr");        // invalid -> auto
  assert.equal(getLanguageInfo().source, "steam-ui");
  setLanguagePreference(undefined);
  delete globalThis.LocalizationManager; setBackendLanguage(null);
});

test("language can change at runtime (no sticky cache)", () => {
  setLanguagePreference("auto");
  setBackendLanguage("english");
  assert.equal(t("title"), "System Monitor");
  setBackendLanguage("brazilian");
  assert.equal(t("title"), "Monitor do Sistema");
  setBackendLanguage("spanish");
  assert.equal(t("title"), "Monitor del sistema");
  setBackendLanguage("english");
  assert.equal(t("title"), "System Monitor");
  setBackendLanguage(null);
});
