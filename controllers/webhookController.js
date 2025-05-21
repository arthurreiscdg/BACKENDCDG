const Webhook = require("../models/webhook");

/**
 * Controller para operações relacionadas a webhooks
 */
const webhookController = {
  /**
   * Lista todos os webhooks cadastrados
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  listarWebhooks: async (req, res) => {
    try {
      const webhooks = await Webhook.findAll();
      res.json(webhooks);
    } catch (error) {
      console.error("Erro ao listar webhooks:", error);
      res.status(500).json({ mensagem: "Erro ao listar webhooks" });
    }
  },

  /**
   * Obtém um webhook específico por ID
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  obterWebhook: async (req, res) => {
    try {
      const { id } = req.params;
      const webhook = await Webhook.findByPk(id);
      
      if (!webhook) {
        return res.status(404).json({ mensagem: "Webhook não encontrado" });
      }
      
      res.json(webhook);
    } catch (error) {
      console.error("Erro ao obter webhook:", error);
      res.status(500).json({ mensagem: "Erro ao obter webhook" });
    }
  },

  /**
   * Cria um novo webhook
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  criarWebhook: async (req, res) => {
    try {
      const { url_destino, descricao, ativo = true } = req.body;
      
      if (!url_destino) {
        return res.status(400).json({ mensagem: "URL de destino é obrigatória" });
      }
      
      const webhook = await Webhook.create({
        url_destino,
        descricao,
        ativo
      });
      
      res.status(201).json(webhook);
    } catch (error) {
      console.error("Erro ao criar webhook:", error);
      res.status(500).json({ mensagem: "Erro ao criar webhook" });
    }
  },

  /**
   * Atualiza um webhook existente
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  atualizarWebhook: async (req, res) => {
    try {
      const { id } = req.params;
      const { url_destino, descricao, ativo } = req.body;
      
      const webhook = await Webhook.findByPk(id);
      
      if (!webhook) {
        return res.status(404).json({ mensagem: "Webhook não encontrado" });
      }
      
      // Atualiza os campos se fornecidos
      if (url_destino !== undefined) webhook.url_destino = url_destino;
      if (descricao !== undefined) webhook.descricao = descricao;
      if (ativo !== undefined) webhook.ativo = ativo;
      
      await webhook.save();
      
      res.json(webhook);
    } catch (error) {
      console.error("Erro ao atualizar webhook:", error);
      res.status(500).json({ mensagem: "Erro ao atualizar webhook" });
    }
  },

  /**
   * Exclui um webhook
   * @param {Object} req - Objeto de requisição Express
   * @param {Object} res - Objeto de resposta Express
   */
  excluirWebhook: async (req, res) => {
    try {
      const { id } = req.params;
      
      const webhook = await Webhook.findByPk(id);
      
      if (!webhook) {
        return res.status(404).json({ mensagem: "Webhook não encontrado" });
      }
      
      await webhook.destroy();
      
      res.json({ mensagem: "Webhook excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir webhook:", error);
      res.status(500).json({ mensagem: "Erro ao excluir webhook" });
    }
  }
};

module.exports = webhookController;
