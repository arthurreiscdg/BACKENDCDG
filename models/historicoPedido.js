const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Pedido = require("./pedido");
const Usuario = require("./usuario");
const StatusPedido = require("./statusPedido");

const HistoricoPedido = sequelize.define("HistoricoPedido", {
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Observações sobre a mudança de status"
  },
  status_anterior_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'status_pedidos',
      key: 'id'
    },
    comment: "Status anterior do pedido"
  },
  status_novo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'status_pedidos',
      key: 'id'
    },
    comment: "Novo status do pedido"
  },
  tipo_acao: {
    type: DataTypes.STRING, // PostgreSQL não usa ENUM da mesma forma que o MySQL
    validate: {
      isIn: [['criacao', 'alteracao_status', 'observacao', 'sistema']]
    },
    defaultValue: 'alteracao_status',
    comment: "Tipo da ação realizada"
  },
  dados_adicionais: {
    type: DataTypes.JSONB, // Mudança para JSONB para melhor suporte no PostgreSQL
    allowNull: true,
    comment: "Dados adicionais da mudança em formato JSON"
  }
}, {
  tableName: 'historico_pedidos',
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: false
});

// Relacionamentos
HistoricoPedido.belongsTo(Pedido, { 
  foreignKey: "pedido_id", 
  as: "pedido",
  onDelete: 'CASCADE'
});

HistoricoPedido.belongsTo(Usuario, { 
  foreignKey: "usuario_id", 
  as: "usuario",
  allowNull: true // Pode ser nulo para ações do sistema
});

HistoricoPedido.belongsTo(StatusPedido, { 
  foreignKey: "status_anterior_id", 
  as: "statusAnterior"
});

HistoricoPedido.belongsTo(StatusPedido, { 
  foreignKey: "status_novo_id", 
  as: "statusNovo"
});

module.exports = HistoricoPedido;
