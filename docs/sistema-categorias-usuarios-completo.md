# Documentação do Sistema de Categorias de Usuários

## Sumário
1. [Introdução](#introdução)
2. [Arquitetura da Solução](#arquitetura-da-solução)
3. [Modelo de Dados](#modelo-de-dados)
4. [Categorias Padrão](#categorias-padrão)
5. [Níveis de Acesso](#níveis-de-acesso)
6. [Como o Sistema Funciona](#como-o-sistema-funciona)
7. [APIs Disponíveis](#apis-disponíveis)
8. [Implementação em Novas Funcionalidades](#implementação-em-novas-funcionalidades)
9. [Exemplos Práticos](#exemplos-práticos)
10. [Migração e Configuração Inicial](#migração-e-configuração-inicial)
11. [Testes e Validação](#testes-e-validação)
12. [Considerações de Segurança](#considerações-de-segurança)
13. [Expansão Futura](#expansão-futura)

## Introdução

O Sistema de Categorias de Usuários (também conhecido como sistema de roles) é uma implementação que permite categorizar usuários em diferentes perfis, controlando o acesso a funcionalidades e recursos da aplicação de forma granular e segura.

Este sistema foi projetado para atender à necessidade de restringir certas áreas do aplicativo apenas para tipos específicos de usuários, como administradores, membros da equipe de produção, Zero Um, Pensi, entre outros.

### Principais Benefícios

- **Controle de acesso granular**: Define diferentes níveis de permissão para várias partes do sistema
- **Segurança aprimorada**: Garante que usuários só acessem o que têm permissão
- **Flexibilidade**: Permite adicionar novas categorias conforme necessário
- **Escalabilidade**: Design que suporta a expansão do sistema sem alterações estruturais

## Arquitetura da Solução

O sistema foi implementado seguindo padrões de arquitetura em camadas (n-tier) e princípios SOLID, com separação clara de responsabilidades:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    Model    │◄────►│   Service   │◄────►│ Controller  │
└─────────────┘      └─────────────┘      └─────────────┘
                                                 ▲
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │ Middleware  │
                                          └─────────────┘
                                                 ▲
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │   Routes    │
                                          └─────────────┘
```

### Componentes Principais

1. **Modelos**:
   - `CategoriaUsuario`: Define a estrutura de categorias de usuários
   - `Usuario`: Modelo existente expandido para incluir relacionamento com categorias

2. **Serviços**:
   - `categoriaUsuarioService`: Encapsula toda a lógica de negócio relacionada às categorias

3. **Controllers**:
   - `categoriaUsuarioController`: Gerencia operações CRUD para categorias
   - `usuarioController`: Expandido para incluir operações relacionadas a categorias

4. **Middlewares**:
   - `roleMiddleware`: Verifica permissões baseadas em categoria
   - `authMiddleware`: Modificado para incluir informações de categoria

5. **Helpers**:
   - `permissionHelpers`: Funções utilitárias para verificações de acesso

## Modelo de Dados

### CategoriaUsuario

```javascript
const CategoriaUsuario = sequelize.define("CategoriaUsuario", {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  descricao: {
    type: DataTypes.STRING
  },
  nivelAcesso: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  isAtivo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "CategoriaUsuarios"
});
```

### Relacionamento com Usuário

```javascript
Usuario.belongsTo(CategoriaUsuario, {
  foreignKey: 'categoriaId',
  as: 'categoria'
});

CategoriaUsuario.hasMany(Usuario, {
  foreignKey: 'categoriaId',
  as: 'usuarios'
});
```

## Categorias Padrão

O sistema inicializa com as seguintes categorias pré-definidas:

| Nome          | Nível de Acesso | Descrição                             |
|---------------|-----------------|---------------------------------------|
| administrador | 10              | Acesso total ao sistema               |
| producao      | 5               | Acesso às funcionalidades de produção |
| zerohum       | 5               | Acesso às funcionalidades da Zero Um  |
| pensi         | 5               | Acesso às funcionalidades da Pensi    |
| visualizador  | 1               | Acesso apenas para visualização       |

## Níveis de Acesso

Os níveis de acesso são valores numéricos que determinam o grau de permissão de uma categoria. Quanto maior o número, maior o acesso:

| Nível | Permissão          | Descrição                                    |
|-------|--------------------|--------------------------------------------- |
| 1     | Visualizar         | Acesso apenas para leitura de dados          |
| 5     | Editar/Criar       | Pode criar e modificar registros             |
| 8     | Excluir            | Pode excluir registros                       |
| 10    | Administrar        | Acesso total, incluindo configurações        |

## Como o Sistema Funciona

### Fluxo de Autenticação e Autorização

1. **Login**:
   - Usuário faz login com email e senha
   - Sistema verifica credenciais e identifica a categoria do usuário
   - Token JWT é gerado incluindo informações da categoria

2. **Token JWT**:
   ```javascript
   // Payload exemplo
   {
     "id": 1,
     "email": "usuario@exemplo.com",
     "is_admin": true,
     "categoria": {
       "id": 1,
       "nome": "administrador",
       "nivelAcesso": 10
     },
     "iat": 1590511954,
     "exp": 1590598354
   }
   ```

3. **Autorização em Rotas**:
   - Middleware `authMiddleware` extrai dados do usuário do token
   - Middleware `roleMiddleware` verifica se o usuário tem permissão adequada
   - Acesso é concedido ou negado com base nas verificações

### Verificação de Permissões

#### Por Categoria

```javascript
// Verificando por nome de categoria
roleMiddleware(['administrador', 'producao'])

// Verificando por ID de categoria
roleMiddleware([1, 2])
```

#### Por Nível de Acesso

```javascript
// Verificando por nível mínimo de acesso
roleMiddleware(null, 5)
```

#### Por Área Funcional Pré-definida

```javascript
// Áreas funcionais pré-configuradas
acessoArea('producao')  // Restringe para usuários com acesso à área de produção
```

## APIs Disponíveis

### API para Gerenciamento de Categorias

| Método | Endpoint                       | Descrição                         | Permissão Necessária   |
|--------|--------------------------------|-----------------------------------|------------------------|
| GET    | `/api/categorias`              | Lista todas as categorias         | Usuário autenticado    |
| GET    | `/api/categorias/:id`          | Retorna uma categoria específica  | Usuário autenticado    |
| POST   | `/api/categorias`              | Cria uma nova categoria           | Administrador          |
| PUT    | `/api/categorias/:id`          | Atualiza uma categoria existente  | Administrador          |
| PATCH  | `/api/categorias/:id/status`   | Ativa/desativa uma categoria      | Administrador          |

### API para Gerenciamento de Usuários e suas Categorias

| Método | Endpoint                       | Descrição                         | Permissão Necessária   |
|--------|--------------------------------|-----------------------------------|------------------------|
| GET    | `/api/usuarios`                | Lista todos os usuários           | Administrador          |
| GET    | `/api/usuarios/:id`            | Retorna um usuário específico     | Administrador          |
| POST   | `/api/usuarios`                | Cria um novo usuário              | Administrador          |
| PUT    | `/api/usuarios/:id`            | Atualiza um usuário existente     | Administrador          |
| PATCH  | `/api/usuarios/:id/status`     | Ativa/desativa um usuário         | Administrador          |
| PATCH  | `/api/usuarios/:id/categoria`  | Altera a categoria de um usuário  | Administrador          |

## Implementação em Novas Funcionalidades

### 1. Protegendo Rotas

```javascript
const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware');
const { roleMiddleware } = require('../auth/roleMiddleware');
const { acessoArea, acessoAcao } = require('../auth/permissionHelpers');
const meuController = require('../controllers/meuController');

// Rota acessível para todos os usuários autenticados
router.get('/', authMiddleware(), meuController.listar);

// Rota acessível apenas para administradores
router.post('/', authMiddleware(), roleMiddleware(['administrador']), meuController.criar);

// Rota acessível para usuários com nível de acesso 5 ou superior
router.put('/:id', authMiddleware(), roleMiddleware(null, 5), meuController.atualizar);

// Rota acessível apenas para usuários da área de produção
router.get('/relatorios', authMiddleware(), acessoArea('producao'), meuController.relatorios);

// Rota acessível apenas para usuários com permissão de exclusão
router.delete('/:id', authMiddleware(), acessoAcao('excluir'), meuController.excluir);

module.exports = router;
```

### 2. Verificando Permissões em Controllers

```javascript
const categoriaUsuarioService = require('../services/categoriaUsuarioService');

async function minhaFuncao(req, res) {
  try {
    // Verificar permissão específica
    const temPermissao = await categoriaUsuarioService.verificarPermissaoUsuario(
      req.usuario.id,
      ['administrador', 'zerohum'],
      5
    );
    
    if (!temPermissao) {
      return res.status(403).json({ mensagem: "Acesso não autorizado para esta função" });
    }
    
    // Lógica da função continua aqui...
    res.json({ mensagem: "Operação realizada com sucesso" });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
}
```

## Exemplos Práticos

### Exemplo 1: Criar um Novo Usuário com Categoria Específica

**Requisição:**
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

**Resposta:**
```json
{
  "id": 7,
  "nome": "João Silva",
  "email": "joao.silva@exemplo.com",
  "is_admin": false,
  "is_ativo": true,
  "criado_em": "2025-05-27T14:30:00.000Z",
  "atualizado_em": "2025-05-27T14:30:00.000Z",
  "categoria": {
    "id": 2,
    "nome": "producao",
    "nivelAcesso": 5
  }
}
```

### Exemplo 2: Alterar a Categoria de um Usuário

**Requisição:**
```http
PATCH /api/usuarios/5/categoria
Content-Type: application/json
Authorization: Bearer <token>

{
  "categoriaId": 3,
  "manterAdmin": false
}
```

**Resposta:**
```json
{
  "usuario": {
    "id": 5,
    "nome": "Maria Oliveira",
    "email": "maria.oliveira@exemplo.com",
    "is_admin": false,
    "is_ativo": true,
    "categoria": {
      "id": 3,
      "nome": "zerohum",
      "nivelAcesso": 5
    }
  },
  "mensagem": "Categoria do usuário alterada para 'zerohum' com sucesso"
}
```

### Exemplo 3: Criar uma Nova Categoria

**Requisição:**
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

**Resposta:**
```json
{
  "id": 6,
  "nome": "suporte",
  "descricao": "Equipe de suporte ao cliente",
  "nivelAcesso": 3,
  "isAtivo": true,
  "criado_em": "2025-05-27T14:35:00.000Z",
  "atualizado_em": "2025-05-27T14:35:00.000Z"
}
```

## Migração e Configuração Inicial

### Scripts Disponíveis

1. **Atualizar Esquema do Banco de Dados**:
   ```bash
   node scripts/migrations/20250527_UpdateUsuarioSchema.js
   ```
   Este script adiciona as colunas necessárias à tabela de usuários:
   - `categoriaId` - Relacionamento com a tabela de categorias
   - `preferencias` - Campo JSON para armazenar preferências do usuário

2. **Criar Categorias Iniciais e Migrar Usuários**:
   ```bash
   node scripts/migrations/20250527_AddCategoriasUsuario.js
   ```
   Este script:
   - Cria as categorias padrão se não existirem
   - Associa usuários existentes às categorias adequadas:
     - Usuários com `is_admin = true` → categoria "administrador"
     - Usuários com `is_admin = false` → categoria "visualizador"

3. **Criar Usuário Admin**:
   ```bash
   node scripts/criarUsuarioAdmin.js
   ```
   Este script cria ou atualiza um usuário administrador padrão com:
   - Email: `admin@sistemaCDG.com`
   - Senha: `senha123`
   - Categoria: `administrador`

### Ordem de Execução Recomendada

1. Atualizar esquema do banco de dados
2. Criar categorias iniciais e migrar usuários
3. Criar usuário admin (opcional, se necessário)

## Testes e Validação

Um script de teste está disponível para validar o funcionamento do sistema:

```bash
node scripts/testarCategorias.js
```

Este script executa os seguintes testes:

1. Login com usuário administrador
2. Listagem de categorias
3. Criação de usuários de teste para cada categoria
4. Testes de acesso a rotas protegidas com diferentes níveis de permissão
5. Alteração de categoria de um usuário
6. Verificação de tokens e informações de usuário

## Considerações de Segurança

### Boas Práticas Implementadas

- **Token JWT com informações mínimas**: Apenas o necessário é incluído no token
- **Validação em camadas**: Tanto no frontend quanto no backend
- **Middleware para rotas**: Proteção consistente das rotas
- **Níveis de acesso graduais**: Permissões incrementais baseadas em níveis

### Recomendações

- **Rotação de tokens**: Implementar refresh tokens para maior segurança
- **Auditoria**: Considerar adicionar logs de auditoria para ações sensíveis
- **Senhas fortes**: Exigir senhas fortes para contas com altos privilégios

## Expansão Futura

O sistema foi projetado para ser facilmente expandido. Algumas possibilidades:

### Adição de Permissões Específicas

Além das categorias, um sistema mais granular de permissões específicas pode ser implementado:

```javascript
const permissoes = {
  'gerenciar_usuarios': ['administrador'],
  'emitir_relatorios': ['administrador', 'producao', 'zerohum'],
  'ver_dashboard': ['administrador', 'producao', 'zerohum', 'pensi']
};
```

### Categorias Dinâmicas

Implementação de um sistema para que administradores possam criar novas categorias e definir permissões através de uma interface web.

### Integração com Sistemas Externos

O sistema pode ser expandido para sincronizar com sistemas externos de gerenciamento de identidade e acesso (IAM).

---

## Suporte e Contato

Para suporte ou esclarecimentos sobre esta documentação, entre em contato com a equipe de desenvolvimento.

---

*Documentação atualizada em: 27 de maio de 2025*
