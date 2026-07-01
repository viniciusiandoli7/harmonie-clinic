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

Teste em produção logo após o deploy ficar **Ready**:

1. Acesse `/api/system/repair` logada. Deve retornar `ok: true`.
2. Abra **CRM Pacientes** e clique em **Abrir ficha** de uma paciente.
3. Clique em **Prontuário & Evolução**.
4. Clique em **Fechar venda** e finalize uma venda.
5. Abra **Executivo > Editar metas > Salvar metas**.
6. Abra **Estoque** e salve um produto.

Correções desta versão:

- A ficha da paciente agora usa uma leitura resiliente por SQL bruto, sem depender de includes do Prisma que estavam quebrando quando o banco de produção estava incompleto.
- O caixa/fechamento de venda não usa mais `prisma.treatment.upsert`, que estava quebrando em produção por causa da coluna `Treatment.standardPrice` ausente.
- A venda agora grava por SQL bruto resiliente: venda, pagamentos, itens, financeiro, contrato e plano de evolução.
- A verificação automática do banco roda uma vez por sessão para reduzir travamento/lentidão.
- Corrigido possível erro de tela branca no prontuário quando `imagesJson` vinha inválido ou sessões vinham sem array.
