# 005 — Plano técnico

## Arquitetura
```
Frontend (React/TS, @decky/ui)            Backend (Python, Decky)
┌───────────────────────────┐             ┌───────────────────────┐
│ Panel  ─┐                 │  callable   │ main.py  (Plugin)     │
│         ├─ Poller ────────┼────────────▶│  get_stats()          │
│ (1 timer)                 │             │  get/set_settings()   │
└───────────────────────────┘             │ py_modules/sysmon.py  │
                                          │ py_modules/settings.py│
                                          └───────────────────────┘
```
## Decisões
- Python stdlib, leitura direta de `/proc` e `/sys` (sem psutil) → leve e portável.
- Detecção por capacidade, não por aparelho (constituição §3).
- Backend aplica `sanitize` nas configurações; frontend é só apresentação.
- Build com `@decky/rollup`; distribuição segue o template oficial do Decky.

## Estrutura
`plugin.json`, `package.json`, `main.py`, `py_modules/`, `src/`, `tests/`, `specs/`.

## Riscos
- Caminhos de sysfs variam por kernel/driver → fixtures e fallbacks.
- API interna do Steam UI muda → depender só de `@decky/ui` estável.
