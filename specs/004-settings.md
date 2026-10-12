# 004 — Configurações

## Requisitos
- **REQ-210** Intervalo de atualização: 500 ms, 1 s (padrão), 2 s, 5 s.
- **REQ-211** Toggles por grupo: CPU, GPU, Memória, Bateria, Ventoinha.
- ~~REQ-212~~ Removido junto com o overlay (spec 003).
- **REQ-213** Persistência em JSON em `DECKY_PLUGIN_SETTINGS_DIR/settings.json`, escrita atômica (tmp + rename); arquivo corrompido → padrões.
- **REQ-214** Valores desconhecidos/inválidos são sanitizados no backend.

## Polling compartilhado
- **REQ-300** `Poller` único: `subscribe(cb)` incrementa assinantes e inicia o timer no primeiro; `unsubscribe` para no último. Chamadas em voo não se acumulam (se a anterior não terminou, o tick é pulado).
