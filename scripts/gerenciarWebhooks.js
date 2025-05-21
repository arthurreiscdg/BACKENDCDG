/**
 * Script para gerenciar webhooks
 * 
 * Uso:
 * - Para criar um webhook: node gerenciarWebhooks.js --criar "https://exemplo.com/webhook" "Descrição do webhook"
 * - Para listar webhooks: node gerenciarWebhooks.js --listar
 * - Para testar um webhook: node gerenciarWebhooks.js --testar ID
 */

const sequelize = require("../config/database");
const Webhook = require("../models/webhook");
const axios = require("axios");
const StatusPedido = require("../models/statusPedido");

async function inicializar() {
  await sequelize.authenticate();
  console.log("Conexão com o banco de dados estabelecida com sucesso.");
}

async function criarWebhook(url, descricao) {
  if (!url) {
    console.error("URL do webhook é obrigatória");
    process.exit(1);
  }

  try {
    const webhook = await Webhook.create({
      url_destino: url,
      descricao: descricao || "Webhook criado via script",
      ativo: true
    });

    console.log(`Webhook criado com sucesso! ID: ${webhook.id}`);
    console.log(`URL: ${webhook.url_destino}`);
    console.log(`Descrição: ${webhook.descricao}`);
    console.log(`Criado em: ${webhook.criado_em}`);
  } catch (error) {
    console.error("Erro ao criar webhook:", error.message);
  }
}

async function listarWebhooks() {
  try {
    const webhooks = await Webhook.findAll();

    if (!webhooks || webhooks.length === 0) {
      console.log("Nenhum webhook cadastrado.");
      return;
    }

    console.log("=== Webhooks Cadastrados ===");
    webhooks.forEach(webhook => {
      console.log(`ID: ${webhook.id}`);
      console.log(`URL: ${webhook.url_destino}`);
      console.log(`Descrição: ${webhook.descricao}`);
      console.log(`Ativo: ${webhook.ativo ? "Sim" : "Não"}`);
      console.log(`Criado em: ${webhook.criado_em}`);
      console.log("-------------------------");
    });
  } catch (error) {
    console.error("Erro ao listar webhooks:", error.message);
  }
}

async function testarWebhook(id) {
  if (!id) {
    console.error("ID do webhook é obrigatório");
    process.exit(1);
  }

  try {
    const webhook = await Webhook.findByPk(id);

    if (!webhook) {
      console.error(`Webhook com ID ${id} não encontrado`);
      process.exit(1);
    }

    // Obtém um status para o teste
    const status = await StatusPedido.findOne();
    if (!status) {
      console.error("Nenhum status encontrado para teste");
      process.exit(1);
    }

    // Prepara o payload do webhook
    const dataHoraAtual = new Date().toISOString().replace("T", " ").substring(0, 19);
    
    // Gera um token de acesso aleatório de teste
    const access_token = gerarTokenAcesso();
    
    const payload = {
      data: dataHoraAtual,
      access_token: access_token,
      json: {
        casa_grafica_id: "1221726", // ID de exemplo
        status_id: status.id,
        status: status.nome
      }
    };

    console.log("Enviando payload de teste para o webhook:", webhook.url_destino);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(webhook.url_destino, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 segundos de timeout
      });
      
      console.log("Resposta do webhook:", {
        status: response.status,
        data: response.data
      });
      console.log("Teste realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao testar webhook:", error.message);
      if (error.response) {
        console.error("Resposta do servidor:", {
          status: error.response.status,
          data: error.response.data
        });
      }
    }
  } catch (error) {
    console.error("Erro ao testar webhook:", error.message);
  }
}

/**
 * Gera um token de acesso aleatório
 * @returns {string} - Token de acesso gerado
 */
function gerarTokenAcesso() {
  const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  
  for (let i = 0; i < 20; i++) {
    token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  
  return token;
}

async function main() {
  await inicializar();

  const args = process.argv.slice(2);
  const comando = args[0];

  switch (comando) {
    case "--criar":
      await criarWebhook(args[1], args[2]);
      break;
    case "--listar":
      await listarWebhooks();
      break;
    case "--testar":
      await testarWebhook(args[1]);
      break;
    default:
      console.log("Comando não reconhecido.");
      console.log("Uso:");
      console.log("- Para criar um webhook: node gerenciarWebhooks.js --criar <url> <descricao>");
      console.log("- Para listar webhooks: node gerenciarWebhooks.js --listar");
      console.log("- Para testar um webhook: node gerenciarWebhooks.js --testar <id>");
      break;
  }

  process.exit(0);
}

main().catch(error => {
  console.error("Erro:", error);
  process.exit(1);
});
