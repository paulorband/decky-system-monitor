# 002 — Painel no Quick Access

## Requisitos
- **REQ-100** O plugin aparece no menu Quick Access (botão `...`) com um painel "Monitor do Sistema".
- **REQ-101** Seções: CPU, GPU, Memória, Bateria/Energia, Ventoinha. Só métricas disponíveis (REQ-001) e habilitadas nas configurações aparecem.
- **REQ-102** Cada linha é um `Field` focável: D-pad cima/baixo percorre todas as leituras; rolagem acompanha o foco.
- **REQ-103** Valores atualizam no intervalo configurado (REQ-201) só enquanto o painel está montado (polling pausado ao fechar).
- **REQ-104** Seção "Configurações" no fim do painel, tudo com widgets nativos Decky (toggle, dropdown) operáveis por controle.
- **REQ-105** Cores semânticas: temperatura ≥ 80 °C âmbar, ≥ 90 °C vermelho; uso ≥ 90 % âmbar. Cor nunca é o único indicador (o valor numérico sempre aparece).
- **REQ-106** Estado de erro/indisponibilidade do backend: mensagem textual focável, sem crash.

## Aceite
- Navegar do topo ao fim e voltar apenas com D-pad; B fecha o menu.
- Fechar o painel interrompe o timer (verificável por contador de assinantes — REQ-300).
