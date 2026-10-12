# 005 — Plano técnico

## Arquitetura
```
Frontend (React/TS, @decky/ui)            Backend (Python, Decky)
┌───────────────────────────┐             ┌───────────────────────┐
│ Panel  ─┐                 │  callable   │ main.py  (Plugin)     │
│         ├─ Poller ────────┼────────────▶│  get_stats()          │
│ (1 timer)                 │             │  get/set_settings()   │
└───────────────────────────┘             │ py_modules/sm_sysmon.py  │
                                          │ py_modules/sm_settings.py│
                                          └───────────────────────┘
```
## Decisões
- Python stdlib, leitura direta de `/proc` e `/sys` (sem psutil) → leve e portável.
- Detecção por capacidade, não por aparelho (constituição §3).
- Backend aplica `sanitize` nas configurações; frontend é só apresentação.
- Build com `@decky/rollup`; distribuição segue o template oficial do Decky.

## Nomes de módulos
Todos os módulos Python do backend usam o prefixo `sm_` (`sm_sysmon`, `sm_settings`, ...). O Decky mantém módulos planos (`settings`, `updater`, ...) em `sys.modules`; um `import updater` genérico devolveria o do Decky sem erro. (Bug real: v0.2.0 não carregava no Ally.)

## Estrutura
`plugin.json`, `package.json`, `main.py`, `py_modules/`, `src/`, `tests/`, `specs/`.

## Riscos
- Caminhos de sysfs variam por kernel/driver → fixtures e fallbacks.
- API interna do Steam UI muda → depender só de `@decky/ui` estável.
