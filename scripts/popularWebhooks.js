const sequelize = require("../config/database");
const Webhook = require("../models/webhook");

/**
 * Script para popular a tabela de webhooks com dados específicos
 */

const webhooksData = [
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
];

async function popularWebhooks() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso');

    console.log('🔗 Inserindo webhooks...');
    console.log('Total de webhooks para inserir:', webhooksData.length);
    
    for (const webhookData of webhooksData) {
      try {
        console.log(`Processando: ${webhookData.url_destino}`);
        
        // Verifica se o webhook já existe pela URL
        const webhookExistente = await Webhook.findOne({
          where: { url_destino: webhookData.url_destino }
        });

        if (webhookExistente) {
          console.log(`⚠️  Webhook ${webhookData.url_destino} já existe, pulando...`);
          continue;
        }

        // Cria o webhook
        const novoWebhook = await Webhook.create(webhookData);
        console.log(`✅ Webhook criado com sucesso (ID: ${novoWebhook.id}) - ${webhookData.descricao}`);
        
      } catch (error) {
        console.error(`❌ Erro ao criar webhook ${webhookData.url_destino}:`, error.message);
      }
    }

    console.log('\n🎉 Script executado com sucesso!');
    console.log('\n📋 Webhooks disponíveis:');
    
    const todosWebhooks = await Webhook.findAll();
    todosWebhooks.forEach(webhook => {
      const status = webhook.ativo ? '🟢 Ativo' : '🔴 Inativo';
      console.log(`   - ID: ${webhook.id} | ${webhook.descricao} | ${status}`);
      console.log(`     URL: ${webhook.url_destino}`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Executa o script se for chamado diretamente
if (require.main === module) {
  popularWebhooks();
}

module.exports = popularWebhooks;
