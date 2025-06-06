const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ArquivoPdf = sequelize.define("ArquivoPdf", {
  nome: { type: DataTypes.STRING, allowNull: false },
  arquivo: DataTypes.STRING,
  link_download: DataTypes.STRING(500),
  web_view_link: DataTypes.STRING(500),
  json_link: DataTypes.STRING(500),
}, {
  tableName: "arquivo_pdfs",
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
});

// Definir associação após a definição do modelo
ArquivoPdf.associate = (models) => {
  ArquivoPdf.belongsTo(models.Formulario, { 
    foreignKey: "formulario_id",
    as: "formulario" 
  });
};

module.exports = ArquivoPdf;
