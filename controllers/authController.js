const bcrypt = require("bcrypt");
const Usuario = require("../models/usuario");
const jwtService = require("../auth/jwtService");

/**
 * Controller para operações de autenticação
 */
const authController = {
  /**
   * Realiza o login do usuário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  login: async (req, res) => {
    try {
      const { email, senha } = req.body;

      if (!validarCamposLogin(email, senha)) {
        return res.status(400).json({ mensagem: "Email e senha são obrigatórios" });
      }

      const usuario = await buscarUsuarioPorEmail(email);
      
      if (!usuario) {
        return res.status(401).json({ mensagem: "Credenciais inválidas" });
      }

      if (!usuario.is_ativo) {
        return res.status(401).json({ mensagem: "Usuário desativado. Entre em contato com o administrador" });
      }

      const senhaCorreta = await verificarSenha(senha, usuario.senha_hash);
      
      if (!senhaCorreta) {
        return res.status(401).json({ mensagem: "Credenciais inválidas" });
      }

      const token = jwtService.gerarToken(usuario);
      const usuarioInfo = formatarDadosUsuario(usuario);

      res.json({
        token,
        usuario: usuarioInfo
      });
    } catch (error) {
      tratarErroInterno(error, res, "Erro no login");
    }
  },

  /**
   * Registra um novo usuário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  registro: async (req, res) => {
    try {
      const { nome, email, senha, is_admin = false } = req.body;

      if (!validarCamposRegistro(nome, email, senha)) {
        return res.status(400).json({ mensagem: "Nome, email e senha são obrigatórios" });
      }

      const usuarioExistente = await buscarUsuarioPorEmail(email);
      
      if (usuarioExistente) {
        return res.status(400).json({ mensagem: "Este email já está em uso" });
      }

      const senha_hash = await gerarHashSenha(senha);
      const novoUsuario = await criarNovoUsuario({ nome, email, senha_hash, is_admin });
      
      const token = jwtService.gerarToken(novoUsuario);
      const usuarioInfo = formatarDadosUsuario(novoUsuario);

      res.status(201).json({
        token,
        usuario: usuarioInfo
      });
    } catch (error) {
      tratarErroInterno(error, res, "Erro no registro");
    }
  },

  /**
   * Verifica se o token JWT é válido e retorna informações do usuário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  verificarToken: async (req, res) => {
    try {
      const usuarioId = req.usuario.id;
      const usuario = await buscarUsuarioPorId(usuarioId);
      
      if (!usuario || !usuario.is_ativo) {
        return res.status(401).json({ mensagem: "Usuário não encontrado ou desativado" });
      }
      
      res.json({ usuario });
    } catch (error) {
      tratarErroInterno(error, res, "Erro na verificação do token");
    }
  }
};

/**
 * Validação dos campos de login
 * @param {string} email - Email do usuário
 * @param {string} senha - Senha do usuário
 * @returns {boolean} Verdadeiro se os campos são válidos
 */
function validarCamposLogin(email, senha) {
  return email && senha;
}

/**
 * Validação dos campos de registro
 * @param {string} nome - Nome do usuário
 * @param {string} email - Email do usuário
 * @param {string} senha - Senha do usuário
 * @returns {boolean} Verdadeiro se os campos são válidos
 */
function validarCamposRegistro(nome, email, senha) {
  return nome && email && senha;
}

/**
 * Busca um usuário pelo email
 * @param {string} email - Email do usuário
 * @returns {Promise<Object>} Promessa com o usuário ou null
 */
async function buscarUsuarioPorEmail(email) {
  return await Usuario.findOne({ where: { email } });
}

/**
 * Busca um usuário pelo ID
 * @param {number} id - ID do usuário
 * @returns {Promise<Object>} Promessa com o usuário ou null
 */
async function buscarUsuarioPorId(id) {
  return await Usuario.findByPk(id, {
    attributes: ['id', 'nome', 'email', 'is_admin', 'is_ativo']
  });
}

/**
 * Verifica se a senha fornecida corresponde ao hash armazenado
 * @param {string} senha - Senha fornecida
 * @param {string} hash - Hash armazenado
 * @returns {Promise<boolean>} Promessa com o resultado da verificação
 */
async function verificarSenha(senha, hash) {
  return await bcrypt.compare(senha, hash);
}

/**
 * Gera um hash para a senha
 * @param {string} senha - Senha a ser hashificada
 * @returns {Promise<string>} Promessa com o hash gerado
 */
async function gerarHashSenha(senha) {
  const saltRounds = 10;
  return await bcrypt.hash(senha, saltRounds);
}

/**
 * Cria um novo usuário no banco de dados
 * @param {Object} dados - Dados do novo usuário
 * @returns {Promise<Object>} Promessa com o usuário criado
 */
async function criarNovoUsuario(dados) {
  return await Usuario.create(dados);
}

/**
 * Formata os dados do usuário para retorno na API
 * @param {Object} usuario - Objeto com dados do usuário
 * @returns {Object} Dados formatados
 */
function formatarDadosUsuario(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    is_admin: usuario.is_admin
  };
}

/**
 * Trata erros internos do servidor
 * @param {Error} error - Objeto de erro
 * @param {Object} res - Objeto de resposta Express
 * @param {string} mensagemLog - Mensagem para o log
 */
function tratarErroInterno(error, res, mensagemLog) {
  console.error(`${mensagemLog}:`, error);
  res.status(500).json({ mensagem: "Erro interno no servidor" });
}

module.exports = authController;