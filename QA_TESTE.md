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

Depois abra estes endpoints para conferir se a base está retornando dados:

```txt
https://harmonie-clinic.vercel.app/api/goals
https://harmonie-clinic.vercel.app/api/finance/sale-sources
https://harmonie-clinic.vercel.app/api/financial-transactions
```

Teste manual obrigatório:

1. Abrir **Financeiro** e **Dashboard Executivo**.
2. Conferir se a **Meta ativa** mostra o mesmo período nos dois lugares.
3. Confirmar que não aparece mais `30/06` quando a meta é de julho. A data deve respeitar o dia escolhido no cadastro da meta.
4. Abrir **Agenda**.
5. No campo **Paciente**, clicar ou digitar. A lista precisa aparecer sem depender de escrever só a inicial.
6. Selecionar uma paciente e criar um agendamento.
7. Abrir a ficha da paciente e fechar uma venda.
8. Abrir **Financeiro**.
9. A venda deve aparecer em **Movimentações** mesmo se o agendamento for de outra data.
10. Clicar em **Lançar venda/custos**.
11. O campo **Selecionar contrato lançado** precisa listar contratos e vendas lançadas, sem depender da data da agenda.
12. Selecionar contrato/venda e conferir se preenche paciente, procedimento, valor, forma de pagamento e valor recebido.

Correções desta versão:

- Corrigido bug visual de data da meta ativa no financeiro por causa de fuso horário.
- Financeiro e Executivo agora usam a mesma meta ativa.
- Financeiro calcula porcentagem da meta com base nas movimentações do período ativo, não só no resumo mensal.
- Financeiro busca dados com `cache: no-store` para não ficar preso em resultado antigo.
- Modal **Lançar venda/custos** recarrega contratos/vendas toda vez que abre.
- Criada rota robusta `/api/finance/sale-sources` com contratos e vendas sem filtro de data.
- A seleção de agendamento no modal financeiro é apenas opcional e não limita contratos/vendas.
- Agenda ganhou busca real de pacientes com dropdown, sem depender do select antigo.
- `/api/financial-transactions` roda reparo financeiro antes de listar.
- Schema financeiro reforçado para bancos Neon/produção antigos.
