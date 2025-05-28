# 🏗️ Sistema de Gerenciamento de Formulários e Google Drive

## 🎯 Visão Geral

Sistema completo de gerenciamento de formulários digitais com **autenticação segura**, **upload automático para Google Drive** e **persistência em SQLite**. Projetado para escalar facilmente para múltiplas escolas mantendo isolamento de dados e segurança.

## 📊 Estrutura do Banco de Dados

### **Modelos Sequelize**

#### **1. Formulário (Tabela Principal)**
```javascript
// models/formulario.js
Formulario {
  id: DataTypes.INTEGER (PRIMARY KEY, AUTO_INCREMENT),
  metodoPedido: DataTypes.STRING,     // 'manual' | 'excel'
  titulo: DataTypes.STRING,           // Título do trabalho
  dataEntrega: DataTypes.DATEONLY,    // Data de entrega
  observacoes: DataTypes.TEXT,        // Observações opcionais
  formatoFinal: DataTypes.STRING,     // 'A4', 'A3', etc.
  corImpressao: DataTypes.STRING,     // 'Preto e Branco', 'Colorida'
  impressao: DataTypes.STRING,        // 'Só Frente', 'Frente/Verso'
  gramatura: DataTypes.STRING,        // '75g', '90g', etc.
  grampos: DataTypes.STRING,          // Quantidade de grampos
  nome: DataTypes.STRING,             // Nome do solicitante
  email: DataTypes.STRING,            // Email do solicitante
  origemDados: DataTypes.STRING,      // Origem dos dados
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}
```

#### **2. ArquivoPdf (Arquivos Associados)**
```javascript
// models/arquivoPdf.js
ArquivoPdf {
  id: DataTypes.INTEGER (PRIMARY KEY),
  nome: DataTypes.STRING,                    // Nome original do arquivo
  tamanho: DataTypes.INTEGER,                // Tamanho em bytes
  tipo: DataTypes.STRING,                    // MIME type
  caminho_local: DataTypes.STRING,           // Caminho local temporário
  drive_file_id: DataTypes.STRING,           // ID no Google Drive
  drive_view_link: DataTypes.STRING,         // Link de visualização
  drive_download_link: DataTypes.STRING,     // Link de download
  formulario_id: DataTypes.INTEGER,          // FK para Formulario
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}
```

#### **3. Unidade (Escolas e Quantidades)**
```javascript
// models/unidade.js
Unidade {
  id: DataTypes.INTEGER (PRIMARY KEY),
  nome: DataTypes.STRING,              // Nome da escola/unidade
  quantidade: DataTypes.INTEGER,       // Quantidade solicitada
  formulario_id: DataTypes.INTEGER,    // FK para Formulario
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE
}
```

### **Associações Sequelize**
```javascript
// Associações bidirecionais com aliases
Formulario.hasMany(ArquivoPdf, { 
  foreignKey: "formulario_id", 
  as: "arquivos" 
});

Formulario.hasMany(Unidade, { 
  foreignKey: "formulario_id", 
  as: "unidades" 
});

ArquivoPdf.belongsTo(Formulario, { 
  foreignKey: "formulario_id" 
});

Unidade.belongsTo(Formulario, { 
  foreignKey: "formulario_id" 
});
```

### **Sistema de Associações Corrigido**

Durante o desenvolvimento, foram identificados e corrigidos erros críticos nas associações Sequelize:

#### **❌ Problemas Encontrados:**
```bash
# Erros que ocorriam antes da correção:
ArquivoPdf is not associated to Formulario
Unidade is not associated to Formulario
```

#### **✅ Solução Implementada:**

1. **Função associate() em cada modelo:**
```javascript
// models/arquivoPdf.js
static associate(models) {
  ArquivoPdf.belongsTo(models.Formulario, { 
    foreignKey: "formulario_id",
    as: "formulario" 
  });
}

// models/unidade.js  
static associate(models) {
  Unidade.belongsTo(models.Formulario, { 
    foreignKey: "formulario_id",
    as: "formulario" 
  });
}

// models/formulario.js
static associate(models) {
  Formulario.hasMany(models.ArquivoPdf, { 
    foreignKey: "formulario_id", 
    as: "arquivos" 
  });
  
  Formulario.hasMany(models.Unidade, { 
    foreignKey: "formulario_id", 
    as: "unidades" 
  });
}
```

2. **Execução automática das associações:**
```javascript
// models/index.js - Sistema atualizado
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
```

3. **Import via index.js nos controllers:**
```javascript
// controllers/formularioController.js
const { Formulario, ArquivoPdf, Unidade } = require('../models');

// ✅ Agora funciona perfeitamente com includes:
const formulario = await Formulario.findByPk(id, {
  include: [
    { model: ArquivoPdf, as: 'arquivos' },
    { model: Unidade, as: 'unidades' }
  ]
});
```

#### **🔧 Benefícios da Correção:**
- ✅ **Associações bidirecionais** funcionando
- ✅ **Includes automáticos** nos queries
- ✅ **Validação de integridade** referencial
- ✅ **Operações CASCADE** configuradas
- ✅ **Performance otimizada** com joins

## 🚀 API Endpoints

### **POST /api/formularios**
**Descrição:** Criar novo formulário com upload automático de PDFs para Google Drive

**Autenticação:** Cookie HTTPOnly obrigatório

**Headers:**
```http
Content-Type: application/json
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Processamento em Etapas:**
1. ✅ **Validação de Dados** - Verificação de campos obrigatórios
2. ✅ **Processamento de PDFs** - Decodificação base64 e validação
3. ✅ **Upload para Google Drive** - Organização automática em pastas
4. ✅ **Persistência SQLite** - Salvamento com associações
5. ✅ **Geração de Links** - Links públicos de visualização

**Body:**
```json
{
  "metodoPedido": "excel",
  "titulo": "Material para Prova Final",
  "dataEntrega": "2025-06-15",
  "observacoes": "Urgente - entregar até 8h",
  "formatoFinal": "A4",
  "corImpressao": "Preto e Branco",
  "impressao": "Só Frente",
  "gramatura": "75g",
  "grampos": "2",
  "nome": "Coordenação ZeroHum",
  "email": "zerohum@casadagrafica.com",
  "origemDados": "excel",
  "pdfs": [
    {
      "nome": "prova-matematica.pdf",
      "tamanho": 245760,
      "tipo": "application/pdf",
      "base64": "JVBERi0xLjQKJcfs..."
    }
  ],
  "escolasQuantidades": {
    "ITABORAI": 34,
    "QUEIMADOS": 54,
    "MARICA": 12
  }
}
```

**Response Success (201):**
```json
{
  "mensagem": "Formulário criado com sucesso",
  "formulario": {
    "id": 15,
    "titulo": "Material para Prova Final",
    "dataEntrega": "2025-06-15",
    "createdAt": "2025-05-28T14:30:00Z",
    "arquivos": [
      {
        "id": 23,
        "nome": "prova-matematica.pdf",
        "drive_view_link": "https://drive.google.com/file/d/1ABC.../view",
        "drive_download_link": "https://drive.google.com/file/d/1ABC.../download"
      }
    ],
    "unidades": [
      {
        "id": 45,
        "nome": "ITABORAI",
        "quantidade": 34
      }
    ]
  }
}
```

### **GET /api/formularios**
**Descrição:** Listar formulários do usuário autenticado

**Filtros automáticos:**
- Admin: Vê todos os formulários
- Escola: Vê apenas seus próprios formulários

**Response:**
```json
{
  "formularios": [
    {
      "id": 15,
      "titulo": "Material para Prova Final",
      "dataEntrega": "2025-06-15",
      "nome": "Coordenação ZeroHum",
      "email": "zerohum@casadagrafica.com",
      "createdAt": "2025-05-28T14:30:00Z",
      "arquivos": [
        {
          "nome": "prova-matematica.pdf",
          "tamanho": 245760,
          "drive_view_link": "https://drive.google.com/file/d/1ABC.../view"
        }
      ],
      "unidades": [
        {
          "nome": "ITABORAI",
          "quantidade": 34
        }
      ]
    }
  ]
}
```

### **GET /api/formularios/:id**
**Descrição:** Obter formulário específico

**Segurança:** Usuário só acessa seus próprios formulários (ou admin acessa todos)

## 🔄 Fluxo Completo de Processamento

### **1. Recebimento da Requisição**
```javascript
// controllers/formularioController.js
router.post('/', authMiddleware, async (req, res) => {
  try {
    // 1. Validar autenticação via cookie
    const usuario = req.usuario; // Extraído do middleware
    
    // 2. Validar dados de entrada
    const validation = validateFormularioData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        mensagem: 'Dados inválidos',
        erros: validation.errors
      });
    }
```

### **2. Processamento de PDFs**
```javascript
    // 3. Processar arquivos PDF
    const pdfPromises = req.body.pdfs.map(async (pdf) => {
      // Decodificar base64
      const buffer = Buffer.from(pdf.base64, 'base64');
      
      // Gerar nome único
      const nomeArquivo = `${Date.now()}-${pdf.nome}`;
      
      // Upload para Google Drive
      const driveResult = await googleDriveService.uploadFile({
        name: nomeArquivo,
        buffer: buffer,
        mimeType: pdf.tipo,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
      });
      
      return {
        nome: pdf.nome,
        tamanho: pdf.tamanho,
        tipo: pdf.tipo,
        drive_file_id: driveResult.id,
        drive_view_link: driveResult.webViewLink,
        drive_download_link: driveResult.webContentLink
      };
    });
    
    const arquivosPdf = await Promise.all(pdfPromises);
```

### **3. Transação no Banco de Dados**
```javascript
    // 4. Iniciar transação
    const transaction = await sequelize.transaction();
    
    try {
      // 5. Criar formulário principal
      const formulario = await Formulario.create({
        metodoPedido: req.body.metodoPedido,
        titulo: req.body.titulo,
        dataEntrega: req.body.dataEntrega,
        // ... outros campos
      }, { transaction });
      
      // 6. Criar registros de PDFs
      const arquivosCreated = await ArquivoPdf.bulkCreate(
        arquivosPdf.map(pdf => ({
          ...pdf,
          formulario_id: formulario.id
        })),
        { transaction }
      );
      
      // 7. Criar registros de unidades
      const unidades = Object.entries(req.body.escolasQuantidades).map(
        ([nome, quantidade]) => ({
          nome,
          quantidade,
          formulario_id: formulario.id
        })
      );
      
      const unidadesCreated = await Unidade.bulkCreate(
        unidades,
        { transaction }
      );
      
      // 8. Confirmar transação
      await transaction.commit();
```

### **4. Resposta Final**
```javascript
      // 9. Buscar dados completos com associações
      const formularioCompleto = await Formulario.findByPk(
        formulario.id,
        {
          include: [
            { model: ArquivoPdf, as: 'arquivos' },
            { model: Unidade, as: 'unidades' }
          ]
        }
      );
      
      // 10. Responder com sucesso
      res.status(201).json({
        mensagem: 'Formulário criado com sucesso',
        formulario: formularioCompleto
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Erro ao criar formulário:', error);
    res.status(500).json({
      mensagem: 'Erro interno do servidor'
    });
  }
});
```

## 🔧 Google Drive Integration

### **Configuração do Serviço**
```javascript
// services/googleDriveService.js
const { google } = require('googleapis');

class GoogleDriveService {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }
  
  async uploadFile({ name, buffer, mimeType, parents = [] }) {
    try {
      const response = await this.drive.files.create({
        requestBody: {
          name: name,
          parents: parents
        },
        media: {
          mimeType: mimeType,
          body: Readable.from(buffer)
        },
        fields: 'id,name,webViewLink,webContentLink,size'
      });
      
      // Definir permissões públicas para visualização
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro no upload para Google Drive:', error);
      throw new Error('Falha no upload do arquivo');
    }
  }
}
```

### **Estrutura de Pastas no Drive**
```
Casa da Gráfica/
├── Formulários/
│   ├── 2025/
│   │   ├── 05-Maio/
│   │   │   ├── ZeroHum/
│   │   │   │   ├── formulario-15-prova-matematica.pdf
│   │   │   │   └── formulario-15-lista-exercicios.pdf
│   │   │   ├── Coleguium/
│   │   │   └── Elite/
│   │   └── 06-Junho/
│   └── 2024/
```

## 🔐 Sistema de Autenticação e Segurança

### **Middleware de Autenticação**
```javascript
// auth/authMiddleware.js
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Extrair token do cookie HTTPOnly
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        mensagem: 'Token de autenticação não fornecido'
      });
    }
    
    // 2. Verificar e decodificar JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Buscar usuário no banco
    const usuario = await Usuario.findByPk(decoded.id);
    
    if (!usuario || !usuario.is_ativo) {
      return res.status(401).json({
        mensagem: 'Usuário não encontrado ou inativo'
      });
    }
    
    // 4. Adicionar usuário ao request
    req.usuario = usuario;
    next();
    
  } catch (error) {
    res.status(401).json({
      mensagem: 'Token inválido'
    });
  }
};
```

### **Controle de Acesso por Escola**
```javascript
// Filtro automático baseado no usuário
const getFormulariosFilter = (usuario) => {
  if (usuario.is_admin) {
    return {}; // Admin vê todos
  }
  
  // Escola vê apenas seus próprios formulários
  return {
    where: {
      email: usuario.email // Ou outros filtros baseados na escola
    }
  };
};
```

## 🚀 Performance e Otimizações

### **Upload Assíncrono de PDFs**
```javascript
// Processamento paralelo de múltiplos PDFs
const pdfPromises = req.body.pdfs.map(pdf => 
  googleDriveService.uploadFile(pdf)
);

const resultados = await Promise.all(pdfPromises);
```

### **Transações ACID**
```javascript
// Garantia de consistência dos dados
const transaction = await sequelize.transaction();

try {
  // Operações múltiplas
  await Formulario.create(data, { transaction });
  await ArquivoPdf.bulkCreate(pdfs, { transaction });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### **Indexação Otimizada**
```sql
-- Índices para performance
CREATE INDEX idx_formulario_email ON Formularios(email);
CREATE INDEX idx_formulario_data ON Formularios(dataEntrega);
CREATE INDEX idx_arquivopdf_formulario ON ArquivosPdf(formulario_id);
CREATE INDEX idx_unidade_formulario ON Unidades(formulario_id);
```

## 🔧 Configuração de Ambiente

### **Variáveis de Ambiente**
```env
# Database
DATABASE_URL=sqlite:./database.sqlite

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Google Drive
GOOGLE_SERVICE_ACCOUNT_KEY=./config/service-account-key.json
GOOGLE_DRIVE_FOLDER_ID=1ABC123DEF456...

# CORS
FRONTEND_URL=http://localhost:5173
```

### **Dependências Principais**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.32.1",
    "sqlite3": "^5.1.6",
    "googleapis": "^126.0.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "helmet": "^7.0.0"
  }
}
```

## 🐛 Tratamento de Erros

### **Categorias de Erro**
```javascript
// 1. Erros de Validação (400)
{
  "mensagem": "Dados inválidos",
  "erros": ["Email é obrigatório", "PDF é obrigatório"]
}

// 2. Erros de Autenticação (401)
{
  "mensagem": "Token inválido"
}

// 3. Erros de Autorização (403)
{
  "mensagem": "Sem permissão para acessar este recurso"
}

// 4. Erros de Recurso (404)
{
  "mensagem": "Formulário não encontrado"
}

// 5. Erros de Servidor (500)
{
  "mensagem": "Erro interno do servidor"
}
```

### **Logs Estruturados**
```javascript
// Sistema de logs para debugging e monitoramento
console.log(`[${new Date().toISOString()}] Novo formulário criado:`, {
  formularioId: formulario.id,
  usuario: req.usuario.email,
  arquivosCount: arquivosPdf.length,
  unidadesCount: unidades.length
});
```

---

## 📈 Escalabilidade

Este sistema foi projetado para **facilmente escalar** para múltiplas escolas:

- ✅ **Autenticação isolada** por escola
- ✅ **Estrutura de dados flexível**
- ✅ **API genérica** reutilizável
- ✅ **Google Drive organizado** por escola
- ✅ **Performance otimizada** para múltiplos usuários simultâneos

**Adicionar uma nova escola requer apenas:**
1. Criar usuário com role específica
2. Configurar redirecionamento automático
3. Sistema já funciona! 🚀
   - Nome, e-mail, título
   - Data de entrega
   - Informações sobre impressão (formato, cor, gramatura, etc.)
   - Observações adicionais

2. O sistema salva os dados na tabela Formulário

### Upload de Arquivos PDF

1. Durante o preenchimento do formulário, o usuário pode anexar um ou mais arquivos PDF
2. O sistema realiza o seguinte processo para cada arquivo:
   - Recebe o arquivo em formato base64
   - Usa a integração com Google Drive API para fazer upload
   - Gera links de visualização e download
   - Salva os metadados e links na tabela ArquivoPdf, associado ao formulário

### Associação com Unidades

1. O usuário pode associar uma ou mais unidades ao formulário
2. Para cada unidade, registra-se:
   - Nome da unidade
   - Quantidade (valor padrão = 1)
3. Estas informações são salvas na tabela Unidade, associada ao formulário

## API REST

### Endpoints para Formulários

- `GET /formularios` - Lista todos os formulários
- `GET /formularios/:id` - Obtém um formulário específico com seus arquivos e unidades
- `POST /formularios` - Cria um novo formulário
- `PUT /formularios/:id` - Atualiza um formulário existente
- `DELETE /formularios/:id` - Exclui um formulário

### Endpoints para Arquivos PDF

- `GET /formularios/:id/arquivos` - Lista os arquivos associados a um formulário
- `POST /formularios/:id/arquivos` - Adiciona um novo arquivo a um formulário
- `DELETE /formularios/:formularioId/arquivos/:arquivoId` - Remove um arquivo de um formulário

### Endpoints para Unidades

- `GET /formularios/:id/unidades` - Lista as unidades associadas a um formulário
- `POST /formularios/:id/unidades` - Gerencia as unidades de um formulário

## Autenticação e Autorização

- Sistema usa autenticação JWT
- Permissões baseadas em papéis (usuário comum vs. administrador)
- Administradores têm acesso completo
- Usuários comuns só podem ver e gerenciar seus próprios formulários

## Integração com Google Drive

A integração com o Google Drive permite:

1. Upload de arquivos PDF para armazenamento em nuvem
2. Geração de links para visualização e download dos arquivos
3. Exclusão automática dos arquivos quando o formulário ou arquivo é removido do sistema

### Configuração Necessária

Para utilizar a integração com Google Drive:

1. Configure credenciais da API Google Drive no arquivo .env:
   ```
   GOOGLE_DRIVE_CREDENTIALS_PATH=/path/to/credentials.json
   GOOGLE_DRIVE_FOLDER_ID=id_da_pasta_no_drive
   ```

2. Conceda permissões adequadas para a conta de serviço do Google

## Instruções de Instalação e Configuração

1. Clone o repositório
2. Execute `npm install` para instalar dependências
3. Configure as variáveis de ambiente no arquivo `.env`
4. Execute `npm run syncDatabase` para criar as tabelas no banco de dados
5. Inicie o servidor com `npm start`

## Notas de Desenvolvimento

- Use o middleware de autenticação para proteger rotas
- Para testes, utilize o script `testarIntegracao.js`
- Para consultar logs e monitoramento, verifique os logs do servidor
