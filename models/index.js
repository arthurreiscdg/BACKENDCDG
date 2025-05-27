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

// As relações entre Usuario e Permissao já estão definidas no modelo UsuarioPermissao

module.exports = {
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
