/**
 * Script para popular dados de teste para o sistema Montink
 * 
 * Uso:
 * node popularDadosTeste.js
 * 
 * Este script criará:
 * - Status de pedidos
 * - Webhooks de teste
 * - Usuários de teste
 * - Pedidos de exemplo
 * - Histórico de status
 */

const sequelize = require("../config/database");
const Usuario = require("../models/usuario");
const StatusPedido = require("../models/statusPedido");
const Webhook = require("../models/webhook");
const Pedido = require("../models/pedido");
const HistoricoStatus = require("../models/historicoStatus");
const bcrypt = require("bcrypt");

async function inicializar() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com o banco de dados estabelecida com sucesso.");
    
    // Sincronizar modelos (criar tabelas se não existirem)
    await sequelize.sync({ alter: true });
    console.log("✅ Tabelas sincronizadas com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao conectar com o banco:", error.message);
    process.exit(1);
  }
}

async function limparDados() {
  console.log("🧹 Limpando dados existentes...");
  
  try {
    // Limpar em ordem para evitar problemas de foreign key
    await HistoricoStatus.destroy({ where: {} });
    await Pedido.destroy({ where: {} });
    await Webhook.destroy({ where: {} });
    // Não limpar usuários para manter logins existentes
    console.log("✅ Dados limpos com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao limpar dados:", error.message);
  }
}

async function criarStatusPedidos() {
  console.log("📊 Criando status de pedidos...");
  
  const statusList = [
    { nome: "Pendente", descricao: "Pedido recebido, aguardando processamento", cor_css: "#FFA500", ordem: 1 },
    { nome: "Confirmado", descricao: "Pedido confirmado e aceito", cor_css: "#00BFFF", ordem: 2 },
    { nome: "Em Produção", descricao: "Pedido sendo produzido", cor_css: "#FFD700", ordem: 3 },
    { nome: "Produção Concluída", descricao: "Produção finalizada", cor_css: "#32CD32", ordem: 4 },
    { nome: "Aguardando Envio", descricao: "Pronto para envio", cor_css: "#9370DB", ordem: 5 },
    { nome: "Enviado", descricao: "Pedido enviado ao cliente", cor_css: "#4169E1", ordem: 6 },
    { nome: "Entregue", descricao: "Pedido entregue com sucesso", cor_css: "#228B22", ordem: 7 },
    { nome: "Cancelado", descricao: "Pedido cancelado", cor_css: "#DC143C", ordem: 8 },
    { nome: "Devolvido", descricao: "Pedido devolvido", cor_css: "#8B0000", ordem: 9 }
  ];

  try {
    for (const status of statusList) {
      const [statusPedido, created] = await StatusPedido.findOrCreate({
        where: { nome: status.nome },
        defaults: status
      });
      
      if (created) {
        console.log(`  ✅ Status criado: ${status.nome}`);
      } else {
        console.log(`  ⚠️  Status já existe: ${status.nome}`);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao criar status:", error.message);
  }
}

async function criarWebhooks() {
  console.log("🔗 Criando webhooks de teste...");
  
  const webhooks = [
    {
      url_destino: "https://webhook.site/unique-id-1",
      descricao: "Webhook de teste para desenvolvimento",
      ativo: true
    },
    {
      url_destino: "https://httpbin.org/post",
      descricao: "Webhook de teste HTTPBin",
      ativo: true
    },
    {
      url_destino: "https://api.exemplo.com/webhook/montink",
      descricao: "Webhook de produção (exemplo)",
      ativo: false
    }
  ];

  try {
    for (const webhook of webhooks) {
      const [webhookCreated, created] = await Webhook.findOrCreate({
        where: { url_destino: webhook.url_destino },
        defaults: webhook
      });
      
      if (created) {
        console.log(`  ✅ Webhook criado: ${webhook.url_destino}`);
      } else {
        console.log(`  ⚠️  Webhook já existe: ${webhook.url_destino}`);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao criar webhooks:", error.message);
  }
}

async function criarUsuarioTeste() {
  console.log("👤 Verificando usuário de teste...");
  
  try {
    const senhaHash = await bcrypt.hash("123456", 10);
    
    const [usuario, created] = await Usuario.findOrCreate({
      where: { email: "admin@casadagrafica.com" },
      defaults: {
        nome: "Administrador Teste",
        username: "admin",
        email: "admin@casadagrafica.com",
        senha_hash: senhaHash,
        is_admin: true,
        is_ativo: true,
        roles: "admin,montik"
      }
    });
    
    if (created) {
      console.log("  ✅ Usuário admin criado (email: admin@casadagrafica.com, senha: 123456)");
    } else {
      console.log("  ⚠️  Usuário admin já existe");
    }
    
    return usuario;
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error.message);
    return null;
  }
}

async function criarPedidosTeste() {
  console.log("📦 Criando pedidos de teste...");
  
  try {
    const usuario = await Usuario.findOne({ where: { email: "admin@casadagrafica.com" } });
    if (!usuario) {
      console.error("❌ Usuário não encontrado para criar pedidos");
      return;
    }

    const statusList = await StatusPedido.findAll();
    const webhook = await Webhook.findOne();
    
    const pedidosExemplo = [
      {
        titulo: "Livro de Matemática - 7º Ano",
        numero_pedido: 202501001,
        valor_pedido: 45.90,
        custo_envio: 8.50,
        nome_cliente: "Escola Estadual São João",
        documento_cliente: "12.345.678/0001-90",
        email_cliente: "compras@escolasaojoao.edu.br",
        nome_destinatario: "Maria Silva Santos",
        endereco: "Rua das Flores, 123",
        numero: "123",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01234-567",
        bairro: "Centro",
        telefone_destinatario: "(11) 98765-4321",
        pais: "Brasil",
        nome_produto: "Livro Matemática Fundamental",
        sku: "LMF-7ANO-2025",
        quantidade: 50,
        id_sku: 1001,
        usuario_id: usuario.id,
        status_id: statusList[Math.floor(Math.random() * statusList.length)].id,
        webhook_id: webhook ? webhook.id : null
      },
      {
        titulo: "Apostila de Português - 6º Ano",
        numero_pedido: 202501002,
        valor_pedido: 32.50,
        custo_envio: 6.00,
        nome_cliente: "Colégio Particular ABC",
        documento_cliente: "98.765.432/0001-10",
        email_cliente: "secretaria@colegioabc.com.br",
        nome_destinatario: "João Carlos Oliveira",
        endereco: "Avenida Principal, 456",
        numero: "456",
        cidade: "Rio de Janeiro",
        uf: "RJ",
        cep: "20000-123",
        bairro: "Copacabana",
        telefone_destinatario: "(21) 99888-7766",
        pais: "Brasil",
        nome_produto: "Apostila Português Básico",
        sku: "APB-6ANO-2025",
        quantidade: 75,
        id_sku: 1002,
        usuario_id: usuario.id,
        status_id: statusList[Math.floor(Math.random() * statusList.length)].id,
        webhook_id: webhook ? webhook.id : null
      },
      {
        titulo: "Material de Ciências - 8º Ano",
        numero_pedido: 202501003,
        valor_pedido: 67.80,
        custo_envio: 12.00,
        nome_cliente: "Instituto Educacional Progresso",
        documento_cliente: "11.222.333/0001-44",
        email_cliente: "compras@progresso.edu.br",
        nome_destinatario: "Ana Paula Costa",
        endereco: "Rua da Educação, 789",
        numero: "789",
        cidade: "Belo Horizonte",
        uf: "MG",
        cep: "30000-456",
        bairro: "Savassi",
        telefone_destinatario: "(31) 97777-5544",
        pais: "Brasil",
        nome_produto: "Kit Ciências Experimentais",
        sku: "KCE-8ANO-2025",
        quantidade: 30,
        id_sku: 1003,
        usuario_id: usuario.id,
        status_id: statusList[Math.floor(Math.random() * statusList.length)].id,
        webhook_id: webhook ? webhook.id : null
      },
      {
        titulo: "Caderno de Exercícios - História",
        numero_pedido: 202501004,
        valor_pedido: 25.90,
        custo_envio: 5.50,
        nome_cliente: "Escola Municipal Dom Pedro",
        documento_cliente: "44.555.666/0001-77",
        email_cliente: "secretaria@dompedromunicipal.gov.br",
        nome_destinatario: "Carlos Eduardo Lima",
        endereco: "Praça Central, 321",
        numero: "321",
        cidade: "Salvador",
        uf: "BA",
        cep: "40000-789",
        bairro: "Pelourinho",
        telefone_destinatario: "(71) 96666-3322",
        pais: "Brasil",
        nome_produto: "Caderno História do Brasil",
        sku: "CHB-ESC-2025",
        quantidade: 100,
        id_sku: 1004,
        usuario_id: usuario.id,
        status_id: statusList[Math.floor(Math.random() * statusList.length)].id,
        webhook_id: webhook ? webhook.id : null
      },
      {
        titulo: "Kit Didático Geografia",
        numero_pedido: 202501005,
        valor_pedido: 89.40,
        custo_envio: 15.00,
        nome_cliente: "Centro Educacional Futuro",
        documento_cliente: "77.888.999/0001-11",
        email_cliente: "compras@futuro.edu.br",
        nome_destinatario: "Fernanda Rodrigues",
        endereco: "Avenida do Conhecimento, 654",
        numero: "654",
        cidade: "Curitiba",
        uf: "PR",
        cep: "80000-321",
        bairro: "Batel",
        telefone_destinatario: "(41) 95555-1199",
        pais: "Brasil",
        nome_produto: "Atlas Geográfico Interativo",
        sku: "AGI-GEO-2025",
        quantidade: 25,
        id_sku: 1005,
        usuario_id: usuario.id,
        status_id: statusList[Math.floor(Math.random() * statusList.length)].id,
        webhook_id: webhook ? webhook.id : null
      }
    ];

    for (const pedidoData of pedidosExemplo) {
      const [pedido, created] = await Pedido.findOrCreate({
        where: { numero_pedido: pedidoData.numero_pedido },
        defaults: pedidoData
      });
      
      if (created) {
        console.log(`  ✅ Pedido criado: #${pedidoData.numero_pedido} - ${pedidoData.titulo}`);
        
        // Criar histórico inicial
        await HistoricoStatus.create({
          pedido_id: pedido.id,
          status_id: pedidoData.status_id,
          usuario_id: usuario.id,
          observacao: "Status inicial do pedido"
        });
      } else {
        console.log(`  ⚠️  Pedido já existe: #${pedidoData.numero_pedido}`);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao criar pedidos:", error.message);
  }
}

async function criarHistoricoAdicional() {
  console.log("📈 Criando histórico adicional de status...");
  
  try {
    const pedidos = await Pedido.findAll();
    const usuario = await Usuario.findOne({ where: { email: "admin@casadagrafica.com" } });
    const statusList = await StatusPedido.findAll();
    
    for (const pedido of pedidos) {
      // Criar 2-4 entradas de histórico para cada pedido
      const numHistorico = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numHistorico; i++) {
        const randomStatus = statusList[Math.floor(Math.random() * statusList.length)];
        const observacoes = [
          "Status atualizado automaticamente",
          "Alteração manual pelo operador",
          "Atualização via sistema",
          "Mudança de status solicitada",
          "Processamento concluído"
        ];
        
        // Criar com datas diferentes
        const dataBase = new Date();
        dataBase.setDate(dataBase.getDate() - (numHistorico - i));
        
        await HistoricoStatus.create({
          pedido_id: pedido.id,
          status_id: randomStatus.id,
          usuario_id: usuario.id,
          observacao: observacoes[Math.floor(Math.random() * observacoes.length)],
          criado_em: dataBase
        });
      }
    }
    
    console.log("  ✅ Histórico adicional criado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao criar histórico:", error.message);
  }
}

async function exibirResumo() {
  console.log("\n📋 RESUMO DOS DADOS CRIADOS:");
  console.log("=" + "=".repeat(50));
  
  try {
    const countStatus = await StatusPedido.count();
    const countWebhooks = await Webhook.count();
    const countUsuarios = await Usuario.count();
    const countPedidos = await Pedido.count();
    const countHistorico = await HistoricoStatus.count();
    
    console.log(`📊 Status de Pedidos: ${countStatus}`);
    console.log(`🔗 Webhooks: ${countWebhooks}`);
    console.log(`👤 Usuários: ${countUsuarios}`);
    console.log(`📦 Pedidos: ${countPedidos}`);
    console.log(`📈 Registros de Histórico: ${countHistorico}`);
    
    console.log("\n🔑 ACESSO DE TESTE:");
    console.log("Email: admin@casadagrafica.com");
    console.log("Senha: 123456");
    
    console.log("\n🌐 PARA TESTAR:");
    console.log("1. Faça login no sistema com as credenciais acima");
    console.log("2. Acesse a página /montik");
    console.log("3. Explore os pedidos criados");
    console.log("4. Teste os filtros e funcionalidades");
    
  } catch (error) {
    console.error("❌ Erro ao gerar resumo:", error.message);
  }
}

async function main() {
  console.log("🚀 INICIANDO POPULAÇÃO DE DADOS DE TESTE");
  console.log("=" + "=".repeat(50));
  
  await inicializar();
  await limparDados();
  await criarStatusPedidos();
  await criarWebhooks();
  await criarUsuarioTeste();
  await criarPedidosTeste();
  await criarHistoricoAdicional();
  await exibirResumo();
  
  console.log("\n✅ POPULAÇÃO DE DADOS CONCLUÍDA COM SUCESSO!");
  process.exit(0);
}

main().catch(error => {
  console.error("❌ ERRO FATAL:", error);
  process.exit(1);
});
