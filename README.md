# Harmonie Clinic — Sistema de Gestão Clínica

Sistema privado de gestão clínica em Next.js, React, TypeScript, Prisma e PostgreSQL.

Esta versão foi otimizada para reduzir travamentos sem alterar o layout nem os fluxos principais do sistema.

## Principais otimizações desta versão

- Migrações/estrutura do banco removidas do caminho das requisições normais.
- O reparo de banco não roda mais automaticamente ao abrir o sistema.
- Prontuário passa a carregar módulos pesados sob demanda por aba.
- Agenda busca apenas o intervalo de datas exibido.
- Listas de pacientes usadas em seletores usam payload compacto.
- Dashboard evita baixar o histórico financeiro inteiro para fazer somas no navegador.
- Financeiro limita listagens extensas e usa agregações no banco quando adequado.
- Timeline da paciente possui limites por categoria e no resultado final.
- Fotos clínicas não usam mais fallback Base64 dentro do PostgreSQL.
- Índices compostos adicionados para consultas frequentes.
- Credenciais padrão removidas: usuário e senha administrativos devem existir no ambiente.
- Endpoint de reparo ficou apenas para recuperação administrativa manual via POST.

Veja `OTIMIZACOES.md` para o relatório técnico e instruções de implantação.

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

1. Copie `.env.example` para `.env` e preencha as credenciais reais.
2. Instale as dependências.
3. Gere o Prisma Client.
4. Aplique as migrations.
5. Rode as verificações e inicie o projeto.

```powershell
npm ci
npm run db:generate
npm run db:deploy
npm run check
npm run dev
```

Para desenvolvimento de migrations novas, use `npm run db:migrate` em um banco de desenvolvimento.

## Variáveis obrigatórias

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/harmonie?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-uma-chave-longa-e-aleatoria"
ADMIN_USER="defina-seu-usuario"
ADMIN_PASSWORD="defina-uma-senha-forte"
MONTHLY_REVENUE_GOAL="30000"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="domf1tnzd"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="harmonie_fotos"

# Recomendado em produção para upload assinado das fotos clínicas
CLOUDINARY_CLOUD_NAME="domf1tnzd"
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

Não existe mais login/senha padrão embutido no código. Se `ADMIN_USER` ou `ADMIN_PASSWORD` não estiverem configurados, o login administrativo é recusado.

## Produção

Antes de publicar uma nova versão, faça backup do PostgreSQL e aplique as migrations:

```powershell
npm ci
npm run db:generate
npm run db:deploy
npm run check
npm run build
npm start
```

Em CI/CD, execute `npm run db:deploy` como etapa de deploy antes de liberar a aplicação. Não use `prisma migrate dev` no banco de produção.

## Reparação administrativa

`/api/system/repair` não é mais executado automaticamente. Um `GET` apenas informa que o modo é manual. O reparo pesado existe apenas via `POST` autenticado para recuperação excepcional.

No funcionamento normal, a evolução do schema deve ocorrer exclusivamente pelas migrations de `prisma/migrations`.

## Scripts úteis

```powershell
npm run dev          # desenvolvimento
npm run build        # gera Prisma Client + build do Next.js
npm run start        # inicia build de produção
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run qa           # checagens próprias do projeto
npm run preflight    # checagem rápida de segurança/estrutura
npm run check        # preflight + qa + lint + typecheck
npm run db:generate  # gera Prisma Client
npm run db:migrate   # cria/aplica migrations no desenvolvimento
npm run db:deploy    # aplica migrations existentes em produção
npm run db:reset     # somente banco de desenvolvimento/teste
```
