# Guia Rápido: Sistema de Categorias de Usuários

Este guia oferece uma visão geral rápida de como utilizar o sistema de categorias de usuários em novos desenvolvimentos.

## Conceitos Básicos

- **Categorias**: Perfis de usuário como administrador, producao, zerohum, pensi, visualizador
- **Níveis de acesso**: Valores numéricos que determinam grau de permissão (1=visualizar, 5=editar, 8=excluir, 10=admin)
- **Áreas funcionais**: Setores predefinidos da aplicação (admin, producao, zerohum, pensi)

## Como Proteger Rotas

### 1. Importar os middlewares necessários

```javascript
const authMiddleware = require('../auth/authMiddleware');
const { roleMiddleware } = require('../auth/roleMiddleware');
const { acessoArea, acessoAcao } = require('../auth/permissionHelpers');
```

### 2. Aplicar nas rotas

#### Proteger por categoria específica

```javascript
// Apenas administradores
router.post('/', authMiddleware(), roleMiddleware(['administrador']), controller.metodo);

// Administradores ou usuários de produção
router.get('/relatorio', authMiddleware(), roleMiddleware(['administrador', 'producao']), controller.metodo);
```

#### Proteger por nível de acesso

```javascript
// Usuários com nível 5 ou superior (podem editar)
router.put('/:id', authMiddleware(), roleMiddleware(null, 5), controller.metodo);

// Usuários com nível 8 ou superior (podem excluir)
router.delete('/:id', authMiddleware(), roleMiddleware(null, 8), controller.metodo);
```

#### Proteger por área funcional

```javascript
// Área de produção
router.get('/dashboard', authMiddleware(), acessoArea('producao'), controller.metodo);

// Área administrativa
router.get('/config', authMiddleware(), acessoArea('admin'), controller.metodo);
```

#### Proteger por tipo de ação

```javascript
// Ação de visualização (nível 1)
router.get('/', authMiddleware(), acessoAcao('visualizar'), controller.metodo);

// Ação de edição (nível 5)
router.put('/', authMiddleware(), acessoAcao('editar'), controller.metodo);

// Ação de exclusão (nível 8)
router.delete('/', authMiddleware(), acessoAcao('excluir'), controller.metodo);

// Ação de gerenciamento (nível 10)
router.post('/config', authMiddleware(), acessoAcao('gerenciar'), controller.metodo);
```

## Verificações em Controllers

### Importar o serviço

```javascript
const categoriaUsuarioService = require('../services/categoriaUsuarioService');
```

### Verificar permissão

```javascript
async function minhaFuncao(req, res) {
  // Verificar se tem permissão específica
  const temPermissao = await categoriaUsuarioService.verificarPermissaoUsuario(
    req.usuario.id,      // ID do usuário
    ['administrador'],   // Categorias permitidas (opcional)
    5                    // Nível mínimo de acesso (opcional)
  );
  
  if (!temPermissao) {
    return res.status(403).json({ mensagem: "Sem permissão" });
  }
  
  // Continuar com a lógica da função
}
```

### Helper simplificado para verificações

```javascript
const { temAcessoArea } = require('../auth/permissionHelpers');

function outroMetodo(req, res) {
  if (!temAcessoArea(req.usuario, 'producao')) {
    return res.status(403).json({ mensagem: "Sem acesso à área de produção" });
  }
  
  // Continuar com a lógica
}
```

## Informações do Usuário Logado

O objeto `req.usuario` contém:

```javascript
{
  id: 1,
  email: "usuario@exemplo.com",
  is_admin: true,
  categoria: {
    id: 1,
    nome: "administrador",
    nivelAcesso: 10
  }
}
```

## Recursos Disponíveis

- **Models**: `Usuario` e `CategoriaUsuario`
- **Services**: `categoriaUsuarioService`
- **Controllers**: `categoriaUsuarioController`, `usuarioController`
- **Middlewares**: `authMiddleware`, `roleMiddleware`
- **Helpers**: `permissionHelpers`

## Documentação Completa

Para informações mais detalhadas, consulte:
- [Documentação completa do sistema de categorias](sistema-categorias-usuarios-completo.md)
- [Exemplo prático de implementação](./exemplos/exemplo_controle_acesso.js)
