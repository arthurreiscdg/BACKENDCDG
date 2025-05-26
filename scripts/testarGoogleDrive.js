require('dotenv').config();
const fs = require('fs');
const path = require('path');
const driveService = require('../services/googleDriveService');

async function testarDrive() {
  try {
    console.log('===== Teste do Google Drive =====');
    console.log('1. Inicializando serviço...');
    await driveService.initialize();
    console.log('✅ Serviço do Google Drive inicializado com sucesso!');

    // Criar um arquivo PDF simples de teste
    console.log('2. Criando arquivo de teste...');
    const testPdfPath = path.join(__dirname, 'test-doc.pdf');

    // Base64 de um PDF mínimo válido
    const minimalPdfBase64 = 'JVBERi0xLjUKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nCtUMFAwVzBQMAQShoYKJgrmCoYKRgpGQGYSFMdIwQzIUyjNycnXMzK31DM0VkhJVbC0NDU1NjI1NzQwMDRRSAUA7j4JwgplbmRzdHJlYW0KZW5kb2JqCjMgMCBvYmoKODEKZW5kb2JqCjEgMCBvYmoKPDwvVGFibGVzL1NVQlQvVHlwZS9DYXRhbG9nL1BhZ2VzIDQgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvS2lkc1s1IDAgUl0vQ291bnQgMSAvVHlwZS9QYWdlcz4+CmVuZG9iago1IDAgb2JqCjw8L0NvbnRlbnRzIDIgMCBSL1R5cGUvUGFnZS9SZXNvdXJjZXM8PC9Qcm9jU2V0IFsvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJXS9Gb250PDwvRjEgNiAwIFI+Pj4+L1BhcmVudCA0IDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PgplbmRvYmoKNiAwIG9iago8PC9CYXNlRm9udC9IZWx2ZXRpY2EvVHlwZS9Gb250L0VuY29kaW5nL1dpbkFuc2lFbmNvZGluZy9TdWJ0eXBlL1R5cGUxPj4KZW5kb2JqCjcgMCBvYmoKPDwvQ3JlYXRpb25EYXRlKEQ6MjAyMzA1MjYxNTAwMDBaKSAvUHJvZHVjZXIoVGVzdGUgZGUgR29vZ2xlIERyaXZlKT4+CmVuZG9iagp4cmVmCjAgOAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAyMDEgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMTgwIDAwMDAwIG4gCjAwMDAwMDAyNjQgMDAwMDAgbiAKMDAwMDAwMDMyNSAwMDAwMCBuIAowMDAwMDAwNDczIDAwMDAwIG4gCjAwMDAwMDA1NjAgMDAwMDAgbiAKdHJhaWxlcgo8PC9JbmZvIDcgMCBSL0lEIFs8MGY3MDhkZTA1YTgxMmFiYjFjNzY1OTkwYWRmNGYzYzY+PGVkNWU2ZGE5OWZlODA0ZWY1ZGVjYWVmY2MyY2NkNGYyPl0vUm9vdCAxIDAgUi9TaXplIDg+PgpzdGFydHhyZWYKNjM0CiUlRU9GCg==';

    // Converter base64 para arquivo PDF
    const pdfBuffer = Buffer.from(minimalPdfBase64, 'base64');
    fs.writeFileSync(testPdfPath, pdfBuffer);
    console.log(`✅ Arquivo de teste criado: ${testPdfPath}`);

    // Fazer upload do arquivo de teste para o Google Drive
    console.log('3. Fazendo upload do arquivo para o Google Drive...');
    const uploadResult = await driveService.uploadPdf(
      minimalPdfBase64, 
      'teste-upload.pdf', 
      'application/pdf'
    );

    console.log('✅ Upload realizado com sucesso!');
    console.log('Detalhes do arquivo:');
    console.log(`- ID: ${uploadResult.id}`);
    console.log(`- Nome: ${uploadResult.nome}`);
    console.log(`- Link de visualização: ${uploadResult.web_view_link}`);
    console.log(`- Link de download: ${uploadResult.link_download}`);

    // Limpar arquivo de teste local
    fs.unlinkSync(testPdfPath);
    console.log('✅ Arquivo de teste local removido');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error(error.stack);
  }
}

testarDrive();
