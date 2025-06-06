# Sistema CDG - Backend

Este é o backend do Sistema CDG, uma aplicação de autenticação e gestão desenvolvida com Node.js, Express e Sequelize.

## Documentação

- [API de Integração - Recebimento de Pedidos](./docs/integracao-api.md)
- [Deploy no Render - Ambiente de Produção](./docs/deploy-render.md)

## Estrutura do Projeto

```
├── app.js               # Ponto de entrada da aplicação
├── auth                 # Módulos de autenticação
│   ├── authMiddleware.js # Middleware de autenticação
│   └── jwtService.js    # Serviço para gerenciamento de JWT
├── config               # Configurações
│   └── database.js      # Configuração do banco de dados
├── controllers          # Controladores da aplicação
│   ├── authController.js   # Autenticação
│   ├── formularioController.js # Formulários
│   └── pedidoController.js     # Pedidos
├── models               # Modelos do Sequelize
│   ├── arquivoPdf.js    # Modelo de arquivos PDF
│   ├── formulario.js    # Modelo de formulários
│   ├── historicoStatus.js # Modelo de histórico de status
│   ├── pedido.js        # Modelo de pedidos
│   ├── statusPedido.js  # Modelo de status de pedido
│   ├── unidade.js       # Modelo de unidades
│   ├── usuario.js       # Modelo de usuários
│   └── webhook.js       # Modelo de webhooks
├── routes               # Rotas da API
│   ├── auth.js          # Rotas de autenticação
│   ├── formularios.js   # Rotas de formulários
│   └── pedidos.js       # Rotas de pedidos
├── scripts              # Scripts de utilidade
│   └── syncDatabase.js  # Script de sincronização do banco de dados
├── services             # Serviços adicionais
│   └── googleDriveService.js # Serviço para Google Drive
├── .env                 # Variáveis de ambiente
├── package.json         # Dependências e scripts
└── database.sqlite      # Banco de dados SQLite
```

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o arquivo `.env` na raiz do projeto:
   ```
   JWT_SECRET=SuaChaveSecretaAqui
   PORT=3000
   NODE_ENV=development
   TOKEN_EXPIRATION=1d
   DATABASE_PATH=./database.sqlite
   ```

## Scripts Disponíveis

- `npm start` - Inicia o servidor em modo produção
- `npm run dev` - Inicia o servidor em modo desenvolvimento com nodemon
- `npm run db:sync` - Sincroniza o banco de dados (não destrói dados)
- `npm run db:update` - Atualiza a estrutura do banco de dados (altera tabelas)
- `npm run db:reset` - Reinicia o banco de dados (apaga todos os dados)

## Inicialização do Banco de Dados

Para inicializar o banco de dados pela primeira vez:

```bash
npm run db:reset
```

Isso criará as tabelas necessárias e alguns dados iniciais, incluindo:
- Status de pedidos padrão (Aberto, Em andamento, Concluído, Cancelado)
- Um usuário administrador (email: admin@sistemaCDG.com, senha: admin123)

## API Endpoints

### Autenticação

- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/registro` - Registro de novo usuário
- `GET /api/auth/verificar` - Verifica token JWT e retorna informações do usuário

### Pedidos

- `GET /api/pedidos` - Listar todos os pedidos (filtrados por usuário)
- `GET /api/pedidos/:id` - Obter detalhes de um pedido específico
- `POST /api/pedidos` - Criar um novo pedido
- `PUT /api/pedidos/:id` - Atualizar um pedido existente
- `DELETE /api/pedidos/:id` - Excluir um pedido (apenas admin)

### Formulários

- `GET /api/formularios` - Listar todos os formulários (filtrados por permissão)
- `GET /api/formularios/:id` - Obter detalhes de um formulário específico
- `POST /api/formularios` - Criar um novo formulário (apenas admin)
- `PUT /api/formularios/:id` - Atualizar um formulário existente (apenas admin)
- `DELETE /api/formularios/:id` - Excluir um formulário (apenas admin)

## Autenticação

A autenticação utiliza tokens JWT. Para acessar rotas protegidas, envie o token no cabeçalho:

```
Authorization: Bearer seu_token_jwt
```

## Desenvolvimento

Para executar o servidor em modo desenvolvimento com recarga automática:

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.
#   B A C K E N D C D G 
 
 