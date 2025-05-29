const sequelize = require("../config/database");
const Usuario = require("../models/usuario");
const StatusPedido = require("../models/statusPedido");
const Webhook = require("../models/webhook");
const Pedido = require("../models/pedido");
const HistoricoPedido = require("../models/historicoPedido");
const bcrypt = require("bcrypt");

/**
 * Script para popular o banco de dados com dados de teste para o sistema Montink
 */
async function popularDadosTeste() {
  try {
    console.log("🚀 Iniciando população de dados de teste...");
    
    // Sincronizar tabelas
    await sequelize.sync({ force: false });
    console.log("✅ Tabelas sincronizadas");

    // 1. Criar status de pedidos
    console.log("📊 Criando status de pedidos...");
    const statusPedidos = await StatusPedido.bulkCreate([
      {
        nome: "Novo",
        descricao: "Pedido recém criado, aguardando processamento",
        cor_css: "#3b82f6",
        ordem: 1,
        ativo: true
      },
      {
        nome: "Em Análise",
        descricao: "Pedido sendo analisado pela equipe",
        cor_css: "#f59e0b",
        ordem: 2,
        ativo: true
      },
      {
        nome: "Aprovado",
        descricao: "Pedido aprovado, aguardando produção",
        cor_css: "#10b981",
        ordem: 3,
        ativo: true
      },
      {
        nome: "Em Produção",
        descricao: "Pedido em processo de produção",
        cor_css: "#8b5cf6",
        ordem: 4,
        ativo: true
      },
      {
        nome: "Produzido",
        descricao: "Pedido produzido, aguardando envio",
        cor_css: "#06b6d4",
        ordem: 5,
        ativo: true
      },
      {
        nome: "Enviado",
        descricao: "Pedido enviado para o cliente",
        cor_css: "#84cc16",
        ordem: 6,
        ativo: true
      },
      {
        nome: "Entregue",
        descricao: "Pedido entregue ao cliente",
        cor_css: "#22c55e",
        ordem: 7,
        ativo: true
      },
      {
        nome: "Cancelado",
        descricao: "Pedido cancelado",
        cor_css: "#ef4444",
        ordem: 8,
        ativo: true
      },
      {
        nome: "Devolvido",
        descricao: "Pedido devolvido pelo cliente",
        cor_css: "#f97316",
        ordem: 9,
        ativo: true
      }
    ], {
      ignoreDuplicates: true,
      returning: true
    });
    console.log(`✅ ${statusPedidos.length} status criados`);

    // 2. Criar webhooks
    console.log("🔗 Criando webhooks...");
    const webhooks = await Webhook.bulkCreate([
      {
        url_destino: "https://api.loja1.com/webhook/pedidos",
        descricao: "Webhook para Loja Principal",
        ativo: true
      },
      {
        url_destino: "https://api.loja2.com/notifications",
        descricao: "Webhook para Loja Secundária",
        ativo: true
      },
      {
        url_destino: "https://api.marketplace.com/orders/status",
        descricao: "Webhook para Marketplace",
        ativo: false
      }
    ], {
      ignoreDuplicates: true,
      returning: true
    });
    console.log(`✅ ${webhooks.length} webhooks criados`);


    // Buscar IDs criados para usar nas associações
    const statusList = await StatusPedido.findAll({ order: [['ordem', 'ASC']] });
    const webhookList = await Webhook.findAll();
    const usuarioList = await Usuario.findAll();

    // 4. Criar pedidos de teste
    console.log("📦 Criando pedidos de teste...");
    
    const produtosSKUs = [
      { nome: "Cartão de Visita Premium", sku: "CV-PREM-001", categoria: "Cartões" },
      { nome: "Flyer A5 Colorido", sku: "FLY-A5-002", categoria: "Panfletos" },
      { nome: "Banner 2x1m", sku: "BAN-2X1-003", categoria: "Banners" },
      { nome: "Camiseta Personalizada", sku: "CAM-PERS-004", categoria: "Roupas" },
      { nome: "Adesivo Vinil", sku: "ADE-VIN-005", categoria: "Adesivos" },
      { nome: "Folder A4", sku: "FOL-A4-006", categoria: "Folders" },
      { nome: "Cartaz A3", sku: "CAR-A3-007", categoria: "Cartazes" },
      { nome: "Calendário Mesa", sku: "CAL-MESA-008", categoria: "Calendários" }
    ];

    const clientes = [
      { nome: "Maria Silva", documento: "123.456.789-01", email: "maria.silva@email.com" },
      { nome: "João Santos", documento: "987.654.321-02", email: "joao.santos@email.com" },
      { nome: "Ana Oliveira", documento: "456.789.123-03", email: "ana.oliveira@email.com" },
      { nome: "Carlos Pereira", documento: "789.123.456-04", email: "carlos.pereira@email.com" },
      { nome: "Lucia Costa", documento: "321.654.987-05", email: "lucia.costa@email.com" },
      { nome: "Pedro Almeida", documento: "654.987.321-06", email: "pedro.almeida@email.com" },
      { nome: "Fernanda Lima", documento: "147.258.369-07", email: "fernanda.lima@email.com" },
      { nome: "Roberto Dias", documento: "258.369.147-08", email: "roberto.dias@email.com" }
    ];

    const enderecos = [
      {
        endereco: "Rua das Flores, 123",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01234-567",
        bairro: "Centro"
      },
      {
        endereco: "Av. Paulista, 456",
        cidade: "São Paulo", 
        uf: "SP",
        cep: "01311-100",
        bairro: "Bela Vista"
      },
      {
        endereco: "Rua Augusta, 789",
        cidade: "São Paulo",
        uf: "SP", 
        cep: "01305-100",
        bairro: "Consolação"
      },
      {
        endereco: "Rua Oscar Freire, 321",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01426-001", 
        bairro: "Jardins"
      }
    ];

    const pedidos = [];
    for (let i = 1; i <= 50; i++) {
      const produto = produtosSKUs[Math.floor(Math.random() * produtosSKUs.length)];
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];
      const endereco = enderecos[Math.floor(Math.random() * enderecos.length)];
      const status = statusList[Math.floor(Math.random() * statusList.length)];
      const webhook = webhookList[Math.floor(Math.random() * webhookList.length)];
      const usuario = usuarioList[Math.floor(Math.random() * usuarioList.length)];
      
      const quantidade = Math.floor(Math.random() * 10) + 1;
      const valorUnitario = Math.random() * 50 + 10;
      const valorTotal = quantidade * valorUnitario;
      
      // Data aleatória nos últimos 30 dias
      const dataBase = new Date();
      dataBase.setDate(dataBase.getDate() - Math.floor(Math.random() * 30));
      
      pedidos.push({
        titulo: `Pedido ${produto.nome} - ${cliente.nome}`,
        numero_pedido: 2024000 + i,
        valor_pedido: valorTotal.toFixed(2),
        custo_envio: (Math.random() * 20 + 5).toFixed(2),
        metodo_envio: Math.floor(Math.random() * 3) + 1,
        
        // Dados do cliente
        nome_cliente: cliente.nome,
        documento_cliente: cliente.documento,
        email_cliente: cliente.email,
        
        // Dados do destinatário
        nome_destinatario: cliente.nome,
        endereco: endereco.endereco,
        numero: Math.floor(Math.random() * 9999) + 1,
        complemento: Math.random() > 0.7 ? "Apt " + Math.floor(Math.random() * 200) : null,
        cidade: endereco.cidade,
        uf: endereco.uf,
        cep: endereco.cep,
        bairro: endereco.bairro,
        telefone_destinatario: `(11) ${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`,
        pais: "Brasil",
        
        // Dados do produto
        nome_produto: produto.nome,
        sku: produto.sku,
        quantidade: quantidade,
        id_sku: Math.floor(Math.random() * 1000) + 1,
        
        // Associações
        status_id: status.id,
        webhook_id: webhook.id,
        usuario_id: usuario.id,
        
        // Timestamps
        criado_em: dataBase,
        atualizado_em: dataBase
      });
    }

    const pedidosCriados = await Pedido.bulkCreate(pedidos, {
      returning: true
    });
    console.log(`✅ ${pedidosCriados.length} pedidos criados`);

    // 5. Criar histórico de pedidos
    console.log("📈 Criando histórico de pedidos...");
    const historicos = [];
    
    for (const pedido of pedidosCriados) {
      const numMudancas = Math.floor(Math.random() * 4) + 1;
      let statusAtual = statusList[0]; // Começar com "Novo"
      let dataHistorico = new Date(pedido.criado_em);
      
      // Criar histórico inicial (criação do pedido)
      historicos.push({
        pedido_id: pedido.id,
        status_anterior_id: null,
        status_novo_id: statusAtual.id,
        tipo_acao: 'criacao',
        observacoes: 'Pedido criado no sistema',
        usuario_id: pedido.usuario_id,
        dados_adicionais: {
          origem: 'webhook',
          ip_origem: '192.168.1.' + Math.floor(Math.random() * 255)
        },
        criado_em: dataHistorico
      });
      
      // Criar mudanças de status aleatórias
      for (let j = 1; j < numMudancas; j++) {
        const statusAnterior = statusAtual;
        // Pegar próximo status na sequência
        const proximoIndice = Math.min(statusList.length - 1, statusAtual.ordem + Math.floor(Math.random() * 2));
        statusAtual = statusList.find(s => s.ordem === proximoIndice) || statusAtual;
        
        dataHistorico = new Date(dataHistorico.getTime() + (Math.random() * 24 * 60 * 60 * 1000)); // +1 dia aleatório
        
        const observacoes = [
          'Status atualizado automaticamente',
          'Mudança solicitada pelo cliente',
          'Atualização do processo produtivo',
          'Revisão de qualidade concluída',
          'Aguardando confirmação do cliente',
          'Processo finalizado com sucesso'
        ];
        
        historicos.push({
          pedido_id: pedido.id,
          status_anterior_id: statusAnterior.id,
          status_novo_id: statusAtual.id,
          tipo_acao: 'alteracao_status',
          observacoes: observacoes[Math.floor(Math.random() * observacoes.length)],
          usuario_id: usuarioList[Math.floor(Math.random() * usuarioList.length)].id,
          dados_adicionais: {
            metodo: Math.random() > 0.5 ? 'manual' : 'automatico',
            motivo: j === numMudancas - 1 ? 'finalizacao' : 'progressao'
          },
          criado_em: dataHistorico
        });
      }
      
      // Atualizar o status atual do pedido
      await pedido.update({ status_id: statusAtual.id });
    }

    await HistoricoPedido.bulkCreate(historicos);
    console.log(`✅ ${historicos.length} registros de histórico criados`);

    // 6. Estatísticas finais
    console.log("\n📊 Estatísticas dos dados criados:");
    console.log(`👥 Usuários: ${usuarios.length}`);
    console.log(`📊 Status: ${statusPedidos.length}`);
    console.log(`🔗 Webhooks: ${webhooks.length}`);
    console.log(`📦 Pedidos: ${pedidosCriados.length}`);
    console.log(`📈 Históricos: ${historicos.length}`);

    // Distribuição por status
    console.log("\n📈 Distribuição de pedidos por status:");
    for (const status of statusList) {
      const count = await Pedido.count({ where: { status_id: status.id } });
      console.log(`${status.nome}: ${count} pedidos`);
    }

    console.log("\n✅ População de dados concluída com sucesso!");
    console.log("\n🔐 Credenciais de teste:");
    console.log("Admin: admin / 123456");
    console.log("Operador: joao.operador / 123456");
    console.log("Supervisor: maria.supervisora / 123456");
    
  } catch (error) {
    console.error("❌ Erro ao popular dados de teste:", error);
    throw error;
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  popularDadosTeste()
    .then(() => {
      console.log("🎉 Script finalizado!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erro fatal:", error);
      process.exit(1);
    });
}

module.exports = popularDadosTeste;
