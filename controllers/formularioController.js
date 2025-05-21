const Formulario = require("../models/formulario");
const ArquivoPdf = require("../models/arquivoPdf");

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
  },

  /**
   * Cria um novo formulário
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  criarFormulario: async (req, res) => {
    try {
      const { nome, descricao, is_publico, arquivo_base64 } = req.body;
      
      if (!validarCamposFormulario(nome, descricao, arquivo_base64)) {
        return res.status(400).json({ mensagem: "Nome, descrição e arquivo são obrigatórios" });
      }
      
      if (!verificarPermissaoCriacao(req.usuario)) {
        return res.status(403).json({ mensagem: "Acesso negado. Apenas administradores podem criar formulários" });
      }
      
      const novoFormulario = await criarNovoFormulario({
        nome,
        descricao,
        is_publico: !!is_publico,
        criado_por: req.usuario.id
      });
      
      if (arquivo_base64) {
        await salvarArquivoFormulario(novoFormulario.id, arquivo_base64);
      }
      
      res.status(201).json(novoFormulario);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao criar formulário");
    }
  },

  /**
   * Atualiza um formulário existente
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  atualizarFormulario: async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, descricao, is_publico, arquivo_base64 } = req.body;
      
      const formulario = await buscarFormularioPorId(id, false);
      
      if (!formulario) {
        return res.status(404).json({ mensagem: "Formulário não encontrado" });
      }
      
      if (!verificarPermissaoEdicao(req.usuario)) {
        return res.status(403).json({ mensagem: "Acesso negado. Apenas administradores podem atualizar formulários" });
      }
      
      await atualizarDadosFormulario(formulario, { nome, descricao, is_publico });
      
      if (arquivo_base64) {
        await atualizarArquivoFormulario(id, arquivo_base64);
      }
      
      res.json(formulario);
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
      
      const formulario = await buscarFormularioPorId(id, false);
      
      if (!formulario) {
        return res.status(404).json({ mensagem: "Formulário não encontrado" });
      }
      
      if (!verificarPermissaoExclusao(req.usuario)) {
        return res.status(403).json({ mensagem: "Acesso negado. Apenas administradores podem excluir formulários" });
      }
      
      await excluirFormulario(id);
      
      res.json({ mensagem: "Formulário excluído com sucesso" });
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao excluir formulário");
    }
  }
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
    opcoes.include = [{ model: ArquivoPdf, as: 'arquivo' }];
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
 * Valida os campos obrigatórios do formulário
 * @param {string} nome - Nome do formulário
 * @param {string} descricao - Descrição do formulário
 * @param {string} arquivo_base64 - Conteúdo do arquivo em base64
 * @returns {boolean} Verdadeiro se os campos são válidos
 */
function validarCamposFormulario(nome, descricao, arquivo_base64) {
  return nome && descricao && (arquivo_base64 !== undefined);
}

/**
 * Cria um novo formulário no banco de dados
 * @param {Object} dados - Dados do formulário
 * @returns {Promise<Object>} Formulário criado
 */
async function criarNovoFormulario(dados) {
  return await Formulario.create(dados);
}

/**
 * Salva um arquivo PDF para um formulário
 * @param {number} formulario_id - ID do formulário
 * @param {string} conteudo - Conteúdo do arquivo em base64
 * @returns {Promise<Object>} Arquivo criado
 */
async function salvarArquivoFormulario(formulario_id, conteudo) {
  return await ArquivoPdf.create({
    formulario_id,
    conteudo
  });
}

/**
 * Atualiza os dados de um formulário
 * @param {Object} formulario - Objeto do formulário
 * @param {Object} dados - Novos dados
 * @returns {Promise<void>}
 */
async function atualizarDadosFormulario(formulario, dados) {
  if (dados.nome) formulario.nome = dados.nome;
  if (dados.descricao) formulario.descricao = dados.descricao;
  if (dados.is_publico !== undefined) formulario.is_publico = dados.is_publico;
  
  await formulario.save();
}

/**
 * Atualiza o arquivo de um formulário
 * @param {number} formulario_id - ID do formulário
 * @param {string} conteudo - Conteúdo do arquivo em base64
 * @returns {Promise<void>}
 */
async function atualizarArquivoFormulario(formulario_id, conteudo) {
  const arquivoExistente = await ArquivoPdf.findOne({ 
    where: { formulario_id } 
  });
  
  if (arquivoExistente) {
    arquivoExistente.conteudo = conteudo;
    await arquivoExistente.save();
  } else {
    await salvarArquivoFormulario(formulario_id, conteudo);
  }
}

/**
 * Exclui um formulário e seu arquivo relacionado
 * @param {number} id - ID do formulário
 * @returns {Promise<void>}
 */
async function excluirFormulario(id) {
  // Excluir o arquivo relacionado primeiro (cascata manual)
  await ArquivoPdf.destroy({ where: { formulario_id: id } });
  
  // Depois excluir o formulário
  await Formulario.destroy({ where: { id } });
}

/**
 * Trata erros internos do servidor
 * @param {Error} error - Objeto de erro
 * @param {Object} res - Objeto de resposta Express
 * @param {string} mensagemLog - Mensagem para o log
 */
function tratarErroInterno(error, res, mensagemLog) {
  console.error(`${mensagemLog}:`, error);
  res.status(500).json({ mensagem: "Erro interno no servidor" });
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