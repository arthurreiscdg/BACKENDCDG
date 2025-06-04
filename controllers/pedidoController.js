const Pedido = require("../models/pedido");
const StatusPedido = require("../models/statusPedido");
const HistoricoPedido = require("../models/historicoPedido");
const Usuario = require("../models/usuario");
const webhookService = require("../services/webhookService");
const sequelize = require("../config/database");

/**
 * Controller para operações relacionadas a pedidos
 */
const pedidoController = {
  /**
   * Lista todos os pedidos, filtrados por usuário se não for admin
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */  listarPedidos: async (req, res) => {
    try {
      const { page = 1, limit = 15, status, sku, dataEmissao, numeroPedido, nomeCliente } = req.query;
      
      // Construir filtros
      const filtros = {};
      
      // Filtro por usuário (apenas se não for admin)
      if (!req.usuario.is_admin) {
        filtros.usuario_id = req.usuario.id;
      }
      
      // Aplicar filtros adicionais
      if (status) {
        filtros.status_id = status;
      }
      
      if (sku) {
        filtros.sku = { [require('sequelize').Op.like]: `%${sku}%` };
      }
      
      if (numeroPedido) {
        filtros.numero_pedido = numeroPedido;
      }
      
      if (nomeCliente) {
        filtros.nome_cliente = { [require('sequelize').Op.like]: `%${nomeCliente}%` };
      }
      
      if (dataEmissao) {
        const data = new Date(dataEmissao);
        const proximoDia = new Date(data);
        proximoDia.setDate(data.getDate() + 1);
        
        filtros.criado_em = {
          [require('sequelize').Op.gte]: data,
          [require('sequelize').Op.lt]: proximoDia
        };
      }
      
      // Configurar paginação
      const offset = (page - 1) * limit;
      
      // Buscar pedidos com paginação
      const { count, rows: pedidos } = await Pedido.findAndCountAll({
        where: filtros,
        include: [{ 
          model: StatusPedido, 
          as: 'status',
          attributes: ['id', 'nome', 'cor_css']
        }],
        order: [['criado_em', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      // Calcular metadados de paginação
      const totalPages = Math.ceil(count / limit);
      
      res.json({
        pedidos,
        paginacao: {
          paginaAtual: parseInt(page),
          totalPaginas: totalPages,
          totalPedidos: count,
          itensPorPagina: parseInt(limit)
        }
      });
    } catch (error) {
      console.error("Erro ao listar pedidos:", error);
      res.status(500).json({ mensagem: "Erro interno no servidor", erro: error.message });
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
        status_anterior_id: null, // Não há status anterior na criação
        status_novo_id: 1,
        observacoes: "Pedido criado",
        tipo_acao: 'criacao'
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
  },

  // Listar todos os status de pedidos disponíveis
  listarStatusPedidos: async (req, res) => {
    try {
      const statusList = await StatusPedido.findAll({
        order: [['id', 'ASC']]
      });
      
      res.json(statusList);
    } catch (error) {
      console.error("Erro ao listar status de pedidos:", error);
      res.status(500).json({ mensagem: "Erro interno no servidor" });
    }
  },
  // Obter histórico de status de um pedido
  obterHistoricoPedido: async (req, res) => {
    try {
      const { id } = req.params;
      
      const pedido = await Pedido.findByPk(id);
      if (!pedido) {
        return res.status(404).json({ mensagem: "Pedido não encontrado" });
      }
      
      const historico = await HistoricoPedido.findAll({
        where: { pedido_id: id },
        include: [
          { 
            model: StatusPedido,
            as: 'statusAnterior',
            attributes: ['id', 'nome', 'cor_css']
          },
          { 
            model: StatusPedido,
            as: 'statusNovo',
            attributes: ['id', 'nome', 'cor_css']
          },
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nome', 'username']
          }
        ],
        order: [['criado_em', 'DESC']]
      });
      
      res.json(historico);
    } catch (error) {
      console.error("Erro ao obter histórico do pedido:", error);
      res.status(500).json({ mensagem: "Erro interno no servidor" });
    }
  },
  // Atualizar status de múltiplos pedidos
  atualizarStatusLote: async (req, res) => {
    try {
      const { order_ids, status_id } = req.body;
      
      if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
        return res.status(400).json({ mensagem: "IDs de pedidos são obrigatórios" });
      }
      
      if (!status_id) {
        return res.status(400).json({ mensagem: "ID do status é obrigatório" });
      }

      // Buscar o status para validação
      const status = await StatusPedido.findByPk(status_id);
      if (!status) {
        return res.status(400).json({ mensagem: "Status não encontrado" });
      }

      const resultados = [];
      const erros = [];

      console.log(`🔄 Iniciando atualização em lote para ${order_ids.length} pedido(s) - Status: ${status.nome}`);
      
      for (const orderId of order_ids) {
        try {
          const pedido = await Pedido.findByPk(orderId);
          
          if (!pedido) {
            erros.push(`Pedido ${orderId} não encontrado`);
            continue;
          }

          // ✅ NOVO FLUXO: Webhook PRIMEIRO, banco DEPOIS
          console.log(`🔄 Enviando webhook para pedido ${orderId} antes de alterar status...`);
          
          try {
            // ✅ 1. ENVIAR WEBHOOK PRIMEIRO
            await webhookService.notificarAtualizacaoStatus(pedido, status_id);
            console.log(`✅ Webhook enviado com sucesso para pedido ${orderId}`);
            
            // ✅ 2. SÓ AGORA ATUALIZAR NO BANCO LOCAL (com transação)
            const transaction = await sequelize.transaction();
            
            try {
              // Registrar histórico
              await HistoricoPedido.create({
                pedido_id: orderId,
                status_anterior_id: pedido.status_id,
                status_novo_id: status_id,
                usuario_id: req.usuario.id,
                observacoes: "Status atualizado em lote após confirmação webhook",
                tipo_acao: 'alteracao_status'
              }, { transaction });
              
              // Atualizar pedido
              pedido.status_id = status_id;
              await pedido.save({ transaction });
              
              // Confirmar transação
              await transaction.commit();
              
              resultados.push({
                pedido_id: orderId,
                sucesso: true,
                mensagem: "Status atualizado com sucesso após confirmação webhook"
              });
              
              console.log(`✅ Status do pedido ${orderId} atualizado localmente após webhook confirmado`);
              
            } catch (dbError) {
              await transaction.rollback();
              throw new Error(`Erro no banco de dados: ${dbError.message}`);
            }
            
          } catch (webhookError) {
            // ❌ Se webhook falhou, NÃO atualizar o banco
            console.error(`❌ Falha no webhook para pedido ${orderId}:`, webhookError.message);
            erros.push(`Pedido ${orderId}: Falha na comunicação com servidor externo - ${webhookError.message}`);
          }
          
        } catch (error) {
          console.error(`❌ Erro geral no pedido ${orderId}:`, error.message);
          erros.push(`Pedido ${orderId}: ${error.message}`);
        }
      }

      // Resposta final
      const response = {
        resultados,
        total_processados: order_ids.length,
        sucessos: resultados.length,
        falhas: erros.length
      };

      if (erros.length > 0) {
        response.erros = erros;
      }

      const statusCode = erros.length === order_ids.length ? 500 : 
                        erros.length > 0 ? 207 : 200; // 207 = Multi-Status

      console.log(`📊 Resultado final: ${resultados.length} sucessos, ${erros.length} falhas`);
      res.status(statusCode).json(response);
      
    } catch (error) {
      console.error("Erro na atualização em lote:", error);
      res.status(500).json({ mensagem: "Erro interno no servidor" });
    }
  },

  // Gerar PDF de pedidos selecionados
  gerarPdfPedidos: async (req, res) => {
    try {
      const { order_ids } = req.body;
      
      if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
        return res.status(400).json({ mensagem: "IDs de pedidos são obrigatórios" });
      }
      
      // Por enquanto, retorna um PDF mockado
      // TODO: Implementar geração real de PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="pedidos.pdf"');
      
      // Retorna um PDF vazio por enquanto
      const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n174\n%%EOF');
      
      res.send(pdfContent);
      
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      res.status(500).json({ mensagem: "Erro interno no servidor" });
    }
  },

  // Obter documentos de um pedido
  obterDocumentosPedido: async (req, res) => {
    try {
      const { id } = req.params;
      
      const pedido = await Pedido.findByPk(id);
      if (!pedido) {
        return res.status(404).json({ mensagem: "Pedido não encontrado" });
      }
      
      // Por enquanto, retorna uma lista vazia
      // TODO: Implementar busca real de documentos
      res.json([]);
      
    } catch (error) {
      console.error("Erro ao obter documentos do pedido:", error);
      res.status(500).json({ mensagem: "Erro interno no servidor" });
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
      { model: StatusPedido, as: 'status' }
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
 * @param {Object} options - Opções do Sequelize (ex: transaction)
 * @returns {Promise<Object>} Histórico criado
 */
async function registrarHistoricoStatus(dados, options = {}) {
  return await HistoricoPedido.create(dados, options);
}

/**
 * Atualiza o status de um pedido e registra no histórico
 * @param {Object} pedido - Objeto do pedido
 * @param {number} status_id - ID do novo status
 * @param {string} observacao - Observação sobre a mudança
 * @returns {Promise<void>}
 */
async function atualizarStatusPedido(pedido, status_id, observacao) {
  // Iniciar transação para garantir consistência de dados
  const transaction = await sequelize.transaction();
  
  try {
    // Registrar histórico primeiro
    await registrarHistoricoStatus({
      pedido_id: pedido.id,
      status_anterior_id: pedido.status_id, // Status atual antes da mudança
      status_novo_id: status_id, // Novo status
      observacoes: observacao || "Status atualizado",
      tipo_acao: 'alteracao_status'
    }, { transaction });
    
    // Atualizar status do pedido
    const statusAnterior = pedido.status_id;
    pedido.status_id = status_id;
    await pedido.save({ transaction });
    
    // Tentar enviar webhook - se falhar, desfaz as mudanças
    try {
      await webhookService.notificarAtualizacaoStatus(pedido, status_id);
      
      // Se webhook foi enviado com sucesso, confirma a transação
      await transaction.commit();
      
      console.log(`Status do pedido ${pedido.id} atualizado de ${statusAnterior} para ${status_id} com webhook enviado com sucesso`);
      
    } catch (webhookError) {
      // Se webhook falhou, desfaz todas as mudanças
      await transaction.rollback();
      
      console.error(`Erro ao enviar webhook para pedido ${pedido.id}:`, webhookError);
      throw new Error(`Não foi possível atualizar o status do pedido: falha ao notificar sistemas externos. ${webhookError.message}`);
    }
    
  } catch (error) {
    // Em caso de qualquer erro, desfaz a transação
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
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
    await HistoricoPedido.create({
      pedido_id: novoPedido.id,
      status_anterior_id: null,
      status_novo_id: 1,
      observacoes: "Pedido criado",
      tipo_acao: 'criacao'
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
      await HistoricoPedido.create({
        pedido_id: pedido.id,
        status_anterior_id: pedido.status_id,
        status_novo_id: status_id,
        observacoes: observacao || "Status atualizado",
        tipo_acao: 'alteracao_status'
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