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
  tableName: "usuario_permissoes",
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
});

// Definindo as relações Many-to-Many
Usuario.belongsToMany(Permissao, { through: UsuarioPermissao, foreignKey: "usuario_id" });
Permissao.belongsToMany(Usuario, { through: UsuarioPermissao, foreignKey: "permissao_id" });

module.exports = UsuarioPermissao;
