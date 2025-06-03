const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PedidoJsonPdf = sequelize.define("PedidoJsonPdf", {
  nome_pdf: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  json_formulario: {
    type: DataTypes.JSONB, // Mudança para JSONB para melhor suporte no PostgreSQL
    allowNull: false,
  },
  pedido_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "pedidos", // Nome corrigido da tabela no PostgreSQL
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },
}, {
  tableName: "pedido_json_pdfs",
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em",
});

PedidoJsonPdf.associate = (models) => {
  PedidoJsonPdf.belongsTo(models.Pedido, {
    foreignKey: "pedido_id",
    as: "pedido",
  });
};

module.exports = PedidoJsonPdf;