# QA / Teste rápido

Correção desta versão:

- Corrigido erro de build:
  - `Type 'string' is not assignable to type '"Pix"'`
- O estado do formulário de **Saídas** agora tem tipagem explícita.
- `paymentMethod` agora é tratado como `string`, permitindo Pix, cartão, dinheiro, boleto etc.
- Também foi corrigido o campo `fixedCostImpact` para aceitar somente `"SIM"` ou `"NAO"` sem quebrar TypeScript.

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

1. Abrir Financeiro.
2. Clicar em Saídas.
3. Selecionar uma forma de pagamento.
4. Selecionar se entra ou não no custo fixo mensal.
5. Salvar saída.
6. Confirmar se aparece em Movimentações como Saída.
