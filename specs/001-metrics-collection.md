# 001 — Coleta de métricas (backend)

Status: implementado em `py_modules/sysmon.py`, exposto por `main.py`.

## Contexto
O frontend precisa de um snapshot barato e uniforme, independente de hardware.

## Requisitos

- **REQ-001** `get_stats()` retorna um dict JSON-serializável; chaves ausentes significam "indisponível".
- **REQ-002 CPU**: `cpu.usage` (% total, delta de `/proc/stat` entre duas chamadas; primeira chamada retorna `null`/ausente), `cpu.freq_mhz` (média de `scaling_cur_freq`), `cpu.temp_c` (hwmon `k10temp`/`coretemp`/`zenpower`, fallback `thermal_zone` `x86_pkg_temp`).
- **REQ-003 Memória**: `mem.used_mb`, `mem.total_mb`, `mem.percent` com base em `MemTotal - MemAvailable`; `swap.used_mb/total_mb` quando houver swap.
- **REQ-004 GPU (AMD/amdgpu)**: `gpu.usage` (`gpu_busy_percent`), `gpu.freq_mhz` (linha `*` de `pp_dpm_sclk`), `gpu.temp_c` (hwmon `amdgpu` `temp1_input`), `gpu.power_w` (`power1_average` ou `power1_input`), `gpu.vram_used_mb/vram_total_mb`. Outras GPUs: omitidas.
- **REQ-005 Bateria**: `battery.percent`, `battery.status`, `battery.power_w` (`power_now`, ou `current_now*voltage_now`). Sem bateria → omitida.
- **REQ-006 Ventoinha**: `fan.rpm` da primeira `fan*_input` não-nula entre hwmons.
- **REQ-007** O coletor aceita um `root` de sistema de arquivos (padrão `/`) para teste com fixtures.
- **REQ-008** Cada grupo é coletado em `try/except` isolado (constituição §4).
- **REQ-009** Descoberta de caminhos (hwmon, card DRM, bateria) é cacheada, com re-descoberta se um arquivo cacheado falhar a leitura.
- **REQ-010** Uma chamada típica faz < 40 leituras de arquivo pequenas e nenhum subprocesso.

## Critérios de aceite
- Testes (`tests/test_sysmon.py`) cobrem cada REQ acima com fixtures de sysfs falsa, incluindo ausência total de GPU/bateria/ventoinha.
