const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Usuario = require("./usuario");
const StatusPedido = require("./statusPedido");
const Webhook = require("./webhook");

const Pedido = sequelize.define("Pedido", {
  titulo: DataTypes.STRING,
  valor_pedido: DataTypes.DECIMAL(10, 2),
  custo_envio: DataTypes.DECIMAL(10, 2),
  etiqueta_envio: DataTypes.STRING(500),
  metodo_envio: DataTypes.INTEGER,
  numero_pedido: { type: DataTypes.INTEGER, unique: true },

  nome_cliente: DataTypes.STRING,
  documento_cliente: DataTypes.STRING(20),
  email_cliente: DataTypes.STRING,

  pdf_path: DataTypes.STRING(255),

  nome_destinatario: DataTypes.STRING,
  endereco: DataTypes.STRING,
  numero: DataTypes.STRING(20),
  complemento: DataTypes.STRING,
  cidade: DataTypes.STRING(100),
  uf: DataTypes.STRING(2),
  cep: DataTypes.STRING(9),
  bairro: DataTypes.STRING(100),
  telefone_destinatario: DataTypes.STRING(20),
  pais: DataTypes.STRING(50),

  nome_info_adicional: DataTypes.STRING,
  telefone_info_adicional: DataTypes.STRING(20),
  email_info_adicional: DataTypes.STRING,

  nome_produto: DataTypes.STRING,
  sku: DataTypes.STRING(100),
  quantidade: DataTypes.INTEGER,
  id_sku: DataTypes.INTEGER,
  arquivo_pdf_produto: DataTypes.STRING(500),

  design_capa_frente: DataTypes.STRING(500),
  design_capa_verso: DataTypes.STRING(500),
  mockup_capa_frente: DataTypes.STRING(500),
  mockup_capa_costas: DataTypes.STRING(500),
}, {
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
});

Pedido.belongsTo(Usuario, { foreignKey: "usuario_id" });
Pedido.belongsTo(StatusPedido, { foreignKey: "status_id", as: "status" });
Pedido.belongsTo(Webhook, { foreignKey: "webhook_id" });

module.exports = Pedido;
