const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Usuario = require("./usuario");

const Formulario = sequelize.define("Formulario", {
  nome: DataTypes.STRING,
  email: DataTypes.STRING,
  titulo: DataTypes.STRING,
  data_entrega: DataTypes.DATEONLY,
  observacoes: DataTypes.TEXT,
  formato: DataTypes.STRING,
  cor_impressao: DataTypes.STRING,
  impressao: DataTypes.STRING,
  gramatura: { type: DataTypes.STRING, defaultValue: "75g" },
  papel_adesivo: { type: DataTypes.BOOLEAN, defaultValue: false },
  tipo_adesivo: DataTypes.STRING,
  grampos: DataTypes.STRING,
  espiral: { type: DataTypes.BOOLEAN, defaultValue: false },
  capa_pvc: { type: DataTypes.BOOLEAN, defaultValue: false },
  cod_op: DataTypes.STRING,
}, {
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
});

Formulario.belongsTo(Usuario, { foreignKey: "usuario_id" });

module.exports = Formulario;
