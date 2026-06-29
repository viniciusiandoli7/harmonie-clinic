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

1. Abrir a tela de login.
2. Conferir se o visual do login continua igual.
3. Conferir no painel **Problems** se os avisos de classes canônicas em `src/app/login/page.tsx` sumiram.
4. Se o VS Code ainda mostrar avisos antigos, feche e abra o arquivo ou rode **Developer: Reload Window**.
