/**
 * Script para testar e inicializar o sistema de roles e permissões
 * Este script cria alguns usuários de exemplo com diferentes roles
 */
require("dotenv").config();
const { Usuario, Permissao } = require("../models");
const { inicializarPermissoes } = require("./inicializarPermissoes");
const permissaoService = require("../services/permissaoService");
const bcrypt = require("bcrypt");

const USUARIOS_TESTE = [
  { 
    nome: "Admin Master", 
    email: "admin@exemplo.com", 
    senha: "admin123", 
    is_admin: true, 
    role: "admin" 
  },
  { 
    nome: "Desenvolvedor", 
    email: "dev@exemplo.com", 
    senha: "dev123", 
    is_admin: false, 
    role: "dev" 
  },
  { 
    nome: "Gerente de Operações", 
    email: "gerente@exemplo.com", 
    senha: "ger123", 
    is_admin: false, 
    role: "gerente" 
  },
  { 
    nome: "Usuário PCP", 
    email: "pcp@exemplo.com", 
    senha: "pcp123", 
    is_admin: false, 
    role: "usuario" 
  },
  { 
    nome: "Expedição", 
    email: "expedicao@exemplo.com", 
    senha: "exp123", 
    is_admin: false, 
    role: "expedicao" 
  },
  { 
    nome: "Escola 1", 
    email: "escola1@exemplo.com", 
    senha: "escola123", 
    is_admin: false, 
    role: "escola",
    escola_id: 1 
  },
  { 
    nome: "Escola 2", 
    email: "escola2@exemplo.com", 
    senha: "escola123", 
    is_admin: false, 
    role: "escola",
    escola_id: 2 
  },
  { 
    nome: "Visitante", 
    email: "visitante@exemplo.com", 
    senha: "vis123", 
    is_admin: false, 
    role: "visitante" 
  }
];

/**
 * Cria e configura usuários de teste
 */
async function criarUsuariosTeste() {
  try {
    console.log("Criando usuários de teste com diferentes roles...");
    
    for (const userInfo of USUARIOS_TESTE) {
      // Verifica se o usuário já existe
      const usuarioExistente = await Usuario.findOne({ where: { email: userInfo.email } });
      
      if (usuarioExistente) {
        console.log(`Usuário ${userInfo.email} já existe. Atualizando...`);
        
        // Atualiza apenas os campos necessários
        usuarioExistente.nome = userInfo.nome;
        usuarioExistente.is_admin = userInfo.is_admin;
        
        if (userInfo.senha) {
          usuarioExistente.senha_hash = await bcrypt.hash(userInfo.senha, 10);
        }
        
        await usuarioExistente.save();
        
        // Define a role
        if (userInfo.role === "escola" && userInfo.escola_id) {
          await permissaoService.configurarUsuarioEscola(usuarioExistente.id, userInfo.escola_id);
          console.log(`Usuário ${userInfo.email} configurado como escola ID ${userInfo.escola_id}`);
        } else {
          await permissaoService.definirRole(usuarioExistente.id, userInfo.role);
          console.log(`Role "${userInfo.role}" atribuída ao usuário ${userInfo.email}`);
        }
        
        continue;
      }
      
      // Cria um novo usuário
      const senha_hash = await bcrypt.hash(userInfo.senha, 10);
      
      const novoUsuario = await Usuario.create({
        nome: userInfo.nome,
        email: userInfo.email,
        senha_hash,
        is_admin: userInfo.is_admin
      });
      
      // Define a role
      if (userInfo.role === "escola" && userInfo.escola_id) {
        await permissaoService.configurarUsuarioEscola(novoUsuario.id, userInfo.escola_id);
        console.log(`Usuário ${userInfo.email} criado como escola ID ${userInfo.escola_id}`);
      } else {
        await permissaoService.definirRole(novoUsuario.id, userInfo.role);
        console.log(`Usuário ${userInfo.email} criado com role "${userInfo.role}"`);
      }
    }
    
    console.log("Usuários de teste criados com sucesso!");
  } catch (error) {
    console.error("Erro ao criar usuários de teste:", error);
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    // Inicializa as permissões
    console.log("Inicializando permissões...");
    await inicializarPermissoes();
    
    // Cria usuários de teste
    await criarUsuariosTeste();
    
    console.log("\nSistema de roles e permissões configurado com sucesso!");
    console.log("\nUsuários criados:");
    console.table(USUARIOS_TESTE.map(u => ({ 
      nome: u.nome, 
      email: u.email, 
      senha: u.senha, 
      role: u.role,
      escola: u.escola_id || "N/A" 
    })));
    
    console.log("\nVocê pode usar esses usuários para testar as diferentes permissões no sistema.");
  } catch (error) {
    console.error("Erro durante a execução do script:", error);
  } finally {
    process.exit(0);
  }
}

// Executa o script
main();
