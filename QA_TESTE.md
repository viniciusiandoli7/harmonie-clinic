# QA / Teste rápido

Depois de substituir os arquivos e subir no GitHub/Vercel, rode localmente:

```powershell
npx prisma db push
npx prisma generate
npm run qa
npm run dev
```

Validação feita nesta versão:

```txt
npm run qa
QA OK
```

Depois do deploy em produção, abra logado:

```txt
https://harmonie-clinic.vercel.app/api/system/repair
```

Depois abra também:

```txt
https://harmonie-clinic.vercel.app/api/finance/sale-sources
```

Esse endpoint precisa retornar uma lista com contratos/vendas lançadas, independentemente da data.

Teste manual obrigatório:

1. Cadastre/agende uma paciente em qualquer data.
2. Se for consulta, lance a venda/custo pelo Financeiro.
3. Se ela fechar tratamento pela ficha, feche a venda pela ficha.
4. Abra **Financeiro**.
5. A venda deve aparecer em **Movimentações** sem depender da data da meta ativa.
6. Clique em **Lançar venda/custos**.
7. No campo **Selecionar contrato lançado**, deve aparecer:
   - contrato gerado pela ficha;
   - ou venda lançada como fallback.
8. Selecione o contrato/venda.
9. O sistema deve preencher paciente, procedimento, valor, forma de pagamento e valor recebido.
10. O campo **Data do procedimento / agenda** agora é opcional e só filtra agendamentos daquela paciente.

Correções desta versão:

- Criada rota `/api/finance/sale-sources` para listar contratos e vendas sem filtro de data.
- Modal de fechamento financeiro agora busca contratos/vendas nessa rota única.
- Seleção do agendamento deixou de ser obrigatória; agendamento é apenas vínculo opcional.
- O modal não depende mais da data da agenda para encontrar o contrato/venda.
- Movimentações financeiras não começam mais escondidas pelo período da meta ativa.
- `/api/financial-transactions` agora roda reparo/backfill de vendas antes de listar.
- Schema do banco reforçado com `ALTER TABLE FinancialTransaction`, para bancos Neon/produção que já existiam com colunas antigas.
- Agenda continua com select real de pacientes, sem depender de digitar inicial.
