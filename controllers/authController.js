const bcrypt = require("bcrypt");
const Usuario = require("../models/usuario");
const jwtService = require("../auth/jwtService");

/**
 * Controller para operações de autenticação
 */
const authController = {
  /**
   * Realiza o login do usuário
   */
  login: async (req, res) => {
    console.log(`[AUTH] Login solicitado para:`, req.body?.username || req.body?.email);
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false,
          message: "Username/email e senha são obrigatórios" 
        });
      }

      const { Op } = require('sequelize');
      const usuario = await Usuario.findOne({ 
        where: { 
          [Op.or]: [
            { username: username },
            { email: username }
          ]
        } 
      });
      
      console.log(`[AUTH] Usuário encontrado:`, usuario ? 'SIM' : 'NÃO');
      
      if (!usuario) {
        console.log(`[AUTH] Retornando erro: Credenciais inválidas`);
        return res.status(401).json({ 
          success: false,
          message: "Credenciais inválidas" 
        });
      }

      if (!usuario.is_ativo) {
        console.log(`[AUTH] Usuário desativado`);
        return res.status(401).json({ 
          success: false,
          message: "Usuário desativado. Entre em contato com o administrador" 
        });
      }

      const senhaCorreta = await bcrypt.compare(password, usuario.senha_hash);
      console.log(`[AUTH] Senha correta:`, senhaCorreta ? 'SIM' : 'NÃO');
      
      if (!senhaCorreta) {
        console.log(`[AUTH] Retornando erro: Senha incorreta`);
        return res.status(401).json({ 
          success: false,
          message: "Credenciais inválidas" 
        });
      }

      const token = jwtService.gerarToken(usuario);
      
      // Configuração de cookies para produção e desenvolvimento
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      };

      if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'none';
      }

      res.cookie('auth_token', token, cookieOptions);

      res.json({
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          username: usuario.username,
          email: usuario.email,
          is_admin: usuario.is_admin,
          roles: usuario.roles || [],
          escola_id: usuario.escola_id,
          metadados: usuario.metadados || {},
          role: usuario.is_admin ? 'admin' : (usuario.roles && usuario.roles.length > 0 ? usuario.roles[0] : 'usuario')
        },
        success: true
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro interno no servidor" 
      });
    }
  },

  /**
   * Registra um novo usuário
   */
  registro: async (req, res) => {
    console.log(`[AUTH] Registro solicitado para:`, req.body?.email);
    try {
      const { nome, email, senha, is_admin = false } = req.body;
      
      if (!nome || !email || !senha) {
        return res.status(400).json({ 
          success: false,
          message: "Nome, email e senha são obrigatórios" 
        });
      }

      const usuarioExistente = await Usuario.findOne({ where: { email } });
      
      if (usuarioExistente) {
        return res.status(400).json({ 
          success: false,
          message: "Este email já está em uso" 
        });
      }

      const saltRounds = 10;
      const senha_hash = await bcrypt.hash(senha, saltRounds);
      const novoUsuario = await Usuario.create({ nome, email, senha_hash, is_admin });
      
      const token = jwtService.gerarToken(novoUsuario);

      res.status(201).json({
        token,
        usuario: {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          username: novoUsuario.username,
          email: novoUsuario.email,
          is_admin: novoUsuario.is_admin,
          roles: novoUsuario.roles || [],
          escola_id: novoUsuario.escola_id,
          role: novoUsuario.is_admin ? 'admin' : 'usuario'
        }
      });
    } catch (error) {
      console.error("Erro no registro:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro interno no servidor" 
      });
    }
  },

  /**
   * Verifica se o token JWT é válido e retorna informações do usuário
   */
  verificarToken: async (req, res) => {
    console.log(`[AUTH] Verificação de token para usuário ID:`, req.usuario?.id);
    try {
      const usuarioId = req.usuario.id;
      const usuario = await Usuario.findByPk(usuarioId, {
        attributes: ['id', 'nome', 'username', 'email', 'is_admin', 'is_ativo', 'roles', 'escola_id', 'metadados']
      });
      
      if (!usuario || !usuario.is_ativo) {
        return res.status(401).json({ 
          success: false,
          message: "Usuário não encontrado ou desativado" 
        });
      }
      
      res.json({ 
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          username: usuario.username,
          email: usuario.email,
          is_admin: usuario.is_admin,
          roles: usuario.roles || [],
          escola_id: usuario.escola_id,
          metadados: usuario.metadados || {},
          role: usuario.is_admin ? 'admin' : (usuario.roles && usuario.roles.length > 0 ? usuario.roles[0] : 'usuario')
        },
        success: true 
      });
    } catch (error) {
      console.error("Erro na verificação do token:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro interno no servidor" 
      });
    }
  },

  /**
   * Realiza logout do usuário
   */
  logout: async (req, res) => {
    console.log(`[AUTH] Logout solicitado para usuário ID:`, req.usuario?.id);
    try {
      const clearCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      };

      if (process.env.NODE_ENV === 'production') {
        clearCookieOptions.secure = true;
        clearCookieOptions.sameSite = 'none';
      }

      res.clearCookie('auth_token', clearCookieOptions);

      res.json({
        success: true,
        message: "Logout realizado com sucesso"
      });
    } catch (error) {
      console.error("Erro no logout:", error);
      res.status(500).json({ 
        success: false,
        message: "Erro interno no servidor" 
      });
    }
  }
};

module.exports = authController;