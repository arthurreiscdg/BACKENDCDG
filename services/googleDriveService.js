const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Serviço para interação com o Google Drive
 * Gerencia o upload de arquivos e retorna os links de acesso
 */
class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.initialized = false;
  }  /**
   * Inicializa a conexão com a API do Google Drive
   * @throws {Error} Se houver erro na inicialização
   */
  async initialize() {
    try {
      console.log('Inicializando serviço do Google Drive com credenciais do .env');
      
      // Obter credenciais do arquivo .env
      const credentials = process.env.CREDENTIALS;
      
      if (!credentials) {
        throw new Error('Credenciais do Google Drive não encontradas no .env');
      }
      
      let parsedCredentials;
      try {
        // Analisar as credenciais como objeto JSON
        parsedCredentials = typeof credentials === 'string' ? JSON.parse(credentials) : credentials;
      } catch (parseError) {
        throw new Error(`Erro ao analisar credenciais: ${parseError.message}`);
      }
      
      console.log('Credenciais do Google Drive carregadas com sucesso');
      
      // Criar cliente de autenticação com as credenciais
      const auth = new google.auth.JWT(
        parsedCredentials.client_email,
        null,
        parsedCredentials.private_key,
        ['https://www.googleapis.com/auth/drive']
      );

      // Criar instância da API Drive
      this.drive = google.drive({
        version: 'v3',
        auth
      });

      this.initialized = true;
      console.log('Serviço do Google Drive inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar serviço do Google Drive:', error);
      throw new Error(`Falha ao inicializar serviço do Google Drive: ${error.message}`);
    }
  }

  /**
   * Verifica se o serviço está inicializado e inicializa se necessário
   * @private
   */
  async _ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Faz upload de um arquivo PDF para o Google Drive
   * @param {String} base64Data - Conteúdo do arquivo em base64
   * @param {String} fileName - Nome do arquivo
   * @param {String} mimeType - Tipo MIME do arquivo (padrão: application/pdf)
   * @returns {Object} Objeto com links e dados do arquivo
   */
  async uploadPdf(base64Data, fileName, mimeType = 'application/pdf') {
    await this._ensureInitialized();

    try {
      // Decodificar base64 para buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Criar arquivo temporário
      const tempFilePath = path.join(os.tmpdir(), fileName);
      fs.writeFileSync(tempFilePath, buffer);

      // Configuração do upload
      const fileMetadata = {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] // ID da pasta onde os arquivos serão armazenados
      };

      const media = {
        mimeType,
        body: fs.createReadStream(tempFilePath)
      };

      // Realizar upload
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink'
      });

      // Configurar permissão para acesso público
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // Limpar arquivo temporário
      fs.unlinkSync(tempFilePath);

      // Preparar objeto de retorno com todos os links necessários
      return {
        id: response.data.id,
        nome: response.data.name,
        arquivo: `https://drive.google.com/file/d/${response.data.id}`,
        link_download: response.data.webContentLink,
        web_view_link: response.data.webViewLink,
        json_link: `https://www.googleapis.com/drive/v3/files/${response.data.id}?alt=media`,
      };
    } catch (error) {
      console.error('Erro ao fazer upload para o Google Drive:', error);
      throw new Error('Falha ao fazer upload do arquivo PDF');
    }
  }

  /**
   * Exclui um arquivo do Google Drive
   * @param {String} fileId - ID do arquivo no Google Drive
   * @returns {Boolean} True se o arquivo foi excluído com sucesso
   */
  async deleteFile(fileId) {
    await this._ensureInitialized();

    try {
      await this.drive.files.delete({
        fileId
      });
      return true;
    } catch (error) {
      console.error('Erro ao excluir arquivo do Google Drive:', error);
      throw new Error('Falha ao excluir arquivo do Google Drive');
    }
  }
}

// Criar instância do serviço
const driveService = new GoogleDriveService();

module.exports = driveService;