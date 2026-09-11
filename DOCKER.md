# Ambiente Docker

O Docker sobe o PostgreSQL e a aplicação Next.js em uma rede local. A imagem da aplicação executa as migrations pendentes antes de iniciar o servidor.

## Pré-requisito

- Docker com Docker Compose (`docker compose`)

## Primeiro uso

Copie o arquivo de variáveis locais:

```bash
cp .env.example .env
```

Inicie o banco e a aplicação:

```bash
docker compose up -d
```

Confira o estado do serviço:

```bash
docker compose ps
```

O PostgreSQL ficará disponível em `localhost:5432` e a aplicação em `http://localhost:3000`. A string de conexão usada fora do Docker está em `DATABASE_URL` no `.env`; dentro da rede Docker, a aplicação usa o host `db`.

## Comandos úteis

Ver logs da aplicação:

```bash
docker compose logs -f app
```

Ver logs do banco:

```bash
docker compose logs -f db
```

Parar os containers sem apagar os dados:

```bash
docker compose down
```

Parar e apagar o volume do banco, perdendo os dados locais:

```bash
docker compose down -v
```

Abrir um terminal no PostgreSQL:

```bash
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

As migrations são executadas automaticamente pelo container `app`. O seed é destinado ao ambiente local e pode ser executado pelo host com `npm run db:seed`.
