# Sistema de Categorias de Usuários

Este documento descreve o sistema de categorias (roles) implementado para controlar o acesso a diferentes recursos e funcionalidades da aplicação.

## Visão Geral

O sistema permite categorizar usuários em diferentes perfis, como administrador, produção, zerohum, pensi, entre outros. Cada categoria pode ter diferentes níveis de acesso, permitindo que algumas funcionalidades sejam acessíveis apenas por determinados tipos de usuários.

## Categorias Padrão

O sistema inicializa com as seguintes categorias de usuários:

| Nome          | Nível de Acesso | Descrição                             |
|---------------|-----------------|---------------------------------------|
| administrador | 10              | Acesso total ao sistema               |
| producao      | 5               | Acesso às funcionalidades de produção |
| zerohum       | 5               | Acesso às funcionalidades da Zero Um  |
| pensi         | 5               | Acesso às funcionalidades da Pensi    |
| visualizador  | 1               | Acesso apenas para visualização       |

## Níveis de Acesso

Os níveis de acesso são valores numéricos que determinam o grau de permissão de uma categoria. Quanto maior o número, maior o acesso:

- **1**: Visualização básica
- **5**: Edição/Criação
- **8**: Exclusão
- **10**: Administração total

## Como Funciona

### No Login

Quando um usuário faz login, os dados da sua categoria são incluídos no token JWT, permitindo verificar suas permissões sem consultar o banco de dados a cada requisição.

### Nas Rotas

As rotas podem ser protegidas de duas formas:

1. **Por área funcional**: Restringe acesso a uma área específica do sistema (admin, produção, etc.)
   ```javascript
   router.get('/rota', acessoArea('producao'), controller.metodo);
   ```

2. **Por nível de ação**: Restringe acesso com base no tipo de ação (visualizar, editar, etc.)
   ```javascript
   router.delete('/rota', acessoAcao('excluir'), controller.metodo);
   ```

## APIs Disponíveis

### API para Gerenciamento de Categorias

#### Endpoints

- `GET /api/categorias`: Lista todas as categorias (autenticado)
- `GET /api/categorias/:id`: Retorna uma categoria específica (autenticado)
- `POST /api/categorias`: Cria uma nova categoria (admin)
- `PUT /api/categorias/:id`: Atualiza uma categoria (admin)
- `PATCH /api/categorias/:id/status`: Ativa/desativa uma categoria (admin)

### API para Gerenciamento de Usuários

#### Endpoints

- `GET /api/usuarios`: Lista todos os usuários (admin)
- `GET /api/usuarios/:id`: Retorna um usuário específico (admin)
- `POST /api/usuarios`: Cria um novo usuário (admin)
- `PUT /api/usuarios/:id`: Atualiza um usuário (admin)
- `PATCH /api/usuarios/:id/status`: Ativa/desativa um usuário (admin)
- `PATCH /api/usuarios/:id/categoria`: Altera a categoria de um usuário (admin)

## Como Implementar em Novas Funcionalidades

Para proteger uma nova rota ou funcionalidade:

1. Importe os helpers de permissão:
   ```javascript
   const { acessoArea, acessoAcao } = require("../auth/permissionHelpers");
   ```

2. Aplique o middleware na rota apropriada:
   ```javascript
   // Acesso por área
   router.get('/relatorios', acessoArea('pensi'), controller.relatorios);
   
   // Acesso por ação
   router.post('/records', acessoAcao('editar'), controller.cadastrar);
   ```

3. Para verificações no código do controller:
   ```javascript
   const { temAcessoArea } = require("../auth/permissionHelpers");
   
   if (!temAcessoArea(req.usuario, 'producao')) {
     return res.status(403).json({ mensagem: "Acesso não autorizado" });
   }
   ```

## Exemplos de Uso das APIs

### Criar um Novo Usuário com Categoria Específica

```http
POST /api/usuarios
Content-Type: application/json
Authorization: Bearer <token>

{
  "nome": "João Silva",
  "email": "joao.silva@exemplo.com",
  "senha": "senha123",
  "categoriaId": 2,
  "preferencias": {
    "tema": "escuro",
    "notificacoes": true
  }
}
```

### Alterar a Categoria de um Usuário

```http
PATCH /api/usuarios/5/categoria
Content-Type: application/json
Authorization: Bearer <token>

{
  "categoriaId": 3,
  "manterAdmin": false
}
```

### Criar uma Nova Categoria

```http
POST /api/categorias
Content-Type: application/json
Authorization: Bearer <token>

{
  "nome": "suporte",
  "descricao": "Equipe de suporte ao cliente",
  "nivelAcesso": 3
}
```

## Migração de Usuários Existentes

Foi criado um script de migração para associar os usuários existentes às categorias adequadas:

- Se `is_admin = true`: Categoria "administrador"
- Se `is_admin = false`: Categoria "visualizador"

Para executar a migração manualmente:
```
node scripts/migrations/20250527_AddCategoriasUsuario.js
```

Antes de executar o script de migração das categorias, é necessário executar o script que adiciona as novas colunas ao banco de dados:
```
node scripts/migrations/20250527_UpdateUsuarioSchema.js
```
