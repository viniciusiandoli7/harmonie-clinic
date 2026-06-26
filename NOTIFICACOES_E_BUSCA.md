# Ajuste de notificações e busca

## O que foi ajustado

### Notificações reais
O botão do sino deixou de ser apenas visual. Agora ele consulta a nova rota:

```txt
/api/notifications
```

Essa rota consolida informações reais do sistema:

- atividades recentes registradas no log de auditoria;
- parcelas vencidas;
- pacientes para reativação;
- aniversários próximos;
- consultas próximas;
- tarefas de pós-procedimento;
- produtos com estoque baixo;
- produtos perto do vencimento.

No frontend, o componente `NotificationBell` exibe:

- contador de notificações não lidas;
- lista organizada por área da clínica;
- atualização manual;
- atualização automática a cada 60 segundos;
- opção de marcar todas como lidas;
- clique direto para a área relacionada.

Como o sistema usa uma conta única da Dra. Mariana, o controle de lidas fica salvo no navegador via `localStorage`, evitando criar complexidade de usuários/permissões.

### Busca refinada
O campo de busca do dashboard foi corrigido para não parecer um input duplicado. Também passou a buscar por:

- nome;
- telefone;
- CPF;
- e-mail;
- origem;
- status no CRM;
- indicação.

Ao digitar no dashboard, aparece uma lista elegante de resultados. Pressionar `Enter` abre a primeira paciente encontrada e `Esc` limpa/fecha a busca.

## Arquivos principais alterados

- `src/app/api/notifications/route.ts`
- `src/components/notifications/NotificationBell.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/patients/page.tsx`
- `src/app/globals.css`
