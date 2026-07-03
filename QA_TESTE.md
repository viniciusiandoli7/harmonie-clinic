# QA / Teste rápido

Correção pontual do build.

Validação feita nesta versão:

```txt
npm run qa
QA OK
```

Correção aplicada:

- Removida referência indevida a `isModalOpen` dentro do componente interno do modal financeiro.
- O modal já só é montado quando aberto, então agora ele carrega contratos/vendas no `useEffect` de montagem.

Depois de substituir os arquivos, rode:

```powershell
npx prisma db push
npx prisma generate
npm run qa
npm run build
npm run dev
```

Depois de subir na Vercel, abra logado:

```txt
https://harmonie-clinic.vercel.app/api/system/repair
```
