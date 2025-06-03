# Solução CORS para Deploy na Vercel

## 🔴 Problema
Após o deploy do frontend na Vercel, o login falhou com erro de CORS:
```
Access to fetch at 'https://cdgproducaoback.onrender.com/api/auth/login' 
from origin 'https://casadagrafica.vercel.app' has been blocked by CORS policy
```

## ✅ Solução Aplicada

### 1. **Adicionado domínio da Vercel no CORS**
```javascript
const allowedOrigins = [
  "http://localhost:5173", // Desenvolvimento local
  "http://localhost:3000", // Desenvolvimento local alternativo
  "http://localhost:5174", // Desenvolvimento local alternativo
  "https://cdgproducao.onrender.com", // Frontend em produção no Render
  "https://casadagrafica.vercel.app", // Frontend em produção na Vercel ✅
  "https://cdgapp.com.br" // Domínio personalizado
];
```

### 2. **Adicionado logs para debug**
```javascript
console.log(`[CORS] Origin recebida: ${origin}`);
if (allowedOrigins.includes(origin)) {
  console.log(`[CORS] Origin permitida: ${origin}`);
} else {
  console.log(`[CORS] Origin não permitida: ${origin}`);
}
```

## 🚀 Próximos Passos

1. **Fazer commit e push** das alterações
2. **Aguardar deploy** no Render (automático)
3. **Testar login** na Vercel
4. **Verificar logs** no Render Dashboard se necessário

## 📋 Configurações Importantes

### Frontend (.env)
```
VITE_API_URL=https://cdgproducaoback.onrender.com/api
```

### Backend (CORS)
- ✅ Permite `https://casadagrafica.vercel.app`
- ✅ Cookies habilitados (`credentials: true`)
- ✅ Métodos necessários permitidos
- ✅ Headers corretos configurados

## 🔍 Como Verificar se Funcionou

1. **DevTools → Network**
2. **Fazer login na Vercel**
3. **Verificar requisição OPTIONS** (preflight)
4. **Verificar requisição POST** `/api/auth/login`
5. **Confirmar cookie** `auth_token` sendo definido

---
*Documentação criada em: 3 de junho de 2025*
