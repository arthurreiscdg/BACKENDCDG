const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Usuario = sequelize.define("Usuario", {
  nome: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  senha_hash: { type: DataTypes.STRING, allowNull: false },
  is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
});

module.exports = Usuario;
