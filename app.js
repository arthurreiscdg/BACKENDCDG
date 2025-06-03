require("dotenv").config();
const express = require("express");
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const sequelize = require("./config/database");
const { authMiddleware } = require("./auth/authMiddleware");
const { sincronizarBancoDados } = require("./scripts/syncDatabase");

// Importação das rotas
const authRoutes = require("./routes/auth");
const pedidoRoutes = require("./routes/pedidos");
const formularioRoutes = require("./routes/formularios");
const integracaoRoutes = require("./routes/integracao");
const webhookRoutes = require("./routes/webhooks");
const usuarioRoutes = require("./routes/usuarios");
const logEndpointMiddleware = require('./controllers/logEndpointMiddleware');

/**
 * Configuração e inicialização do Express
 */
function configurarExpress() {
  const app = express();
    // Configurar timeout para requisições grandes (5 minutos)
  app.use((req, res, next) => {
    req.setTimeout(300000); // 5 minutos em ms
    res.setTimeout(300000); // 5 minutos em ms
    next();
  });
  
  // Middleware para cookies
  app.use(cookieParser());  // Middleware para CORS (Cross-Origin Resource Sharing) - ATUALIZADO para produção
  app.use((req, res, next) => {
    const allowedOrigins = [
      "http://localhost:5173", // Desenvolvimento local
      "http://localhost:3000", // Desenvolvimento local alternativo
      "http://localhost:5174", // Desenvolvimento local alternativo
      "https://cdgproducao.onrender.com", // Frontend em produção no Render
      "https://casadagrafica.vercel.app", // Frontend em produção na Vercel
      "https://cdgapp.com.br" // Se você tiver um domínio personalizado
    ];
    
    const origin = req.headers.origin;
    console.log(`[CORS] Origin recebida: ${origin}`); // Log para debug
    
    if (allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      console.log(`[CORS] Origin permitida: ${origin}`); // Log para debug
    } else {
      console.log(`[CORS] Origin não permitida: ${origin}`); // Log para debug
    }
    
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true"); // IMPORTANTE: permite cookies
    
    // Responde às requisições OPTIONS
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    
    next();
  });// Middleware para processar JSON (com limite aumentado para PDFs em base64 - 300MB)
  app.use(express.json({ limit: "300mb" }));
  
  // Middleware para processar dados URL-encoded (com limite aumentado - 300MB)
  app.use(express.urlencoded({ limit: "300mb", extended: true }));
  
  // Middleware para processar uploads de arquivos
  app.use(fileUpload({
    limits: { fileSize: 200 * 1024 * 1024 }, // limita a 200MB
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: '/tmp/',
    abortOnLimit: false, // Não abortar imediatamente no limite
    responseOnLimit: "Arquivo muito grande" // Mensagem personalizada
  }));
  
  // Middleware para logar o endpoint acessado
  app.use(logEndpointMiddleware);
  
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
  app.use("/api/usuarios", authMiddleware(), usuarioRoutes);
  
  // Rota para buscar status de pedidos
  app.get("/api/status-pedidos", authMiddleware(), require("./controllers/pedidoController").listarStatusPedidos);
}

/**
 * Inicia o servidor
 * @param {express.Application} app - Instância do Express
 */
async function iniciarServidor(app) {
  try {
    // Obtém a porta do ambiente (Render usa PORT, não API_PORT)
    const PORT = process.env.PORT || process.env.API_PORT || 3000;
    
    // Inicia o servidor com timeout configurado
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
      // Configurar timeout do servidor para uploads grandes (5 minutos)
    server.timeout = 300000; // 5 minutos
    server.keepAliveTimeout = 320000; // 5 minutos + 20 segundos
    server.headersTimeout = 330000; // 5 minutos + 30 segundos
    
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
