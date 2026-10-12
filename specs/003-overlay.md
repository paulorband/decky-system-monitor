# 003 — Overlay no jogo (REMOVIDO)

Status: **removido** (v0.1.1). Mantido como registro da decisão.

## O que aconteceu
O overlay era um componente global da interface do Steam (`routerHook.addGlobalComponent`).
No Game Mode o jogo é desenhado pelo gamescope; a interface do Steam só aparece por cima quando
o menu do Steam/Quick Access está aberto. Resultado (confirmado no ROG Xbox Ally): o overlay
**nunca aparece sobre o jogo**, só na interface do Steam. O nome "overlay no jogo" era enganoso.

## Decisão
Removido, em vez de manter um recurso que não entrega o que promete.
Um overlay real dentro do jogo exigiria controlar o MangoApp/MangoHud (fora de escopo, decisão do autor).
Se for retomado, deve nascer como uma spec nova, validada em hardware desde o início.
