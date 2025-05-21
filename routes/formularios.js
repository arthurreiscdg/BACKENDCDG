const express = require("express");
const formularioController = require("../controllers/formularioController");

/**
 * Configuração das rotas de formulários
 * @returns {express.Router} Router do Express configurado
 */
function configurarRotasFormularios() {
  const router = express.Router();
  
  // Configuração das rotas
  definirRotasConsulta(router);
  definirRotasManipulacao(router);
  
  return router;
}

/**
 * Define as rotas de consulta (GET)
 * @param {express.Router} router - Router do Express
 */
function definirRotasConsulta(router) {
  // Listar todos os formulários
  router.get("/", formularioController.listarFormularios);
  
  // Obter um formulário específico
  router.get("/:id", formularioController.obterFormulario);
}

/**
 * Define as rotas de manipulação (POST, PUT, DELETE)
 * @param {express.Router} router - Router do Express
 */
function definirRotasManipulacao(router) {
  // Criar um novo formulário
  router.post("/", formularioController.criarFormulario);
  
  // Atualizar um formulário
  router.put("/:id", formularioController.atualizarFormulario);
  
  // Excluir um formulário
  router.delete("/:id", formularioController.excluirFormulario);
}

module.exports = configurarRotasFormularios();