# Validação da versão otimizada

Validações executadas nesta revisão:

- `scripts/preflight.mjs`: OK.
- `scripts/qa-check.mjs`: OK.
- Resolução estrutural de imports/rotas coberta pelo QA do projeto: OK.
- Transpilação de sintaxe de todos os arquivos `.ts`/`.tsx` de `src`: OK.
- Verificação de DDL (`CREATE/ALTER/INDEX`) fora dos helpers de reparo: OK, nenhum encontrado.
- Verificação de chamada automática a `/api/system/repair`: OK, removida.
- Verificação de credenciais administrativas fallback: OK, removidas.
- Comparação das colunas que antes eram criadas por `ensure*Schema` contra migrations: OK após a migration `20260823200000_performance_indexes`.
- Varredura simples de segredos hardcoded: somente placeholders do `.env.example`.

## Limitação do ambiente desta revisão

O `npm ci` completo não pôde finalizar neste ambiente porque o acesso ao registry do npm retornou erro DNS `EAI_AGAIN`. Por isso, `next build`, ESLint e o typecheck completo dependente das dependências instaladas devem ser executados no ambiente de desenvolvimento/deploy com acesso ao registry.

Com acesso normal à internet, use:

```powershell
npm ci
npm run db:generate
npm run db:deploy
npm run check
npm run build
```
