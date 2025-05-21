// Exemplo de receptor de webhook para o Sistema CDG
// Este código demonstra como receber e processar webhooks enviados pelo Sistema CDG

const express = require('express');
const app = express();
const PORT = 3001;

// Middleware para processar o corpo JSON das requisições
app.use(express.json());

// Rota para receber webhooks do Sistema CDG
app.post('/webhook', (req, res) => {
  try {
    console.log('Webhook recebido:', JSON.stringify(req.body, null, 2));
    
    // Extrai os dados do webhook
    const { data, access_token, json } = req.body;
    
    // Validação básica dos dados recebidos
    if (!data || !access_token || !json) {
      console.error('Webhook com formato inválido');
      return res.status(400).json({ success: false, message: 'Formato inválido' });
    }
    
    // Processa os dados do webhook
    const { casa_grafica_id, status_id, status } = json;
    
    console.log(`Pedido ${casa_grafica_id} atualizado para o status "${status}" (ID: ${status_id})`);
    
    // Aqui você implementaria a lógica específica do seu sistema
    // Por exemplo, atualizar um pedido no seu banco de dados
    
    // Responde com sucesso, mesmo que ocorra algum erro interno
    // Isso evita que o Sistema CDG tente reenviar a notificação
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processado com sucesso',
      pedido: casa_grafica_id,
      status: status
    });
    
    // Após responder, você pode executar tarefas mais demoradas de forma assíncrona
    processarAtualizacaoStatus(casa_grafica_id, status_id, status);
    
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    
    // Importante: ainda responde com 200 para evitar reenvios
    res.status(200).json({ 
      success: false, 
      message: 'Erro interno, mas notificação recebida'
    });
  }
});

// Função para processar a atualização de status de forma assíncrona
async function processarAtualizacaoStatus(pedidoId, statusId, statusNome) {
  try {
    console.log(`Processamento assíncrono do pedido ${pedidoId} iniciado`);
    
    // Simula um processamento demorado
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`Atualização de status do pedido ${pedidoId} concluída`);
    
    // Aqui você implementaria a lógica específica do seu sistema
    // Por exemplo, enviar um e-mail de notificação, atualizar um dashboard, etc.
    
  } catch (error) {
    console.error(`Erro no processamento assíncrono do pedido ${pedidoId}:`, error);
  }
}

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Receptor de webhooks rodando na porta ${PORT}`);
  console.log(`URL para configurar no Sistema CDG: http://seu-servidor.com:${PORT}/webhook`);
});
