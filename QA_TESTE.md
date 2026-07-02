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

Teste manual sugerido:

1. Abrir uma paciente já cadastrada.
2. Na aba **Informações**, conferir o bloco **Ficha de anamnese**.
3. Clicar em **Copiar link** e abrir o link em outra aba:
   `/anamnese/ID_DA_PACIENTE`
4. Preencher a anamnese on-line e salvar.
5. Voltar para a ficha da paciente e atualizar a página.
6. Confirmar se as respostas aparecem salvas em **Informações > Ficha de anamnese**.
7. Testar **Enviar pelo WhatsApp** para conferir se a mensagem leva ao link da anamnese.
8. Abrir **Editar paciente > Ficha de Anamnese** e conferir se as perguntas também aparecem para edição interna.

Depois do deploy em produção, abrir logado:

```txt
https://harmonie-clinic.vercel.app/api/system/repair
```

O retorno esperado é `ok: true`.

Alterações desta versão:

- Anamnese com as perguntas novas solicitadas.
- Anamnese salva e visível dentro da ficha da paciente.
- Link público para a paciente preencher on-line.
- Botão para copiar link da anamnese.
- Botão para enviar anamnese pelo WhatsApp.
- Campos novos no banco:
  - previousAestheticProcedures
  - roacutanDetails
  - waterIntake
  - cancerHistory
  - circulationProblems
- Alertas clínicos também consideram histórico de câncer e trombose/circulação.
