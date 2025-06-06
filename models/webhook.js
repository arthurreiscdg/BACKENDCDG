const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Webhook = sequelize.define("Webhook", {
  url_destino: DataTypes.STRING(500),
  descricao: DataTypes.TEXT,
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
}, {
  tableName: "webhooks",
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: false
});

module.exports = Webhook;
