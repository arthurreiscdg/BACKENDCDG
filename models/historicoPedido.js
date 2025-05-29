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
      model: 'StatusPedidos',
      key: 'id'
    },
    comment: "Status anterior do pedido"
  },
  status_novo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'StatusPedidos',
      key: 'id'
    },
    comment: "Novo status do pedido"
  },
  tipo_acao: {
    type: DataTypes.ENUM('criacao', 'alteracao_status', 'observacao', 'sistema'),
    defaultValue: 'alteracao_status',
    comment: "Tipo da ação realizada"
  },
  dados_adicionais: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('dados_adicionais');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(val) {
      this.setDataValue('dados_adicionais', JSON.stringify(val || {}));
    },
    comment: "Dados adicionais da mudança em formato JSON"
  }
}, {
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: false,
  tableName: 'HistoricoPedidos'
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
