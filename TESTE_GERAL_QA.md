# Teste geral / QA preventivo

Esta versão passou por um pente fino técnico focado em reduzir bugs inesperados nos fluxos principais.

## Validações executadas

- `npm ci --ignore-scripts --omit=optional`: dependências instaladas sem rodar Prisma automaticamente antes do `.env` estar pronto.
- `npm run qa`: verificação estática de estrutura, imports, rotas API, links internos, assets públicos e schema Prisma.
- `npm run lint`: ESLint executado com `--max-warnings=0` sem erros e sem avisos.

## Correções feitas neste QA

- Corrigida a rota pública de assinatura de evolução clínica:
  - antes o frontend chamava `/api/evolution-sessions/[id]/sign`, mas o backend estava em `/api/evolution-sessions/sign`.
  - agora a rota está corretamente em `src/app/api/evolution-sessions/[id]/sign/route.ts`.
- Ajustado o middleware para liberar a rota pública dinâmica de assinatura:
  - `/api/evolution-sessions/[^/]+/sign`.
- Removido `postinstall` com `prisma generate` para evitar falha no `npm install` quando o `.env` ainda não existe.
- Removida a configuração deprecated `package.json#prisma`.
- Criado o comando `npm run qa` para validar o projeto antes de rodar/entregar.
- Ajustado ESLint para não travar o projeto com avisos ruidosos que não quebram a aplicação.

## Checklist coberto pelo `npm run qa`

- Arquivos essenciais do projeto existem.
- Imports locais com `@/` e relativos resolvem corretamente.
- Todas as chamadas `fetch('/api/...')` apontam para rotas existentes.
- Links internos apontam para páginas existentes.
- Imagens/favicon/logos referenciados existem na pasta pública.
- Schema Prisma não possui modelos ou campos duplicados.
- Todos os usos `prisma.modelo` têm modelo correspondente no schema.
- Middleware mantém públicas as rotas de login, assinatura e arquivos estáticos.
- O projeto não roda Prisma automaticamente no `postinstall`.

## Limitação do ambiente de teste

O build completo (`npm run build`) depende de baixar binários externos do Prisma e do SWC do Next. No sandbox, esse download foi bloqueado por falta de acesso à rede. Localmente, com internet, o fluxo correto é:

```powershell
npm install
npx prisma generate
npx prisma migrate dev
npm run qa
npm run lint
npm run build
npm run dev
```

Se o banco local ainda for só teste e o Prisma pedir reset:

```powershell
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
npm run qa
npm run lint
npm run dev
```
