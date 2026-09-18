# Operação do piloto

## Gate antes de dados reais

- definir `SUPPORT_EMAIL` com uma caixa monitorada;
- publicar `/privacidade` e `/termos` após revisão responsável;
- confirmar backup automático diário no provedor PostgreSQL;
- executar e registrar um teste de restauração em banco isolado;
- configurar monitoramento de `/api/health` e erros HTTP 5xx;
- manter previews em banco ou schema separado, sem cópia de dados reais.

## Backup e restauração

1. Habilitar retenção mínima de sete dias no provedor PostgreSQL.
2. Criar um banco temporário sem acesso da aplicação de produção.
3. Restaurar o backup mais recente nesse banco.
4. Executar `npm run db:deploy` contra a restauração.
5. Validar contagens de barbearias, profissionais, serviços, clientes e agendamentos.
6. Validar um fluxo de leitura da agenda sem enviar notificações ou eventos externos.
7. Registrar data, duração, responsável e resultado do teste.

## Incidentes

1. Interromper deploys e preservar logs sem divulgar telefones ou secrets.
2. Classificar impacto por tenant e por intervalo de tempo.
3. Corrigir ou reverter a versão sem alterar migrations já aplicadas.
4. Comunicar barbearias afetadas pelo canal de suporte.
5. Registrar causa, impacto, resolução e ação preventiva.

## Retenção e solicitações

- pedidos de acesso, correção, exportação ou exclusão chegam pelo e-mail de suporte;
- confirmar a identidade do proprietário antes de entregar ou excluir dados;
- concluir solicitações do piloto em até 15 dias, salvo obrigação de retenção;
- não copiar dados de produção para desenvolvimento ou preview;
- revisar esta política e os textos legais antes da comercialização.
