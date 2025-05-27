const Formulario = require("../models/formulario");
const ArquivoPdf = require("../models/arquivoPdf");
const Unidade = require("../models/unidade");
const googleDriveService = require("../services/googleDriveService");
const { Op } = require("sequelize");

/**
 * Adapta o formato recebido do frontend para o formato esperado pelo backend
 * @param {Object} dadosRecebidos - Dados no formato recebido do frontend
 * @returns {Object} - Dados no formato esperado pelo backend
 */
function adaptarDadosRecebidos(dadosRecebidos) {
  // Criar objeto base com os campos adaptados
  const dadosAdaptados = {
    nome: dadosRecebidos.nome,
    email: dadosRecebidos.email,
    titulo: dadosRecebidos.titulo,
    data_entrega: dadosRecebidos.dataEntrega,
    observacoes: dadosRecebidos.observacoes || "",
    formato: dadosRecebidos.formatoFinal,
    cor_impressao: dadosRecebidos.corImpressao,
    impressao: dadosRecebidos.impressao,
    gramatura: dadosRecebidos.gramatura,
    papel_adesivo: false, // Valor padrão se não informado
    tipo_adesivo: null,
    grampos: dadosRecebidos.grampos,
    espiral: false, // Valor padrão se não informado
    capa_pvc: false, // Valor padrão se não informado
    cod_op: dadosRecebidos.metodoPedido === "manual" ? "MANUAL" : null
  };

  // Adaptar PDFs para o formato esperado de arquivos
  if (dadosRecebidos.pdfs && Array.isArray(dadosRecebidos.pdfs)) {
    dadosAdaptados.arquivos = dadosRecebidos.pdfs.map(pdf => ({
      nome: pdf.nome,
      // O base64 precisará ser adicionado posteriormente
      base64: pdf.base64 || null
    }));
  }

  // Adaptar escolas/quantidades para formato de unidades
  if (dadosRecebidos.escolasQuantidades) {
    dadosAdaptados.unidades = Object.entries(dadosRecebidos.escolasQuantidades).map(([nome, quantidade]) => ({
      nome,
      quantidade
    }));
  }

  return dadosAdaptados;
}

/**
 * Controller para operações relacionadas a formulários
 */
const formularioController = {
  /**
   * Lista todos os formulários disponíveis para o usuário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  listarFormularios: async (req, res) => {
    try {
      const formularios = await buscarTodosFormularios(req.usuario);
      res.json(formularios);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao listar formulários");
    }
  },

  /**
   * Obtém um formulário específico por ID
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  obterFormulario: async (req, res) => {
    try {
      const { id } = req.params;
      const formulario = await buscarFormularioPorId(id);
      
      if (!formulario) {
        return res.status(404).json({ mensagem: "Formulário não encontrado" });
      }
      
      if (!verificarPermissaoVisualizacao(req.usuario, formulario)) {
        return res.status(403).json({ mensagem: "Acesso negado" });
      }
      
      res.json(formulario);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao obter formulário");
    }
  },  /**
   * Cria um novo formulário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  criarFormulario: async (req, res) => {
    try {
      // Adaptar dados recebidos do frontend para o formato esperado pelo backend
      const dadosAdaptados = adaptarDadosRecebidos(req.body);
      
      const { 
        nome, email, titulo, data_entrega, observacoes,
        formato, cor_impressao, impressao, gramatura,
        papel_adesivo, tipo_adesivo, grampos, espiral, capa_pvc, cod_op,
        arquivos, unidades
      } = dadosAdaptados;
      
      if (!validarCamposFormulario(dadosAdaptados)) {
        return res.status(400).json({ mensagem: "Nome, email e título são obrigatórios" });
      }
      
      // Criar o formulário
      const novoFormulario = await criarNovoFormulario({
        nome,
        email,
        titulo,
        data_entrega,
        observacoes,
        formato,
        cor_impressao,
        impressao,
        gramatura,
        papel_adesivo,
        tipo_adesivo,
        grampos,
        espiral,
        capa_pvc,
        cod_op,
        usuario_id: req.usuario?.id
      });
      
      // Processar arquivos PDF se houver
      const arquivosSalvos = [];
      if (Array.isArray(arquivos) && arquivos.length > 0) {
        for (const arquivo of arquivos) {
          if (arquivo.base64 && arquivo.nome) {
            const arquivoPdf = await salvarArquivoFormulario(
              novoFormulario.id,
              arquivo.base64,
              arquivo.nome
            );
            arquivosSalvos.push(arquivoPdf);
          }
        }
      }
      
      // Processar unidades se houver
      let unidadesSalvas = [];
      if (Array.isArray(unidades) && unidades.length > 0) {
        unidadesSalvas = await gerenciarUnidades(novoFormulario.id, unidades);
      }
      
      // Retornar com dados completos
      const formularioCompleto = await buscarFormularioPorId(novoFormulario.id);
      res.status(201).json(formularioCompleto);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao criar formulário");
    }
  },  /**
   * Atualiza um formulário existente
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  atualizarFormulario: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Adaptar dados recebidos do frontend para o formato esperado pelo backend
      const dadosAdaptados = adaptarDadosRecebidos(req.body);
      
      const { 
        nome, email, titulo, data_entrega, observacoes,
        formato, cor_impressao, impressao, gramatura,
        papel_adesivo, tipo_adesivo, grampos, espiral, capa_pvc, cod_op,
        arquivos, unidades
      } = dadosAdaptados;
      
      const formulario = await buscarFormularioPorId(id, false);
      
      if (!formulario) {
        return res.status(404).json({ mensagem: "Formulário não encontrado" });
      }
      
      // Atualizar dados do formulário
      await atualizarDadosFormulario(formulario, { 
        nome, email, titulo, data_entrega, observacoes,
        formato, cor_impressao, impressao, gramatura,
        papel_adesivo, tipo_adesivo, grampos, espiral, capa_pvc, cod_op
      });
      
      // Processar arquivos PDF se houver
      if (Array.isArray(arquivos) && arquivos.length > 0) {
        for (const arquivo of arquivos) {
          if (arquivo.base64 && arquivo.nome) {
            await atualizarArquivoFormulario(
              id,
              arquivo.base64,
              arquivo.nome
            );
          }
        }
      }
      
      // Processar unidades se houver
      if (Array.isArray(unidades)) {
        await gerenciarUnidades(id, unidades);
      }
      
      // Retornar com dados completos
      const formularioAtualizado = await buscarFormularioPorId(id);
      res.json(formularioAtualizado);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao atualizar formulário");
    }
  },
  /**
   * Exclui um formulário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  excluirFormulario: async (req, res) => {
    try {
      const { id } = req.params;
      
      const formulario = await buscarFormularioPorId(id, true);
      
      if (!formulario) {
        return res.status(404).json({ mensagem: "Formulário não encontrado" });
      }
      
      // Verifica se o usuário pode excluir o formulário
      // Se o formulário tem um usuário_id, apenas o próprio usuário ou admin pode excluir
      if (formulario.usuario_id && formulario.usuario_id !== req.usuario?.id && !req.usuario?.is_admin) {
        return res.status(403).json({ mensagem: "Acesso negado. Você não tem permissão para excluir este formulário" });
      }
      
      await excluirFormulario(id);
      
      res.json({ mensagem: "Formulário excluído com sucesso" });
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao excluir formulário");
    }
  },
  /**
   * Obtém arquivos PDF associados a um formulário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  obterArquivosFormulario: async (req, res) => {
    try {
      const { id } = req.params;
      
      const arquivos = await ArquivoPdf.findAll({
        where: { formulario_id: id }
      });
      
      res.json(arquivos);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao obter arquivos do formulário");
    }
  },
  
  /**
   * Obtém unidades associadas a um formulário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  obterUnidadesFormulario: async (req, res) => {
    try {
      const { id } = req.params;
      
      const unidades = await Unidade.findAll({
        where: { formulario_id: id }
      });
      
      res.json(unidades);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao obter unidades do formulário");
    }
  },
  
  /**
   * Adiciona um arquivo PDF a um formulário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  adicionarArquivoFormulario: async (req, res) => {
    try {
      const { id } = req.params;
      const { base64, nome } = req.body;
      
      if (!base64 || !nome) {
        return res.status(400).json({ mensagem: "Arquivo e nome são obrigatórios" });
      }
      
      const formulario = await Formulario.findByPk(id);
      
      if (!formulario) {
        return res.status(404).json({ mensagem: "Formulário não encontrado" });
      }
      
      const arquivoPdf = await salvarArquivoFormulario(id, base64, nome);
      
      res.status(201).json(arquivoPdf);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao adicionar arquivo ao formulário");
    }
  },
  
  /**
   * Exclui um arquivo PDF de um formulário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  excluirArquivoFormulario: async (req, res) => {
    try {
      const { formularioId, arquivoId } = req.params;
      
      const arquivo = await ArquivoPdf.findOne({
        where: {
          id: arquivoId,
          formulario_id: formularioId
        }
      });
      
      if (!arquivo) {
        return res.status(404).json({ mensagem: "Arquivo não encontrado" });
      }
      
      // Exclui o arquivo do Google Drive
      const fileId = extrairIdArquivo(arquivo.arquivo);
      if (fileId) {
        try {
          await googleDriveService.deleteFile(fileId);
        } catch (err) {
          console.warn("Erro ao excluir arquivo do Google Drive:", err);
        }
      }
      
      // Exclui o registro do banco de dados
      await arquivo.destroy();
      
      res.json({ mensagem: "Arquivo excluído com sucesso" });
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao excluir arquivo do formulário");
    }
  },
  
  /**
   * Gerencia unidades de um formulário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  gerenciarUnidadesFormulario: async (req, res) => {
    try {
      const { id } = req.params;
      const { unidades } = req.body;
      
      if (!Array.isArray(unidades)) {
        return res.status(400).json({ mensagem: "Lista de unidades inválida" });
      }
      
      const formulario = await Formulario.findByPk(id);
      
      if (!formulario) {
        return res.status(404).json({ mensagem: "Formulário não encontrado" });
      }
      
      const unidadesSalvas = await gerenciarUnidades(id, unidades);
      
      res.json(unidadesSalvas);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao gerenciar unidades do formulário");
    }
  },
};

/**
 * Busca todos os formulários, aplicando filtros por permissão
 * @param {Object} usuario - Dados do usuário logado
 * @returns {Promise<Array>} Lista de formulários
 */
async function buscarTodosFormularios(usuario) {
  const where = usuario.is_admin ? {} : { is_publico: true };
  return await Formulario.findAll({ where });
}

/**
 * Busca um formulário específico por ID
 * @param {number} id - ID do formulário
 * @param {boolean} incluirArquivo - Se deve incluir o arquivo relacionado
 * @returns {Promise<Object>} Formulário encontrado ou null
 */
async function buscarFormularioPorId(id, incluirArquivo = true) {
  const opcoes = {};
  
  if (incluirArquivo) {
    opcoes.include = [
      { model: ArquivoPdf },
      { model: Unidade }
    ];
  }
  
  return await Formulario.findByPk(id, opcoes);
}

/**
 * Verifica se o usuário tem permissão para visualizar um formulário
 * @param {Object} usuario - Dados do usuário logado
 * @param {Object} formulario - Dados do formulário
 * @returns {boolean} Verdadeiro se o usuário tem permissão
 */
function verificarPermissaoVisualizacao(usuario, formulario) {
  return usuario.is_admin || formulario.is_publico;
}

/**
 * Verifica se o usuário tem permissão para criar formulários
 * @param {Object} usuario - Dados do usuário logado
 * @returns {boolean} Verdadeiro se o usuário tem permissão
 */
function verificarPermissaoCriacao(usuario) {
  return usuario.is_admin;
}

/**
 * Verifica se o usuário tem permissão para editar formulários
 * @param {Object} usuario - Dados do usuário logado
 * @returns {boolean} Verdadeiro se o usuário tem permissão
 */
function verificarPermissaoEdicao(usuario) {
  return usuario.is_admin;
}

/**
 * Verifica se o usuário tem permissão para excluir formulários
 * @param {Object} usuario - Dados do usuário logado
 * @returns {boolean} Verdadeiro se o usuário tem permissão
 */
function verificarPermissaoExclusao(usuario) {
  return usuario.is_admin;
}

/**
 * Salva um arquivo PDF enviado em conjunto com o formulário
 * @param {number} formularioId - ID do formulário
 * @param {string} base64Data - Arquivo em formato base64
 * @param {string} nomeArquivo - Nome do arquivo
 * @returns {Promise<Object>} Dados do arquivo salvo
 */
async function salvarArquivoFormulario(formularioId, base64Data, nomeArquivo = "documento.pdf") {
  try {
    // Faz upload do arquivo para o Google Drive
    const resultadoUpload = await googleDriveService.uploadPdf(
      base64Data,
      nomeArquivo
    );
    
    // Salva os dados na tabela ArquivoPdf
    const arquivoPdf = await ArquivoPdf.create({
      nome: resultadoUpload.nome,
      arquivo: resultadoUpload.arquivo,
      link_download: resultadoUpload.link_download,
      web_view_link: resultadoUpload.web_view_link,
      json_link: resultadoUpload.json_link,
      formulario_id: formularioId
    });
    
    return arquivoPdf;
  } catch (error) {
    console.error("Erro ao salvar arquivo:", error);
    throw new Error("Falha ao processar o arquivo PDF");
  }
}

/**
 * Atualiza um arquivo PDF associado a um formulário
 * @param {number} formularioId - ID do formulário
 * @param {string} base64Data - Arquivo em formato base64
 * @param {string} nomeArquivo - Nome do arquivo
 * @returns {Promise<Object>} Dados do arquivo atualizado
 */
async function atualizarArquivoFormulario(formularioId, base64Data, nomeArquivo = "documento.pdf") {
  try {
    // Busca arquivo existente
    const arquivoExistente = await ArquivoPdf.findOne({
      where: { formulario_id: formularioId }
    });
    
    // Se existir, exclui do Google Drive
    if (arquivoExistente) {
      const fileId = extrairIdArquivo(arquivoExistente.arquivo);
      if (fileId) {
        try {
          await googleDriveService.deleteFile(fileId);
        } catch (err) {
          console.warn("Erro ao excluir arquivo antigo:", err);
        }
      }
    }
    
    // Faz upload do novo arquivo
    const resultadoUpload = await googleDriveService.uploadPdf(
      base64Data,
      nomeArquivo
    );
    
    // Atualiza ou cria o registro
    if (arquivoExistente) {
      arquivoExistente.nome = resultadoUpload.nome;
      arquivoExistente.arquivo = resultadoUpload.arquivo;
      arquivoExistente.link_download = resultadoUpload.link_download;
      arquivoExistente.web_view_link = resultadoUpload.web_view_link;
      arquivoExistente.json_link = resultadoUpload.json_link;
      await arquivoExistente.save();
      return arquivoExistente;
    } else {
      return await salvarArquivoFormulario(formularioId, base64Data, nomeArquivo);
    }
  } catch (error) {
    console.error("Erro ao atualizar arquivo:", error);
    throw new Error("Falha ao processar o arquivo PDF");
  }
}

/**
 * Extrai o ID de um arquivo a partir da URL do Google Drive
 * @param {string} url - URL do arquivo no Google Drive
 * @returns {string|null} ID do arquivo ou null
 */
function extrairIdArquivo(url) {
  if (!url) return null;
  
  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Gerencia as unidades associadas a um formulário
 * @param {number} formularioId - ID do formulário
 * @param {Array} unidades - Lista de unidades com nome e quantidade
 * @returns {Promise<Array>} Unidades salvas
 */
async function gerenciarUnidades(formularioId, unidades) {
  if (!Array.isArray(unidades) || !unidades.length) {
    return [];
  }
  
  try {
    // Exclui unidades existentes
    await Unidade.destroy({
      where: { formulario_id: formularioId }
    });
    
    // Cria novas unidades
    const unidadesSalvas = await Promise.all(
      unidades.map(unidade => 
        Unidade.create({
          nome: unidade.nome,
          quantidade: unidade.quantidade || 1,
          formulario_id: formularioId
        })
      )
    );
    
    return unidadesSalvas;
  } catch (error) {
    console.error("Erro ao gerenciar unidades:", error);
    throw new Error("Falha ao processar as unidades");
  }
}

/**
 * Trata erro interno e envia resposta adequada
 * @param {Error} error - Objeto de erro
 * @param {Object} res - Objeto de resposta Express
 * @param {string} mensagem - Mensagem de erro padrão
 */
function tratarErroInterno(error, res, mensagem = "Erro interno no servidor") {
  console.error(`Erro: ${mensagem}`, error);
  res.status(500).json({ mensagem, detalhes: process.env.NODE_ENV === 'development' ? error.message : null });
}

/**
 * Cria um novo formulário com todos os dados
 * @param {Object} dados - Dados do formulário
 * @returns {Promise<Object>} Formulário criado
 */
async function criarNovoFormulario(dados) {
  return await Formulario.create({
    nome: dados.nome,
    email: dados.email,
    titulo: dados.titulo,
    data_entrega: dados.data_entrega,
    observacoes: dados.observacoes,
    formato: dados.formato,
    cor_impressao: dados.cor_impressao,
    impressao: dados.impressao,
    gramatura: dados.gramatura,
    papel_adesivo: dados.papel_adesivo || false,
    tipo_adesivo: dados.tipo_adesivo,
    grampos: dados.grampos,
    espiral: dados.espiral || false,
    capa_pvc: dados.capa_pvc || false,
    cod_op: dados.cod_op,
    usuario_id: dados.usuario_id
  });
}

/**
 * Valida os campos obrigatórios do formulário
 * @param {Object} dados - Dados do formulário
 * @returns {boolean} Verdadeiro se os dados são válidos
 */
function validarCamposFormulario(dados) {
  return !!(dados.nome && dados.email && dados.titulo);
}

/**
 * Atualiza os dados de um formulário
 * @param {Object} formulario - Instância do formulário
 * @param {Object} dados - Dados a serem atualizados
 */
async function atualizarDadosFormulario(formulario, dados) {
  // Atualiza somente os campos fornecidos
  if (dados.nome) { formulario.nome = dados.nome; }
  if (dados.email) { formulario.email = dados.email; }
  if (dados.titulo) { formulario.titulo = dados.titulo; }
  if (dados.data_entrega) { formulario.data_entrega = dados.data_entrega; }
  if (dados.observacoes !== undefined) { formulario.observacoes = dados.observacoes; }
  if (dados.formato) { formulario.formato = dados.formato; }
  if (dados.cor_impressao) { formulario.cor_impressao = dados.cor_impressao; }
  if (dados.impressao) { formulario.impressao = dados.impressao; }
  if (dados.gramatura) { formulario.gramatura = dados.gramatura; }
  if (dados.papel_adesivo !== undefined) { formulario.papel_adesivo = dados.papel_adesivo; }
  if (dados.tipo_adesivo) { formulario.tipo_adesivo = dados.tipo_adesivo; }
  if (dados.grampos) { formulario.grampos = dados.grampos; }
  if (dados.espiral !== undefined) { formulario.espiral = dados.espiral; }
  if (dados.capa_pvc !== undefined) { formulario.capa_pvc = dados.capa_pvc; }
  if (dados.cod_op) { formulario.cod_op = dados.cod_op; }
  
  await formulario.save();
  return formulario;
}

/**
 * Exclui um formulário e seus relacionamentos
 * @param {number} id - ID do formulário
 */
async function excluirFormulario(id) {
  // Busca os arquivos para excluir do Google Drive
  const arquivos = await ArquivoPdf.findAll({
    where: { formulario_id: id }
  });
  
  // Exclui arquivos do Google Drive
  for (const arquivo of arquivos) {
    const fileId = extrairIdArquivo(arquivo.arquivo);
    if (fileId) {
      try {
        await googleDriveService.deleteFile(fileId);
      } catch (err) {
        console.warn("Erro ao excluir arquivo do Google Drive:", err);
      }
    }
  }
  
  // Exclui registros das tabelas relacionadas
  await ArquivoPdf.destroy({ where: { formulario_id: id } });
  await Unidade.destroy({ where: { formulario_id: id } });
  
  // Exclui o formulário
  await Formulario.destroy({ where: { id } });
}

module.exports = formularioController;

// Criar um novo formulário
exports.criarFormulario = async (req, res) => {
  try {
    const { nome, descricao, is_publico, arquivo_base64 } = req.body;
    
    // Validação básica
    if (!nome || !descricao || arquivo_base64 === undefined) {
      return res.status(400).json({ mensagem: "Nome, descrição e arquivo são obrigatórios" });
    }
    
    // Apenas admins podem criar formulários
    if (!req.usuario.is_admin) {
      return res.status(403).json({ mensagem: "Acesso negado. Apenas administradores podem criar formulários" });
    }
    
    // Criar o formulário
    const novoFormulario = await Formulario.create({
      nome,
      descricao,
      is_publico: !!is_publico,
      criado_por: req.usuario.id
    });
    
    // Se foi enviado um arquivo, salvar
    if (arquivo_base64) {
      await ArquivoPdf.create({
        formulario_id: novoFormulario.id,
        conteudo: arquivo_base64
      });
    }
    
    res.status(201).json(novoFormulario);
  } catch (error) {
    console.error("Erro ao criar formulário:", error);
    res.status(500).json({ mensagem: "Erro interno no servidor" });
  }
};

// Atualizar um formulário
exports.atualizarFormulario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, is_publico, arquivo_base64 } = req.body;
    
    const formulario = await Formulario.findByPk(id);
    
    if (!formulario) {
      return res.status(404).json({ mensagem: "Formulário não encontrado" });
    }
    
    // Apenas admins podem atualizar formulários
    if (!req.usuario.is_admin) {
      return res.status(403).json({ mensagem: "Acesso negado. Apenas administradores podem atualizar formulários" });
    }
    
    // Atualizar os campos
    if (nome) formulario.nome = nome;
    if (descricao) formulario.descricao = descricao;
    if (is_publico !== undefined) formulario.is_publico = is_publico;
    
    await formulario.save();
    
    // Se foi enviado um novo arquivo, atualizar
    if (arquivo_base64) {
      const arquivoExistente = await ArquivoPdf.findOne({ where: { formulario_id: id } });
      
      if (arquivoExistente) {
        arquivoExistente.conteudo = arquivo_base64;
        await arquivoExistente.save();
      } else {
        await ArquivoPdf.create({
          formulario_id: id,
          conteudo: arquivo_base64
        });
      }
    }
    
    res.json(formulario);
  } catch (error) {
    console.error("Erro ao atualizar formulário:", error);
    res.status(500).json({ mensagem: "Erro interno no servidor" });
  }
};

// Excluir um formulário
exports.excluirFormulario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const formulario = await Formulario.findByPk(id);
    
    if (!formulario) {
      return res.status(404).json({ mensagem: "Formulário não encontrado" });
    }
    
    // Apenas admins podem excluir formulários
    if (!req.usuario.is_admin) {
      return res.status(403).json({ mensagem: "Acesso negado. Apenas administradores podem excluir formulários" });
    }
    
    // Excluir o arquivo relacionado primeiro (cascata manual)
    await ArquivoPdf.destroy({ where: { formulario_id: id } });
    
    // Depois excluir o formulário
    await formulario.destroy();
    
    res.json({ mensagem: "Formulário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir formulário:", error);
    res.status(500).json({ mensagem: "Erro interno no servidor" });
  }
};