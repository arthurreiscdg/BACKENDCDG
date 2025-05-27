const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarAutenticacao } = require('../auth/authMiddleware');
const { verificarPermissao, verificarRole } = require('../auth/permissaoMiddleware');

// Rotas públicas (sem autenticação)
// Nenhuma rota pública para usuários

// Rotas protegidas (com autenticação)
router.use(verificarAutenticacao);

// Listar todos os usuários (apenas admin ou gerente)
router.get('/', verificarRole(['admin', 'dev', 'gerente']), usuarioController.listar);

// Obter usuário por ID (admin, dev, gerente e o próprio usuário)
router.get('/:id', (req, res, next) => {
  // Se for o próprio usuário, permite acesso
  if (req.usuario && req.usuario.id === parseInt(req.params.id)) {
    return next();
  }
  // Caso contrário, verifica as roles com permissão
  verificarRole(['admin', 'dev', 'gerente'])(req, res, next);
}, usuarioController.obterPorId);

// Criar novo usuário (apenas admin)
router.post('/', verificarRole(['admin', 'dev']), usuarioController.criar);

// Atualizar usuário (admin, dev ou o próprio usuário)
router.put('/:id', (req, res, next) => {
  // Se for o próprio usuário, permite acesso com restrições
  if (req.usuario && req.usuario.id === parseInt(req.params.id)) {
    // Remove campos que o usuário não pode alterar sobre si mesmo
    delete req.body.is_admin;
    delete req.body.is_ativo;
    delete req.body.roles;
    return next();
  }
  // Caso contrário, verifica as roles com permissão
  verificarRole(['admin', 'dev'])(req, res, next);
}, usuarioController.atualizar);

// Desativar usuário (apenas admin)
router.delete('/:id', verificarRole(['admin', 'dev']), usuarioController.desativar);

// Definir role para usuário (apenas admin)
router.post('/:id/roles', verificarRole(['admin']), usuarioController.definirRole);

// Configurar usuário como associado a uma escola (apenas admin)
router.post('/:id/escola', verificarRole(['admin']), usuarioController.configurarUsuarioEscola);

// Listar todas as roles disponíveis (admin, dev)
router.get('/sistema/roles', verificarRole(['admin', 'dev']), usuarioController.listarRoles);

module.exports = router;
