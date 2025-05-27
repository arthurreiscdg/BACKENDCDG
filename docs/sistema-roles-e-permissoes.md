# Sistema de Roles e Permissões

Este documento descreve o sistema de controle de acesso baseado em roles e permissões implementado na aplicação.

## Roles Disponíveis

| Role | Descrição | Permissões Principais |
|------|-----------|----------------------|
| **Admin** | Permissão total do sistema | Acesso completo a todas as funcionalidades |
| **Dev** | Integrações e API e acesso total ao sistema | Acesso completo com foco em APIs e integrações |
| **Gerente** | Consultas e alteração de status | Visualização de relatórios, alteração de status e consultas |
| **Usuário (PCP)** | Baixar pedidos | Visualização de pedidos e download de relatórios |
| **Expedição** | Baixar etiquetas e alterar status para enviado | Gerenciamento do fluxo de envio de pedidos |
| **Escola** | Acesso somente à sua área | Visualização apenas dos pedidos da própria escola |
| **Visitante** | Apenas visualização | Acesso somente leitura ao sistema |

## Permissões por Funcionalidade

### Pedidos

| Funcionalidade | Roles com Acesso |
|----------------|------------------|
| Visualizar Pedidos | Admin, Dev, Gerente, Usuário, Expedição, Visitante |
| Visualizar Pedidos Específicos | Escola (apenas seus próprios pedidos) |
| Criar Pedidos | Admin, Dev, Gerente, Usuário |
| Editar Pedidos | Admin, Dev, Gerente |
| Excluir Pedidos | Admin, Dev |
| Alterar Status | Admin, Dev, Gerente, Usuário, Expedição* |
| Baixar Relatórios | Admin, Dev, Gerente, Usuário |
| Baixar Etiquetas | Admin, Dev, Gerente, Expedição |

*A role Expedição só pode alterar para status relacionados a envio (enviado, em_transporte, entregue).

### Usuários

| Funcionalidade | Roles com Acesso |
|----------------|------------------|
| Visualizar Usuários | Admin, Dev, Gerente |
| Criar Usuários | Admin, Dev |
| Editar Usuários | Admin, Dev |
| Definir Roles | Admin |
| Desativar Usuários | Admin, Dev |

### Formulários

| Funcionalidade | Roles com Acesso |
|----------------|------------------|
| Visualizar Formulários | Todas as roles |
| Editar Formulários | Admin, Dev, Gerente |
| Excluir Formulários | Admin, Dev |

### Integrações e API

| Funcionalidade | Roles com Acesso |
|----------------|------------------|
| Gerenciar Webhooks | Admin, Dev |
| Gerenciar Integrações | Admin, Dev |
| Acessar API | Admin, Dev |

## Como Implementar Verificações de Permissão

### Em Rotas

```javascript
const { verificarRole, verificarPermissao } = require('../auth/permissaoMiddleware');

// Verificar por role
router.get('/rota-protegida', verificarRole(['admin', 'gerente']), controller.metodo);

// Verificar por permissão específica
router.get('/outra-rota', verificarPermissao('pedidos.visualizar'), controller.metodo);
```

### Com Filtro por Escola

```javascript
const { filtrarPorEscola } = require('../auth/escolaMiddleware');

// Aplicar filtro automático por escola
router.get('/pedidos', filtrarPorEscola, pedidoController.listarPedidos);
```

### No Controller

```javascript
// No controller, verificar se req.filtroEscola existe e aplicar o filtro
const listarPedidos = async (req, res) => {
  try {
    let whereClause = {};
    
    // Se existe filtro por escola, aplicar
    if (req.filtroEscola) {
      whereClause = { ...whereClause, ...req.filtroEscola };
    }
    
    const pedidos = await Pedido.findAll({ where: whereClause });
    return res.json(pedidos);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao listar pedidos" });
  }
};
```

## Como Atribuir Roles a Usuários

Para atribuir uma role a um usuário, use o serviço de permissões:

```javascript
const permissaoService = require('../services/permissaoService');

// Definir uma role padrão
await permissaoService.definirRole(usuarioId, 'gerente');

// Configurar um usuário como associado a uma escola
await permissaoService.configurarUsuarioEscola(usuarioId, escolaId);
```

## Sincronização do Banco de Dados

Para criar as tabelas necessárias e inicializar as permissões padrão, execute os scripts:

```bash
node scripts/syncDatabase.js --alter
node scripts/inicializarPermissoes.js
```
