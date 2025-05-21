/**
 * Script para criar um usuário de teste
 */
require("dotenv").config();
const bcrypt = require("bcrypt");
const Usuario = require("../models/usuario");
const sequelize = require("../config/database");

async function criarUsuarioTeste() {
  try {
    // Conecta ao banco de dados
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso");
    
    // Verifica se o usuário já existe
    const usuarioExistente = await Usuario.findOne({ where: { email: "teste@exemplo.com" } });
    
    if (usuarioExistente) {
      console.log("Usuário de teste já existe!");
      process.exit(0);
    }
    
    // Gera o hash da senha
    const saltRounds = 10;
    const senha_hash = await bcrypt.hash("senha123", saltRounds);
    
    // Cria o usuário
    const novoUsuario = await Usuario.create({
      nome: "Usuário de Teste",
      email: "teste@exemplo.com",
      senha_hash,
      is_admin: true,
      is_ativo: true
    });
    
    console.log("Usuário de teste criado com sucesso:", {
      id: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email
    });
    
    process.exit(0);
  } catch (error) {
    console.error("Erro ao criar usuário de teste:", error);
    process.exit(1);
  }
}

// Executa a função
criarUsuarioTeste();
