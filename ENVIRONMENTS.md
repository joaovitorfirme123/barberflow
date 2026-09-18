# Ambientes e Regras Técnicas — Fase 0

## Ambientes

### Local

- Next.js executado com `npm run dev`.
- PostgreSQL executado pelo Docker Compose.
- Variáveis carregadas de `.env`, que não deve ser versionado.
- Dados podem ser recriados com `docker compose down -v`, `docker compose up -d db` e `npm run db:deploy`.

### Preview (requisito de deploy)

- Cada preview deve usar um banco PostgreSQL separado ou um schema isolado.
- `DATABASE_URL`, `SESSION_SECRET` e demais secrets são fornecidos pelo provedor de deploy.
- O processo de deploy executa migrations versionadas antes de aceitar tráfego.
- Dados reais de produção não devem ser copiados para preview.

### Produção (requisito de deploy)

- Aplicação executada como imagem Docker ou serviço Node compatível.
- PostgreSQL gerenciado, inicialmente compatível com Neon ou equivalente.
- HTTPS obrigatório.
- Secrets somente no gerenciador de variáveis do provedor.
- Backups e teste de restauração pertencem ao processo operacional antes da cobrança.

## Regras de datas e timezone

- Cada barbearia possui um timezone IANA, com padrão `America/Sao_Paulo`.
- Datas e horários enviados pelo cliente representam o relógio local da barbearia.
- O backend converte o horário local para UTC antes de persistir.
- O banco armazena instantes como `timestamp` UTC por convenção da aplicação.
- O frontend exibe instantes convertidos para o timezone da barbearia.
- Datas de calendário usam o formato `YYYY-MM-DD`.
- Horários de expediente usam o formato `HH:mm`.
- Nunca usar o timezone do servidor para decidir expediente ou disponibilidade.
- Horários ambíguos durante transições de horário de verão devem ser rejeitados ou tratados explicitamente pelo domínio.

As conversões compartilhadas ficam em `src/lib/dates.ts` e devem ser cobertas por testes de domínio.

## Configuração mínima

O arquivo `.env.example` documenta as variáveis necessárias. O `SESSION_SECRET` deve ser substituído por um valor aleatório com pelo menos 32 caracteres em qualquer ambiente compartilhado.
