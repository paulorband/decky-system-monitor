# Decky System Monitor

Monitor de recursos leve para o [Decky Loader](https://decky.xyz) no Game Mode (SteamOS, Bazzite, CachyOS Handheld, ChimeraOS…). 100 % navegável por controle.

- CPU (uso, frequência, temperatura), GPU AMD (uso, clock, temp, potência, VRAM), RAM/swap, bateria/consumo, ventoinha
- Painel no Quick Access + overlay opcional no jogo
- Idiomas: English, Português (Brasil), Español — segue o idioma do Steam; padrão English
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

Release versionada: `git tag v0.1.0-rc1 && git push origin v0.1.0-rc1`.
