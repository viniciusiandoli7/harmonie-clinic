# QA / Teste rápido

Correção desta versão:

- Adicionados os novos procedimentos:
  - Preenchedor lips
  - Preenchedor lift
  - Preenchedor ultra volume
  - Preenchedor lift plus

Onde foi adicionado:

- Estoque
- Agenda
- Edição de agendamento
- Criação rápida de agendamento
- Caixa / Ponto de Venda
- Contrato: os novos preenchedores puxam o termo de Preenchimento automaticamente.

Rode:

```powershell
npx prisma db push
npx prisma generate
npm run qa
npm run build
npm run dev
```

Validação feita nesta versão:

```txt
npm run qa
QA OK
```

Teste obrigatório:

1. Abrir Estoque.
2. Conferir se aparecem:
   - Preenchedor lips
   - Preenchedor lift
   - Preenchedor ultra volume
   - Preenchedor lift plus
3. Abrir Agenda e conferir a mesma lista.
4. Abrir uma ficha de paciente e fechar venda com um dos novos preenchedores.
5. Conferir se o contrato puxa o termo de Preenchimento.
