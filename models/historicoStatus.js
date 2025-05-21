const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Usuario = require("./usuario");
const StatusPedido = require("./statusPedido");
const Pedido = require("./pedido");

const HistoricoStatus = sequelize.define("HistoricoStatus", {
  pedido_id: { type: DataTypes.INTEGER, allowNull: false },
  status_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: false
});

HistoricoStatus.belongsTo(Pedido, { foreignKey: "pedido_id" });
HistoricoStatus.belongsTo(StatusPedido, { foreignKey: "status_id" });
HistoricoStatus.belongsTo(Usuario, { foreignKey: "usuario_id" });

module.exports = HistoricoStatus;
