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

O retorno esperado é `ok: true`.

Teste manual sugerido:

1. Fechar uma venda no **Caixa / Ponto de Venda**.
2. Abrir **Financeiro**.
3. Conferir se a venda aparece em **Movimentações** automaticamente.
4. Clicar em **Nova transação**.
5. No modal **Fechamento da venda**, conferir se aparece:
   - contrato gerado;
   - ou, se o contrato não existir, a venda lançada como opção de fallback.
6. Selecionar o contrato/venda e conferir se preenche:
   - paciente;
   - procedimento vendido;
   - valor cheio;
   - forma de pagamento quando houver;
   - valor no banco.
7. Conferir se o filtro **Categoria > Procedimento** também exibe vendas antigas com categoria `PROCEDIMENTO`.

Correções desta versão:

- Financeiro não quebra mais quando a tabela de fechamento mensal ainda não existe.
- `/api/finance/stats` agora prepara o schema antes de buscar as movimentações.
- Sistema cria automaticamente movimentação financeira para vendas antigas que ainda não tinham lançamento financeiro.
- `/api/system/repair` também faz esse reparo financeiro.
- Lista de contratos do modal financeiro ganhou fallback por venda lançada.
- Categoria financeira padronizada como `Procedimento`.
- Filtro de categoria agora também reconhece registros antigos `PROCEDIMENTO`.
