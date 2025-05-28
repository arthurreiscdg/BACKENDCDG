const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Unidade = sequelize.define("Unidade", {
  nome: { type: DataTypes.STRING, allowNull: false },
  quantidade: { type: DataTypes.INTEGER, defaultValue: 1 },
}, {
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em"
});

// Definir associação após a definição do modelo
Unidade.associate = (models) => {
  Unidade.belongsTo(models.Formulario, { 
    foreignKey: "formulario_id",
    as: "formulario" 
  });
};

module.exports = Unidade;
