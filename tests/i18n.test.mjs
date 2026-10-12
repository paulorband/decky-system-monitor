import test from "node:test";
import assert from "node:assert/strict";
import {
  DICTIONARIES, resolveLocale, t, tBatteryStatus, tProcesses, fmtNum,
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
