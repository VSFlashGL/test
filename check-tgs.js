#!/usr/bin/env node

/**
 * Скрипт для проверки TGS файлов
 * Показывает информацию о файле и проверяет его валидность
 * 
 * Использование:
 *   node check-tgs.js file.tgs
 *   node check-tgs.js (проверяет все .tgs в текущей папке)
 */

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const args = process.argv.slice(2);

if (args.length === 1) {
  // Проверяем один файл
  checkTGS(args[0]);
} else if (args.length === 0) {
  // Проверяем все TGS в папке
  console.log('🔍 Поиск TGS файлов...\n');
  
  const files = fs.readdirSync('.').filter(file => file.endsWith('.tgs'));
  
  if (files.length === 0) {
    console.log('❌ TGS файлы не найдены');
    process.exit(1);
  }
  
  console.log(`📦 Найдено ${files.length} TGS файл(ов)\n`);
  
  files.forEach(file => {
    checkTGS(file);
    console.log('---\n');
  });
} else {
  console.log('Использование:');
  console.log('  node check-tgs.js file.tgs');
  console.log('  или');
  console.log('  node check-tgs.js (проверяет все TGS в папке)');
  process.exit(1);
}

function checkTGS(filePath) {
  try {
    console.log(`📄 Файл: ${path.basename(filePath)}`);
    
    // Читаем файл
    const compressed = fs.readFileSync(filePath);
    const size = compressed.length;
    
    console.log(`📦 Размер: ${formatBytes(size)}`);
    
    if (size > 64 * 1024) {
      console.log('⚠️  ВНИМАНИЕ: Размер больше 64KB (лимит Telegram)');
    }
    
    // Распаковываем
    const decompressed = zlib.inflateSync(compressed).toString();
    console.log(`📂 Распакованный размер: ${formatBytes(decompressed.length)}`);
    
    // Парсим JSON
    const data = JSON.parse(decompressed);
    
    // Информация о анимации
    console.log(`🎬 Информация о анимации:`);
    console.log(`   - FPS: ${data.fr || 'не указан'}`);
    console.log(`   - Ширина: ${data.w || 'не указана'}`);
    console.log(`   - Высота: ${data.h || 'не указана'}`);
    console.log(`   - Длительность: ${((data.op - data.ip) / data.fr).toFixed(2)}с`);
    console.log(`   - Слоёв: ${data.layers?.length || 0}`);
    console.log(`   - Версия: ${data.v || 'не указана'}`);
    
    console.log('✅ Файл валидный!');
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
