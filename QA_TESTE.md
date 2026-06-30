# QA / Teste rápido

Depois de substituir os arquivos, rode:

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

Teste manual sugerido:

1. Abrir o sistema no celular ou tablet.
2. Conferir se aparece:
   - barra superior com logo;
   - menu inferior com todas as abas: Dashboard, Agenda, CRM, Financeiro, Estoque, WhatsApp, Relatórios e Executivo.
3. Abrir **Estoque** e cadastrar um item.
4. Confirmar se o item salva sem erro.
5. Abrir **CRM Pacientes > Novo Paciente**.
6. Preencher a aba **Relacionamento / CRM** e salvar.
7. Confirmar se não aparece mais o aviso de banco desatualizado.
8. Abrir **Financeiro** e confirmar se **Lançar venda/custos** continua funcionando.
