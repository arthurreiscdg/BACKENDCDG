const ArquivoPdf = require("../models/arquivoPdf");
const googleDriveService = require("../services/googleDriveService");
const path = require("path");
const fs = require("fs");

/**
 * Controller para gerenciar operações de upload de PDFs
 */
const pdfController = {
  /**
   * Faz upload de um arquivo PDF e o associa a um formulário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  uploadPdf: async (req, res) => {
    try {
      const { formularioId } = req.params;
      
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ mensagem: "Nenhum arquivo foi enviado" });
      }

      const arquivo = req.files.arquivo;
      const nomeArquivo = arquivo.name;
      
      // Verificar se é um PDF
      if (arquivo.mimetype !== 'application/pdf') {
        return res.status(400).json({ mensagem: "O arquivo deve ser um PDF" });
      }
      
      // Converter arquivo para base64
      const base64Data = arquivo.data.toString('base64');
      
      // Fazer upload para o Google Drive e salvar no banco
      const arquivoPdf = await salvarArquivoPdf(formularioId, base64Data, nomeArquivo);
      
      res.json(arquivoPdf);
    } catch (error) {
      console.error("Erro ao fazer upload do PDF:", error);
      res.status(500).json({ mensagem: "Erro ao processar arquivo PDF" });
    }
  },
  
  /**
   * Faz upload de múltiplos arquivos PDF e os associa a um formulário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  uploadMultiplosPdfs: async (req, res) => {
    try {
      const { formularioId } = req.params;
      const resultados = [];
      
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ mensagem: "Nenhum arquivo foi enviado" });
      }

      // Tratar array de arquivos
      const arquivos = Array.isArray(req.files.arquivos) 
        ? req.files.arquivos 
        : [req.files.arquivos];
      
      for (const arquivo of arquivos) {
        if (arquivo.mimetype === 'application/pdf') {
          const base64Data = arquivo.data.toString('base64');
          const arquivoPdf = await salvarArquivoPdf(formularioId, base64Data, arquivo.name);
          resultados.push(arquivoPdf);
        }
      }
      
      res.json({ 
        mensagem: `${resultados.length} PDFs salvos com sucesso`,
        arquivos: resultados 
      });
    } catch (error) {
      console.error("Erro ao fazer upload dos PDFs:", error);
      res.status(500).json({ mensagem: "Erro ao processar arquivos PDF" });
    }
  }
};

/**
 * Salva um arquivo PDF no Google Drive e no banco de dados
 * @param {string} formularioId - ID do formulário associado
 * @param {string} base64Data - Conteúdo do arquivo em base64
 * @param {string} nomeArquivo - Nome do arquivo
 * @returns {Promise<Object>} - Dados do arquivo salvo
 */
async function salvarArquivoPdf(formularioId, base64Data, nomeArquivo) {
  try {
    // Upload para o Google Drive
    const resultadoUpload = await googleDriveService.uploadPdf(
      base64Data,
      nomeArquivo
    );
    
    // Salvar no banco de dados
    return await ArquivoPdf.create({
      nome: resultadoUpload.nome,
      arquivo: resultadoUpload.arquivo,
      link_download: resultadoUpload.link_download,
      web_view_link: resultadoUpload.web_view_link,
      json_link: resultadoUpload.json_link,
      formulario_id: formularioId
    });
  } catch (error) {
    console.error("Erro ao salvar arquivo PDF:", error);
    throw new Error("Falha ao processar arquivo PDF");
  }
}

module.exports = pdfController;
