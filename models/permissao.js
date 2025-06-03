const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Permissao = sequelize.define("Permissao", {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: "permissoes",
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
});

module.exports = Permissao;
