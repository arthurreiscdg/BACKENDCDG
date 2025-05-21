const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Formulario = require("./formulario");

const ArquivoPdf = sequelize.define("ArquivoPdf", {
  nome: { type: DataTypes.STRING, allowNull: false },
  arquivo: DataTypes.STRING,
  link_download: DataTypes.STRING(500),
  web_view_link: DataTypes.STRING(500),
  json_link: DataTypes.STRING(500),
}, {
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
});

ArquivoPdf.belongsTo(Formulario, { foreignKey: "formulario_id" });

module.exports = ArquivoPdf;
