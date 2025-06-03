# Solução para Problema de Autenticação CORS - Frontend Local + Backend Render

## Problema Identificado

Quando o backend está no Render e o frontend está rodando localmente, os cookies HTTPOnly não estão sendo persistidos devido a configurações inadequadas para requisições cross-origin.

## Mudanças Realizadas

### 1. **Correção na Configuração de Cookies (authController.js)**

```javascript
// Configuração ajustada para funcionar com CORS
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000
};

// Em produção (Render), usar sameSite: 'none' para CORS
if (process.env.NODE_ENV === 'production') {
  cookieOptions.secure = true; // Obrigatório com sameSite: 'none'
  cookieOptions.sameSite = 'none';
}
```

**Por que isso resolve:**
- `sameSite: 'none'` permite que cookies sejam enviados em requisições cross-site
- `secure: true` é obrigatório quando `sameSite: 'none'` (requer HTTPS)

### 2. **Correção da URL da API no Frontend (.env)**

```env
# Antes (INCORRETO)
VITE_API_URL=https://cdgproducaoback.onrender.com/

# Depois (CORRETO)
VITE_API_URL=https://cdgproducaoback.onrender.com/api
```

### 3. **Arquivo de Ambiente para Produção (.env.production)**

Criado arquivo `.env.production` com `NODE_ENV=production` para garantir que as configurações corretas sejam aplicadas no Render.

## Como Testar

### 1. **Deploy das Mudanças**
1. Faça commit das mudanças
2. Faça push para o repositório
3. O Render vai fazer redeploy automaticamente

### 2. **Teste no Frontend Local**
```javascript
// No DevTools do navegador, verificar:
// 1. Network tab - verificar se requisições incluem cookies
// 2. Application tab > Cookies - verificar se cookie 'auth_token' está presente
// 3. Console - não deve haver erros de CORS
```

### 3. **Verificação de Funcionamento**
- Login deve funcionar normalmente
- Cookie deve ser criado e persistido
- Requisições subsequentes devem incluir o cookie automaticamente
- Logout deve limpar o cookie corretamente

## Configurações Importantes no Render

Certifique-se de que no Render você tem:

1. **Variável de Ambiente**
   ```
   NODE_ENV=production
   ```

2. **Build Command**
   ```
   npm install && npm run db:sync
   ```

3. **Start Command**
   ```
   npm start
   ```

## Troubleshooting

### Se ainda não funcionar:

1. **Verificar logs do Render**
   - Acessar o painel do Render
   - Verificar se `NODE_ENV=production` está sendo aplicado
   - Verificar se não há erros no startup

2. **Testar endpoints diretamente**
   ```bash
   curl -X POST https://cdgproducaoback.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"seu_usuario","password":"sua_senha"}' \
     -v
   ```
   - Verificar se o header `Set-Cookie` está presente na resposta

3. **Verificar CORS**
   - Confirmar que `http://localhost:5173` está nos `allowedOrigins`
   - Verificar se `Access-Control-Allow-Credentials: true` está presente

## Referências

- [MDN - SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [CORS com Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#requests_with_credentials)
- [Render Deploy Guide](https://render.com/docs/deploy-node-express-app)
