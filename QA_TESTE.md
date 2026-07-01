# QA / Teste rápido

Depois de substituir os arquivos e subir no Vercel/GitHub, rode localmente:

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

Teste manual sugerido em produção:

1. Abrir **Estoque**.
2. Cadastrar um produto.
3. Confirmar se não aparece mais:
   - relation "InventoryItem" does not exist
   - erro ao salvar item no estoque
4. Abrir uma paciente.
5. Clicar em **Prontuário & Evolução**.
6. Confirmar se a tela abre sem cair em “Application error”.
7. Testar novamente no celular/tablet:
   - barra superior mobile;
   - menu inferior com todas as abas;
   - navegação entre Dashboard, Agenda, CRM, Financeiro, Estoque, WhatsApp, Relatórios e Executivo.

Observação:
Essa versão cria automaticamente, em produção, as tabelas novas necessárias caso o banco ainda não tenha recebido todas as migrations.
