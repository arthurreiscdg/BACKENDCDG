const jwtService = require("./jwtService");
require("dotenv").config();

/**
 * Middleware de autenticação para proteger rotas
 * Verifica se o token JWT é válido e adiciona os dados do usuário à requisição
 * @returns {Function} Middleware para Express
 */
function authMiddleware() {
  return (req, res, next) => {
    try {
      const token = extrairToken(req);
      
      if (!token) {
        return responderErroAutenticacao(res, "Token não fornecido ou formato inválido");
      }
      
      const dadosUsuario = verificarEDecodificarToken(token);
      adicionarDadosUsuarioRequisicao(req, dadosUsuario);
      
      next();
    } catch (error) {
      tratarErroAutenticacao(error, res);
    }
  };
}

/**
 * Extrai o token JWT do cabeçalho de autorização
 * @param {Object} req - Objeto de requisição Express
 * @returns {string|null} Token JWT ou null se não for encontrado
 */
function extrairToken(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  return authHeader.split(" ")[1];
}

/**
 * Verifica e decodifica o token JWT
 * @param {string} token - Token JWT a ser verificado
 * @returns {Object} Dados do usuário decodificados do token
 */
function verificarEDecodificarToken(token) {
  return jwtService.verificarToken(token);
}

/**
 * Adiciona os dados do usuário decodificados à requisição
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} dadosUsuario - Dados do usuário decodificados do token
 */
function adicionarDadosUsuarioRequisicao(req, dadosUsuario) {
  req.usuario = dadosUsuario;
}

/**
 * Responde com erro de autenticação
 * @param {Object} res - Objeto de resposta Express
 * @param {string} mensagem - Mensagem de erro
 * @returns {Object} Resposta HTTP com erro
 */
function responderErroAutenticacao(res, mensagem) {
  return res.status(401).json({ mensagem });
}

/**
 * Trata erros de autenticação
 * @param {Error} error - Objeto de erro
 * @param {Object} res - Objeto de resposta Express
 */
function tratarErroAutenticacao(error, res) {
  console.error("Erro na autenticação:", error);
  responderErroAutenticacao(res, "Não autorizado: token inválido ou expirado");
}

module.exports = authMiddleware;