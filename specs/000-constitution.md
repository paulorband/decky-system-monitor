# Constituição do projeto

Princípios inegociáveis. Toda spec e todo PR devem respeitá-los.

1. **Leve primeiro.** O plugin não pode ser notado no desempenho do jogo.
   - Zero polling quando nada está visível (painel e tela de processos fechados).
   - Backend em Python puro (stdlib), lendo apenas `/proc` e `/sys`. Sem subprocessos no caminho quente.
   - Um único timer no frontend, compartilhado entre os consumidores.
   - Orçamento: < 1% de uma CPU a 1 Hz; < 2 MB de bundle JS.
2. **100% controle.** Toda ação é alcançável apenas com D-pad + A/B. Nada depende de toque, mouse ou teclado.
   - Todo item de lista é focável (inclusive leituras), para rolagem com D-pad.
   - Nenhuma armadilha de foco; B sempre sai.
3. **Portável entre distros.** SteamOS oficial, Bazzite, CachyOS Handheld, ChimeraOS, etc.
   - Descoberta de sensores por *capacidade* (nomes de hwmon, arquivos existentes), nunca por modelo de aparelho.
   - Métrica indisponível → omitida da UI, nunca erro nem "0".
   - Sem dependências nativas ou pip.
   - **Root (decisão do autor, spec 009)**: o backend roda com a flag `root` do Decky *somente* para o auto update, que precisa escrever na pasta de plugins (do root) e reiniciar o `plugin_loader`. Em contrapartida o código root é mínimo: só baixa releases deste repositório, com SHA-256, extração restrita e instalação por clique.
4. **Degradação graciosa.** Qualquer falha de leitura de sensor é isolada e não derruba a coleta.
5. **Spec-driven.** Mudança de comportamento começa em `specs/`. Cada requisito tem ID (`REQ-xxx`) e critérios de aceite verificáveis; testes referenciam os IDs.
6. **Privacidade.** Nenhuma telemetria, nenhum identificador, nada do aparelho é enviado.
   - Única exceção de rede: consulta e download de **releases do próprio repositório** no GitHub (spec 009), desligável nas configurações.
   - Atualização só instala após ação explícita do usuário e com verificação de integridade (SHA-256).
