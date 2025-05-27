const { Usuario, Permissao } = require('../models');
const { ROLES_PADRAO, MAPEAMENTO_ROLE_PERMISSAO } = require('../scripts/inicializarPermissoes');

/**
 * Serviço para gerenciamento de permissões
 */
const permissaoService = {
  /**
   * Cria uma nova permissão
   * @param {Object} dados - Dados da permissão
   * @returns {Promise<Object>} - Permissão criada
   */
  criarPermissao: async (dados) => {
    try {
      const permissao = await Permissao.create(dados);
      return permissao;
    } catch (error) {
      console.error('Erro ao criar permissão:', error);
      throw error;
    }
  },

  /**
   * Associa permissão a um usuário
   * @param {number} usuarioId - ID do usuário
   * @param {number} permissaoId - ID da permissão
   * @returns {Promise<void>}
   */
  associarPermissaoUsuario: async (usuarioId, permissaoId) => {
    try {
      const usuario = await Usuario.findByPk(usuarioId);
      const permissao = await Permissao.findByPk(permissaoId);
      
      if (!usuario || !permissao) {
        throw new Error('Usuário ou permissão não encontrados');
      }
      
      await usuario.addPermissao(permissao);
    } catch (error) {
      console.error('Erro ao associar permissão ao usuário:', error);
      throw error;
    }
  },

  /**
   * Remove associação de permissão de um usuário
   * @param {number} usuarioId - ID do usuário
   * @param {number} permissaoId - ID da permissão
   * @returns {Promise<void>}
   */
  removerPermissaoUsuario: async (usuarioId, permissaoId) => {
    try {
      const usuario = await Usuario.findByPk(usuarioId);
      const permissao = await Permissao.findByPk(permissaoId);
      
      if (!usuario || !permissao) {
        throw new Error('Usuário ou permissão não encontrados');
      }
      
      await usuario.removePermissao(permissao);
    } catch (error) {
      console.error('Erro ao remover permissão do usuário:', error);
      throw error;
    }
  },

  /**
   * Verifica se um usuário tem uma permissão específica
   * @param {number} usuarioId - ID do usuário
   * @param {string} codigoPermissao - Código da permissão
   * @returns {Promise<boolean>} - True se o usuário tem a permissão, false caso contrário
   */
  verificarPermissao: async (usuarioId, codigoPermissao) => {
    try {
      const usuario = await Usuario.findByPk(usuarioId, {
        include: [{
          model: Permissao,
          where: { codigo: codigoPermissao },
          required: false
        }]
      });
      
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      
      return usuario.Permissaos && usuario.Permissaos.length > 0;
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      throw error;
    }
  },
  /**
   * Atualiza as roles de um usuário
   * @param {number} usuarioId - ID do usuário
   * @param {Array<string>} roles - Array de roles
   * @returns {Promise<Object>} - Usuário atualizado
   */
  atualizarRoles: async (usuarioId, roles) => {
    try {
      const usuario = await Usuario.findByPk(usuarioId);
      
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      
      usuario.roles = roles;
      await usuario.save();
      return usuario;
    } catch (error) {
      console.error('Erro ao atualizar roles do usuário:', error);
      throw error;
    }
  },
  
  /**
   * Define a role de um usuário para uma das roles padrão e atribui as permissões correspondentes
   * @param {number} usuarioId - ID do usuário
   * @param {string} role - Nome da role (uma das definidas em ROLES_PADRAO)
   * @returns {Promise<Object>} - Usuário atualizado
   */
  definirRole: async (usuarioId, role) => {
    try {
      if (!ROLES_PADRAO[role]) {
        throw new Error(`Role "${role}" não está definida no sistema`);
      }
      
      const usuario = await Usuario.findByPk(usuarioId);
      
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      
      // Define a role
      usuario.roles = ROLES_PADRAO[role];
      await usuario.save();
      
      // Associa permissões correspondentes
      if (MAPEAMENTO_ROLE_PERMISSAO[role]) {
        const permissoes = await Permissao.findAll({
          where: { codigo: MAPEAMENTO_ROLE_PERMISSAO[role] }
        });
        
        await usuario.setPermissaos(permissoes);
      }
      
      return usuario;
    } catch (error) {
      console.error(`Erro ao definir role "${role}" para o usuário:`, error);
      throw error;
    }
  },
  
  /**
   * Configura um usuário como usuário de uma escola específica
   * @param {number} usuarioId - ID do usuário
   * @param {number} escolaId - ID da escola
   * @returns {Promise<Object>} - Usuário atualizado
   */
  configurarUsuarioEscola: async (usuarioId, escolaId) => {
    try {
      const usuario = await Usuario.findByPk(usuarioId);
      
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      
      // Define a role como 'escola'
      usuario.roles = ROLES_PADRAO.escola;
      
      // Define o ID da escola
      usuario.escola_id = escolaId;
      
      await usuario.save();
      
      // Associa permissões da role 'escola'
      if (MAPEAMENTO_ROLE_PERMISSAO.escola) {
        const permissoes = await Permissao.findAll({
          where: { codigo: MAPEAMENTO_ROLE_PERMISSAO.escola }
        });
        
        await usuario.setPermissaos(permissoes);
      }
      
      return usuario;
    } catch (error) {
      console.error(`Erro ao configurar usuário como associado à escola ID ${escolaId}:`, error);
      throw error;
    }
  },
  
  /**
   * Obtém uma lista de todas as roles disponíveis no sistema
   * @returns {Object} - Objeto com as roles disponíveis
   */
  obterRolesDisponiveis: () => {
    return ROLES_PADRAO;
  }
};

module.exports = permissaoService;
