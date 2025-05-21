const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StatusPedido = sequelize.define("StatusPedido", {
  nome: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  descricao: DataTypes.TEXT,
  cor_css: DataTypes.STRING(50),
  ordem: { type: DataTypes.INTEGER, defaultValue: 0 },
  ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  timestamps: false
});

module.exports = StatusPedido;
