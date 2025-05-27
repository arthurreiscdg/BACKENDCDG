/**
 * Script para inicializar permissões e roles padrão no sistema
 */
require("dotenv").config();
const { Usuario, Permissao } = require("../models");
const permissaoService = require("../services/permissaoService");

/**
 * Permissões padrão do sistema
 */
const PERMISSOES_PADRAO = [
  // Permissões de pedidos
  { nome: "Visualizar Pedidos", descricao: "Permite visualizar todos os pedidos", codigo: "pedidos.visualizar" },
  { nome: "Editar Pedidos", descricao: "Permite editar pedidos", codigo: "pedidos.editar" },
  { nome: "Excluir Pedidos", descricao: "Permite excluir pedidos", codigo: "pedidos.excluir" },
  { nome: "Baixar Pedidos", descricao: "Permite baixar pedidos", codigo: "pedidos.baixar" },
  { nome: "Alterar Status", descricao: "Permite alterar o status dos pedidos", codigo: "pedidos.alterar_status" },
  { nome: "Baixar Etiquetas", descricao: "Permite baixar etiquetas dos pedidos", codigo: "pedidos.baixar_etiquetas" },
  { nome: "Visualizar Pedido Específico", descricao: "Permite visualizar pedido de uma escola específica", codigo: "pedidos.visualizar_especifico" },
  
  // Permissões de formulários
  { nome: "Visualizar Formulários", descricao: "Permite visualizar todos os formulários", codigo: "formularios.visualizar" },
  { nome: "Editar Formulários", descricao: "Permite editar formulários", codigo: "formularios.editar" },
  { nome: "Excluir Formulários", descricao: "Permite excluir formulários", codigo: "formularios.excluir" },
  
  // Permissões de usuários
  { nome: "Visualizar Usuários", descricao: "Permite visualizar todos os usuários", codigo: "usuarios.visualizar" },
  { nome: "Editar Usuários", descricao: "Permite editar usuários", codigo: "usuarios.editar" },
  { nome: "Excluir Usuários", descricao: "Permite excluir usuários", codigo: "usuarios.excluir" },
  
  // Permissões de integrações e API
  { nome: "Gerenciar Webhooks", descricao: "Permite gerenciar webhooks", codigo: "webhooks.gerenciar" },
  { nome: "Gerenciar Integrações", descricao: "Permite gerenciar integrações", codigo: "integracoes.gerenciar" },
  { nome: "Acessar API", descricao: "Permite acesso à API do sistema", codigo: "api.acessar" },
];

/**
 * Roles padrão do sistema
 */
const ROLES_PADRAO = {
  admin: ["admin"],                // Permissão total do sistema
  usuario: ["usuario"],            // PCP, baixar pedidos
  dev: ["dev"],                    // Integrações e API e acesso total ao sistema
  gerente: ["gerente"],            // Consultas e alteração de status
  expedicao: ["expedicao"],        // Pode baixar etiquetas e alterar status para enviado
  escola: ["escola"],              // Cada escola vai ter acesso somente a sua área
  visitante: ["visitante"]         // Apenas visualização
};

/**
 * Mapeia permissões para cada role
 */
const MAPEAMENTO_ROLE_PERMISSAO = {
  // Admin - Permissão total do sistema
  admin: [
    "pedidos.visualizar", "pedidos.editar", "pedidos.excluir", "pedidos.baixar", "pedidos.alterar_status", "pedidos.baixar_etiquetas",
    "formularios.visualizar", "formularios.editar", "formularios.excluir", 
    "usuarios.visualizar", "usuarios.editar", "usuarios.excluir", 
    "webhooks.gerenciar", "integracoes.gerenciar", "api.acessar"
  ],
  
  // Dev - Integrações e API e acesso total ao sistema
  dev: [
    "pedidos.visualizar", "pedidos.editar", "pedidos.excluir", "pedidos.baixar", "pedidos.alterar_status", "pedidos.baixar_etiquetas",
    "formularios.visualizar", "formularios.editar", "formularios.excluir", 
    "usuarios.visualizar", "usuarios.editar",
    "webhooks.gerenciar", "integracoes.gerenciar", "api.acessar"
  ],
  
  // Gerente - Consultas e alteração de status
  gerente: [
    "pedidos.visualizar", "pedidos.alterar_status", "pedidos.baixar", 
    "formularios.visualizar", "formularios.editar", 
    "usuarios.visualizar"
  ],
  
  // Usuário (PCP) - Baixar pedidos
  usuario: [
    "pedidos.visualizar", "pedidos.baixar", "pedidos.alterar_status",
    "formularios.visualizar"
  ],
  
  // Expedição - Baixar etiquetas e alterar status para enviado
  expedicao: [
    "pedidos.visualizar", "pedidos.baixar_etiquetas", "pedidos.alterar_status"
  ],
  
  // Escola - Acesso somente a sua área
  escola: [
    "pedidos.visualizar_especifico"
  ],
  
  // Visitante - Apenas visualização
  visitante: [
    "pedidos.visualizar",
    "formularios.visualizar"
  ]
};

/**
 * Função principal que inicializa as permissões e roles
 */
async function inicializarPermissoes() {
  try {
    console.log("Iniciando a configuração de permissões e roles...");
    
    // Cria as permissões padrão
    for (const permissao of PERMISSOES_PADRAO) {
      const [perm, criada] = await Permissao.findOrCreate({
        where: { codigo: permissao.codigo },
        defaults: permissao
      });
      
      if (criada) {
        console.log(`Permissão criada: ${permissao.nome} (${permissao.codigo})`);
      } else {
        console.log(`Permissão já existe: ${permissao.nome} (${permissao.codigo})`);
      }
    }
    
    // Configura o admin padrão (se existir)
    const admin = await Usuario.findOne({ where: { is_admin: true } });
    if (admin) {
      // Define role de admin
      admin.roles = ROLES_PADRAO.admin;
      await admin.save();
      
      // Associa todas as permissões ao admin
      const todasPermissoes = await Permissao.findAll();
      await admin.setPermissaos(todasPermissoes);
      
      console.log(`Administrador (ID: ${admin.id}) configurado com todas as permissões`);
    }
    
    console.log("Configuração de permissões e roles concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao configurar permissões e roles:", error);
  }
}

/**
 * Atribui uma role específica a um usuário
 * @param {number} usuarioId - ID do usuário
 * @param {string} role - Role a ser atribuída
 * @returns {Promise<Object>} - Usuário atualizado
 */
async function atribuirRole(usuarioId, role) {
  try {
    if (!ROLES_PADRAO[role]) {
      throw new Error(`Role "${role}" não definida no sistema`);
    }
    
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      throw new Error(`Usuário com ID ${usuarioId} não encontrado`);
    }
    
    // Atribui a role ao usuário
    usuario.roles = ROLES_PADRAO[role];
    await usuario.save();
    
    // Associa as permissões correspondentes à role
    if (MAPEAMENTO_ROLE_PERMISSAO[role] && MAPEAMENTO_ROLE_PERMISSAO[role].length > 0) {
      const permissoes = await Permissao.findAll({
        where: {
          codigo: MAPEAMENTO_ROLE_PERMISSAO[role]
        }
      });
      
      await usuario.setPermissaos(permissoes);
    }
    
    console.log(`Role "${role}" atribuída com sucesso ao usuário ID ${usuarioId}`);
    return usuario;
  } catch (error) {
    console.error(`Erro ao atribuir role "${role}" ao usuário:`, error);
    throw error;
  }
}

/**
 * Atribui acesso a uma escola específica para um usuário
 * @param {number} usuarioId - ID do usuário
 * @param {number} escolaId - ID da escola
 * @returns {Promise<Object>} - Usuário atualizado
 */
async function atribuirEscola(usuarioId, escolaId) {
  try {
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      throw new Error(`Usuário com ID ${usuarioId} não encontrado`);
    }
    
    // Define a role como "escola"
    usuario.roles = ROLES_PADRAO.escola;
    
    // Armazena o ID da escola em um campo adicional
    // Isso pode ser implementado de várias maneiras, por exemplo:
    // 1. Adicionar uma coluna escola_id na tabela Usuario
    // 2. Usar um JSON em um campo de metadados
    // 3. Criar uma tabela de relacionamento entre usuários e escolas
    
    // Por ora, vamos usar a abordagem de armazenar em uma propriedade adicional
    // Observação: seria necessário adicionar esta coluna ao modelo Usuario
    usuario.escola_id = escolaId;
    await usuario.save();
    
    // Associa as permissões da role "escola"
    const permissoes = await Permissao.findAll({
      where: {
        codigo: MAPEAMENTO_ROLE_PERMISSAO.escola
      }
    });
    
    await usuario.setPermissaos(permissoes);
    
    console.log(`Acesso à escola ID ${escolaId} atribuído com sucesso ao usuário ID ${usuarioId}`);
    return usuario;
  } catch (error) {
    console.error(`Erro ao atribuir acesso à escola ID ${escolaId} ao usuário:`, error);
    throw error;
  }
}

// Executa a função principal quando o script é chamado diretamente
if (require.main === module) {
  inicializarPermissoes()
    .then(() => {
      console.log("Script finalizado com sucesso!");
      process.exit(0);
    })
    .catch(error => {
      console.error("Erro na execução do script:", error);
      process.exit(1);
    });
}

module.exports = { 
  inicializarPermissoes,
  atribuirRole,
  atribuirEscola
};
