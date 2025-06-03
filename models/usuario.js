const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Usuario = sequelize.define("Usuario", {
  nome: DataTypes.STRING,
  username: { 
    type: DataTypes.STRING(255), 
    unique: true, 
    allowNull: true,
    comment: "Nome de usuário único para login"
  },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  senha_hash: { type: DataTypes.STRING, allowNull: false },
  is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
  roles: { 
    type: DataTypes.STRING, 
    defaultValue: "usuario",
    get() {
      const rawValue = this.getDataValue('roles');
      return rawValue ? rawValue.split(',') : [];
    },
    set(val) {
      this.setDataValue('roles', Array.isArray(val) ? val.join(',') : val);
    }
  },
  escola_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: "ID da escola que o usuário tem acesso quando role = escola"
  },
  metadados: {
    type: DataTypes.JSONB, // Mudança para JSONB para melhor suporte no PostgreSQL
    allowNull: true,
    comment: "Dados adicionais do usuário em formato JSON"
  },
}, {
  tableName: "usuarios",
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
});

module.exports = Usuario;
