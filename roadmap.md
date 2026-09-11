# Roadmap do Produto

## SaaS de Agendamento para Barbearias

**Última revisão:** 11/09/2026

**Objetivo:** transformar o protótipo atual em um SaaS simples, confiável, validável e posteriormente comercializável para barbearias pequenas e médias.

**Legenda:** `[x]` concluído e validado · `[ ]` pendente

## 1. Visão do produto

### Problema

Barbearias pequenas e médias frequentemente recebem pedidos de horário pelo Instagram e WhatsApp. Isso exige troca manual de mensagens para descobrir serviço, profissional, data e horário disponível, além de aumentar o risco de conflitos, esquecimentos e perda de clientes.

### Proposta de valor

Criar uma ferramenta de agendamento focada em converter clientes que já chegam pelos canais da própria barbearia.

Cada barbearia recebe uma página pública própria, que pode ser compartilhada no Instagram, WhatsApp, Google Business Profile ou QR Code.

O produto não precisa competir inicialmente como marketplace ou ferramenta de descoberta de barbearias. O foco é tornar o processo:

- rápido para o cliente;
- simples para o barbeiro;
- confiável na gestão da agenda;
- barato para operar;
- fácil de configurar.

### Público inicial

- barbearias pequenas e médias;
- profissionais autônomos;
- equipes com poucos barbeiros;
- negócios que já usam Instagram e WhatsApp para captar clientes;
- estabelecimentos que ainda controlam horários manualmente.

### Métrica principal do produto

Agendamentos concluídos pela plataforma por barbearia ativa.

### Métricas auxiliares

- taxa de conclusão do fluxo de agendamento;
- taxa de cancelamento;
- taxa de no-show;
- número de barbearias ativas;
- agendamentos por barbearia/mês;
- retenção das barbearias;
- tempo médio para realizar um agendamento.

## 2. Princípios do projeto

- Agenda confiável antes de funcionalidades extras.
- Poucos passos para o cliente agendar.
- Configuração simples para o dono da barbearia.
- Mobile-first, pois grande parte do acesso virá de Instagram e WhatsApp.
- Multi-tenant desde a modelagem, mantendo dados de cada barbearia isolados.
- Evitar funcionalidades de marketplace antes da validação.
- Não automatizar processos caros antes de comprovar demanda.
- Toda funcionalidade nova deve resolver uma dor observada ou melhorar uma métrica importante.

## 3. Arquitetura técnica

### Stack planejada

| Camada             | Tecnologia                             |
| ------------------ | -------------------------------------- |
| Frontend           | Next.js + React + TypeScript           |
| UI                 | Tailwind CSS                           |
| Backend            | Next.js Route Handlers — API REST      |
| Banco              | PostgreSQL via Neon                    |
| ORM                | Prisma recomendado                     |
| Autenticação       | Auth.js ou autenticação própria segura |
| Fotos              | Cloudflare R2 ou serviço equivalente   |
| Deploy do frontend | Vercel                                 |
| Deploy do backend  | Serviço compatível com Node.js         |
| Versionamento      | Git + GitHub                           |

**Decisão técnica:** o MVP usa Next.js full-stack com Route Handlers, PostgreSQL e Prisma no mesmo deploy. Express separado fica fora da Fase 0 porque aumentaria deploys, configuração, CORS, autenticação distribuída e manutenção sem benefício validado.

### Requisitos técnicos obrigatórios

- variáveis de ambiente para secrets;
- validação de entrada no backend;
- senhas com hash seguro caso autenticação própria seja usada;
- isolamento por `barbershop_id`/`organization_id`;
- migrations versionadas;
- índices para consultas frequentes;
- tratamento centralizado de erros;
- logs básicos;
- datas armazenadas de forma consistente;
- timezone configurável por barbearia;
- proteção contra double booking;
- rate limiting nas rotas públicas sensíveis;
- backup e estratégia de recuperação do banco.

### Entidades mínimas

- `barbershops`
- `users`
- `professionals`
- `services`
- `professional_services`
- `business_hours`
- `schedule_blocks`
- `customers`
- `appointments`

### Entidades posteriores

- `appointment_status_history`
- `notifications`
- `subscriptions`
- `payments`
- `audit_logs`
- `reviews`

## 4. Fase 0 — Fundação do projeto

**Objetivo:** eliminar decisões estruturais que podem gerar retrabalho durante o MVP.

### Produto

- [x] definir nome provisório do produto;
- [x] definir exatamente quem é o primeiro usuário-alvo;
- [x] documentar a jornada atual de agendamento pelo WhatsApp;
- [x] definir a jornada ideal dentro da plataforma;
- [x] definir quais funcionalidades não entrarão no MVP;
- [x] definir critérios de sucesso da validação.

### Engenharia

- [x] migrar frontend para TypeScript, caso ainda esteja em JavaScript;
- [x] definir estrutura de ambientes: local, preview e produção;
- [x] configurar ESLint e formatação;
- [x] configurar `.env.example`;
- [x] definir estratégia de autenticação;
- [x] definir estratégia de multi-tenancy;
- [x] definir timezone e regras de datas;
- [x] criar schema inicial do banco;
- [x] criar migrations;
- [x] criar seed com uma barbearia fictícia;
- [x] configurar deploy inicial.

### Critério de conclusão

- [x] uma nova instalação do projeto consegue subir localmente, criar o banco, carregar dados de teste e executar frontend/backend sem configuração manual obscura.

## 5. Fase 1 — MVP funcional

**Objetivo:** permitir que uma barbearia real publique seus serviços e receba agendamentos sem conflito de horários.

### 5.1 Onboarding da barbearia

- [x] criar conta do proprietário;
- [x] criar barbearia;
- [x] configurar nome, slug/link público, telefone/WhatsApp, endereço, Instagram, foto/logo e timezone;
- [x] validar slug único;
- [x] permitir editar os dados posteriormente.

### 5.2 Serviços

CRUD de serviços com os campos:

- [x] nome;
- [x] descrição opcional;
- [x] preço;
- [x] duração;
- [x] ativo/inativo.

- [x] impedir agendamento de serviço inativo.

### 5.3 Profissionais

Mesmo que o primeiro teste use apenas um barbeiro, a modelagem deve evitar assumir que toda barbearia terá apenas um profissional.

- [x] cadastro de profissional;
- [x] nome e foto;
- [x] ativo/inativo;
- [x] associação dos serviços que cada profissional executa;
- [x] avaliar duração/preço específico por profissional e manter fora do MVP por não ser necessário agora.

### 5.4 Configuração da agenda

- [x] horário de funcionamento por dia da semana;
- [x] intervalo/almoço;
- [x] dias sem atendimento;
- [x] bloqueios pontuais;
- [x] folgas;
- [x] intervalo mínimo entre horários, se necessário;
- [x] antecedência mínima para agendar;
- [x] limite máximo de dias futuros disponíveis.

### 5.5 Página pública

**Rota sugerida:** `/barbearia/[slug]`

### Conteúdo

- [x] capa/logo;
- [x] nome;
- [x] endereço;
- [x] Instagram;
- [x] WhatsApp;
- [x] lista de serviços;
- [x] preço;
- [x] duração;
- [x] profissionais disponíveis;
- [x] CTA "Agendar horário".

### Não incluir inicialmente

- [x] feed;
- [x] descoberta;
- [x] busca de barbearias;
- [x] botão "Seguir" sem utilidade real;
- [x] gamificação;
- [x] avaliações antes de existir volume de clientes.

### 5.6 Fluxo de agendamento

**Fluxo recomendado:** Serviço → Profissional → Data → Horário → Dados do cliente → Confirmação

- [x] selecionar serviço;
- [x] selecionar profissional;
- [x] permitir opção "qualquer profissional", se aplicável; no primeiro piloto, exigir profissional explícito para manter a agenda determinística;
- [x] mostrar apenas datas válidas;
- [x] calcular horários disponíveis dinamicamente;
- [x] solicitar nome;
- [x] solicitar telefone/WhatsApp;
- [x] exibir resumo antes de confirmar;
- [x] criar agendamento;
- [x] exibir confirmação.

### Regras críticas

- [x] nunca oferecer horário já ocupado;
- [x] considerar duração do serviço;
- [x] considerar expediente;
- [x] considerar intervalo;
- [x] considerar bloqueios;
- [x] considerar outros agendamentos;
- [x] evitar double booking mesmo com duas requisições simultâneas;
- [x] normalizar e validar telefone;
- [x] não confiar apenas na disponibilidade exibida no frontend: revalidar no backend no momento da confirmação.

### 5.7 Painel do barbeiro

#### Dashboard

- [x] agendamentos de hoje;
- [x] próximos atendimentos;
- [x] total de agendamentos do dia;
- [x] previsão simples de faturamento;
- [x] atalhos para agenda, serviços e configurações.

#### Agenda

- [x] visão diária;
- [x] visão semanal;
- [x] filtrar por profissional;
- [x] criar agendamento manual;
- [x] visualizar detalhes;
- [x] alterar status.

#### Status sugeridos

- [x] `scheduled`
- [x] `confirmed`
- [x] `completed`
- [x] `cancelled`
- [x] `no_show`

### 5.8 Clientes

O cliente não precisa criar senha no MVP.

- [x] criar/identificar cliente por telefone;
- [x] nome;
- [x] telefone;
- [x] histórico de agendamentos;
- [x] última visita;
- [x] quantidade de visitas.

### 5.9 WhatsApp no MVP

Manter a estratégia de baixo custo inicialmente.

- [x] gerar mensagem pronta após o agendamento;
- [x] criar link para abrir conversa no WhatsApp;
- [x] incluir cliente, serviço, profissional, data e horário;
- [x] registrar que o agendamento foi criado independentemente do clique no WhatsApp.

O WhatsApp deve ser um complemento de comunicação. O banco de dados da plataforma deve continuar sendo a fonte de verdade da agenda.

### 5.10 Qualidade mínima

- [x] layout responsivo;
- [x] estados de loading;
- [x] empty states;
- [x] mensagens de erro compreensíveis;
- [x] confirmação antes de ações destrutivas;
- [x] acessibilidade básica;
- [x] testes do cálculo de disponibilidade;
- [x] testes contra double booking;
- [x] teste completo do fluxo público.

### Critério de conclusão do MVP

O MVP estará pronto para testadores quando uma barbearia conseguir:

- [x] criar conta;
- [x] configurar seu estabelecimento;
- [x] cadastrar serviço e profissional;
- [x] configurar horários;
- [x] compartilhar o link público;
- [x] receber um agendamento;
- [x] visualizar o agendamento no painel;
- [x] concluir ou cancelar o atendimento;
- [x] fazer tudo isso sem intervenção manual do desenvolvedor.

## 6. Fase 2 — Validação com usuários reais

**Objetivo:** descobrir se o produto resolve uma dor suficientemente importante para gerar uso recorrente e pagamento.

### Recrutamento

- [ ] selecionar 5–10 barbearias;
- [ ] fazer onboarding pessoalmente ou por chamada;
- [ ] acompanhar configuração inicial;
- [ ] observar o primeiro agendamento real.

### Feedback

Não perguntar apenas "você gostou?". Investigar:

- [ ] como agenda hoje;
- [ ] onde perde mais tempo;
- [ ] quantos agendamentos recebe por semana;
- [ ] quantos clientes faltam;
- [ ] o que ainda precisou fazer pelo WhatsApp;
- [ ] em que momento o sistema atrapalhou;
- [ ] qual funcionalidade faria diferença suficiente para pagar;
- [ ] quanto pagaria por mês.

### Métricas da validação

- [ ] barbearias cadastradas;
- [ ] barbearias que terminaram onboarding;
- [ ] barbearias que receberam ao menos 1 agendamento;
- [ ] agendamentos semanais;
- [ ] taxa de conclusão do agendamento;
- [ ] agendamentos cancelados;
- [ ] no-shows;
- [ ] usuários ativos após 7/30 dias;
- [ ] feedbacks recorrentes.

### Gate para avançar

Priorizar a Fase 3 somente depois de existir evidência de uso real. Funcionalidades pedidas por apenas um usuário não devem automaticamente entrar no roadmap.

## 7. Fase 3 — Produto comercializável

**Objetivo:** adicionar o mínimo necessário para cobrar com segurança e operar o SaaS.

### 7.1 Multiusuário e permissões

- [ ] proprietário;
- [ ] administrador/recepção;
- [ ] profissional;
- [ ] permissões por papel;
- [ ] convite de membros;
- [ ] remoção/desativação de membros.

### 7.2 Gestão avançada da agenda

- [ ] reagendamento;
- [ ] cancelamento pelo painel;
- [ ] cancelamento pelo cliente através de link seguro;
- [ ] bloqueio rápido de horário;
- [ ] recorrência de horários de trabalho;
- [ ] histórico de mudanças importantes.

### 7.3 Financeiro básico

- [ ] faturamento diário;
- [ ] faturamento mensal;
- [ ] faturamento por profissional;
- [ ] faturamento por serviço;
- [ ] quantidade de atendimentos;
- [ ] ticket médio;
- [ ] no-show.

Não transformar o MVP em ERP financeiro completo.

### 7.4 Notificações

- [ ] estruturar camada de notificações independente do provedor;
- [ ] confirmação de agendamento;
- [ ] lembrete antes do atendimento;
- [ ] aviso de cancelamento;
- [ ] avaliar WhatsApp Business Platform oficial;
- [ ] avaliar e-mail como fallback;
- [ ] registrar status de envio.

### 7.5 Planos e cobrança

- [ ] definir plano gratuito/teste;
- [ ] definir plano pago;
- [ ] integrar gateway de pagamento;
- [ ] período de teste;
- [ ] assinatura mensal;
- [ ] status da assinatura;
- [ ] cancelamento;
- [ ] falha de pagamento;
- [ ] webhooks do gateway;
- [ ] limites por plano, somente se realmente necessários.

### 7.6 Operação do SaaS

- [ ] página de termos de uso;
- [ ] política de privacidade;
- [ ] adequação básica à LGPD;
- [ ] canal de suporte;
- [ ] página de status ou comunicação de incidentes;
- [ ] logs de erros;
- [ ] monitoramento;
- [ ] backups;
- [ ] processo de recuperação;
- [ ] exclusão de conta/dados;
- [ ] exportação de dados essenciais.

### Critério de conclusão

- [ ] uma barbearia desconhecida consegue descobrir o produto, testar, configurar, usar, pagar e cancelar sem depender diretamente do desenvolvedor.

## 8. Fase 4 — Retenção e automação

**Objetivo:** aumentar recorrência e reduzir trabalho operacional das barbearias.

Priorizar de acordo com dados das Fases 2 e 3.

- [ ] lembrete automático;
- [ ] confirmação automática;
- [ ] lista de clientes;
- [ ] busca de clientes;
- [ ] histórico detalhado;
- [ ] observações do cliente;
- [ ] reagendamento pelo cliente;
- [ ] cancelamento pelo cliente;
- [ ] link de retorno para novo agendamento;
- [ ] relatório de no-show;
- [ ] horários mais procurados;
- [ ] serviços mais vendidos;
- [ ] profissionais mais ocupados;
- [ ] relatórios simples exportáveis.

## 9. Fase 5 — Diferenciais competitivos

**Objetivo:** criar diferenciação depois que o núcleo do produto estiver validado.

Possibilidades:

- [ ] personalização de cores;
- [ ] domínio/subdomínio personalizado;
- [ ] galeria de cortes;
- [ ] avaliações pós-atendimento;
- [ ] QR Code para página de agendamento;
- [ ] programa simples de fidelidade;
- [ ] campanhas para clientes inativos;
- [ ] lista de espera para horários cancelados;
- [ ] encaixes;
- [ ] pacotes/combos;
- [ ] comissão por profissional;
- [ ] integração com Google Calendar;
- [ ] integração com ferramentas externas.

Cada item deve passar por validação antes de entrar em desenvolvimento.

## 10. Backlog — não priorizar agora

Funcionalidades que podem parecer interessantes, mas aumentam muito o escopo sem provar valor no estágio atual:

- marketplace de barbearias;
- feed social;
- chat interno;
- sistema de seguidores;
- aplicativo mobile nativo;
- IA sem caso de uso validado;
- sistema completo de estoque;
- PDV;
- contabilidade;
- folha de pagamento;
- programa complexo de fidelidade;
- login obrigatório para o cliente apenas para marcar horário.

## 11. Segurança e confiabilidade

Antes de cobrar clientes:

- HTTPS em produção;
- autenticação segura;
- autorização por recurso e organização;
- nenhuma rota deve aceitar `barbershop_id` sem validar acesso;
- rate limiting;
- validação e sanitização;
- proteção contra enumeração de recursos;
- secrets somente em variáveis de ambiente;
- logs sem dados sensíveis desnecessários;
- backup automático;
- teste de restauração;
- tratamento de concorrência na agenda;
- política de retenção/exclusão de dados.

## 12. UX essencial

### Cliente

O cliente deve conseguir concluir o agendamento sem treinamento.

### Metas

- poucos passos;
- botões grandes;
- experiência rápida no celular;
- datas/horários fáceis de entender;
- nenhuma criação de conta obrigatória no MVP;
- confirmação clara;
- feedback imediato em caso de horário indisponível.

### Barbearia

- a agenda do dia deve ser a informação mais fácil de acessar;
- ações frequentes devem exigir poucos cliques;
- configuração avançada não deve poluir o uso diário;
- status devem ser visualmente claros;
- telas vazias devem explicar o próximo passo;
- onboarding deve levar o usuário até o primeiro link público funcional.

## 13. Observabilidade e analytics

### Eventos de produto

- `barbershop_created`
- `service_created`
- `professional_created`
- `public_page_viewed`
- `booking_started`
- `booking_slot_selected`
- `booking_completed`
- `booking_cancelled`
- `appointment_completed`
- `no_show_recorded`

### Monitoramento de engenharia

- erros 5xx;
- latência;
- falhas no banco;
- falhas de autenticação;
- conflitos de agendamento;
- falhas de notificações;
- disponibilidade da aplicação.

## 14. Estratégia de lançamento

### Alpha

- uso interno;
- dados fictícios;
- testes de regras da agenda.

### Beta fechado

- 5–10 barbearias;
- acompanhamento próximo;
- uso gratuito;
- coleta intensa de feedback.

### Beta comercial

- preço inicial;
- onboarding simplificado;
- suporte direto;
- medir disposição real a pagar.

### Produção

- checkout;
- onboarding self-service;
- documentação;
- suporte;
- monitoramento;
- termos e privacidade;
- processo de cancelamento.

## 15. Ordem recomendada de implementação

```text
Fundação
  ↓
Banco + autenticação + multi-tenancy
  ↓
Barbearia
  ↓
Serviços
  ↓
Profissionais
  ↓
Horários de funcionamento
  ↓
Motor de disponibilidade
  ↓
Página pública
  ↓
Criação de agendamento
  ↓
Agenda do barbeiro
  ↓
Status do atendimento
  ↓
Clientes/histórico
  ↓
Testes e confiabilidade
  ↓
5–10 barbearias reais
  ↓
Feedback + métricas
  ↓
Reagendamento/cancelamento
  ↓
Notificações automáticas
  ↓
Cobrança
  ↓
Operação comercial
  ↓
Diferenciais validados
```

## 16. Próximas tarefas imediatas

### Prioridade P0

- decidir arquitetura final do backend;
- definir autenticação;
- modelar banco multi-tenant;
- implementar barbearias;
- implementar serviços;
- implementar profissionais;
- implementar horários de funcionamento;
- implementar motor de disponibilidade;
- garantir proteção contra double booking;
- implementar criação de agendamento;
- conectar o frontend já prototipado.

### Prioridade P1

- agenda diária/semanal;
- bloqueios e folgas;
- status do atendimento;
- clientes e histórico;
- fluxo WhatsApp;
- testes automatizados do domínio da agenda;
- analytics básico.

### Prioridade P2

- reagendamento;
- cancelamento self-service;
- financeiro básico;
- notificações automáticas;
- multiusuário;
- assinaturas.

## 17. Definição de "produto pronto para vender"

O projeto não deve ser considerado comercializável apenas porque o fluxo de agendamento funciona.

Para começar a vender de forma responsável, o mínimo esperado é:

- agenda confiável;
- ausência de double booking;
- autenticação e isolamento de dados;
- onboarding funcional;
- página pública;
- serviços/profissionais/horários configuráveis;
- criação e gestão de agendamentos;
- cancelamento e reagendamento;
- histórico de clientes;
- experiência mobile adequada;
- tratamento de erros;
- monitoramento;
- backups;
- termos e privacidade;
- processo de suporte;
- cobrança;
- pelo menos alguns usuários reais validando o fluxo.

## 18. Regra de evolução do roadmap

Antes de desenvolver uma nova funcionalidade, responder:

- qual problema ela resolve;
- quantos usuários demonstraram esse problema;
- existe uma solução mais simples;
- ela melhora aquisição, ativação, retenção, receita ou confiabilidade;
- quanto aumenta a complexidade técnica e operacional;
- é necessária agora ou pode esperar.

Se a resposta não justificar o custo, a funcionalidade permanece no backlog.
