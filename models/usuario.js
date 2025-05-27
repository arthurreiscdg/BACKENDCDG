const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Usuario = sequelize.define("Usuario", {
  nome: DataTypes.STRING,
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
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('metadados');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(val) {
      this.setDataValue('metadados', JSON.stringify(val || {}));
    },
    comment: "Dados adicionais do usuário em formato JSON"
  },
}, {
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
});

module.exports = Usuario;
