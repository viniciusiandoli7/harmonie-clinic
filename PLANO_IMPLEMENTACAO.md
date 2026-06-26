# Plano de implementação — Mariana Thomaz Carmona

## Estrutura analisada
- `src/app`: rotas App Router, páginas, APIs e autenticação.
- `src/components`: componentes reutilizáveis de layout, dashboard, calendário, financeiro, pacientes e UI.
- `src/services`: camada de serviços para financeiro, pacientes e agenda.
- `src/lib`: configuração Prisma, autenticação e utilitários.
- `prisma/schema.prisma`: modelos principais do banco.
- `public`: imagens públicas, ícones e assets.

## Componentes reutilizáveis identificados
- Layout: `Sidebar`.
- Financeiro: `CreateSaleModal`, `TransactionModal`, `FinanceChart`, `CloseSaleAutomationCard`.
- Dashboard: `DashboardHeader`, `KpiCards`, `DashboardFinancialCards`, `DashboardCharts`, `MonthlyKpis`.
- Pacientes: `PatientForm`, `PatientCard`, `ClinicalEvolutionSection`, `ClinicalInsights`, `AnamneseForm`.
- Calendário: modais rápidos, modais de edição, calendário semanal.
- UI: `PageHeader`, `SignaturePad`.

## Arquivos modificados
- `package.json`
- `package-lock.json`
- `README.md`
- `tailwind.config.ts`
- `prisma/schema.prisma`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/login/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/finance/page.tsx`
- `src/app/patients/page.tsx`
- `src/app/patients/[id]/page.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/finance/stats/route.ts`
- `src/app/api/financial-transactions/route.ts`
- `src/app/api/financial-transactions/[id]/route.ts`
- `src/app/api/patients/route.ts`
- `src/app/api/patients/[id]/route.ts`
- `src/components/layout/Sidebar.tsx`
- `src/components/patients/PatientForm.tsx`
- `src/services/financialService.ts`

## Arquivos criados
- `src/lib/brand.ts`
- `src/app/inventory/page.tsx`
- `src/app/executive/page.tsx`
- `src/app/api/inventory-items/route.ts`
- `src/app/api/inventory-items/[id]/route.ts`
- `src/app/api/backups/route.ts`
- `public/mariana-carmona-logo.png`
- `public/mariana-carmona-logo-offwhite.png`
- `public/favicon.ico`
- `public/favicon-16.png`
- `public/favicon-32.png`
- `public/favicon-48.png`
- `public/favicon-64.png`
- `public/favicon-180.png`
- `public/favicon-512.png`

## Entrega executada
- Rebranding visual para Mariana Thomaz Carmona com tokens de cor e assets da nova identidade.
- Login redesenhado com logo, fundo off-white, mostrar senha, lembrar usuário e microinterações.
- Sidebar premium com logo nova, menus expandidos, recolhimento e navegação mobile.
- Dashboard com resumo financeiro, pacientes novos/retornando, origem dos pacientes, aniversários e alerta de inatividade.
- Financeiro com filtros funcionais, status pendente/pago/cancelado, baixa/reabertura/cancelamento, anexos e exportação CSV/Excel/PDF.
- CRM com origem, indicação, status e autorização de imagem.
- Prontuário com timeline do paciente e aba de galeria antes/depois.
- Novo módulo de estoque com fornecedor, lote, validade, quantidade mínima, valor e alertas.
- Novo dashboard executivo com indicadores e backup local manual com histórico.
- Estrutura inicial de logs/backups no schema para evolução futura.

## Observações técnicas
- O projeto preserva Next.js, React, TypeScript, TailwindCSS, Prisma e a estrutura geral de pastas.
- Componentes existentes foram reutilizados e evoluídos onde possível.
- O comando `npx tsc --noEmit` só não pôde validar totalmente porque o ambiente não conseguiu gerar o Prisma Client sem acesso aos binários externos da Prisma. Os erros restantes são exclusivamente de `@prisma/client` não gerado no sandbox.

## Refinamento backend premium v1

### Arquivos criados/adicionados nesta etapa
- `BACKEND_REFINAMENTO.md`
- `src/lib/audit.ts`
- `src/lib/money.ts`
- `src/lib/finance-utils.ts`
- `src/app/api/financial-installments/route.ts`
- `src/app/api/financial-installments/[id]/route.ts`
- `src/app/api/finance/monthly-closing/route.ts`
- `src/app/api/patients/[id]/timeline/route.ts`
- `src/app/api/patients/[id]/photos/route.ts`
- `src/app/api/patient-photos/[id]/route.ts`
- `src/app/api/inventory-movements/route.ts`
- `src/app/api/alerts/route.ts`
- `src/app/api/audit-logs/route.ts`
- `src/app/api/backups/export/route.ts`
- `prisma/migrations/20260626013000_backend_premium_refinement/migration.sql`

### Arquivos reforçados nesta etapa
- `prisma/schema.prisma`
- `src/services/financialService.ts`
- `src/app/api/finance/stats/route.ts`
- `src/app/api/financial-transactions/route.ts`
- `src/app/api/financial-transactions/[id]/route.ts`
- `src/app/api/inventory-items/route.ts`
- `src/app/api/inventory-items/[id]/route.ts`
- `src/app/api/patients/route.ts`
- `src/app/api/patients/[id]/route.ts`
- `src/app/api/sales/route.ts`
- `src/app/api/sales/[id]/route.ts`
- `src/app/api/sales/close/route.ts`
- `src/app/api/backups/route.ts`
- `src/app/api/dashboard/route.ts`
- `src/app/api/dashboard/summary/route.ts`
- `README.md`

### Resultado técnico
- Financeiro preparado para parcelamento, taxa, comissão, valor bruto e valor líquido.
- Fechamento mensal com cálculo automático.
- Estoque com movimentações reais.
- Timeline clínica agregada por paciente.
- Galeria clínica/antes e depois com autorização de imagem.
- Alertas inteligentes para rotina da recepção.
- Auditoria de ações críticas.
- Backup exportável com dados reais.
- Módulo de marketing continua removido; a lógica passa a ser CRM, captação, conversão e reativação.
