# 003 — Overlay no jogo (opcional)

## Requisitos
- **REQ-200** Overlay desligado por padrão; ligado por um toggle no painel.
- **REQ-201** Renderizado como componente global do Decky (`routerHook.addGlobalComponent`), `pointer-events: none`, sem foco.
- **REQ-202** Posição: 4 cantos (dropdown). Modo compacto (uma linha) ou detalhado.
- **REQ-203** Métricas do overlay: subconjunto escolhido (CPU %, GPU %, RAM %, temperaturas, potência, bateria).
- **REQ-204** Overlay ligado mantém exatamente 1 timer compartilhado com o painel (REQ-300); desligado → 0 timers se painel fechado.
- **REQ-205** Opacidade fixa e fundo translúcido para legibilidade sem cobrir o jogo.

## Fora de escopo
- Mostrar overlay dentro do jogo via MangoHud/gamescope (outro mecanismo).
