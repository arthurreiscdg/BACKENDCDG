const { Usuario, Permissao } = require('../models');

/**
 * Middleware para verificar se o usuário possui uma permissão específica
 * @param {string} codigoPermissao - Código da permissão necessária
 * @returns {function} - Middleware Express
 */
const verificarPermissao = (codigoPermissao) => {
  return async (req, res, next) => {
    try {
      // Verifica se o usuário está autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Se o usuário for admin, sempre permite o acesso
      if (req.usuario.is_admin) {
        return next();
      }

      const usuario = await Usuario.findByPk(req.usuario.id, {
        include: [{
          model: Permissao,
          where: { codigo: codigoPermissao },
          required: false
        }]
      });

      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Verifica se o usuário possui a permissão necessária
      if (usuario.Permissaos && usuario.Permissaos.length > 0) {
        return next();
      }

      // Verifica se o usuário tem a role necessária baseado em uma convenção
      // Por exemplo, se o código da permissão for "pedidos.visualizar", verifica se tem role "gestor_pedidos"
      const roleNecessaria = codigoPermissao.split('.')[0];
      if (usuario.roles && Array.isArray(usuario.roles)) {
        const temRole = usuario.roles.some(role => 
          role.includes(roleNecessaria) || role === 'super_usuario'
        );
        
        if (temRole) {
          return next();
        }
      }

      // Acesso negado
      return res.status(403).json({ 
        message: "Acesso negado. Você não possui permissão para acessar este recurso." 
      });
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      return res.status(500).json({ message: "Erro ao verificar permissão" });
    }
  };
};

/**
 * Middleware para verificar se o usuário possui uma das roles especificadas
 * @param {Array<string>} rolesPermitidas - Array de roles permitidas
 * @returns {function} - Middleware Express
 */
const verificarRole = (rolesPermitidas) => {
  return async (req, res, next) => {
    try {
      // Verifica se o usuário está autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Se o usuário for admin, sempre permite o acesso
      if (req.usuario.is_admin) {
        return next();
      }
      
      // Se o usuário tem role 'dev', considera como admin
      const usuario = await Usuario.findByPk(req.usuario.id);

      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Dev tem quase os mesmos privilégios de admin
      if (usuario.roles && usuario.roles.includes('dev')) {
        return next();
      }

      // Verifica se o usuário tem alguma das roles necessárias
      if (usuario.roles && Array.isArray(usuario.roles)) {
        const temRole = usuario.roles.some(role => 
          rolesPermitidas.includes(role) || 
          role === 'super_usuario' ||
          // Garante que admin e dev sempre têm acesso
          role === 'admin' || 
          role === 'dev'
        );
        
        if (temRole) {
          return next();
        }
      }

      // Acesso negado
      return res.status(403).json({ 
        message: "Acesso negado. Você não possui a função necessária para acessar este recurso." 
      });
    } catch (error) {
      console.error("Erro ao verificar role:", error);
      return res.status(500).json({ message: "Erro ao verificar role" });
    }
  };
};

/**
 * Middleware para verificar se o usuário tem permissão para baixar pedidos
 */
const verificarPermissaoBaixarPedidos = (req, res, next) => {
  const rolesPermitidas = ['admin', 'usuario', 'dev', 'gerente'];
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
    return next();
  }

  return res.status(403).json({ message: "Você não tem permissão para baixar pedidos" });
};

/**
 * Middleware para verificar se o usuário tem permissão para baixar etiquetas
 */
const verificarPermissaoBaixarEtiquetas = (req, res, next) => {
  const rolesPermitidas = ['admin', 'expedicao', 'dev', 'gerente'];
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
    return next();
  }

  return res.status(403).json({ message: "Você não tem permissão para baixar etiquetas" });
};

module.exports = {
  verificarPermissao,
  verificarRole,
  verificarPermissaoBaixarPedidos,
  verificarPermissaoBaixarEtiquetas
};
