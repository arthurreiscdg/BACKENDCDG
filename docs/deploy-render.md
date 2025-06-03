# Deploy no Render - Sistema CDG

Este documento fornece instruções para realizar o deploy da aplicação no Render.

## URL do Backend
- Backend: https://cdgproducaoback.onrender.com

## Como Configurar o Deploy

1. **Acesse o Dashboard do Render**
   - Crie uma conta ou faça login em https://dashboard.render.com/

2. **Crie um Novo Web Service**
   - Clique em "New +" e selecione "Web Service"
   - Conecte seu repositório Git
   - Selecione o repositório do backend CDG

3. **Configure o Serviço**
   - **Nome**: cdgproducaoback
   - **Região**: Oregon (US West) ou sua preferência
   - **Branch**: main (ou sua branch principal)
   - **Ambiente**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

4. **Configure as Variáveis de Ambiente**
   - Copie as variáveis do arquivo `env.render.example`
   - Adicione todas as variáveis no painel do Render em "Environment"
   - Substitua os valores sensíveis (chaves, tokens) pelos valores reais

5. **Banco de Dados**
   - O SQLite funcionará direto pelo `/tmp/database.sqlite`
   - **IMPORTANTE**: Este método perderá dados em deploys subsequentes
   - Para persistência, considere migrar para:
     - PostgreSQL (disponível gratuitamente no Render)
     - Outro serviço de banco de dados

## Verificações Importantes

1. **CORS**:
   - As URLs do frontend estão configuradas no middleware CORS em `app.js`
   - URLs permitidas: localhost:5173, cdgproducao.onrender.com e cdgapp.com.br

2. **Porta**:
   - O Render define automaticamente a porta na variável `PORT`
   - O código foi ajustado para usar `process.env.PORT || process.env.API_PORT`

3. **Timeout**:
   - Configurado para 5 minutos (300000ms) para arquivos grandes
   - Se encontrar problemas com uploads, verifique as políticas do Render

## Comandos Úteis

```bash
# Para sincronizar o banco de dados manualmente (via dashboard do Render)
npm run db:sync

# Para criar usuário administrador (via dashboard do Render)
npm run create:user
```

## Problemas Comuns

1. **Erro "H10 - App Crashed"**
   - Verifique os logs no Render
   - Certifique-se de que todas as variáveis de ambiente estão configuradas

2. **CORS Bloqueando Requisições**
   - Verifique se a URL do frontend está na lista de `allowedOrigins` em `app.js`

3. **Problemas de Persistência de Dados**
   - O SQLite no Render tem armazenamento efêmero
   - Considere migrar para PostgreSQL se precisar de persistência
