# Sistema de Autenticação com Cookies - Backend

## 📋 Visão Geral

Este documento descreve a implementação do sistema de autenticação usando cookies HTTPOnly seguros no backend da Casa da Gráfica.

## 🔒 Arquitetura de Segurança

### Fluxo de Autenticação
```
1. Cliente → POST /api/auth/login (credentials: 'include')
2. Backend → Valida credenciais → Cria JWT → Define cookie HTTPOnly
3. Cliente → Requisições subsequentes (cookie enviado automaticamente)
4. Backend → Lê token do cookie → Valida JWT → Autoriza acesso
```

## 🛠️ Componentes Implementados

### 1. **app.js** - Configuração Principal

#### Middleware de Cookies
```javascript
// Middleware para processar cookies
app.use(cookieParser());
```

#### Configuração CORS para Cookies
```javascript
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173"); // URL específica
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true"); // ⚠️ IMPORTANTE: permite cookies
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});
```

**🔑 Pontos Importantes:**
- `Access-Control-Allow-Credentials: true` - Permite envio de cookies
- URL específica no CORS (não `*`) - Requerido para credentials
- Suporte a requisições OPTIONS para preflight

### 2. **authController.js** - Controlador de Autenticação

#### Login com Cookie
```javascript
login: async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validação e autenticação...
    const usuario = await buscarUsuarioPorUsernameOuEmail(username);
    const senhaCorreta = await verificarSenha(password, usuario.senha_hash);
    
    if (senhaCorreta) {
      const token = jwtService.gerarToken(usuario);
      
      // ⚠️ DEFINE COOKIE SEGURO
      res.cookie('auth_token', token, {
        httpOnly: true,                    // Não acessível via JavaScript (XSS protection)
        secure: process.env.NODE_ENV === 'production', // HTTPS em produção
        sameSite: 'lax',                  // Proteção CSRF
        maxAge: 24 * 60 * 60 * 1000      // 24 horas
      });
      
      res.json({
        token,
        usuario: formatarDadosUsuario(usuario),
        success: true
      });
    }
  } catch (error) {
    // Tratamento de erro...
  }
}
```

#### Logout com Limpeza de Cookie
```javascript
logout: async (req, res) => {
  try {
    // ⚠️ LIMPA COOKIE DE FORMA SEGURA
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({
      success: true,
      message: "Logout realizado com sucesso"
    });
  } catch (error) {
    // Tratamento de erro...
  }
}
```

### 3. **authMiddleware.js** - Middleware de Autenticação

#### Extração de Token (Header ou Cookie)
```javascript
function extrairToken(req) {
  // 1º Prioridade: Header Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  
  // 2º Prioridade: Cookie auth_token
  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }
  
  return null;
}
```

**🔑 Estratégia de Fallback:**
1. Primeiro tenta ler do header `Authorization: Bearer <token>`
2. Se não encontrar, lê do cookie `auth_token`
3. Compatibilidade com ambos os métodos

### 4. **routes/auth.js** - Rotas de Autenticação

```javascript
function definirRotasPublicas(router) {
  router.post("/login", authController.login);
  router.post("/registro", authController.registro);
}

function definirRotasProtegidas(router) {
  router.get("/verificar", authMiddleware(), authController.verificarToken);
  router.post("/logout", authMiddleware(), authController.logout); // ⚠️ NOVA ROTA
}
```

## 🔐 Configurações de Segurança

### Parâmetros do Cookie
| Parâmetro | Valor | Função |
|-----------|-------|---------|
| `httpOnly` | `true` | Impede acesso via JavaScript (XSS) |
| `secure` | `true` (produção) | Apenas HTTPS em produção |
| `sameSite` | `'lax'` | Proteção contra CSRF |
| `maxAge` | `24h` | Tempo de vida do cookie |

### Variáveis de Ambiente
```env
NODE_ENV=development  # ou 'production'
API_PORT=3000
JWT_SECRET=your_jwt_secret_here
```

## 🧪 Testando o Sistema

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt
```

### 2. Verificação (com cookie)
```bash
curl -X GET http://localhost:3000/api/auth/verificar \
  -b cookies.txt
```

### 3. Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

## 🚨 Considerações de Segurança

### ✅ Implementado
- **HTTPOnly cookies** - Proteção contra XSS
- **SameSite protection** - Proteção contra CSRF
- **Secure flag** - HTTPS em produção
- **CORS específico** - URL do frontend definida
- **Token no cookie** - Não exposto no localStorage

### ⚠️ Recomendações Adicionais
- Implementar rate limiting no login
- Logs de auditoria para tentativas de login
- Rotação de chaves JWT
- Blacklist de tokens revogados
- Monitoramento de sessões ativas

## 🔄 Migração de localStorage para Cookies

### Antes (Inseguro)
```javascript
// ❌ Token exposto no localStorage
localStorage.setItem('token', jwt);
```

### Depois (Seguro)
```javascript
// ✅ Token em cookie HTTPOnly
res.cookie('auth_token', jwt, { httpOnly: true });
```

## 📦 Dependências

```json
{
  "cookie-parser": "^1.4.6",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0"
}
```

## 🔧 Solução de Problemas

### Cookie não está sendo criado
- Verificar se `cookieParser()` está configurado
- Confirmar CORS com `credentials: true`
- Checar URL específica no CORS (não `*`)

### Token não está sendo lido
- Verificar se middleware lê cookies
- Confirmar nome do cookie (`auth_token`)
- Testar com header Authorization como fallback

### Erro de CORS
- URL do frontend deve estar exata no CORS
- `Access-Control-Allow-Credentials` deve ser `true`
- Requisições devem usar `credentials: 'include'`

## 📝 Próximos Passos

1. **Implementar refresh tokens** para renovação automática
2. **Adicionar rate limiting** nas rotas de autenticação
3. **Logs de auditoria** para segurança
4. **Sessões concorrentes** - limitar por usuário
5. **Blacklist de tokens** para logout forçado

---

*Documentação criada em: 28 de maio de 2025*  
*Versão do sistema: 1.0*
