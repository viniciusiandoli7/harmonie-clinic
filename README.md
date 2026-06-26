# Mariana Thomaz Carmona — Sistema de Gestão Clínica

Sistema privado de gestão para a clínica da Dra. Mariana Thomaz Carmona, com foco em pacientes, agenda, financeiro, prontuário, estoque, documentos, backup e indicadores de captação/conversão.

## Funcionalidades principais

- Login privado com NextAuth.
- Dashboard financeiro e operacional.
- Agenda de atendimentos e bloqueios.
- CRM de pacientes com origem, indicação, status e autorização de imagem.
- Prontuário, anamnese, evolução clínica e timeline da paciente.
- Financeiro com transações, status, anexos, taxas, valor líquido e parcelas.
- Fechamento mensal automático.
- Estoque com lote, validade, quantidade mínima e movimentações reais.
- Galeria clínica de fotos/antes e depois vinculada à paciente.
- Contratos e termos com assinatura.
- Alertas inteligentes para reativação, parcelas vencidas, estoque e aniversários.
- Backup local/exportação JSON.
- Auditoria de ações críticas.

## Tecnologias

- Next.js App Router
- React
- TypeScript
- TailwindCSS
- Prisma ORM
- PostgreSQL
- NextAuth
- Zod

## Configuração local

Crie um arquivo `.env` e também um `.env.local` na raiz do projeto com:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/harmonie?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="troque-por-uma-chave-grande-e-segura"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin123"
MONTHLY_REVENUE_GOAL="30000"
```

Depois rode:

```powershell
npm install
npx prisma generate
npx prisma migrate dev
npm run lint
npm run dev
```

Se o banco local estiver apenas em teste e o Prisma pedir reset:

```powershell
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
npm run dev
```

## Login padrão

```txt
Usuário: admin
Senha: admin123
```

## Observação

O sistema foi mantido com uma única conta operacional da Dra. Mariana, sem módulo de múltiplos usuários/permissões, conforme decisão de simplificação. A recepção pode acessar pela mesma conta quando necessário.


## Scripts úteis

```powershell
npm run dev          # inicia o sistema local
npm run lint         # valida boas práticas de código
npm run typecheck    # valida TypeScript após gerar Prisma Client
npm run db:generate  # gera Prisma Client
npm run db:migrate   # aplica migrations no banco local
npm run db:reset     # reseta banco local de teste
```

## Pente fino técnico

A versão atual inclui o arquivo `PENTE_FINO_APLICACAO.md` com os ajustes de arquitetura, segurança, assinatura pública, scripts e decisões de produto.
