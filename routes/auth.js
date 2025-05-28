const express = require("express");
const authController = require("../controllers/authController");
const { authMiddleware } = require("../auth/authMiddleware");

/**
 * Configuração das rotas de autenticação
 * @returns {express.Router} Router do Express configurado
 */
function configurarRotasAutenticacao() {
  const router = express.Router();
  
  // Configuração das rotas
  definirRotasPublicas(router);
  definirRotasProtegidas(router);
  
  return router;
}

/**
 * Define as rotas públicas (que não requerem autenticação)
 * @param {express.Router} router - Router do Express
 */
function definirRotasPublicas(router) {
  // Rota de login
  router.post("/login", authController.login);
  
  // Rota de registro
  router.post("/registro", authController.registro);
}

/**
 * Define as rotas protegidas (que requerem autenticação)
 * @param {express.Router} router - Router do Express
 */
function definirRotasProtegidas(router) {
  // Rota para verificar se o token é válido e obter informações do usuário
  router.get("/verificar", authMiddleware(), authController.verificarToken);
  
  // Rota de logout
  router.post("/logout", authMiddleware(), authController.logout);
}

module.exports = configurarRotasAutenticacao();