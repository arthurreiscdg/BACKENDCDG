const express = require("express");
const integracaoController = require("../controllers/integracaoController");

/**
 * Configuração das rotas de integração externa
 * @returns {express.Router} Router do Express configurado
 */
function configurarRotasIntegracao() {
  const router = express.Router();
  
  // Rota para receber pedidos de sistemas externos
  router.post("/pedidos", integracaoController.receberPedido);
  
  // Rota para listar todos os pedidos
  router.get("/pedidos", integracaoController.listarPedidos);
  
  // Rota para verificar status de pedidos enviados
  router.get("/pedidos/:numero_pedido/status", integracaoController.verificarStatusPedido);
  
  // Rota para cancelar um pedido
  router.post("/pedidos/:numero_pedido/cancelar", integracaoController.cancelarPedido);
  
  // Rota para atualizar um pedido
  router.put("/pedidos/:numero_pedido", integracaoController.atualizarPedido);
  
  // Rota para obter métricas da API (apenas para admin)
  router.get("/metricas", integracaoController.getMetricas);
  
  return router;
}

module.exports = configurarRotasIntegracao();
