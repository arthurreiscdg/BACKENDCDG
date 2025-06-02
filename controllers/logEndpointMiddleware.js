// Middleware para logar o endpoint acessado em cada requisição
module.exports = (req, res, next) => {
  const usuario = req.usuario ? ` | usuario: ${req.usuario.email || req.usuario.id}` : '';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}${usuario}`);
  next();
};
