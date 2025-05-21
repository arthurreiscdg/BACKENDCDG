const Pedido = require("../models/pedido");
const StatusPedido = require("../models/statusPedido");
const HistoricoStatus = require("../models/historicoStatus");

/**
 * Controller para operações relacionadas a pedidos
 */
const pedidoController = {
  /**
   * Lista todos os pedidos, filtrados por usuário se não for admin
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  listarPedidos: async (req, res) => {
    try {
      const pedidos = await buscarTodosPedidos(req.usuario);
      res.json(pedidos);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao listar pedidos");
    }
  },

  /**
   * Obtém um pedido específico por ID
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  obterPedido: async (req, res) => {
    try {
      const { id } = req.params;
      const pedido = await buscarPedidoPorId(id);
      
      if (!pedido) {
        return res.status(404).json({ mensagem: "Pedido não encontrado" });
      }
      
      if (!verificarPermissaoVisualizacao(req.usuario, pedido)) {
        return res.status(403).json({ mensagem: "Acesso negado" });
      }
      
      res.json(pedido);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao obter pedido");
    }
  },

  /**
   * Cria um novo pedido
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  criarPedido: async (req, res) => {
    try {
      const { titulo, descricao, unidade_id } = req.body;
      
      if (!validarCamposPedido(titulo, descricao, unidade_id)) {
        return res.status(400).json({ mensagem: "Título, descrição e unidade são obrigatórios" });
      }
      
      const novoPedido = await criarNovoPedido({
        titulo,
        descricao,
        usuario_id: req.usuario.id,
        unidade_id,
        status_id: 1 // Assumindo que o ID 1 é o status "Aberto"
      });
      
      await registrarHistoricoStatus({
        pedido_id: novoPedido.id,
        status_id: 1,
        observacao: "Pedido criado"
      });
      
      res.status(201).json(novoPedido);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao criar pedido");
    }
  },

  /**
   * Atualiza um pedido existente
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  atualizarPedido: async (req, res) => {
    try {
      const { id } = req.params;
      const { titulo, descricao, status_id, observacao } = req.body;
      
      const pedido = await buscarPedidoPorId(id, false);
      
      if (!pedido) {
        return res.status(404).json({ mensagem: "Pedido não encontrado" });
      }
      
      if (!verificarPermissaoEdicao(req.usuario, pedido)) {
        return res.status(403).json({ mensagem: "Acesso negado" });
      }
      
      // Atualiza o status e registra no histórico se necessário
      if (status_id && status_id !== pedido.status_id) {
        await atualizarStatusPedido(pedido, status_id, observacao);
      }
      
      // Atualiza os demais campos
      await atualizarDadosPedido(pedido, { titulo, descricao });
      
      res.json(pedido);
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao atualizar pedido");
    }
  },

  /**
   * Exclui um pedido
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  excluirPedido: async (req, res) => {
    try {
      const { id } = req.params;
      
      const pedido = await buscarPedidoPorId(id, false);
      
      if (!pedido) {
        return res.status(404).json({ mensagem: "Pedido não encontrado" });
      }
      
      if (!verificarPermissaoExclusao(req.usuario)) {
        return res.status(403).json({ mensagem: "Acesso negado. Apenas administradores podem excluir pedidos" });
      }
      
      await excluirPedido(pedido);
      
      res.json({ mensagem: "Pedido excluído com sucesso" });
    } catch (error) {
      tratarErroInterno(error, res, "Erro ao excluir pedido");
    }
  }
};

/**
 * Busca todos os pedidos, aplicando filtros por usuário se necessário
 * @param {Object} usuario - Dados do usuário logado
 * @returns {Promise<Array>} Lista de pedidos
 */
async function buscarTodosPedidos(usuario) {
  const filtro = usuario.is_admin ? {} : { usuario_id: usuario.id };
  
  return await Pedido.findAll({
    where: filtro,
    include: [{ model: StatusPedido, as: 'status' }],
    order: [['criado_em', 'DESC']]
  });
}

/**
 * Busca um pedido específico por ID
 * @param {number} id - ID do pedido
 * @param {boolean} incluirRelacionamentos - Se deve incluir modelos relacionados
 * @returns {Promise<Object>} Pedido encontrado ou null
 */
async function buscarPedidoPorId(id, incluirRelacionamentos = true) {
  const opcoes = {};
  
  if (incluirRelacionamentos) {
    opcoes.include = [
      { model: StatusPedido, as: 'status' },
      { model: HistoricoStatus, as: 'historico', include: [{ model: StatusPedido }] }
    ];
  }
  
  return await Pedido.findByPk(id, opcoes);
}

/**
 * Verifica se o usuário tem permissão para visualizar um pedido
 * @param {Object} usuario - Dados do usuário logado
 * @param {Object} pedido - Dados do pedido
 * @returns {boolean} Verdadeiro se o usuário tem permissão
 */
function verificarPermissaoVisualizacao(usuario, pedido) {
  return usuario.is_admin || pedido.usuario_id === usuario.id;
}

/**
 * Verifica se o usuário tem permissão para editar um pedido
 * @param {Object} usuario - Dados do usuário logado
 * @param {Object} pedido - Dados do pedido
 * @returns {boolean} Verdadeiro se o usuário tem permissão
 */
function verificarPermissaoEdicao(usuario, pedido) {
  return usuario.is_admin || pedido.usuario_id === usuario.id;
}

/**
 * Verifica se o usuário tem permissão para excluir um pedido
 * @param {Object} usuario - Dados do usuário logado
 * @returns {boolean} Verdadeiro se o usuário tem permissão
 */
function verificarPermissaoExclusao(usuario) {
  return usuario.is_admin;
}

/**
 * Valida os campos obrigatórios do pedido
 * @param {string} titulo - Título do pedido
 * @param {string} descricao - Descrição do pedido
 * @param {number} unidade_id - ID da unidade
 * @returns {boolean} Verdadeiro se os campos são válidos
 */
function validarCamposPedido(titulo, descricao, unidade_id) {
  return titulo && descricao && unidade_id;
}

/**
 * Cria um novo pedido no banco de dados
 * @param {Object} dados - Dados do pedido
 * @returns {Promise<Object>} Pedido criado
 */
async function criarNovoPedido(dados) {
  return await Pedido.create(dados);
}

/**
 * Registra uma nova entrada no histórico de status
 * @param {Object} dados - Dados do histórico
 * @returns {Promise<Object>} Histórico criado
 */
async function registrarHistoricoStatus(dados) {
  return await HistoricoStatus.create(dados);
}

/**
 * Atualiza o status de um pedido e registra no histórico
 * @param {Object} pedido - Objeto do pedido
 * @param {number} status_id - ID do novo status
 * @param {string} observacao - Observação sobre a mudança
 * @returns {Promise<void>}
 */
async function atualizarStatusPedido(pedido, status_id, observacao) {
  await registrarHistoricoStatus({
    pedido_id: pedido.id,
    status_id,
    observacao: observacao || "Status atualizado"
  });
  
  pedido.status_id = status_id;
}

/**
 * Atualiza os dados de um pedido
 * @param {Object} pedido - Objeto do pedido
 * @param {Object} dados - Novos dados
 * @returns {Promise<void>}
 */
async function atualizarDadosPedido(pedido, dados) {
  if (dados.titulo) pedido.titulo = dados.titulo;
  if (dados.descricao) pedido.descricao = dados.descricao;
  
  await pedido.save();
}

/**
 * Exclui um pedido
 * @param {Object} pedido - Objeto do pedido
 * @returns {Promise<void>}
 */
async function excluirPedido(pedido) {
  await pedido.destroy();
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

module.exports = pedidoController;

// Criar um novo pedido
exports.criarPedido = async (req, res) => {
  try {
    const { titulo, descricao, unidade_id } = req.body;
    
    // Validação básica
    if (!titulo || !descricao || !unidade_id) {
      return res.status(400).json({ mensagem: "Título, descrição e unidade são obrigatórios" });
    }
    
    // Criar o pedido com status inicial "Aberto"
    const novoPedido = await Pedido.create({
      titulo,
      descricao,
      usuario_id: req.usuario.id,
      unidade_id,
      status_id: 1 // Assumindo que o ID 1 é o status "Aberto"
    });
    
    // Registrar o histórico de status
    await HistoricoStatus.create({
      pedido_id: novoPedido.id,
      status_id: 1,
      observacao: "Pedido criado"
    });
    
    res.status(201).json(novoPedido);
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    res.status(500).json({ mensagem: "Erro interno no servidor" });
  }
};

// Atualizar um pedido
exports.atualizarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, status_id, observacao } = req.body;
    
    const pedido = await Pedido.findByPk(id);
    
    if (!pedido) {
      return res.status(404).json({ mensagem: "Pedido não encontrado" });
    }
    
    // Verificar se o usuário tem permissão para editar este pedido
    // Admins podem editar qualquer pedido, usuários comuns só os seus
    if (!req.usuario.is_admin && pedido.usuario_id !== req.usuario.id) {
      return res.status(403).json({ mensagem: "Acesso negado" });
    }
    
    // Se houver mudança de status, registrar no histórico
    if (status_id && status_id !== pedido.status_id) {
      await HistoricoStatus.create({
        pedido_id: pedido.id,
        status_id,
        observacao: observacao || "Status atualizado"
      });
      
      pedido.status_id = status_id;
    }
    
    // Atualizar os outros campos
    if (titulo) pedido.titulo = titulo;
    if (descricao) pedido.descricao = descricao;
    
    await pedido.save();
    
    res.json(pedido);
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    res.status(500).json({ mensagem: "Erro interno no servidor" });
  }
};

// Excluir um pedido
exports.excluirPedido = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pedido = await Pedido.findByPk(id);
    
    if (!pedido) {
      return res.status(404).json({ mensagem: "Pedido não encontrado" });
    }
    
    // Apenas admins podem excluir pedidos
    if (!req.usuario.is_admin) {
      return res.status(403).json({ mensagem: "Acesso negado. Apenas administradores podem excluir pedidos" });
    }
    
    await pedido.destroy();
    
    res.json({ mensagem: "Pedido excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir pedido:", error);
    res.status(500).json({ mensagem: "Erro interno no servidor" });
  }
};