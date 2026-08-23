# Relatório de otimização — Harmonie Clinic

## Objetivo

Preservar a interface e os fluxos existentes, reduzindo trabalho desnecessário no navegador, nas APIs e no PostgreSQL.

## 1. Banco: DDL fora do uso normal

Antes, diversas rotas chamavam rotinas `ensure*Schema` que executavam `CREATE TABLE`, `ALTER TABLE` e `CREATE INDEX IF NOT EXISTS` durante requisições comuns. O `AppShell` também disparava `/api/system/repair` ao abrir o sistema.

Agora:

- requisições normais não executam reparos de schema;
- o `AppShell` não chama reparo;
- mudanças permanentes ficam em `prisma/migrations`;
- `/api/system/repair` permanece como recurso manual e autenticado, com reparo apenas via POST.

## 2. Prontuário da paciente

O carregamento inicial foi reduzido. Dados secundários são buscados quando a aba correspondente é aberta, evitando múltiplas consultas concorrentes desnecessárias.

Também foram reduzidas consultas do endpoint de insights: contagens e último atendimento usam operações específicas do banco em vez de carregar o histórico completo.

## 3. Agenda

- Busca consultas apenas do dia/semana/mês visível.
- Recarrega somente a agenda depois de criar ou mover um atendimento.
- Pacientes usados em seletores são obtidos com payload compacto.
- API suporta `dateFrom`, `dateTo`, `limit` e `order`.
- Relação de paciente na agenda seleciona somente campos necessários.

## 4. Dashboard e relatórios

- Dashboard deixa de baixar todas as transações financeiras.
- Estatísticas financeiras usam agregação no PostgreSQL para saldo por tipo.
- Movimentações recentes têm limite.
- Agenda do dashboard é limitada ao período relevante.
- KPI mensal solicita somente o mês atual.
- Relatório financeiro solicita somente o mês escolhido.

## 5. Financeiro

- Listagem de transações passou a ter limite seguro por padrão.
- Backfill/reparo financeiro não roda ao abrir a tela.
- Rotina de reparo permanece disponível apenas no endpoint administrativo manual.

## 6. Fotos clínicas

O fallback que convertia imagens para Base64 e salvava os dados dentro do banco foi removido.

Agora:

- somente imagens válidas de até 10 MB são enviadas;
- o upload precisa retornar URL HTTPS;
- falha no Cloudinary gera erro de upload, em vez de aumentar o banco com Base64;
- APIs de evolução recusam URLs não HTTPS;
- imagens da galeria usam carregamento lazy no navegador.

## 7. Índices

A migration `20260823200000_performance_indexes` adiciona índices para caminhos frequentes, incluindo:

- paciente ativo + nome;
- status de CRM;
- sala + data da agenda;
- paciente + data da agenda;
- status + data da agenda;
- paciente + data de evolução;
- paciente + data de venda;
- status + tipo + data financeira;
- paciente + data financeira;
- status + vencimento de parcelas;
- paciente + data de foto.

A mesma migration também semeia mensagens-padrão de WhatsApp quando a tabela estiver vazia, substituindo inicialização durante o uso.

## 8. Segurança

Credenciais administrativas fallback foram removidas. `ADMIN_USER` e `ADMIN_PASSWORD` precisam ser definidos no ambiente.

O `.env.example` contém apenas placeholders/configurações públicas necessárias, sem senha real.

## 9. Implantação recomendada

Faça backup do banco antes da primeira publicação desta versão.

```powershell
npm ci
npm run db:generate
npm run db:deploy
npm run check
npm run build
npm start
```

Use `prisma migrate deploy` em produção. Não execute `prisma migrate dev` no banco produtivo.

## 10. Observação de compatibilidade

A otimização foi feita mantendo os componentes visuais e rotas funcionais existentes. As mudanças concentram-se em acesso a dados, limites, carregamento sob demanda, banco e segurança.
