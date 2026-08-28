# QA / Teste rápido

Correção desta versão:

- Todas as variações comerciais de preenchedor foram removidas das listas do sistema.
- Agora existe apenas uma opção: **Preenchedor**.
- A alteração foi aplicada em:
  - Estoque
  - Agenda
  - Edição de agendamento
  - Criação rápida de agendamento
  - Caixa / Ponto de Venda
  - Contratos
- O contrato sempre exibe **Preenchedor** de forma genérica, inclusive quando for gerado a partir de um registro antigo que ainda possua o nome comercial salvo no histórico.
- O termo específico continua sendo o termo de **Preenchimento**.

Validação rápida:

```powershell
npm run preflight
npm run qa
npm run build
npm run dev
```

Não é necessária uma nova migration para esta alteração, pois ela não modifica a estrutura do banco de dados.

Teste obrigatório:

1. Abrir Estoque e conferir que há apenas **Preenchedor**.
2. Abrir Agenda e conferir que há apenas **Preenchedor**.
3. Abrir edição e criação rápida de agendamento e conferir a mesma opção.
4. Abrir uma ficha de paciente e fechar uma venda selecionando **Preenchedor**.
5. Conferir no PDF/contrato que o item aparece como **Preenchedor**, sem marca ou linha comercial.
