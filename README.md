# Decky System Monitor

Monitor de recursos leve para o [Decky Loader](https://decky.xyz) no Game Mode (SteamOS, Bazzite, CachyOS Handheld, ChimeraOS…). 100 % navegável por controle.

- CPU (uso, frequência, temperatura), GPU AMD (uso, clock, temp, potência, VRAM), RAM/swap, bateria/consumo, ventoinha
- Painel no Quick Access + overlay opcional no jogo
- **Consumo por processo**: tela dedicada (CPU e RAM), agrupada por jogo via `SteamAppId` (Proton/Wine incluídos), ordenável por CPU ou memória
- Sem polling quando nada está visível; Python puro, sem dependências

Desenvolvimento orientado por specs: veja [`specs/`](specs/). Comece por `000-constitution.md`.

```
pnpm i && pnpm build   # frontend
pnpm test              # backend (pytest)
```
