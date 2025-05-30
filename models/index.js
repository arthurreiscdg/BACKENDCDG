const Usuario = require('./usuario');
const Permissao = require('./permissao');
const UsuarioPermissao = require('./usuarioPermissao');
const Formulario = require('./formulario');
const HistoricoStatus = require('./historicoStatus');
const Pedido = require('./pedido');
const StatusPedido = require('./statusPedido');
const Unidade = require('./unidade');
const Webhook = require('./webhook');
const ArquivoPdf = require('./arquivoPdf');
const pedidoJsonPdf = require('./pedidoJsonPdf');

// Definir associações
const models = {
  Usuario,
  Permissao,
  UsuarioPermissao,
  Formulario,
  HistoricoStatus,
  Pedido,
  StatusPedido,
  Unidade,
  Webhook,
  ArquivoPdf
};

// Executar associações se existirem
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
