const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Usuario = require("./usuario");
const Permissao = require("./permissao");

const UsuarioPermissao = sequelize.define("UsuarioPermissao", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // O campo UsuarioId e PermissaoId serão adicionados automaticamente pelo Sequelize
}, {
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
});

// Definindo as relações Many-to-Many
Usuario.belongsToMany(Permissao, { through: UsuarioPermissao });
Permissao.belongsToMany(Usuario, { through: UsuarioPermissao });

module.exports = UsuarioPermissao;
