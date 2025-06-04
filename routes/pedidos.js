const express = require("express");
const pedidoController = require("../controllers/pedidoController");
const { 
  verificarPermissaoPedido, 
  verificarPermissaoAlterarStatus,
  verificarPermissaoBaixarPedidos, 
  verificarPermissaoBaixarEtiquetas
} = require("../controllers/pedidoMiddleware");
const { verificarRole } = require('../auth/permissaoMiddleware');
const { filtrarPorEscola } = require('../auth/escolaMiddleware');

/**
 * Configuração das rotas de pedidos
 * @returns {express.Router} Router do Express configurado
 */
function configurarRotasPedidos() {
  const router = express.Router();
  
  // Middleware para filtrar pedidos por escola, se aplicável
  router.use(filtrarPorEscola);
    // Configuração das rotas
  definirRotasConsulta(router);
  definirRotasManipulacao(router);
  definirRotasEspeciais(router);
  
  return router;
}

/**
 * Define as rotas de consulta (GET)
 * @param {express.Router} router - Router do Express
 */
function definirRotasConsulta(router) {
  // Listar todos os pedidos (filtrado automaticamente para escolas)
  router.get("/", verificarPermissaoPedido, pedidoController.listarPedidos);
  
  // Obter um pedido específico
  router.get("/:id", verificarPermissaoPedido, pedidoController.obterPedido);
  
  // Obter histórico de status de um pedido
  router.get("/:id/historico", verificarPermissaoPedido, pedidoController.obterHistoricoPedido);
  
  // Obter documentos de um pedido
  router.get("/:id/documentos", verificarPermissaoPedido, pedidoController.obterDocumentosPedido);
}

/**
 * Define as rotas de manipulação (POST, PUT, DELETE)
 * @param {express.Router} router - Router do Express
 */
function definirRotasManipulacao(router) {
  // Criar um novo pedido (admin, dev, gerente, usuário)
  router.post("/", verificarRole(['admin', 'dev', 'gerente', 'usuario']), pedidoController.criarPedido);
  
  // Atualização em lote de status de pedidos
  router.put("/bulk-update-status", verificarRole(['admin', 'dev', 'gerente']), pedidoController.atualizarStatusLote);
  
  // Atualizar um pedido (admin, dev, gerente)
  router.put("/:id", verificarRole(['admin', 'dev', 'gerente']), pedidoController.atualizarPedido);
  
  // Gerar PDF de pedidos
  router.post("/download-pdf", verificarPermissaoPedido, pedidoController.gerarPdfPedidos);
  
  // Excluir um pedido (apenas admin e dev)
  router.delete("/:id", verificarRole(['admin', 'dev']), pedidoController.excluirPedido);
  
  // Alterar status de um pedido (admin, dev, gerente, usuário, expedição - com restrições)
  // router.put("/:id/status", verificarPermissaoAlterarStatus, pedidoController.alterarStatus);
}

/**
 * Define rotas especiais para recursos específicos
 * @param {express.Router} router - Router do Express
 */
function definirRotasEspeciais(router) {
  // Baixar pedidos (admin, dev, gerente, usuário)
  // router.get("/baixar/relatorio", verificarPermissaoBaixarPedidos, pedidoController.baixarRelatorio);
  
  // Baixar etiquetas (admin, dev, gerente, expedição)
  // router.get("/baixar/etiquetas", verificarPermissaoBaixarEtiquetas, pedidoController.baixarEtiquetas);
  
  // Estatísticas de pedidos (admin, dev, gerente)
  // router.get("/estatisticas/resumo", verificarRole(['admin', 'dev', 'gerente']), pedidoController.obterEstatisticas);
}

// Exporta o router configurado
module.exports = configurarRotasPedidos();