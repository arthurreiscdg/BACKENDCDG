const { Sequelize } = require("sequelize");
require("dotenv").config();

/**
 * Configuração do banco de dados
 */
const dbConfig = {
  /**
   * Cria e configura a instância do Sequelize
   * @returns {Sequelize} Instância configurada do Sequelize
   */
  criarConexao: () => {
    const config = {
      dialect: "sqlite",
      storage: process.env.DATABASE_PATH || "./database.sqlite",
      logging: process.env.NODE_ENV === "development",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };
    
    return new Sequelize(config);
  },
  
  /**
   * Testa a conexão com o banco de dados
   * @param {Sequelize} sequelize - Instância do Sequelize
   * @returns {Promise<void>}
   */
  testarConexao: async (sequelize) => {
    try {
      await sequelize.authenticate();
      console.log('Conexão com o banco de dados estabelecida com sucesso.');
    } catch (error) {
      console.error('Não foi possível conectar ao banco de dados:', error);
      throw error;
    }
  }
};

// Cria a instância do Sequelize
const sequelize = dbConfig.criarConexao();

module.exports = sequelize;
