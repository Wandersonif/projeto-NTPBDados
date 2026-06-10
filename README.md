# NTPBDados

Dashboard de controle de vendas desenvolvido para a disciplina de Banco de Dados. O projeto usa PostgreSQL como fonte de dados, uma API Node.js/Express em TypeScript e um frontend React com gráficos e telas administrativas.

## Funcionalidades

- Autenticação de usuários com cadastro, login, sessão por token e logout.
- Dashboard com receita total, quantidade de vendas, total de produtos, ticket médio e ranking de produtos.
- Listagem de produtos com categoria, preço, estoque e status visual.
- Cadastro de novos produtos.
- Registro de vendas com abatimento de estoque e atualização do contador de vendas.
- Integração direta com PostgreSQL.

## Tecnologias

- Frontend: React, Vite, TypeScript, Chart.js, react-chartjs-2 e lucide-react.
- Backend: Node.js, Express, TypeScript, pg e dotenv.
- Banco de dados: PostgreSQL.

## Estrutura

```text
.
├── backend/
│   ├── src/
│   │   ├── db.ts          # Configuração do pool PostgreSQL
│   │   └── index.ts       # API Express, autenticação e rotas de negócio
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Aplicação React, dashboard e autenticação
│   │   ├── App.css        # Estilos do dashboard e login
│   │   ├── index.css      # Reset global mínimo
│   │   └── main.tsx       # Bootstrap do React
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── setup_banco.sql    # Criação das tabelas e seed inicial
│   └── documentacao.md
└── README.md
```

## Banco de Dados

O script principal está em `docs/setup_banco.sql`. Ele cria as tabelas:

- `categorias`
- `produtos`
- `vendas`
- `itens_venda`
- `usuarios`

Para criar o banco:

```bash
createdb ntpb_dados
psql -d ntpb_dados -f docs/setup_banco.sql
```

Se o banco já existir, execute o script para criar a tabela `usuarios` e garantir as tabelas principais. O cadastro do primeiro usuário é feito pela tela inicial do frontend ou pelo endpoint `/api/auth/register`.

## Variáveis de Ambiente

Crie `backend/.env`:

```env
DATABASE_URL=postgres://usuario:senha@localhost:5432/ntpb_dados
AUTH_SECRET=troque-por-um-segredo-forte
PORT=3001
```

`AUTH_SECRET` é usado para assinar os tokens de sessão. Em desenvolvimento existe um fallback, mas em produção essa variável deve ser definida.

## Como Executar

Instale as dependências:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Inicie o backend:

```bash
cd backend
npm run dev
```

Inicie o frontend em outro terminal:

```bash
cd frontend
npm run dev
```

URLs padrão:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Fluxo de Autenticação

1. Acesse o frontend.
2. Clique em `Cadastrar` para criar o primeiro usuário.
3. Após o cadastro, o frontend salva o token em `localStorage`.
4. As rotas protegidas enviam `Authorization: Bearer <token>`.
5. O botão de logout remove a sessão local.

As senhas são armazenadas no banco com hash usando `crypto.scrypt` e salt individual. Os tokens expiram após 8 horas.

## Endpoints da API

### Autenticação

- `POST /api/auth/register`
  - Body: `{ "nome": "Admin", "email": "admin@ntpbdados.com", "password": "123456" }`
- `POST /api/auth/login`
  - Body: `{ "email": "admin@ntpbdados.com", "password": "123456" }`
- `GET /api/auth/me`
  - Requer token.

### Dados Protegidos

Todos os endpoints abaixo exigem o cabeçalho `Authorization: Bearer <token>`.

- `GET /api/categories`
- `GET /api/products`
- `POST /api/products`
- `GET /api/dashboard/stats`
- `POST /api/sales`

Exemplo de venda:

```json
{
  "productId": 1,
  "quantity": 2
}
```

## Scripts

Backend:

```bash
npm run dev      # inicia a API em modo desenvolvimento
npm run build    # compila TypeScript para dist/
npm start        # executa dist/index.js após build
```

Frontend:

```bash
npm run dev      # inicia o Vite
npm run build    # compila TypeScript e gera dist/
npm run lint     # executa ESLint
npm run preview  # serve o build localmente
```

## Validação

Comandos executados após as alterações:

```bash
cd backend && npm run build
cd frontend && npm run lint
cd frontend && npm run build
```

Status: todos passaram.

## Observações Técnicas

- A API usa `DATABASE_URL`; sem essa variável, as rotas que consultam o banco falham.
- As rotas de negócio foram protegidas por autenticação, enquanto cadastro e login permanecem públicos.
- O CSS global antigo do template Vite foi substituído por um reset mínimo para não limitar a largura do dashboard.
- O seed de categorias usa `ON CONFLICT (nome) DO NOTHING` para evitar erro ao reexecutar parte do script.

## Equipe

- Wanderson
- Gabriel Victor
- Rafael
- Elias
- Alessandra

## Padrão de Commits

O projeto usa Conventional Commits:

- `feat:` novas funcionalidades.
- `fix:` correções de bugs.
- `docs:` documentação.
- `style:` formatação sem mudança de comportamento.
- `refactor:` refatoração.
- `test:` testes.
- `chore:` tarefas auxiliares de build, configuração ou manutenção.
