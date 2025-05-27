require("dotenv").config();
const express = require("express");
const fileUpload = require('express-fileupload');
const sequelize = require("./config/database");
const authMiddleware = require("./auth/authMiddleware");
const { sincronizarBancoDados } = require("./scripts/syncDatabase");

// Importação das rotas
const authRoutes = require("./routes/auth");
const pedidoRoutes = require("./routes/pedidos");
const formularioRoutes = require("./routes/formularios");
const integracaoRoutes = require("./routes/integracao");
const webhookRoutes = require("./routes/webhooks");

/**
 * Configuração e inicialização do Express
 */
function configurarExpress() {
  const app = express();
  
  // Middleware para CORS (Cross-Origin Resource Sharing)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    // Responde às requisições OPTIONS
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    
    next();
  });
    // Middleware para processar JSON (com limite aumentado para PDFs em base64)
  app.use(express.json({ limit: "10mb" }));
  
  // Middleware para processar uploads de arquivos
  app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // limita a 10MB
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: '/tmp/'
  }));
  
  // Configuração das rotas
  configurarRotas(app);
  
  return app;
}

/**
 * Configuração das rotas da aplicação
 * @param {express.Application} app - Instância do Express
 */
function configurarRotas(app) {
  app.use("/api/auth", authRoutes);
  app.use("/api/pedidos", authMiddleware(), pedidoRoutes);
  app.use("/api/formularios", authMiddleware(), formularioRoutes);
  app.use("/api/integracao", integracaoRoutes);
  app.use("/api/webhooks", authMiddleware(), webhookRoutes);
}

/**
 * Inicia o servidor
 * @param {express.Application} app - Instância do Express
 */
async function iniciarServidor(app) {
  try {
    // Obtém a porta do arquivo
    const PORT = process.env.API_PORT;
    
    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
}

/**
 * Verifica a conexão com o banco de dados
 */
async function verificarConexaoBancoDados() {
  try {
    // Testa a conexão com o banco de dados
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
    return false;
  }
}

/**
 * Função principal que inicializa a aplicação
 */
async function iniciarAplicacao() {
  // Verifica a conexão com o banco de dados
  const conexaoOk = await verificarConexaoBancoDados();
  
  if (!conexaoOk) {
    console.error("Não foi possível conectar ao banco de dados. Encerrando aplicação.");
    process.exit(1);
  }
  
  // Configura e inicia o servidor Express
  const app = configurarExpress();
  iniciarServidor(app);
}

// Inicia a aplicação
iniciarAplicacao();
