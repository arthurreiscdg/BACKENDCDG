require('dotenv').config();
const { Client } = require('pg');

async function diagnosticar() {
  console.log('🔍 Diagnóstico do Banco de Dados\n');
  
  // Mostrar configurações
  console.log('📋 Configurações:');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_SSL:', process.env.DB_SSL);
  console.log('');

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Verificar schemas disponíveis
    console.log('🗂️ Schemas disponíveis:');
    const schemas = await client.query('SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;');
    schemas.rows.forEach(row => console.log('-', row.schema_name));
    console.log('');

    // Verificar schema atual
    console.log('📍 Schema atual:');
    const currentSchema = await client.query('SELECT current_schema();');
    console.log('Current schema:', currentSchema.rows[0].current_schema);
    console.log('');

    // Verificar tabelas no schema public
    console.log('📋 Tabelas no schema "public":');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    if (tables.rows.length === 0) {
      console.log('❌ Nenhuma tabela encontrada no schema "public"');
    } else {
      tables.rows.forEach(row => console.log('-', row.table_name));
    }
    console.log('');

    // Verificar se a tabela usuarios existe em algum schema
    console.log('🔎 Procurando tabela "usuarios" em todos os schemas:');
    const usuariosSearch = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'usuarios'
      ORDER BY table_schema;
    `);
    
    if (usuariosSearch.rows.length === 0) {
      console.log('❌ Tabela "usuarios" não encontrada em nenhum schema');
    } else {
      usuariosSearch.rows.forEach(row => 
        console.log(`- Encontrou: ${row.table_schema}.${row.table_name}`)
      );
    }

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    await client.end();
  }
}

diagnosticar();