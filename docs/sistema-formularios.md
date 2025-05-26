# Sistema de Gerenciamento de Formulários

## Visão Geral

Este sistema permite o gerenciamento de formulários digitais com upload de arquivos PDF e associação de unidades. O sistema usa Node.js com Express no backend e Sequelize como ORM para interação com o banco de dados.

## Estrutura do Banco de Dados

### Tabelas Principais

1. **Formulário**
   - Armazena as informações do formulário
   - Campos incluem: nome, email, título, data de entrega, observações, formato, tipo de impressão, gramatura, etc.
   - Relacionado com as tabelas ArquivoPdf e Unidade

2. **ArquivoPdf**
   - Armazena metadados de arquivos PDF
   - Os arquivos são armazenados no Google Drive
   - Campos incluem: nome, links para visualização e download
   - Relacionado com a tabela Formulário

3. **Unidade**
   - Armazena unidades associadas ao formulário
   - Campos incluem: nome e quantidade
   - Relacionado com a tabela Formulário

## Fluxo do Sistema

### Cadastro de Formulário

1. O usuário preenche um formulário com dados como:
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
