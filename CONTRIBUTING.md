# Contribuindo

## Branches

Todo trabalho novo parte da `main` atualizada, em um branch com um destes prefixos:

| Prefixo | Quando | Exemplo |
|---|---|---|
| `feature/<síntese>` | funcionalidade nova ou mudança de comportamento | `feature/gpu-intel` |
| `hotfix/<síntese>` | correção de defeito | `hotfix/processes-footer-overlap` |

`<síntese>` é um resumo curto do contexto, em minúsculas e com hífens. Nada de push direto na `main`: toda mudança entra por pull request.

## Fluxo (spec-driven)

1. Mudou comportamento? Comece em `specs/`: crie/ajuste a spec, com requisitos `REQ-xxx` e critérios de aceite (ver `specs/000-constitution.md`).
2. Implemente e escreva os testes referenciando os `REQ-xxx`.
3. Antes de abrir o PR, rode o que o CI roda:
   ```
   pnpm install --frozen-lockfile
   pnpm typecheck
   pnpm test        # pytest (backend) + node --test (idiomas)
   pnpm build
   ```
4. Abra o PR para a `main`. Preferimos **merge commit** (não squash/rebase): as tags de release apontam para commits dos branches e precisam continuar alcançáveis a partir da `main`.

## CI e builds de teste

- O workflow roda em pushes para `main`, `feature/**`, `hotfix/**` e `claude/**`: typecheck, testes, zip, e atualiza o pré-release **`test-build`**.
- O `test-build` é **um só para o repositório**: o push mais recente, de qualquer branch, substitui o anterior. Quem ligar o canal de teste no plugin recebe o último.

## Releases

Pelo GitHub: *Actions → Build & release → Run workflow*, informando `version` (ex.: `v0.3.0`). A versão precisa ser igual à do `package.json`, senão o workflow falha. Corte releases a partir da `main`.

- Tag sem `-` é release estável; com `-` (ex.: `v0.3.0-rc1`) é pré-release.
- O plugin só oferece releases estáveis (e o `test-build`, se o usuário optar).

## Estrutura do backend

Módulos Python do backend usam o prefixo `sm_` (ver `specs/005-plan.md`): o Decky mantém módulos como `settings` e `updater` em `sys.modules`, e um `import` genérico devolveria os dele.
