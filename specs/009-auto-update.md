# 009 — Atualização automática

Verifica novas versões ao iniciar, avisa o usuário e permite instalar pela tela de estatísticas.

## Requisitos

### Verificação
- **REQ-600** Ao iniciar o plugin (e se `auto_check` ligado), o frontend pede ao backend para consultar `GET https://api.github.com/repos/paulorband/decky-system-monitor/releases/latest` (apenas releases estáveis; pré-releases e `test-build` são ignorados).
- **REQ-601** Versões seguem SemVer (`vX.Y.Z`). Há atualização se `latest > current`. Tags inválidas são ignoradas. Versão atual lida de `package.json` do plugin instalado.
- **REQ-602** Falha de rede/API é silenciosa na inicialização (sem toast, sem erro); fica registrada no estado e só é exibida se o usuário pedir "Verificar agora".
- **REQ-603** A consulta roda fora do loop principal (executor), com timeout ≤ 10 s e sem repetição automática. Resultado em cache por 6 h; "Verificar agora" ignora o cache.
- **REQ-604** `auto_check` (padrão: ligado) é configurável; desligado, nenhuma requisição ocorre sem ação do usuário.

### Notificação
- **REQ-610** Havendo atualização na verificação de inicialização, exibe um toast do Decky: título + "Versão X disponível". Uma vez por inicialização do plugin.

### Tela de estatísticas (painel)
- **REQ-620** Seção "Atualizações" mostra: versão atual; versão nova (quando houver); estado ("Atualizado" quando checado e sem novidade); botão **Instalar vX.Y.Z** (se houver) ou **Verificar agora** (se não).
- **REQ-621** A seção fica **sempre no fim** do painel (o aviso de versão nova chega pelo toast da inicialização).
- **REQ-622** Tudo focável e operável por controle (linhas `Field` focáveis, `ButtonItem`). Botões ficam desabilitados durante a operação; mensagem de resultado como linha focável.

### Instalação
- **REQ-630** A instalação só ocorre por clique no botão; o backend **rebusca** a release (não confia em dados do frontend) e exige `latest > current`.
- **REQ-631 Origem**: o asset deve se chamar `decky-system-monitor.zip` e a URL começar com `https://github.com/paulorband/decky-system-monitor/releases/download/`.
- **REQ-632 Integridade**: o `digest` `sha256:` do asset (API do GitHub) deve existir e conferir com o zip baixado; ausente ou divergente → recusa (falha fechada). Limite de 10 MB.
- **REQ-633 Zip seguro**: sem caminhos absolutos, `..` ou symlinks; todos os arquivos sob `decky-system-monitor/`; limite de tamanho descompactado.
- **REQ-634 Validação**: o pacote deve conter `plugin.json` com `name` = `System Monitor`, `main.py` e `dist/index.js`.
- **REQ-635 Aplicação com rollback**: os itens (`plugin.json`, `package.json`, `main.py`, `LICENSE`, `dist/`, `py_modules/`) são copiados sobre a pasta instalada; backup prévio, restaurado se qualquer passo falhar.
- **REQ-636** Após sucesso, o backend agenda a reinicialização do Decky (`systemctl restart plugin_loader`, destacada, com pequeno atraso) para carregar a nova versão; a UI informa antes.
- **REQ-636b** A reinicialização roda com ambiente limpo (sem `LD_LIBRARY_PATH` do Decky, que quebra `systemctl`), e o resultado é gravado em `restart.log` na pasta de logs do plugin. Se o Decky não reiniciar em ~20 s, a UI para de esperar e orienta a reiniciar manualmente (reiniciar o aparelho ou o `plugin_loader` no modo desktop).
- **REQ-637** Instalações concorrentes são recusadas.
- **REQ-638 Privilégio**: o backend de um plugin Decky roda como `deck`, que não escreve em `~/homebrew/plugins` (root) nem reinicia o `plugin_loader`. Por isso o `plugin.json` declara `"flags": ["root"]`. Se a pasta não for gravável, a instalação falha **antes de tocar em qualquer arquivo** com mensagem explícita.
- **REQ-639** Quem está numa versão sem a flag `root` (≤ v0.2.1) precisa instalar uma vez o ZIP manualmente; dali em diante o botão funciona.

### Publicação (CI)
- **REQ-640** O workflow de release falha se a tag não for igual a `v` + versão do `package.json` (evita oferecer a mesma versão para sempre).

### Canal de teste (opt-in)
- **REQ-650** Configuração `test_channel` (padrão: **desligada**). Ligada, o plugin também considera o pré-release rolante `test-build` (último commit da branch de desenvolvimento), além das releases estáveis.
- **REQ-651 Aviso de risco**: ligar o canal exige confirmação em modal (`ConfirmModal`, navegável por controle) explicando que builds de teste não foram publicadas, podem conter erros, podem deixar o plugin inoperante e não têm reversão automática. Cancelar mantém desligado. Desligar é imediato. Com o canal ligado, um aviso curto (bloco de texto em largura total, âmbar, focável) permanece nas configurações; o texto completo fica só no modal.
- **REQ-652 Identidade do build**: o CI grava `build.json` (`version`, `commit`) em todo zip. O plugin instalado conhece seu commit por esse arquivo; o commit do `test-build` vem do corpo da release (`commit: <sha>`, com `target_commitish` como alternativa).
- **REQ-653 Há build de teste novo** se o commit difere do instalado **e** a versão do build não é *menor* que a instalada (evita regressão para versão mais antiga). Sem `build.json` (instalação antiga), assume-se commit desconhecido → oferece.
- **REQ-654** Com o canal ligado vale o melhor dos dois: se houver build de teste novo, ele é oferecido; senão, uma release estável mais nova (REQ-601). Com o canal desligado o `test-build` é **ignorado**.
- **REQ-655** Mesma segurança da instalação estável (origem, SHA-256, zip seguro, validação, rollback, REQ-630…639). O backend lê `test_channel` das **suas** configurações, nunca de parâmetro do frontend.
- **REQ-657 Mesmo commit = oficial**: se o `test-build` foi feito do **mesmo commit** da release estável mais recente (`target_commitish` da release, só quando for um SHA completo), ele é tratado como a release estável: sem rótulo/aviso de teste, e é instalado o *asset* estável. Se o commit instalado já é esse, está atualizado. Sem prova de igualdade (ex.: `target_commitish` é um nome de branch), vale a regra do REQ-654.
- **REQ-656** UI: o build de teste é rotulado ("v0.2.5 · teste ab12cd3", em âmbar), o botão diz "Instalar build de teste", e o toast de inicialização também diz que é um build de teste. Mudar o canal força nova verificação.

## Limitações conhecidas
- A reinicialização do Decky recarrega a interface; o mecanismo (`plugin_loader.service`) é o do Decky em SteamOS/Bazzite/CachyOS, mas só foi planejado para validação em hardware (T9-bis).
- Repositório privado ou sem rede: não há atualização.
