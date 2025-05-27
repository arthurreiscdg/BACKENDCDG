const { filtrarPorEscola, verificarAcessoEscola } = require('../auth/escolaMiddleware');
const { verificarPermissaoBaixarPedidos, verificarPermissaoBaixarEtiquetas } = require('../auth/permissaoMiddleware');

/**
 * Middleware para verificar se o usuário pode visualizar um pedido específico
 */
const verificarPermissaoPedido = (req, res, next) => {
  // Este middleware combina a verificação de escola e filtro
  // para garantir que o usuário só veja os pedidos aos quais tem acesso
  return filtrarPorEscola(req, res, next);
};

/**
 * Middleware para verificar se o usuário pode alterar status de um pedido
 */
const verificarPermissaoAlterarStatus = (req, res, next) => {
  const rolesPermitidas = ['admin', 'dev', 'gerente', 'usuario', 'expedicao'];
  const usuario = req.usuario;

  if (!usuario) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  // Admin e Dev sempre têm acesso
  if (usuario.is_admin || (usuario.roles && (usuario.roles.includes('admin') || usuario.roles.includes('dev')))) {
    return next();
  }

  // Verifica roles permitidas
  if (usuario.roles && usuario.roles.some(role => rolesPermitidas.includes(role))) {
    // Usuários com role específica de expedicao só podem alterar para os status relacionados
    if (usuario.roles.includes('expedicao')) {
      // Se não for alteração para status "enviado" ou similares
      const { novoStatus } = req.body;
      if (novoStatus && !['enviado', 'entregue', 'em_transporte'].includes(novoStatus.toLowerCase())) {
        return res.status(403).json({ 
          message: "Você só tem permissão para alterar o status para situações de envio" 
        });
      }
    }
    return next();
  }

  return res.status(403).json({ message: "Você não tem permissão para alterar o status deste pedido" });
};

/**
 * Verifica acesso por escola a um pedido específico
 */
const verificarAcessoEscolaPedido = verificarAcessoEscola((req) => {
  // Extrai o ID da escola a partir do pedido
  // Esta implementação depende da estrutura dos seus dados
  if (req.params.id) {
    // Se estiver consultando um pedido específico
    return req.params.escolaId;
  } else if (req.body && req.body.escolaId) {
    // Se estiver enviando dados em um POST/PUT
    return req.body.escolaId;
  }
  return null;
});

module.exports = {
  verificarPermissaoPedido,
  verificarPermissaoAlterarStatus,
  verificarAcessoEscolaPedido,
  verificarPermissaoBaixarPedidos,
  verificarPermissaoBaixarEtiquetas
};
