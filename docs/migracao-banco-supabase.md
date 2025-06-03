# Migração de Banco de Dados - SQLite para Supabase (PostgreSQL)

## 📋 Resumo

Este documento descreve o processo completo de migração do sistema Casa da Gráfica do banco SQLite local para o Supabase (PostgreSQL na nuvem), realizada em junho de 2025.

## 🎯 Objetivo

Migrar de um banco SQLite em memória para um banco PostgreSQL profissional no Supabase, mantendo toda a estrutura de dados e funcionalidades existentes.

---

## 📊 Configurações do Supabase

### Dados do Projeto
- **Organização**: Casa da Gráfica
- **Nome do Projeto**: Casa da Gráfica Project
- **Região**: América do Sul (São Paulo)
- **URL do Projeto**: https://kcezmqxsnzqksbilebnt.supabase.co
- **Senha do Banco**: xirQhERgjJ6xjqEq

### Chaves de API
- **Chave Anon Public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Chave Service Role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 🔧 Configuração Técnica

### 1. Dependências Adicionadas

```bash
npm install pg pg-hstore
```

- **pg**: Driver PostgreSQL para Node.js
- **pg-hstore**: Suporte para tipo de dados hstore do PostgreSQL

### 2. Variáveis de Ambiente (`.env`)

```env
# Configuracao do Supabase/PostgreSQL
SUPABASE_URL=https://kcezmqxsnzqksbilebnt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Configuracao do Banco PostgreSQL (Supabase)
DB_HOST=aws-0-sa-east-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.kcezmqxsnzqksbilebnt
DB_PASSWORD=xirQhERgjJ6xjqEq
DB_SSL=true
```

### 3. Configuração do Database (`config/database.js`)

```javascript
const { Sequelize } = require("sequelize");
require("dotenv").config();

const dbConfig = {
  criarConexao: () => {
    // Configuração para PostgreSQL (Supabase)
    return new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",
        dialectOptions: {
          ssl: process.env.DB_SSL === "true" ? {
            require: true,
            rejectUnauthorized: false
          } : false
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        logging: false
      }
    );
  },
  testarConexao: async (sequelize) => {
    try {
      await sequelize.authenticate();
      console.log("Conexão com o banco de dados estabelecida com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao conectar com o banco de dados:", error);
      return false;
    }
  }
};

// Cria a instância do Sequelize
const sequelize = dbConfig.criarConexao();

module.exports = sequelize;
```

---

## 🗃️ Estrutura de Tabelas Migradas

### Tabelas Criadas no Supabase

1. **Usuarios** - Usuários do sistema
2. **Permissoes** - Permissões do sistema
3. **UsuarioPermissoes** - Relacionamento usuário-permissão
4. **StatusPedidos** - Status disponíveis para pedidos
5. **Pedidos** - Pedidos do sistema
6. **HistoricoPedidos** - Histórico de alterações nos pedidos
7. **HistoricoStatus** - Histórico de mudanças de status
8. **Webhooks** - URLs de notificação
9. **Formularios** - Formulários do sistema
10. **ArquivoPdfs** - Arquivos PDF uploadados
11. **Unidades** - Unidades de medida
12. **PedidoJsonPdfs** - Dados JSON dos PDFs

### Relacionamentos Preservados

- **Usuario** → **Pedido** (1:N)
- **StatusPedido** → **Pedido** (1:N)
- **Usuario** ↔ **Permissao** (N:N via UsuarioPermissao)
- **Pedido** → **HistoricoPedido** (1:N)
- **Webhook** → **Pedido** (1:N)

---

## 🚀 Scripts de Migração e População

### 1. Sincronização do Banco

```bash
# Sincronizar modelos (sem recriar)
npm run db:sync

# Reset completo (recriar todas as tabelas)
npm run db:reset

# Atualizar estrutura existente
npm run db:update
```

**Script**: `scripts/syncDatabase.js`
- Conecta ao Supabase
- Sincroniza modelos Sequelize
- Cria dados iniciais quando usando `--force`

### 2. Criação de Usuários das Escolas

```bash
node scripts/criarUsuariosEscola.js
```

**Usuários Criados**:
- **admin** / admin123 (Administrador)
- **zerohum** / zerohum123 (Escola ZeroHum)
- **coleguium** / coleguium123 (Escola Coleguium)
- **elite** / elite123 (Escola Elite)
- **pensi** / pensi123 (Escola Pensi)

### 3. População de Dados de Teste

```bash
node scripts/popularDadosTesteMontink.js
```

**Dados Criados**:
- Status de pedidos (Novo, Em Análise, Aprovado, etc.)
- Webhooks de teste
- Dados iniciais do sistema Montink

### 4. População de Webhooks

```bash
npm run webhook:popular
```

**Webhooks Criados**:
- Loja Principal: `https://api.loja1.com/webhook/pedidos`
- Loja Secundária: `https://api.loja2.com/notifications`
- Marketplace: `https://api.marketplace.com/orders/status` (inativo)

---

## ✅ Processo de Migração Executado

### Passo 1: Preparação
1. ✅ Criação do projeto no Supabase
2. ✅ Obtenção das credenciais de conexão
3. ✅ Instalação das dependências PostgreSQL

### Passo 2: Configuração
1. ✅ Atualização do arquivo `.env`
2. ✅ Modificação do `config/database.js`
3. ✅ Correção de problemas de sintaxe SQL

### Passo 3: Migração
1. ✅ Execução do `npm run db:reset`
2. ✅ Criação automática de todas as tabelas
3. ✅ Verificação de relacionamentos

### Passo 4: População
1. ✅ Criação de usuários das escolas
2. ✅ População de dados de teste
3. ✅ Configuração de webhooks

### Passo 5: Validação
1. ✅ Teste de conexão
2. ✅ Verificação das tabelas no Supabase
3. ✅ Execução do servidor (`npm run dev`)

---

## 🔧 Comandos Úteis

### Gerenciamento do Banco

```bash
# Sincronizar sem recriar
npm run db:sync

# Reset completo (apaga tudo e recria)
npm run db:reset

# Atualizar estrutura mantendo dados
npm run db:update
```

### Gerenciamento de Webhooks

```bash
# Popular webhooks
npm run webhook:popular

# Listar webhooks
npm run webhook:listar

# Criar webhook
npm run webhook:criar

# Testar webhook
npm run webhook:testar
```

### Execução do Servidor

```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

---

## 🚨 Problemas Encontrados e Soluções

### 1. Erro de Sintaxe SQL com UNIQUE
**Problema**: Sequelize gerava SQL incorreto para PostgreSQL
```sql
ALTER COLUMN "username" TYPE VARCHAR(255) UNIQUE;
```

**Solução**: Remoção do `{ alter: true }` dos scripts que causavam o problema

### 2. Importação de Modelos
**Problema**: Script tentava usar modelos não importados
**Solução**: Correção da importação via `require("../models/index")`

### 3. Configuração SSL
**Problema**: Conexão rejeitada sem SSL
**Solução**: Adição de configuração SSL adequada para Supabase

---

## 📈 Vantagens da Migração

### Performance
- ✅ Banco PostgreSQL profissional
- ✅ Pool de conexões otimizado
- ✅ Índices automáticos

### Escalabilidade
- ✅ Sem limite de tamanho do SQLite
- ✅ Múltiplas conexões simultâneas
- ✅ Backup automático

### Funcionalidades
- ✅ Interface web do Supabase
- ✅ APIs REST automáticas
- ✅ Monitoramento em tempo real

### Segurança
- ✅ Criptografia em trânsito
- ✅ Controle de acesso avançado
- ✅ Auditoria de consultas

---

## 🔐 Segurança

### Credenciais
- ✅ Variáveis de ambiente protegidas
- ✅ Chaves de API separadas (anon/service)
- ✅ Conexão SSL obrigatória

### Acesso ao Banco
- ✅ Usuário específico do projeto
- ✅ Região São Paulo (conformidade LGPD)
- ✅ Backup automático diário

---

## 📚 Referências

- [Documentação Supabase](https://supabase.com/docs)
- [Sequelize PostgreSQL](https://sequelize.org/docs/v6/dialects/postgres/)
- [Node.js pg Driver](https://node-postgres.com/)

---

## 📝 Notas Finais

A migração foi concluída com sucesso em junho de 2025. O sistema agora opera com um banco PostgreSQL profissional no Supabase, mantendo todas as funcionalidades existentes e ganhando recursos adicionais de escalabilidade e performance.

**Status**: ✅ **MIGRAÇÃO CONCLUÍDA COM SUCESSO**

---

*Documentação criada em: 03 de junho de 2025*  
*Última atualização: 03 de junho de 2025*
