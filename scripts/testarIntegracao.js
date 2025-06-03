/**
 * Script para testar a API de integração de pedidos
 * 
 * Para usar:
 * 1. Certifique-se de que o servidor esteja rodando
 * 2. Execute o script: node scripts/testarIntegracao.js
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

// Configurações da API
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.PORT || process.env.API_PORT || 3030;
const API_PATH = '/api/integracao/pedidos';
const API_KEY = process.env.INTEGRACAO_API_KEY || process.env.API_KEY;

// Verifica se a chave de API está configurada
if (!API_KEY) {
  console.error('A chave de API (INTEGRACAO_API_KEY) não está configurada no arquivo .env');
  process.exit(1);
}

// Dados do pedido de teste
const pedidoTeste = {
  "valor_pedido": 150.50,
  "custo_envio": 15.00,
  "etiqueta_envio": "https://exemplo.com/etiquetas/123456.pdf",
  "metodo_envio": 1,
  "numero_pedido": Math.floor(100000 + Math.random() * 900000), // Número aleatório para evitar duplicidade
  "nome_cliente": "Cliente de Teste",
  "documento_cliente": "123.456.789-00",
  "email_cliente": "teste@exemplo.com",
  "produtos": [
    {
      "nome": "Produto de Teste",
      "sku": "TESTE-SKU-001",
      "quantidade": 1,
      "id_sku": 1001,
      "designs": {
        "capa_frente": "https://exemplo.com/designs/teste_frente.jpg",
        "capa_verso": "https://exemplo.com/designs/teste_verso.jpg"
      },
      "mockups": {
        "capa_frente": "https://exemplo.com/mockups/teste_frente.jpg",
        "capa_costas": "https://exemplo.com/mockups/teste_costas.jpg"
      },
      "arquivo_pdf": "https://exemplo.com/arquivos/teste.pdf"
    }
  ],
  "informacoes_adicionais": {
    "nome": "Loja de Teste",
    "telefone": "(11) 98765-4321",
    "email": "contato@teste.com"
  },
  "endereco_envio": {
    "nome_destinatario": "Destinatário de Teste",
    "endereco": "Rua de Teste",
    "numero": "123",
    "complemento": "Sala 45",
    "cidade": "Cidade de Teste",
    "uf": "SP",
    "cep": "01234-567",
    "bairro": "Bairro de Teste",
    "telefone": "(11) 98765-4321",
    "pais": "Brasil"
  }
};

// Configura a requisição
const options = {
  hostname: API_HOST,
  port: API_PORT,
  path: API_PATH,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  }
};

// Faz a requisição
const req = http.request(options, (res) => {
  console.log(`\nStatus da requisição: ${res.statusCode} ${res.statusMessage}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonResponse = JSON.parse(data);
      console.log('\nResposta:');
      console.log(JSON.stringify(jsonResponse, null, 2));
      
      if (jsonResponse.sucesso) {
        console.log(`\nPedido ${jsonResponse.numero_pedido} enviado com sucesso!`);
        console.log(`ID interno: ${jsonResponse.pedido_id}`);
      } else {
        console.error('\nErro ao enviar o pedido:', jsonResponse.mensagem);
      }
    } catch (error) {
      console.error('\nErro ao processar a resposta:', error.message);
      console.log('Dados recebidos:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('\nErro na requisição:', error.message);
});

// Envia os dados do pedido
console.log('Enviando pedido de teste para a API de integração...');
console.log(`URL: http://${API_HOST}:${API_PORT}${API_PATH}`);
console.log('Número do pedido:', pedidoTeste.numero_pedido);

req.write(JSON.stringify(pedidoTeste));
req.end();
