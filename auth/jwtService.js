const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Serviço para operações relacionadas a JWT (JSON Web Tokens)
 */
const jwtService = {
  /**
   * Gera um token JWT para o usuário
   * @param {Object} usuario - Objeto com dados do usuário
   * @returns {string} Token JWT gerado
   */  gerarToken: (usuario) => {
    const payload = { 
      id: usuario.id, 
      email: usuario.email,
      username: usuario.username,
      is_admin: usuario.is_admin,
      roles: usuario.roles || [],
      escola_id: usuario.escola_id
    };
    
    const secret = process.env.JWT_SECRET;
    const options = { 
      expiresIn: process.env.TOKEN_EXPIRATION || "1d" 
    };
    
    return jwt.sign(payload, secret, options);
  },
  
  /**
   * Verifica e decodifica um token JWT
   * @param {string} token - Token JWT a ser verificado
   * @returns {Object} Payload decodificado do token
   * @throws {Error} Se o token for inválido ou estiver expirado
   */
  verificarToken: (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
};

module.exports = jwtService;
