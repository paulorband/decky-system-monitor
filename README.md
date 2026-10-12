# Decky System Monitor

Monitor de recursos leve para o [Decky Loader](https://decky.xyz) no Game Mode (SteamOS, Bazzite, CachyOS Handheld, ChimeraOS…). 100 % navegável por controle.

- CPU (uso, frequência, temperatura), GPU AMD (uso, clock, temp, potência, VRAM), RAM/swap, bateria/consumo, ventoinha
- Painel no Quick Access
- **Auto update**: avisa na inicialização quando há versão nova e instala pelo painel (verifica SHA-256; só consulta o GitHub deste repositório; desligável nas configurações). Opcional: canal de **builds de teste** (desligado por padrão, com aviso de risco)
- Idiomas: English, Português (Brasil), Español — escolha nas Configurações do plugin ("Idioma / Language"); em Automático tenta seguir o Steam, padrão English
- **Consumo por processo**: tela dedicada (CPU e RAM), agrupada por jogo via `SteamAppId` (Proton/Wine incluídos), ordenável por CPU ou memória
- Sem polling quando nada está visível; Python puro, sem dependências

Desenvolvimento orientado por specs: veja [`specs/`](specs/). Comece por `000-constitution.md`.

```
pnpm i && pnpm build   # frontend
pnpm test              # backend (pytest)
```

## Instalação (teste)

1. Baixe `decky-system-monitor.zip` na página de [Releases](../../releases) (pré-release **test-build** = último commit).
2. Decky Loader → Configurações → Geral → ative o **Modo desenvolvedor**.
3. Seção **Desenvolvedor** → **Instalar plugin de um ZIP**.

Release versionada: `git tag v0.1.0 && git push origin v0.1.0`, ou Actions → *Build & release* → *Run workflow* informando `version` (ex.: `v0.1.0`).

## Compatibilidade

| Hardware / distro | Estado |
|---|---|
| ROG Xbox Ally (AMD) — Bazzite | Validado: painel, processos, idiomas e auto update |
| Steam Deck — SteamOS | Não testado (a detecção é por sensores, deve funcionar) |
| CachyOS Handheld | Não testado |
| GPU Intel / NVIDIA | Adiado: GPU exibida só para AMD (`amdgpu`); CPU, RAM, bateria e processos funcionam em qualquer hardware |

Relatos de teste em outros aparelhos são bem-vindos (abra uma issue com a distro e o que apareceu/faltou).
Overlay dentro do jogo (gamescope/MangoHud) está fora de escopo; veja `specs/003-overlay.md`.
