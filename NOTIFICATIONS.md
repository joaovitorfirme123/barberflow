# Notificações de agenda

O painel usa Web Push para enviar um lembrete do próximo atendimento **10 minutos antes**.

## Configuração

Gere um par VAPID:

```bash
npx web-push generate-vapid-keys --json
```

Configure no ambiente do servidor:

```env
PUSH_VAPID_SUBJECT=mailto:suporte@seudominio.com
PUSH_VAPID_PUBLIC_KEY=...
PUSH_VAPID_PRIVATE_KEY=...
CRON_SECRET=um-segredo-longo-e-aleatorio
```

O navegador precisa de HTTPS em produção. `localhost` é aceito para desenvolvimento.

## Instalação como aplicativo

O painel agora é um PWA instalável. Abra `/painel`, abra o menu da conta e escolha **Instalar aplicativo** quando o navegador oferecer essa opção.

No iPhone/iPad, abra pelo Safari e use **Compartilhar → Adicionar à Tela de Início**. Depois de instalado, o PWA pode receber os lembretes push com o painel fechado, desde que as notificações tenham sido ativadas.

O Service Worker mantém apenas recursos públicos e uma tela offline em cache. Dados da agenda e respostas autenticadas não são armazenados no cache do navegador.

## Agendador

O endpoint precisa ser chamado a cada minuto por um cron externo ou worker:

```bash
curl -X POST https://seu-dominio.com/api/notifications/dispatch \
  -H "x-cron-secret: $CRON_SECRET"
```

O endpoint considera agendamentos `SCHEDULED` e `CONFIRMED` que estejam entre 9 e 11 minutos do horário atual. A tabela `notification_deliveries` impede reenvios do mesmo lembrete, inclusive quando há mais de um dispositivo cadastrado para o usuário.

No painel, cada usuário ativa os alertas no menu da conta. A permissão é por navegador/dispositivo e os alertas são enviados somente para usuários ativos da mesma barbearia do agendamento.
