const { Usuario, Permissao } = require('../models');
const permissaoService = require('../services/permissaoService');
const { ROLES_PADRAO } = require('../scripts/inicializarPermissoes');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Controller para gerenciamento de usuários
 */
const usuarioController = {
  /**
   * Lista todos os usuários
   */
  listar: async (req, res) => {
    try {
      const usuarios = await Usuario.findAll({
        attributes: { exclude: ['senha_hash'] },
        include: [{ model: Permissao, through: { attributes: [] } }]
      });
      return res.json(usuarios);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ message: 'Erro ao listar usuários' });
    }
  },

  /**
   * Obtém um usuário pelo ID
   */
  obterPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const usuario = await Usuario.findByPk(id, {
        attributes: { exclude: ['senha_hash'] },
        include: [{ model: Permissao, through: { attributes: [] } }]
      });

      if (!usuario) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      return res.json(usuario);
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      return res.status(500).json({ message: 'Erro ao obter usuário' });
    }
  },

  /**
   * Cria um novo usuário
   */
  criar: async (req, res) => {
    try {
      const { nome, email, senha, is_admin = false, roles = ['usuario'] } = req.body;

      // Verifica se o e-mail já existe
      const existente = await Usuario.findOne({ where: { email } });
      if (existente) {
        return res.status(400).json({ message: 'E-mail já cadastrado' });
      }

      // Gera o hash da senha
      const senha_hash = await bcrypt.hash(senha, 10);

      // Cria o usuário
      const usuario = await Usuario.create({
        nome,
        email,
        senha_hash,
        is_admin,
        roles
      });

      // Retorna o usuário criado sem a senha
      const { senha_hash: _, ...usuarioSemSenha } = usuario.toJSON();
      return res.status(201).json(usuarioSemSenha);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ message: 'Erro ao criar usuário' });
    }
  },

  /**
   * Atualiza um usuário existente
   */
  atualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, email, senha, is_admin, is_ativo, roles } = req.body;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Atualiza os campos
      if (nome) usuario.nome = nome;
      if (email) usuario.email = email;
      if (senha) usuario.senha_hash = await bcrypt.hash(senha, 10);
      if (typeof is_admin !== 'undefined') usuario.is_admin = is_admin;
      if (typeof is_ativo !== 'undefined') usuario.is_ativo = is_ativo;
      if (roles) usuario.roles = roles;

      await usuario.save();

      // Retorna o usuário atualizado sem a senha
      const { senha_hash: _, ...usuarioSemSenha } = usuario.toJSON();
      return res.json(usuarioSemSenha);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ message: 'Erro ao atualizar usuário' });
    }
  },

  /**
   * Define a role do usuário
   */
  definirRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!ROLES_PADRAO[role]) {
        return res.status(400).json({ message: `Role "${role}" inválida` });
      }

      const usuario = await permissaoService.definirRole(id, role);

      // Retorna o usuário atualizado sem a senha
      const { senha_hash: _, ...usuarioSemSenha } = usuario.toJSON();
      return res.json(usuarioSemSenha);
    } catch (error) {
      console.error('Erro ao definir role:', error);
      return res.status(500).json({ message: 'Erro ao definir role' });
    }
  },

  /**
   * Configura um usuário como associado a uma escola específica
   */
  configurarUsuarioEscola: async (req, res) => {
    try {
      const { id } = req.params;
      const { escolaId } = req.body;

      if (!escolaId) {
        return res.status(400).json({ message: 'ID da escola é obrigatório' });
      }

      const usuario = await permissaoService.configurarUsuarioEscola(id, escolaId);

      // Retorna o usuário atualizado sem a senha
      const { senha_hash: _, ...usuarioSemSenha } = usuario.toJSON();
      return res.json(usuarioSemSenha);
    } catch (error) {
      console.error('Erro ao configurar usuário de escola:', error);
      return res.status(500).json({ message: 'Erro ao configurar usuário de escola' });
    }
  },

  /**
   * Lista todas as roles disponíveis no sistema
   */
  listarRoles: async (req, res) => {
    try {
      const roles = permissaoService.obterRolesDisponiveis();
      return res.json(roles);
    } catch (error) {
      console.error('Erro ao listar roles:', error);
      return res.status(500).json({ message: 'Erro ao listar roles' });
    }
  },

  /**
   * Desativa um usuário (soft delete)
   */
  desativar: async (req, res) => {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      usuario.is_ativo = false;
      await usuario.save();

      return res.json({ message: 'Usuário desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      return res.status(500).json({ message: 'Erro ao desativar usuário' });
    }
  }
};

module.exports = usuarioController;
