#!/usr/bin/env node

/**
 * Скрипт для конвертации Lottie JSON в TGS формат
 * 
 * Использование:
 *   node convert-to-tgs.js input.json output.tgs
 * 
 * Или для всех JSON файлов в папке:
 *   node convert-to-tgs.js
 */

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// Проверяем аргументы командной строки
const args = process.argv.slice(2);

if (args.length === 2) {
  // Конвертируем один файл
  const inputFile = args[0];
  const outputFile = args[1];
  
  convertFile(inputFile, outputFile);
} else if (args.length === 0) {
  // Конвертируем все JSON в текущей папке
  console.log('🔍 Поиск JSON файлов в текущей папке...\n');
  
  const files = fs.readdirSync('.').filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('❌ JSON файлы не найдены');
    process.exit(1);
  }
  
  console.log(`📦 Найдено ${files.length} JSON файл(ов)\n`);
  
  files.forEach(file => {
    const outputFile = file.replace('.json', '.tgs');
    convertFile(file, outputFile);
  });
  
  console.log('\n✅ Конвертация завершена!');
} else {
  console.log('Использование:');
  console.log('  node convert-to-tgs.js input.json output.tgs');
  console.log('  или');
  console.log('  node convert-to-tgs.js (конвертирует все JSON в папке)');
  process.exit(1);
}

function convertFile(inputPath, outputPath) {
  try {
    // Читаем JSON файл
    const lottieJson = fs.readFileSync(inputPath, 'utf8');
    
    // Проверяем, что это валидный JSON
    try {
      JSON.parse(lottieJson);
    } catch (e) {
      console.log(`❌ ${inputPath} - невалидный JSON`);
      return;
    }
    
    // Сжимаем через gzip
    const compressed = zlib.gzipSync(lottieJson);
    
    // Сохраняем как TGS
    fs.writeFileSync(outputPath, compressed);
    
    // Статистика
    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = fs.statSync(outputPath).size;
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
    console.log(`   Размер: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (сжато на ${ratio}%)\n`);
    
  } catch (error) {
    console.log(`❌ Ошибка при конвертации ${inputPath}:`, error.message);
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
