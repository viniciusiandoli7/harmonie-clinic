# Refinamento Backend Premium v1

Esta versão mantém a lógica de uma única conta da Dra. Mariana, sem múltiplos usuários/permissões, e reforça o sistema onde mais importa para uso real da clínica.

## O que foi adicionado

### Financeiro mais completo
- Campos para valor bruto, taxa, valor líquido, percentual de taxa e comissão.
- Parcelas financeiras vinculadas à transação, venda e paciente.
- Status de parcela: `PENDING`, `PAID`, `CANCELED` ou `COMPLETED`.
- Baixa/reabertura/cancelamento de parcela via API.
- Estatísticas financeiras passam a considerar valor líquido quando existir.

Novas rotas:
- `GET /api/financial-installments`
- `POST /api/financial-installments`
- `PATCH /api/financial-installments/[id]`
- `DELETE /api/financial-installments/[id]`

### Fechamento mensal
- Prévia automática do mês.
- Fechamento/reabertura do mês com registro no histórico.
- Cálculo de receita bruta, despesas, taxas, comissões, lucro líquido, saldo disponível, ticket médio e procedimento mais vendido.

Nova rota:
- `GET /api/finance/monthly-closing?month=2026-06`
- `POST /api/finance/monthly-closing`

### Timeline real da paciente
Agrega em ordem cronológica:
- cadastro;
- agenda;
- vendas;
- financeiro;
- parcelas;
- prontuário/evoluções;
- contratos;
- fotos clínicas;
- movimentações de estoque.

Nova rota:
- `GET /api/patients/[id]/timeline`

### Fotos clínicas / antes e depois
- Registro por paciente.
- Tipo de foto: `BEFORE`, `AFTER`, `CLINICAL`, `MARKETING_AUTHORIZED`.
- Autorização de imagem separada.
- Procedimento, região, data e observações.

Novas rotas:
- `GET /api/patients/[id]/photos`
- `POST /api/patients/[id]/photos`
- `PATCH /api/patient-photos/[id]`
- `DELETE /api/patient-photos/[id]`

### Estoque com movimentação real
- Movimentações de entrada, saída, ajuste, perda, vencimento e uso em procedimento.
- Baixa automática da quantidade ao registrar saída/uso/perda/vencimento.
- Histórico por produto e por paciente.

Nova rota:
- `GET /api/inventory-movements`
- `POST /api/inventory-movements`

### Alertas inteligentes
Inclui:
- pacientes para reativação;
- parcelas vencidas;
- produtos abaixo do mínimo;
- produtos perto do vencimento;
- próximos agendamentos;
- aniversários.

Nova rota:
- `GET /api/alerts?inactiveDays=90`

### Auditoria
- Registro de criação, alteração e exclusão de pacientes, financeiro, parcelas, vendas, estoque e fotos.
- Guarda dados anteriores e novos quando aplicável.

Nova rota:
- `GET /api/audit-logs`

### Backup melhorado
- Backup manual agora salva dados reais, não apenas contagem.
- Exportação JSON completa para download.

Rotas:
- `POST /api/backups`
- `GET /api/backups/export`

## Migração adicionada

`prisma/migrations/20260626013000_backend_premium_refinement/migration.sql`

Depois de substituir o projeto, rode:

```powershell
npx prisma migrate dev
npx prisma generate
npm run dev
```

Se o banco local estiver apenas em teste e o Prisma pedir reset:

```powershell
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
npm run dev
```

## Observação

O módulo de Marketing foi mantido removido. No lugar, o backend agora trabalha melhor com CRM, origem da paciente, conversão, reativação, timeline e alertas, que fazem mais sentido para a rotina da clínica.
