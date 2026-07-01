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

Teste manual em produção:

1. Depois do deploy ficar **Ready**, abra o site e faça login.
2. Acesse uma página interna para disparar a verificação automática do banco.
3. Abra diretamente:
   `/api/system/repair`
   Deve retornar `ok: true`.
4. Teste **Executivo > Editar metas > Salvar metas**.
5. Teste **CRM > Caixa/Ponto de venda > Finalizar venda**.
6. Teste abrir paciente e clicar em **Prontuário & Evolução**.
7. Teste **Estoque > Salvar item**.

Correções desta versão:

- Cria/ajusta automaticamente tabelas e colunas de produção usadas por:
  - Estoque
  - Tratamentos
  - Venda/Caixa
  - Financeiro
  - Contratos
  - Prontuário & Evolução
  - Metas/Executivo
- Corrige erro de `Treatment.standardPrice`.
- Corrige erro de `InventoryItem does not exist`.
- Evita tela branca no prontuário caso a paciente não carregue.
