# Documentação de Webhooks - Sistema CDG

## Visão Geral

O Sistema CDG inclui uma funcionalidade robusta de webhooks que permite a integração com sistemas externos através de notificações em tempo real. Os webhooks são disparados automaticamente sempre que ocorre uma atualização no status de um pedido, permitindo que sistemas integrados recebam informações atualizadas sem a necessidade de consultas periódicas à API.

## Estrutura do Sistema de Webhooks

O sistema de webhooks é composto por:

1. **Modelo de Dados**: Define a estrutura de armazenamento dos webhooks no banco de dados
2. **Controlador**: Gerencia as operações CRUD via API REST
3. **Serviço**: Lógica para disparo e processamento dos webhooks
4. **Rotas**: Endpoints da API para gerenciamento de webhooks
5. **Script de Gerenciamento**: Utilitário de linha de comando para gerenciar webhooks

## Componentes em Detalhes

### 1. Modelo de Dados (`models/webhook.js`)

Este arquivo define a estrutura da tabela de webhooks no banco de dados utilizando o Sequelize ORM.

**Campos do modelo:**
- `url_destino`: URL para onde as notificações serão enviadas (String, máx. 500 caracteres)
- `descricao`: Descrição do propósito do webhook (Campo de texto)
- `ativo`: Indica se o webhook está ativo ou desativado (Boolean, padrão: true)
- `criado_em`: Data de criação do webhook (gerenciado automaticamente)

**Propósito**: Armazenar os destinos para onde as notificações serão enviadas, permitindo ativar/desativar webhooks sem removê-los.

### 2. Controlador (`controllers/webhookController.js`)

Este controlador gerencia todas as operações relacionadas aos webhooks através da API REST.

**Métodos implementados:**

- `listarWebhooks`: Retorna todos os webhooks cadastrados
  - **Endpoint**: GET /api/webhooks
  - **Permissão**: Apenas administradores
  - **Resposta**: Lista de todos os webhooks com seus atributos

- `obterWebhook`: Obtém detalhes de um webhook específico
  - **Endpoint**: GET /api/webhooks/:id
  - **Permissão**: Apenas administradores
  - **Parâmetros**: ID do webhook
  - **Resposta**: Detalhes do webhook solicitado

- `criarWebhook`: Cria um novo webhook
  - **Endpoint**: POST /api/webhooks
  - **Permissão**: Apenas administradores
  - **Corpo da requisição**:
    ```json
    {
      "url_destino": "https://sistema-externo.com/webhook",
      "descricao": "Notificação para o sistema externo",
      "ativo": true
    }
    ```
  - **Resposta**: Detalhes do webhook criado com seu ID

- `atualizarWebhook`: Atualiza um webhook existente
  - **Endpoint**: PUT /api/webhooks/:id
  - **Permissão**: Apenas administradores
  - **Parâmetros**: ID do webhook
  - **Corpo da requisição**: Campos a serem atualizados
  - **Resposta**: Webhook atualizado

- `excluirWebhook`: Remove um webhook
  - **Endpoint**: DELETE /api/webhooks/:id
  - **Permissão**: Apenas administradores
  - **Parâmetros**: ID do webhook
  - **Resposta**: Mensagem de confirmação da exclusão

**Propósito**: Expor operações de gerenciamento de webhooks via API REST com controle de acesso adequado.

### 3. Serviço (`services/webhookService.js`)

Este serviço contém a lógica para envio de notificações via webhook quando eventos ocorrem no sistema.

**Métodos implementados:**

- `notificarAtualizacaoStatus`: Método principal que envia notificações quando o status de um pedido é atualizado
  - **Parâmetros**: 
    - `pedido`: Objeto do pedido atualizado
    - `statusId`: ID do novo status
  - **Processamento**:
    1. Busca todos os webhooks ativos
    2. Obtém detalhes do status atualizado
    3. Prepara o payload de notificação
    4. Envia a notificação para todos os webhooks cadastrados
    5. Retorna os resultados das chamadas

- `enviarWebhook` (função interna): Realiza a requisição HTTP para enviar o payload
  - **Parâmetros**:
    - `url`: URL de destino para envio
    - `payload`: Dados a serem enviados
  - **Processamento**:
    1. Envia uma requisição POST com o payload em formato JSON
    2. Utiliza timeout de 10 segundos para evitar bloqueios
    3. Retorna o resultado da chamada, seja sucesso ou erro

- `gerarTokenAcesso` (função interna): Gera um token de acesso aleatório para autenticação
  - **Processamento**: Cria uma string aleatória de 20 caracteres como token de acesso

**Propósito**: Centralizar toda a lógica de processamento e envio de notificações, garantindo que os sistemas externos recebam dados consistentes e formatados corretamente.

### 4. Rotas (`routes/webhooks.js`)

Este arquivo configura os endpoints da API relacionados a webhooks, com middleware de autenticação e validação de permissões.

**Configurações:**

- Todas as rotas requerem autenticação via token JWT
- Um middleware verifica se o usuário autenticado tem permissão de administrador
- Os endpoints são mapeados para os métodos do controller

**Endpoints expostos:**
- `GET /api/webhooks`: Listar todos os webhooks
- `GET /api/webhooks/:id`: Obter um webhook específico
- `POST /api/webhooks`: Criar um novo webhook
- `PUT /api/webhooks/:id`: Atualizar um webhook existente
- `DELETE /api/webhooks/:id`: Excluir um webhook

**Propósito**: Expor as funcionalidades de gerenciamento de webhooks via API REST com as devidas proteções de acesso.

### 5. Script de Gerenciamento (`scripts/gerenciarWebhooks.js`)

Este script oferece uma interface de linha de comando para gerenciar webhooks, útil para operações administrativas e testes.

**Comandos disponíveis:**

- `--criar <url> <descricao>`: Cria um novo webhook
  - **Exemplo**: `node gerenciarWebhooks.js --criar "https://exemplo.com/webhook" "Notificação de status"`
  - **Processamento**: Cria um novo webhook com a URL e descrição especificadas
  - **Saída**: Detalhes do webhook criado, incluindo seu ID

- `--listar`: Lista todos os webhooks cadastrados
  - **Exemplo**: `node gerenciarWebhooks.js --listar`
  - **Processamento**: Consulta todos os webhooks no banco de dados
  - **Saída**: Tabela formatada com os detalhes de cada webhook

- `--testar <id>`: Testa um webhook enviando um payload simulado
  - **Exemplo**: `node gerenciarWebhooks.js --testar 1`
  - **Processamento**: 
    1. Busca o webhook com o ID especificado
    2. Cria um payload de teste simulando atualização de status
    3. Envia o payload para a URL do webhook
    4. Exibe o resultado da operação
  - **Saída**: Detalhes da requisição e resposta recebida

**Propósito**: Facilitar o gerenciamento e teste de webhooks através de uma interface de linha de comando, sem necessidade de acessar a API REST.

## Formato do Payload

Quando um status de pedido é atualizado, o sistema envia uma requisição POST para todos os webhooks cadastrados com o seguinte formato de payload:

```json
{
  "data": "2025-05-21 16:41:45",
  "access_token": "ioewnxlslwidnazgje",
  "json": {
    "casa_grafica_id": "1221726",
    "status_id": 1,
    "status": "Pedido enviado para produção"
  }
}
```

**Campos do payload:**

- `data`: Data e hora da atualização do status (formato: YYYY-MM-DD HH:MM:SS)
- `access_token`: Token de acesso gerado para autenticação da requisição
- `json`: Objeto contendo os detalhes da atualização
  - `casa_grafica_id`: ID do pedido/casa gráfica no sistema
  - `status_id`: ID numérico do novo status
  - `status`: Descrição textual do novo status

## Fluxo de Funcionamento

1. **Cadastro de Webhook**:
   - Um administrador cadastra um webhook através da API ou script de gerenciamento
   - O sistema armazena a URL de destino e mantém o webhook como ativo

2. **Atualização de Status de Pedido**:
   - Um pedido tem seu status alterado através da API
   - A função `atualizarStatusPedido` no controlador de pedidos é executada
   - Esta função chama `webhookService.notificarAtualizacaoStatus` após atualizar o status

3. **Processamento do Webhook**:
   - O serviço de webhook busca todos os webhooks ativos
   - Prepara o payload com as informações do pedido e do novo status
   - Envia requisições POST para cada webhook cadastrado
   - Registra os resultados das chamadas (sucesso ou erro)

4. **Recebimento pelo Sistema Externo**:
   - O sistema externo recebe a requisição POST
   - Processa o payload conforme sua lógica interna
   - Responde com um código HTTP de sucesso (2xx)

## Boas Práticas para Sistemas de Recebimento

Para sistemas que receberão as notificações via webhook, recomenda-se:

1. **Validação de Token**: Validar o token recebido no campo `access_token`
2. **Processamento Assíncrono**: Processar a notificação de forma assíncrona e responder rapidamente
3. **Resiliência**: Implementar lógica para lidar com possíveis duplicações de eventos
4. **Confirmação**: Responder com código HTTP 200 mesmo que ocorram erros internos, para evitar reenvios
5. **Logging**: Manter registros detalhados das notificações recebidas para depuração

**Um exemplo de implementação de receptor de webhooks está disponível em [exemplo-receptor-webhook.js](./exemplo-receptor-webhook.js)**

## Scripts Auxiliares

O sistema oferece scripts NPM para facilitar o gerenciamento de webhooks:

- `npm run webhook:criar <url> <descricao>`: Criar um novo webhook
- `npm run webhook:listar`: Listar todos os webhooks
- `npm run webhook:testar <id>`: Testar um webhook específico

## Exemplos de Uso

### Criação de um Webhook via API

```
POST /api/webhooks
Authorization: Bearer <seu_token_jwt>

{
  "url_destino": "https://sistema-cliente.com/api/notificacoes",
  "descricao": "Notificações para o Sistema Cliente"
}
```

### Criação de um Webhook via Script

```bash
npm run webhook:criar "https://sistema-cliente.com/api/notificacoes" "Notificações para o Sistema Cliente"
```

### Teste de um Webhook

```bash
npm run webhook:testar 1
```

## Solução de Problemas

### Webhook não está sendo disparado

1. Verifique se o webhook está ativo no banco de dados
2. Confirme que a URL de destino está correta e acessível
3. Verifique os logs de erro no console do servidor

### Erro ao receber notificações no sistema externo

1. Verifique se o sistema externo está acessível pela internet
2. Confirme que a URL de destino está configurada para aceitar requisições POST
3. Verifique se o payload está sendo processado corretamente no sistema destino

### Problemas de timeout

1. O sistema configura um timeout de 10 segundos para as requisições
2. Sistemas de destino devem responder dentro deste limite
3. Considere implementar um sistema de confirmação assíncrona para processamentos longos

## Considerações de Segurança

1. **Autenticação**: Apenas administradores podem gerenciar webhooks
2. **Token de Acesso**: Cada notificação possui um token único para autenticação
3. **HTTPS**: Recomenda-se utilizar apenas URLs HTTPS para os webhooks
4. **Validação**: O sistema de destino deve validar o token e a origem das requisições

## Conclusão

O sistema de webhooks do Sistema CDG fornece uma forma robusta e confiável para integração com sistemas externos, permitindo notificações em tempo real sobre atualizações de status de pedidos. Através das ferramentas disponibilizadas, é possível gerenciar facilmente os webhooks tanto via API REST quanto por linha de comando.
