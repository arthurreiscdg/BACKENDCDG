# API de Integração - Recebimento de Pedidos

Esta documentação descreve como usar a API de integração para enviar pedidos externos para o Sistema CDG.

## Autenticação

Todas as requisições à API de integração devem incluir um cabeçalho de autenticação com a chave de API.

```
X-API-Key: sua_chave_secreta
```

## Endpoints

### Enviar Pedido

**Endpoint:** `POST /api/integracao/pedidos`

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: sua_chave_secreta`

**Corpo da Requisição:**

```json
{
  "valor_pedido": 150.50,
  "custo_envio": 15.00,
  "etiqueta_envio": "https://exemplo.com/etiquetas/123456.pdf",
  "metodo_envio": 1,
  "numero_pedido": 123456,
  "nome_cliente": "João Silva",
  "documento_cliente": "123.456.789-00",
  "email_cliente": "joao.silva@exemplo.com",
  "produtos": [
    {
      "nome": "Camiseta Personalizada - Tamanho M",
      "sku": "CAM-PERS-M",
      "quantidade": 2,
      "id_sku": 1001,
      "designs": {
        "capa_frente": "https://exemplo.com/designs/123456_frente.jpg",
        "capa_verso": "https://exemplo.com/designs/123456_verso.jpg"
      },
      "mockups": {
        "capa_frente": "https://exemplo.com/mockups/123456_frente.jpg",
        "capa_costas": "https://exemplo.com/mockups/123456_costas.jpg"
      },
      "arquivo_pdf": "https://exemplo.com/arquivos/123456.pdf"
    }
  ],
  "informacoes_adicionais": {
    "nome": "Loja de Camisetas",
    "telefone": "(11) 98765-4321",
    "email": "contato@lojadecamisetas.com.br"
  },
  "endereco_envio": {
    "nome_destinatario": "João Silva",
    "endereco": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 45",
    "cidade": "São Paulo",
    "uf": "SP",
    "cep": "01234-567",
    "bairro": "Centro",
    "telefone": "(11) 98765-4321",
    "pais": "Brasil"
  }
}
```

**Resposta de Sucesso:**

```json
{
  "sucesso": true,
  "mensagem": "Pedido recebido com sucesso",
  "pedido_id": 1,
  "numero_pedido": 123456
}
```

### Listar Pedidos

**Endpoint:** `GET /api/integracao/pedidos`

**Parâmetros de Query:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Número de itens por página (padrão: 20)

**Headers:**
- `X-API-Key: sua_chave_secreta`

**Resposta de Sucesso:**

```json
{
  "sucesso": true,
  "pedidos": [
    {
      "id": 1,
      "numero_pedido": 123456,
      "status": "Em processamento",
      "nome_cliente": "João Silva",
      "valor_pedido": 150.50,
      "data_criacao": "2023-05-21T10:30:00Z",
      "data_atualizacao": "2023-05-21T11:15:00Z"
    },
    {
      "id": 2,
      "numero_pedido": 123457,
      "status": "Concluído",
      "nome_cliente": "Maria Oliveira",
      "valor_pedido": 75.25,
      "data_criacao": "2023-05-20T14:45:00Z",
      "data_atualizacao": "2023-05-21T09:30:00Z"
    }
  ],
  "paginacao": {
    "total": 25,
    "pagina_atual": 1,
    "total_paginas": 3,
    "itens_por_pagina": 10
  }
}
```

### Verificar Status de Pedido

**Endpoint:** `GET /api/integracao/pedidos/{numero_pedido}/status`

**Headers:**
- `X-API-Key: sua_chave_secreta`

**Resposta de Sucesso:**

```json
{
  "sucesso": true,
  "numero_pedido": 123456,
  "status": "Aguardando Produção",
  "data_criacao": "2023-05-10T14:30:00Z",
  "data_atualizacao": "2023-05-11T10:15:22Z"
}
```

### Cancelar Pedido

**Endpoint:** `POST /api/integracao/pedidos/{numero_pedido}/cancelar`

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: sua_chave_secreta`

**Corpo da Requisição:**

```json
{
  "motivo_cancelamento": "Pedido cancelado a pedido do cliente"
}
```

**Resposta de Sucesso:**

```json
{
  "sucesso": true,
  "mensagem": "Pedido cancelado com sucesso",
  "numero_pedido": 123456,
  "status": "Cancelado"
}
```

### Atualizar Pedido

**Endpoint:** `PUT /api/integracao/pedidos/{numero_pedido}`

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: sua_chave_secreta`

**Corpo da Requisição:**

```json
{
  "email_cliente": "novo.email@exemplo.com",
  "telefone_cliente": "(11) 98888-7777",
  "endereco_envio": {
    "nome_destinatario": "Maria Silva",
    "endereco": "Avenida Principal",
    "numero": "1000",
    "complemento": "Bloco B, Apto 101",
    "cidade": "Rio de Janeiro",
    "uf": "RJ",
    "cep": "22000-000",
    "bairro": "Copacabana",
    "telefone": "(21) 98765-4321"
  }
}
```

**Resposta de Sucesso:**

```json
{
  "sucesso": true,
  "mensagem": "Pedido atualizado com sucesso",
  "numero_pedido": 123456,
  "campos_atualizados": [
    "email_cliente",
    "telefone_cliente",
    "endereco",
    "numero",
    "complemento",
    "cidade",
    "uf",
    "cep",
    "bairro",
    "telefone_destinatario"
  ]
}
```

### Métricas da API

**Endpoint:** `GET /api/integracao/metricas`

**Headers:**
- `X-API-Key: sua_chave_secreta` (requer privilégios de administrador)

**Resposta de Sucesso:**

```json
{
  "sucesso": true,
  "metricas": {
    "chamadas_totais": 1542,
    "chamadas_por_endpoint": {
      "receberPedido": 450,
      "verificarStatusPedido": 980,
      "listarPedidos": 102,
      "cancelarPedido": 8,
      "atualizarPedido": 2
    },
    "erros_totais": 23,
    "ultima_hora": 45,
    "tempo_medio_resposta": "120ms"
  }
}
```

## Códigos de Erro

- `400 Bad Request`: Requisição inválida ou dados faltando
- `401 Unauthorized`: Chave de API inválida ou não fornecida
- `404 Not Found`: Recurso não encontrado
- `429 Too Many Requests`: Limite de requisições excedido
- `500 Internal Server Error`: Erro interno no servidor

## Limites de Uso

A API possui os seguintes limites de uso:

- Máximo de 1000 requisições por hora
- Máximo de 10000 requisições por dia

## Ambiente de Teste

Para testar a integração, utilize os scripts disponíveis no diretório `TESTEDEENVIOSAPI`:

- `enviar.py`: Para enviar pedidos de teste
- `consultar.py`: Para consultar pedidos interativamente
- `consultar_json.py`: Para consultar pedidos com saída em formato JSON
