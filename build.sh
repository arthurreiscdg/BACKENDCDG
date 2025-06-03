#!/bin/bash

# Script de build para o Render
echo "Iniciando processo de build..."

# Instalar dependências
echo "Instalando dependências..."
npm install

# Sincronizar banco de dados
echo "Sincronizando banco de dados..."
npm run db:sync

echo "Build concluído com sucesso!"
