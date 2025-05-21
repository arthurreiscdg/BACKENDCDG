/**
 * Script para sincronização controlada do banco de dados
 * Este script permite sincronizar o banco de dados com as definições dos modelos
 * sem ficar em um loop infinito de criação e exclusão de tabelas
 */
require("dotenv").config();
const sequelize = require("../config/database");
const Usuario = require("../models/usuario");
const StatusPedido = require("../models/statusPedido");
const Pedido = require("../models/pedido");
const HistoricoStatus = require("../models/historicoStatus");
const Formulario = require("../models/formulario");
const ArquivoPdf = require("../models/arquivoPdf");
const Webhook = require("../models/webhook");
const Unidade = require("../models/unidade");

/**
 * Importa todos os modelos para garantir que sejam registrados
 */
const importarModelos = () => {
  // Modelos já importados acima
  console.log("Modelos importados com sucesso");
};

/**
 * Sincroniza o banco de dados
 * @param {boolean} force - Se deve recriar todas as tabelas
 * @param {boolean} alter - Se deve alterar tabelas existentes
 */
const sincronizarBancoDados = async (force = false, alter = false) => {
  try {
    console.log(`Iniciando sincronização do banco de dados (force: ${force}, alter: ${alter})`);
    
    // Importa todos os modelos
    importarModelos();
    
    // Testa a conexão com o banco de dados
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso");
    
    // Sincroniza o banco de dados
    await sequelize.sync({ force, alter });
    console.log("Banco de dados sincronizado com sucesso");
    
    if (force) {
      await criarDadosIniciais();
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao sincronizar banco de dados:", error);
    return false;
  }
};

/**
 * Cria dados iniciais após uma sincronização forçada
 */
const criarDadosIniciais = async () => {
  try {
    console.log("Criando dados iniciais...");
    
    // Criar status de pedido padrão
    await StatusPedido.bulkCreate([
      { id: 1, nome: "Aberto", descricao: "Pedido aberto", cor_css: "blue", ordem: 1 },
      { id: 2, nome: "Em andamento", descricao: "Pedido em andamento", cor_css: "orange", ordem: 2 },
      { id: 3, nome: "Concluído", descricao: "Pedido concluído", cor_css: "green", ordem: 3 },
      { id: 4, nome: "Cancelado", descricao: "Pedido cancelado", cor_css: "red", ordem: 4 }
    ]);
    
    // Criar usuário admin padrão
    const bcrypt = require("bcrypt");
    const saltRounds = 10;
    const senha_hash = await bcrypt.hash("admin123", saltRounds);
    
    await Usuario.create({
      nome: "Administrador",
      email: "admin@sistemaCDG.com",
      senha_hash,
      is_admin: true
    });
    
    console.log("Dados iniciais criados com sucesso");
  } catch (error) {
    console.error("Erro ao criar dados iniciais:", error);
  }
};

// Se o script for executado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const alter = args.includes("--alter");
  
  sincronizarBancoDados(force, alter)
    .then(success => {
      if (success) {
        console.log("Sincronização concluída com sucesso");
      } else {
        console.error("Falha na sincronização");
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error("Erro inesperado:", error);
      process.exit(1);
    });
}

module.exports = {
  sincronizarBancoDados
};
