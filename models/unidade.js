const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Formulario = require("./formulario");

const Unidade = sequelize.define("Unidade", {
  nome: { type: DataTypes.STRING, allowNull: false },
  quantidade: { type: DataTypes.INTEGER, defaultValue: 1 },
}, {
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
});

Unidade.belongsTo(Formulario, { foreignKey: "formulario_id" });

module.exports = Unidade;
