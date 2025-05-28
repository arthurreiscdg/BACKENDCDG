const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");
const { authMiddleware } = require("../auth/authMiddleware");

// Todas as rotas de webhook requerem autenticação
router.use(authMiddleware());

// Middleware para verificar se o usuário é administrador
router.use((req, res, next) => {
  if (!req.usuario || !req.usuario.is_admin) {
    return res.status(403).json({ mensagem: "Acesso negado. Apenas administradores podem gerenciar webhooks." });
  }
  next();
});

// Rotas para gerenciamento de webhooks
router.get("/", webhookController.listarWebhooks);
router.get("/:id", webhookController.obterWebhook);
router.post("/", webhookController.criarWebhook);
router.put("/:id", webhookController.atualizarWebhook);
router.delete("/:id", webhookController.excluirWebhook);

module.exports = router;
