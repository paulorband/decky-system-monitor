# Constituição do projeto

Princípios inegociáveis. Toda spec e todo PR devem respeitá-los.

1. **Leve primeiro.** O plugin não pode ser notado no desempenho do jogo.
   - Zero polling quando nada está visível (painel fechado e overlay desligado).
   - Backend em Python puro (stdlib), lendo apenas `/proc` e `/sys`. Sem subprocessos no caminho quente.
   - Um único timer no frontend, compartilhado entre painel e overlay.
   - Orçamento: < 1% de uma CPU a 1 Hz; < 2 MB de bundle JS.
2. **100% controle.** Toda ação é alcançável apenas com D-pad + A/B. Nada depende de toque, mouse ou teclado.
   - Todo item de lista é focável (inclusive leituras), para rolagem com D-pad.
   - Nenhuma armadilha de foco; B sempre sai.
   - O overlay é estritamente não interativo e nunca captura foco.
3. **Portável entre distros.** SteamOS oficial, Bazzite, CachyOS Handheld, ChimeraOS, etc.
   - Descoberta de sensores por *capacidade* (nomes de hwmon, arquivos existentes), nunca por modelo de aparelho.
   - Métrica indisponível → omitida da UI, nunca erro nem "0".
   - Sem dependências nativas ou pip; sem root além do que o Decky já fornece.
4. **Degradação graciosa.** Qualquer falha de leitura de sensor é isolada e não derruba a coleta.
5. **Spec-driven.** Mudança de comportamento começa em `specs/`. Cada requisito tem ID (`REQ-xxx`) e critérios de aceite verificáveis; testes referenciam os IDs.
6. **Privacidade.** Nada sai do aparelho. Sem rede, sem telemetria.
