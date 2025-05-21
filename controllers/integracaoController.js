/**
 * Controller para integração externa de pedidos
 * Permite que sistemas externos enviem pedidos para o sistema
 */
const Pedido = require("../models/pedido");
const crypto = require("crypto");

const integracaoController = {
  /**
   * Recebe um pedido de uma integração externa e insere no banco de dados
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  receberPedido: async (req, res) => {
    try {
      // Verificar a chave de API
      const apiKey = req.headers["x-api-key"];
      
      if (!apiKey || !verificarChaveApi(apiKey)) {
        return res.status(401).json({ 
          sucesso: false,
          mensagem: "Chave de API inválida ou não fornecida" 
        });
      }

      // Validar os dados do pedido
      const dadosPedido = req.body;
      
      if (!validarDadosPedido(dadosPedido)) {
        return res.status(400).json({ 
          sucesso: false,
          mensagem: "Dados do pedido inválidos ou incompletos" 
        });
      }

      // Converter o pedido do formato externo para o formato interno
      const pedidoFormatado = formatarPedido(dadosPedido);
      
      // Inserir pedido no banco de dados
      const novoPedido = await Pedido.create(pedidoFormatado);
      
      res.status(201).json({
        sucesso: true,
        mensagem: "Pedido recebido com sucesso",
        pedido_id: novoPedido.id,
        numero_pedido: novoPedido.numero_pedido
      });
    } catch (error) {
      console.error("Erro ao processar pedido da integração:", error);
      res.status(500).json({ 
        sucesso: false,
        mensagem: "Erro interno no servidor ao processar o pedido",
        erro: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  /**
   * Verifica o status de um pedido recebido via integração
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  verificarStatusPedido: async (req, res) => {
    try {
      // Verificar a chave de API
      const apiKey = req.headers["x-api-key"];
      
      if (!apiKey || !verificarChaveApi(apiKey)) {
        return res.status(401).json({ 
          sucesso: false,
          mensagem: "Chave de API inválida ou não fornecida" 
        });
      }

      const { numero_pedido } = req.params;
        // Buscar o pedido pelo número de pedido externo
      const pedido = await Pedido.findOne({
        where: { numero_pedido },
        include: ['status']
      });
      
      if (!pedido) {
        return res.status(404).json({
          sucesso: false,
          mensagem: "Pedido não encontrado" 
        });
      }
      
      res.json({
        sucesso: true,
        numero_pedido: pedido.numero_pedido,
        status: pedido.status ? pedido.status.nome : 'Desconhecido',
        data_criacao: pedido.criado_em,
        data_atualizacao: pedido.atualizado_em
      });
    } catch (error) {
      console.error("Erro ao verificar status do pedido:", error);
      res.status(500).json({ 
        sucesso: false,
        mensagem: "Erro interno no servidor ao verificar o pedido",
        erro: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  /**
   * Lista todos os pedidos acessíveis pela API externa
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  listarPedidos: async (req, res) => {
    try {
      // Verificar a chave de API
      const apiKey = req.headers["x-api-key"];
      
      if (!apiKey || !verificarChaveApi(apiKey)) {
        return res.status(401).json({ 
          sucesso: false,
          mensagem: "Chave de API inválida ou não fornecida" 
        });
      }
      
      // Obter parâmetros de paginação
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
        // Buscar pedidos com paginação
      const { count, rows: pedidos } = await Pedido.findAndCountAll({
        limit,
        offset,
        order: [['criado_em', 'DESC']],
        include: ['status']
      });
      
      // Formatar os pedidos para a resposta
      const pedidosFormatados = pedidos.map(pedido => ({
        id: pedido.id,
        numero_pedido: pedido.numero_pedido,
        status: pedido.status ? pedido.status.nome : 'Desconhecido',
        nome_cliente: pedido.nome_cliente,
        valor_pedido: pedido.valor_pedido,
        data_criacao: pedido.criado_em,
        data_atualizacao: pedido.atualizado_em
      }));
      
      // Calcular informações de paginação
      const totalPages = Math.ceil(count / limit);
      
      res.json({
        sucesso: true,
        pedidos: pedidosFormatados,
        paginacao: {
          total: count,
          pagina_atual: page,
          total_paginas: totalPages,
          itens_por_pagina: limit
        }
      });
    } catch (error) {
      console.error("Erro ao listar pedidos:", error);
      res.status(500).json({ 
        sucesso: false,
        mensagem: "Erro interno no servidor ao listar pedidos",
        erro: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Cancela um pedido existente via API externa
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  cancelarPedido: async (req, res) => {
    try {
      // Verificar a chave de API
      const apiKey = req.headers["x-api-key"];
      
      if (!apiKey || !verificarChaveApi(apiKey)) {
        return res.status(401).json({ 
          sucesso: false,
          mensagem: "Chave de API inválida ou não fornecida" 
        });
      }

      const { numero_pedido } = req.params;
      const { motivo_cancelamento } = req.body;
      
      // Validar o motivo de cancelamento
      if (!motivo_cancelamento) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "O motivo do cancelamento é obrigatório"
        });
      }
        // Buscar o pedido pelo número
      const pedido = await Pedido.findOne({
        where: { numero_pedido },
        include: ['status']
      });
      
      if (!pedido) {
        return res.status(404).json({
          sucesso: false,
          mensagem: "Pedido não encontrado" 
        });
      }
      
      // ID do status "Cancelado" (assumindo que existe um status com ID 5 para pedidos cancelados)
      const STATUS_CANCELADO_ID = 5;
      
      // Atualizar o status do pedido para "Cancelado"
      await pedido.update({ 
        status_id: STATUS_CANCELADO_ID,
        obs_cancelamento: motivo_cancelamento,
        atualizado_em: new Date()
      });
      
      // Registrar no histórico de status (se existir modelo para isso)
      try {
        const HistoricoStatus = require("../models/historicoStatus");
        await HistoricoStatus.create({
          pedido_id: pedido.id,
          status_id: STATUS_CANCELADO_ID,
          observacao: motivo_cancelamento,
          criado_em: new Date()
        });
      } catch (historicoError) {
        console.warn("Não foi possível registrar o histórico de status:", historicoError);
      }
      
      // Log da operação
      logApiCall("cancelarPedido", { 
        numero_pedido, 
        motivo_cancelamento, 
        sucesso: true 
      });
      
      res.json({
        sucesso: true,
        mensagem: "Pedido cancelado com sucesso",
        numero_pedido: pedido.numero_pedido,
        status: "Cancelado"
      });
    } catch (error) {
      // Log do erro
      logApiCall("cancelarPedido", { 
        numero_pedido: req.params.numero_pedido, 
        erro: error.message,
        sucesso: false 
      });
      
      console.error("Erro ao cancelar pedido:", error);
      res.status(500).json({ 
        sucesso: false,
        mensagem: "Erro interno no servidor ao cancelar o pedido",
        erro: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  /**
   * Atualiza um pedido existente via API externa
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  atualizarPedido: async (req, res) => {
    try {
      // Verificar a chave de API
      const apiKey = req.headers["x-api-key"];
      
      if (!apiKey || !verificarChaveApi(apiKey)) {
        return res.status(401).json({ 
          sucesso: false,
          mensagem: "Chave de API inválida ou não fornecida" 
        });
      }

      const { numero_pedido } = req.params;
      const dadosAtualizacao = req.body;
      
      // Validar os dados da atualização
      if (!dadosAtualizacao || Object.keys(dadosAtualizacao).length === 0) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Nenhum dado fornecido para atualização"
        });
      }
      
      // Campos que podem ser atualizados
      const camposPermitidos = [
        'email_cliente',
        'telefone_cliente',
        'nome_destinatario',
        'endereco',
        'numero',
        'complemento',
        'bairro',
        'cidade',
        'uf',
        'cep',
        'telefone_destinatario',
        'etiqueta_envio',
        'metodo_envio'
      ];
      
      // Filtrar apenas os campos permitidos
      const camposAtualizar = {};
      for (const campo of camposPermitidos) {
        if (dadosAtualizacao[campo] !== undefined) {
          camposAtualizar[campo] = dadosAtualizacao[campo];
        }
      }
      
      // Verificar se há campos para atualizar após filtrar
      if (Object.keys(camposAtualizar).length === 0) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Nenhum campo válido para atualização"
        });
      }
      
      // Buscar o pedido pelo número
      const pedido = await Pedido.findOne({
        where: { numero_pedido }
      });
      
      if (!pedido) {
        return res.status(404).json({
          sucesso: false,
          mensagem: "Pedido não encontrado" 
        });
      }
      
      // Atualizar data de atualização
      camposAtualizar.atualizado_em = new Date();
      
      // Atualizar o pedido
      await pedido.update(camposAtualizar);
      
      // Log da operação
      logApiCall("atualizarPedido", { 
        numero_pedido, 
        campos_atualizados: Object.keys(camposAtualizar),
        sucesso: true 
      });
      
      res.json({
        sucesso: true,
        mensagem: "Pedido atualizado com sucesso",
        numero_pedido: pedido.numero_pedido,
        campos_atualizados: Object.keys(camposAtualizar).filter(c => c !== 'atualizado_em')
      });
    } catch (error) {
      // Log do erro
      logApiCall("atualizarPedido", { 
        numero_pedido: req.params.numero_pedido, 
        erro: error.message,
        sucesso: false 
      });
      
      console.error("Erro ao atualizar pedido:", error);
      res.status(500).json({ 
        sucesso: false,
        mensagem: "Erro interno no servidor ao atualizar o pedido",
        erro: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  /**
   * Retorna métricas de uso da API
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  getMetricas: async (req, res) => {
    try {
      // Verificar a chave de API (apenas admin deveria acessar as métricas)
      const apiKey = req.headers["x-api-key"];
      
      if (!apiKey || !verificarChaveApi(apiKey)) {
        return res.status(401).json({ 
          sucesso: false,
          mensagem: "Chave de API inválida ou não fornecida" 
        });
      }
      
      // Se existir um modelo para armazenar métricas, usaríamos ele aqui
      // Como é uma implementação simples, usamos as métricas em memória
      
      res.json({
        sucesso: true,
        metricas: {
          chamadas_totais: apiMetrics.totalCalls || 0,
          chamadas_por_endpoint: apiMetrics.callsByEndpoint || {},
          erros_totais: apiMetrics.totalErrors || 0,
          ultima_hora: apiMetrics.lastHourCalls || 0,
          tempo_medio_resposta: apiMetrics.averageResponseTime || "N/A"
        }
      });
    } catch (error) {
      console.error("Erro ao obter métricas:", error);
      res.status(500).json({ 
        sucesso: false,
        mensagem: "Erro interno no servidor ao obter métricas",
        erro: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

/**
 * Verifica se a chave de API fornecida é válida
 * @param {string} apiKey - Chave de API fornecida no header
 * @returns {boolean} - Verdadeiro se a chave for válida
 */
function verificarChaveApi(apiKey) {
  // A chave de API deve ser configurada no .env
  const chaveValida = process.env.API_KEY;
  
  if (!chaveValida) {
    console.error("Chave de API não configurada no arquivo .env");
    return false;
  }
  
  // Comparação simples de strings
  return apiKey === chaveValida;
}

/**
 * Valida os dados do pedido recebido
 * @param {Object} dadosPedido - Dados do pedido
 * @returns {boolean} - Verdadeiro se os dados forem válidos
 */
function validarDadosPedido(dadosPedido) {
  // Validar campos obrigatórios básicos
  if (!dadosPedido) return false;
  
  const camposObrigatorios = [
    'numero_pedido',
    'nome_cliente',
    'email_cliente',
    'produtos',
    'endereco_envio'
  ];
  
  for (const campo of camposObrigatorios) {
    if (!dadosPedido[campo]) return false;
  }
  
  // Validar produtos - deve haver pelo menos 1
  if (!Array.isArray(dadosPedido.produtos) || dadosPedido.produtos.length === 0) {
    return false;
  }
  
  // Validar endereço de envio
  const enderecoObrigatorio = [
    'nome_destinatario',
    'endereco',
    'numero',
    'cidade',
    'uf',
    'cep',
    'bairro'
  ];
  
  for (const campo of enderecoObrigatorio) {
    if (!dadosPedido.endereco_envio[campo]) return false;
  }
  
  return true;
}

/**
 * Formata o pedido do formato externo para o formato interno
 * @param {Object} dadosExternos - Dados do pedido no formato externo
 * @returns {Object} - Dados formatados para a tabela de pedidos
 */
function formatarPedido(dadosExternos) {
  // Assumindo que estamos tratando apenas do primeiro produto
  const produto = dadosExternos.produtos[0];
  const endereco = dadosExternos.endereco_envio;
  const infoAdicional = dadosExternos.informacoes_adicionais || {};
  
  return {
    // Campos básicos do pedido
    valor_pedido: dadosExternos.valor_pedido || 0,
    custo_envio: dadosExternos.custo_envio || 0,
    etiqueta_envio: dadosExternos.etiqueta_envio,
    metodo_envio: dadosExternos.metodo_envio,
    numero_pedido: dadosExternos.numero_pedido,
    
    // Dados do cliente
    nome_cliente: dadosExternos.nome_cliente,
    documento_cliente: dadosExternos.documento_cliente,
    email_cliente: dadosExternos.email_cliente,
    
    // Status inicial - assumindo que existe um status com ID 1 para novos pedidos
    status_id: 1,
    
    // Dados do produto
    nome_produto: produto.nome,
    sku: produto.sku,
    quantidade: produto.quantidade,
    id_sku: produto.id_sku,
    arquivo_pdf_produto: produto.arquivo_pdf,
    
    // Designs e mockups
    design_capa_frente: produto.designs?.capa_frente,
    design_capa_verso: produto.designs?.capa_verso,
    mockup_capa_frente: produto.mockups?.capa_frente,
    mockup_capa_costas: produto.mockups?.capa_costas,
    
    // Dados do endereço
    nome_destinatario: endereco.nome_destinatario,
    endereco: endereco.endereco,
    numero: endereco.numero,
    complemento: endereco.complemento,
    cidade: endereco.cidade,
    uf: endereco.uf,
    cep: endereco.cep,
    bairro: endereco.bairro,
    telefone_destinatario: endereco.telefone,
    pais: endereco.pais || 'Brasil', // Valor padrão
    
    // Informações adicionais
    nome_info_adicional: infoAdicional.nome,
    telefone_info_adicional: infoAdicional.telefone,
    email_info_adicional: infoAdicional.email
  };
}

/**
 * Sistema simples de métricas da API
 */
const apiMetrics = {
  totalCalls: 0,
  totalErrors: 0,
  callsByEndpoint: {},
  lastHourCalls: 0,
  callLog: [],
  averageResponseTime: 0
};

/**
 * Registra uma chamada à API para métricas
 * @param {string} endpoint - Nome do endpoint chamado
 * @param {Object} details - Detalhes da chamada
 */
function logApiCall(endpoint, details = {}) {
  // Incrementar contadores
  apiMetrics.totalCalls++;
  apiMetrics.callsByEndpoint[endpoint] = (apiMetrics.callsByEndpoint[endpoint] || 0) + 1;
  
  if (!details.sucesso) {
    apiMetrics.totalErrors++;
  }
  
  // Registrar chamada com timestamp
  const timestamp = new Date();
  apiMetrics.callLog.push({
    endpoint,
    timestamp,
    sucesso: details.sucesso,
    ...details
  });
  
  // Limitar log a últimas 1000 chamadas
  if (apiMetrics.callLog.length > 1000) {
    apiMetrics.callLog.shift();
  }
  
  // Calcular chamadas na última hora
  const umaHoraAtras = new Date(timestamp.getTime() - 60 * 60 * 1000);
  apiMetrics.lastHourCalls = apiMetrics.callLog.filter(
    call => call.timestamp > umaHoraAtras
  ).length;
  
  // Registrar em arquivo de log se configurado
  if (process.env.API_LOG_FILE) {
    const fs = require('fs');
    try {
      const logEntry = `[${timestamp.toISOString()}] ${endpoint} - ${JSON.stringify(details)}\n`;
      fs.appendFileSync(process.env.API_LOG_FILE, logEntry);
    } catch (error) {
      console.error("Erro ao registrar log em arquivo:", error);
    }
  }
}

module.exports = integracaoController;
