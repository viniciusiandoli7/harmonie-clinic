# Evolução Completa — Gestão Clínica Premium

Esta versão mantém a conta única da Dra. Mariana e amplia o sistema para uma gestão clínica mais completa, sem criar permissões ou múltiplos usuários.

## O que foi adicionado

### 1. Catálogo de procedimentos
- Cadastro de preço padrão.
- Custo médio por item.
- Margem e lucro estimado.
- Tempo médio do procedimento.
- Retorno padrão em dias.
- Marcação de termo obrigatório, fotos e lote.
- Orientações pós-procedimento.
- Mensagem padrão de WhatsApp por procedimento.

Rota visual: `/procedures`

### 2. Plano de tratamento por paciente
- Plano individual por paciente.
- Etapas com prioridade, data prevista, valor estimado e status.
- Status: sugerido, aceito, recusado, adiado e realizado.
- Total estimado do plano.

Dentro da paciente: aba **Plano de Tratamento**.

### 3. Segurança clínica e anamnese inteligente
- Campos adicionais de risco: anticoagulante, doença autoimune, diabetes, epilepsia, infecção ativa, odontologia recente e histórico de intercorrência.
- Alertas automáticos gerados pela anamnese.
- Níveis: crítico, atenção e informação.

Dentro da paciente: aba **Segurança**.

### 4. Evolução clínica estruturada
- Queixa principal.
- Avaliação clínica.
- Procedimento realizado.
- Produto, lote, validade, região, quantidade.
- Intercorrências.
- Orientações dadas.
- Retorno recomendado.
- Termo assinado e fotos feitas.
- Criação automática de tarefa de retorno quando configurado.

Dentro da paciente: aba **Prontuário & Evolução**.

### 5. Pós-procedimento e WhatsApp
- Tarefas de acompanhamento por paciente.
- Mensagens prontas por categoria.
- Envio por WhatsApp com texto pré-preenchido.
- Variáveis: `[nome]`, `[primeiroNome]`, `[procedimento]`, `[data]`, `[valor]`, `[retorno]`.

Rotas visuais:
- `/whatsapp`
- Aba **Pós & WhatsApp** dentro da paciente.

### 6. Conversão de avaliação
- Registro de valor proposto, valor fechado, status e motivo de perda.
- Atualização automática do cadastro da paciente.
- Preparado para análise de conversão no relatório mensal.

API: `/api/evaluation-conversions`

### 7. Metas
- Meta de faturamento.
- Meta de pacientes.
- Meta de avaliações.
- Meta de conversão.
- Ticket médio alvo.

API: `/api/goals`
Dashboard executivo exibe metas principais.

### 8. Relatório mensal
- Faturamento.
- Lucro líquido.
- Ticket médio.
- Meta atingida.
- Novas pacientes.
- Comparecimento, faltas e conversão.
- Procedimentos mais vendidos.
- Origem das pacientes.
- Alertas de estoque.
- Exportação visual em PDF pelo navegador.

Rota visual: `/reports/monthly`

### 9. Backup real em JSON
- Histórico de backups.
- Exportação de dados em JSON.
- Inclui pacientes, agenda, financeiro, estoque, procedimentos, planos, evoluções, tarefas, metas e auditoria.

API:
- `GET /api/backups`
- `POST /api/backups`
- `GET /api/backups?export=json`

## Banco de dados

Foi adicionada a migration:

```txt
prisma/migrations/20260626023000_clinic_management_complete/migration.sql
```

Depois de baixar esta versão, rode:

```powershell
npx prisma migrate dev
npx prisma generate
npm run dev
```

Se o banco local ainda for apenas de teste e o Prisma pedir reset:

```powershell
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
npm run dev
```

## Observação técnica

O ambiente de geração não conseguiu validar o Prisma com `prisma validate` porque o Prisma tentou baixar binários externos em `binaries.prisma.sh`. A sintaxe TypeScript/TSX dos arquivos foi verificada localmente por transpilação com TypeScript, e o schema foi revisado para remover duplicidades de campos.
