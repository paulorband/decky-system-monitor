# 007 — Consumo por processo

Motivador principal do plugin: ver **quem** está consumindo CPU e RAM.

## Requisitos

### Coleta (`py_modules/procmon.py`)
- **REQ-400** `get_processes(sort, limit)` retorna os `limit` maiores consumidores, ordenados por `sort` (`cpu` | `mem`). `limit` ∈ [1, 50] (padrão 15); valores inválidos são saneados.
- **REQ-401** Fonte: apenas `/proc/<pid>/stat` (+ `environ` uma vez por processo). Sem subprocessos, sem dependências.
- **REQ-402 CPU**: `cpu` = % da capacidade **total** da máquina (0–100, consistente com o uso total de CPU), calculado por delta de ticks (utime+stime) sobre o delta de ticks totais de `/proc/stat`. Na primeira amostra (ou após > 10 s sem chamadas) `cpu` é `null`.
- **REQ-403 Memória**: `rss_mb` = RSS do processo. Limitação conhecida: páginas compartilhadas contam em cada processo; no grupo, somam-se (superestima levemente). Documentado na UI.
- **REQ-404 Agrupamento**: processos com o mesmo `SteamAppId` (lido de `environ`) formam um grupo `app:<id>` (cobre Proton/Wine/pressure-vessel/reaper do jogo). Os demais agrupam por nome (`comm`). Cada grupo traz `name`, `app_id?`, `count`, `cpu`, `rss_mb`.
- **REQ-405** Threads de kernel (`PF_KTHREAD`) são ignoradas.
- **REQ-406** Leitura de `environ` é cacheada por (pid, starttime); entradas de processos extintos são limpas a cada amostra.
- **REQ-407** Falha em um pid (sumiu, sem permissão) é ignorada e não afeta os demais.
- **REQ-408** `root` configurável para testes (como REQ-007).

### Tela (`src/ProcessPage.tsx`)
- **REQ-410** Rota própria (`/system-monitor/processes`), aberta por botão "Consumo por processo" no painel; o Quick Access fecha ao abrir.
- **REQ-411** Controle: topo com dropdown "Ordenar por" (CPU / Memória); abaixo, uma linha focável por grupo. D-pad navega tudo; **B volta** ao jogo/menu. Sem toque necessário.
- **REQ-412** Tabela com **uma coluna por métrica**: Aplicativo | Proc. | CPU | RAM, com cabeçalho alinhado às linhas e ▼ na coluna usada para ordenar. Nome = nome do jogo via `appStore` do Steam quando há `app_id`, senão o `comm`. Cada linha é um único item focável (D-pad desce linha a linha). Números alinhados à direita; CPU ≥ 25 % em âmbar (o número sempre aparece).
- **REQ-413** Polling próprio (`get_processes`) **somente enquanto a tela está montada**, no intervalo configurado (mínimo 1 s); ticks não se acumulam.
- **REQ-414** Rodapé informativo: "RAM = RSS (páginas compartilhadas contam em cada processo)".
- **REQ-415** Somente leitura: **não** há ação de encerrar processo.

## Aceite
- `tests/test_procmon.py` cobre REQ-400…408 com `/proc` falso.
- Tela: navegação completa só com D-pad; sair com B; fechar a tela para o timer.
