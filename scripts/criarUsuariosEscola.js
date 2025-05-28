const bcrypt = require('bcrypt');
const { Usuario } = require('../models');
const sequelize = require('../config/database');

/**
 * Script para criar usuários de escolas baseados no users.json do frontend
 */

const usuariosEscola = [
  {
    nome: 'Administrador',
    username: 'admin',
    email: 'admin@casadagrafica.com',
    password: 'admin123',
    is_admin: true,
    roles: ['admin'],
    is_ativo: true
  },
  {
    nome: 'Usuário ZeroHum',
    username: 'zerohum',
    email: 'zerohum@casadagrafica.com',
    password: 'zerohum123',
    is_admin: false,
    roles: ['zerohum'],
    is_ativo: true
  },
  {
    nome: 'Usuário Coleguium',
    username: 'coleguium',
    email: 'coleguium@casadagrafica.com',
    password: 'coleguium123',
    is_admin: false,
    roles: ['coleguium'],
    is_ativo: true
  },
  {
    nome: 'Usuário Elite',
    username: 'elite',
    email: 'elite@casadagrafica.com',
    password: 'elite123',
    is_admin: false,
    roles: ['elite'],
    is_ativo: true
  },
  {
    nome: 'Usuário Pensi',
    username: 'pensi',
    email: 'pensi@casadagrafica.com',
    password: 'pensi123',
    is_admin: false,
    roles: ['pensi'],
    is_ativo: true
  }
];

async function criarUsuarios() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso');

    console.log('🔄 Sincronizando modelos...');
    await sequelize.sync({ alter: true });

    for (const userData of usuariosEscola) {
      try {
        // Verifica se o usuário já existe
        const usuarioExistente = await Usuario.findOne({
          where: {
            [require('sequelize').Op.or]: [
              { username: userData.username },
              { email: userData.email }
            ]
          }
        });

        if (usuarioExistente) {
          console.log(`⚠️  Usuário ${userData.username} já existe, pulando...`);
          continue;
        }

        // Cria o hash da senha
        const senha_hash = await bcrypt.hash(userData.password, 10);

        // Cria o usuário
        const novoUsuario = await Usuario.create({
          nome: userData.nome,
          username: userData.username,
          email: userData.email,
          senha_hash: senha_hash,
          is_admin: userData.is_admin,
          roles: userData.roles,
          is_ativo: userData.is_ativo
        });

        console.log(`✅ Usuário ${userData.username} criado com sucesso (ID: ${novoUsuario.id})`);
      } catch (error) {
        console.error(`❌ Erro ao criar usuário ${userData.username}:`, error.message);
      }
    }

    console.log('\n🎉 Script executado com sucesso!');
    console.log('\n📋 Usuários disponíveis para login:');
    usuariosEscola.forEach(user => {
      console.log(`   - Username: ${user.username} | Senha: ${user.password} | Role: ${user.roles.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Executa o script
criarUsuarios();
