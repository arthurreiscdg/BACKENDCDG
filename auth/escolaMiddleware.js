const { Usuario } = require('../models');
const { ROLES_PADRAO } = require('../scripts/inicializarPermissoes');

/**
 * Middleware para verificar se o usuário tem acesso a uma escola específica
 * @param {function} getEscolaId - Função que extrai o ID da escola do request
 * @returns {function} - Middleware Express
 */
const verificarAcessoEscola = (getEscolaId) => {
  return async (req, res, next) => {
    try {
      // Verifica se o usuário está autenticado
      if (!req.usuario || !req.usuario.id) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const usuario = await Usuario.findByPk(req.usuario.id);

      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Se o usuário for admin ou dev, tem acesso a todas as escolas
      if (req.usuario.is_admin || (usuario.roles && usuario.roles.includes('admin') || usuario.roles.includes('dev'))) {
        return next();
      }

      // Se o usuário tiver a role de 'gerente', também tem acesso a todas as escolas
      if (usuario.roles && usuario.roles.includes('gerente')) {
        return next();
      }

      // Para usuários com role 'escola', verifica se tem acesso específico à escola solicitada
      if (usuario.roles && usuario.roles.includes('escola')) {
        // Obtém o ID da escola a partir do request
        const escolaIdSolicitada = getEscolaId(req);
        
        // Se não for possível determinar o ID da escola, nega o acesso
        if (!escolaIdSolicitada) {
          return res.status(400).json({ message: "ID da escola não especificado" });
        }
        
        // Verifica se o usuário tem acesso à escola específica
        if (usuario.escola_id === parseInt(escolaIdSolicitada)) {
          return next();
        } else {
          return res.status(403).json({ 
            message: "Acesso negado. Você só tem permissão para acessar a sua escola." 
          });
        }
      }

      // Se chegou aqui, o usuário não tem a role 'escola', então verificamos se tem outras permissões
      // Passa para o próximo middleware (que pode ser outro verificador de permissões)
      return next();
    } catch (error) {
      console.error("Erro ao verificar acesso à escola:", error);
      return res.status(500).json({ message: "Erro ao verificar permissões de acesso à escola" });
    }
  };
};

/**
 * Middleware para filtrar dados de pedidos por escola
 * Permite que todos os usuários vejam os dados, mas para usuários com role 'escola',
 * filtra os resultados para mostrar apenas os da escola específica
 */
const filtrarPorEscola = async (req, res, next) => {
  try {
    // Se não há usuário autenticado, não faz nada
    if (!req.usuario || !req.usuario.id) {
      return next();
    }

    const usuario = await Usuario.findByPk(req.usuario.id);

    // Se o usuário tiver a role 'escola', define um filtro no request
    if (usuario && usuario.roles && usuario.roles.includes('escola')) {
      // Adiciona um filtro ao objeto de request para ser usado nos controllers
      req.filtroEscola = { escola_id: usuario.escola_id };
      
      // Se houver query params para paginação, também podemos adicioná-los aqui
      if (req.query) {
        req.query.escola_id = usuario.escola_id;
      }
    }

    next();
  } catch (error) {
    console.error("Erro ao aplicar filtro de escola:", error);
    return res.status(500).json({ message: "Erro ao processar filtro de acesso por escola" });
  }
};

module.exports = {
  verificarAcessoEscola,
  filtrarPorEscola
};
