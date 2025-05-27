const express = require("express");
const formularioController = require("../controllers/formularioController");
const pdfController = require("../controllers/pdfController");

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
  
  // Obter arquivos PDF de um formulário
  router.get("/:id/arquivos", formularioController.obterArquivosFormulario);
  
  // Obter unidades de um formulário
  router.get("/:id/unidades", formularioController.obterUnidadesFormulario);
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
  
  // Adicionar arquivos PDF a um formulário
  router.post("/:id/arquivos", formularioController.adicionarArquivoFormulario);
  
  // Upload de arquivo PDF via multipart/form-data
  router.post("/:formularioId/upload-pdf", pdfController.uploadPdf);
  
  // Upload de múltiplos arquivos PDF via multipart/form-data
  router.post("/:formularioId/upload-pdfs", pdfController.uploadMultiplosPdfs);
  
  // Excluir um arquivo PDF de um formulário
  router.delete("/:formularioId/arquivos/:arquivoId", formularioController.excluirArquivoFormulario);
  
  // Gerenciar unidades de um formulário
  router.post("/:id/unidades", formularioController.gerenciarUnidadesFormulario);
}

module.exports = configurarRotasFormularios();