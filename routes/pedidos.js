const express = require("express");
const pedidoController = require("../controllers/pedidoController");

/**
 * Configuração das rotas de pedidos
 * @returns {express.Router} Router do Express configurado
 */
function configurarRotasPedidos() {
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
  // Listar todos os pedidos
  router.get("/", pedidoController.listarPedidos);
  
  // Obter um pedido específico
  router.get("/:id", pedidoController.obterPedido);
}

/**
 * Define as rotas de manipulação (POST, PUT, DELETE)
 * @param {express.Router} router - Router do Express
 */
function definirRotasManipulacao(router) {
  // Criar um novo pedido
  router.post("/", pedidoController.criarPedido);
  
  // Atualizar um pedido
  router.put("/:id", pedidoController.atualizarPedido);
  
  // Excluir um pedido
  router.delete("/:id", pedidoController.excluirPedido);
}

module.exports = configurarRotasPedidos();