const axios = require("axios");
const Webhook = require("../models/webhook");
const StatusPedido = require("../models/statusPedido");
const Pedido = require("../models/pedido");

/**
 * Serviço para gerenciamento e disparo de webhooks
 */
const webhookService = {
  /**
   * Envia notificação de atualização de status via webhook para todos os endpoints cadastrados
   * @param {Object} pedido - Objeto do pedido atualizado
   * @param {number} statusId - ID do status atualizado
   * @returns {Promise<Array>} - Resultados das chamadas de webhook
   */
  notificarAtualizacaoStatus: async (pedido, statusId) => {
    try {
      // Busca todos os webhooks cadastrados
      const webhooks = await Webhook.findAll({
        where: { ativo: true }
      });

      if (!webhooks || webhooks.length === 0) {
        console.log("Nenhum webhook cadastrado para notificação");
        return [];
      }

      // Busca o status atualizado
      const status = await StatusPedido.findByPk(statusId);
      
      if (!status) {
        throw new Error(`Status com ID ${statusId} não encontrado`);
      }

      // Busca o pedido completo
      const pedidoCompleto = await Pedido.findByPk(pedido.id);
      
      if (!pedidoCompleto) {
        throw new Error(`Pedido com ID ${pedido.id} não encontrado`);
      }

      // Prepara o payload do webhook
      const dataHoraAtual = new Date().toISOString().replace("T", " ").substring(0, 19);
      
      // Gera um token de acesso aleatório - em uma implementação real, isso seria mais robusto
      const access_token = gerarTokenAcesso();
      
      const payload = {
        data: dataHoraAtual,
        access_token: access_token,
        json: {
          casa_grafica_id: pedidoCompleto.id.toString(),
          status_id: status.id,
          status: status.nome
        }
      };      // Envia para todos os webhooks cadastrados
      const resultados = await Promise.all(
        webhooks.map(webhook => enviarWebhook(webhook.url_destino, payload))
      );

      // Verifica se todos os webhooks foram enviados com sucesso
      const falhas = resultados.filter(resultado => !resultado.success);
      
      if (falhas.length > 0) {
        const errosDetalhados = falhas.map(falha => 
          `URL: ${falha.url}, Erro: ${falha.error}, Status: ${falha.status || 'N/A'}`
        ).join('; ');
        
        throw new Error(`Falha ao enviar ${falhas.length} de ${resultados.length} webhooks: ${errosDetalhados}`);
      }

      console.log(`Todos os ${resultados.length} webhooks enviados com sucesso para pedido ${pedido.id}`);
      return resultados;
    } catch (error) {
      console.error("Erro ao notificar atualização via webhook:", error);
      throw error;
    }
  }
};

/**
 * Envia uma requisição POST para o URL de destino com o payload
 * @param {string} url - URL de destino
 * @param {Object} payload - Dados a serem enviados
 * @returns {Promise<Object>} - Resultado da requisição
 */
async function enviarWebhook(url, payload) {
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 segundos de timeout
    });
    
    return {
      url,
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      url,
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

/**
 * Gera um token de acesso aleatório
 * @returns {string} - Token de acesso gerado
 */
function gerarTokenAcesso() {
  const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  
  for (let i = 0; i < 20; i++) {
    token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  
  return token;
}

module.exports = webhookService;
