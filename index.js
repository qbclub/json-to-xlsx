#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Размер файла в байтах, выше которого используем потоковую обработку
const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB
const BATCH_SIZE = 1000; // Количество записей для обработки за один раз

function flatten(obj, prefix = '', res = {}) {
  // Если объект содержит единственное свойство и оно является объектом,
  // извлекаем вложенный объект (универсальная обёртка)
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const keys = Object.keys(obj);
    if (keys.length === 1) {
      const singleKey = keys[0];
      const value = obj[singleKey];
      // Если единственное свойство - это объект (не массив), извлекаем его
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        obj = value;
      }
    }
  }
  
  // Не разворачиваем вложенные объекты, просто копируем свойства первого уровня
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    Object.entries(obj).forEach(([k, v]) => {
      // Если значение - объект или массив, преобразуем в JSON строку
      if (typeof v === 'object' && v !== null) {
        res[k] = JSON.stringify(v);
      } else {
        res[k] = v;
      }
    });
  } else {
    // primitive
    if (prefix.endsWith('.')) prefix = prefix.slice(0, -1);
    res[prefix] = obj;
  }
  return res;
}

function isLargeFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size > LARGE_FILE_THRESHOLD;
  } catch (e) {
    return false;
  }
}

function toSheetFromArray(arr) {
  const flat = arr.map(item => flatten(item));
  const headers = Array.from(new Set(flat.flatMap(o => Object.keys(o))));
  const data = [headers];
  flat.forEach(o => {
    const row = headers.map(h => o[h] !== undefined ? o[h] : '');
    data.push(row);
  });
  return xlsx.utils.aoa_to_sheet(data);
}

async function processLargeFile(inputPath, outputPath, batchSize = BATCH_SIZE) {
  console.log(`Обработка большого файла с чанковым чтением (размер пакета: ${batchSize})...`);
  
  // Проверяем, что файл действительно содержит JSON массив
  const sample = fs.readFileSync(inputPath, { encoding: 'utf8', start: 0, end: 1000 });
  if (!sample.trim().startsWith('[')) {
    throw new Error('Потоковая обработка поддерживается только для JSON массивов');
  }
  
  const fileContent = fs.readFileSync(inputPath, 'utf8');
  let data;
  
  try {
    data = JSON.parse(fileContent);
  } catch (e) {
    throw new Error('Неверный JSON: ' + e.message);
  }
  
  if (!Array.isArray(data)) {
    throw new Error('Потоковая обработка поддерживается только для JSON массивов');
  }
  
  console.log(`Найдено ${data.length} записей, обрабатываем пакетами по ${batchSize}...`);
  
  let allHeaders = new Set();
  let wb = xlsx.utils.book_new();
  let ws = null;
  let totalProcessed = 0;
  
  // Первый проход - собираем все заголовки
  console.log('Анализ структуры данных...');
  data.forEach(item => {
    const flattened = flatten(item);
    Object.keys(flattened).forEach(key => allHeaders.add(key));
  });
  
  const headerArray = Array.from(allHeaders);
  console.log(`Найдено ${headerArray.length} уникальных полей`);
  
  // Обрабатываем данные пакетами
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const isFirstBatch = i === 0;
    
    const flat = batch.map(item => flatten(item));
    
    if (isFirstBatch) {
      // Создаем новый лист с заголовками
      const sheetData = [headerArray];
      flat.forEach(o => {
        const row = headerArray.map(h => o[h] !== undefined ? o[h] : '');
        sheetData.push(row);
      });
      ws = xlsx.utils.aoa_to_sheet(sheetData);
      xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    } else {
      // Добавляем данные к существующему листу
      const newData = flat.map(o => headerArray.map(h => o[h] !== undefined ? o[h] : ''));
      
      if (ws && ws['!ref']) {
        const range = xlsx.utils.decode_range(ws['!ref']);
        const startRow = range.e.r + 1;
        
        newData.forEach((row, idx) => {
          row.forEach((cell, colIdx) => {
            const cellAddr = xlsx.utils.encode_cell({ r: startRow + idx, c: colIdx });
            ws[cellAddr] = { v: cell, t: typeof cell === 'number' ? 'n' : 's' };
          });
        });
        
        ws['!ref'] = xlsx.utils.encode_range({
          s: { c: 0, r: 0 },
          e: { c: headerArray.length - 1, r: startRow + newData.length - 1 }
        });
      }
    }
    
    totalProcessed += batch.length;
    
    if (totalProcessed % (batchSize * 5) === 0) {
      console.log(`Обработано ${totalProcessed}/${data.length} записей (${Math.round(totalProcessed/data.length*100)}%)...`);
    }
    
    // Принудительная сборка мусора для больших файлов
    if (totalProcessed % (batchSize * 20) === 0 && global.gc) {
      global.gc();
    }
  }
  
  console.log(`Создание Excel файла с ${totalProcessed} записями...`);
  xlsx.writeFile(wb, outputPath);
  console.log(`Файл ${outputPath} успешно создан`);
}

async function convert(inputPath, outputPath, options = {}) {
  const { forceStream = false, batchSize = BATCH_SIZE } = options;
  
  // Проверяем размер файла и выбираем метод обработки
  if (forceStream || isLargeFile(inputPath)) {
    const reason = forceStream ? 'принудительно включена потоковая обработка' : 
                  `файл ${path.basename(inputPath)} слишком большой (>${LARGE_FILE_THRESHOLD / (1024*1024)}MB)`;
    console.log(`${reason}, используем потоковую обработку`);
    return processLargeFile(inputPath, outputPath, batchSize);
  }

  console.log('Обработка файла стандартным методом...');
  const raw = fs.readFileSync(inputPath, 'utf8');
  let data;
  try { 
    data = JSON.parse(raw); 
  } catch (e) { 
    console.error('Неверный JSON:', e.message); 
    process.exit(2); 
  }
  
  const wb = xlsx.utils.book_new();

  if (Array.isArray(data)) {
    const ws = toSheetFromArray(data);
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
  } else if (typeof data === 'object' && data !== null) {
    const allArrays = Object.values(data).every(v => Array.isArray(v));
    if (allArrays) {
      for (const [key, val] of Object.entries(data)) {
        const ws = toSheetFromArray(val);
        // sheet names max length 31
        const name = key.substring(0, 31) || 'Sheet';
        xlsx.utils.book_append_sheet(wb, ws, name);
      }
    } else {
      const row = flatten(data);
      const headers = Object.keys(row);
      const values = headers.map(h => row[h]);
      const ws = xlsx.utils.aoa_to_sheet([headers, values]);
      xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    }
  } else {
    console.error('Неподдерживаемый тип корневого элемента JSON');
    process.exit(3);
  }
  
  xlsx.writeFile(wb, outputPath);
  console.log(`Файл ${outputPath} создан`);
}

async function main() {
  const args = process.argv.slice(2);
  
  // Обработка флагов
  let forceStream = false;
  let customBatchSize = BATCH_SIZE;
  let showHelp = false;
  
  const filteredArgs = args.filter(arg => {
    if (arg === '--help' || arg === '-h') {
      showHelp = true;
      return false;
    }
    if (arg === '--stream') {
      forceStream = true;
      return false;
    }
    if (arg.startsWith('--batch-size=')) {
      customBatchSize = parseInt(arg.split('=')[1]) || BATCH_SIZE;
      return false;
    }
    return true;
  });
  
  if (showHelp || filteredArgs.length < 1) {
    console.error('JSON to XLSX Converter');
    console.error('');
    console.error('Использование: node index.js [опции] input.json [output.xlsx]');
    console.error('');
    console.error('Опции:');
    console.error('  --help, -h          Показать эту справку');
    console.error('  --stream            Принудительно использовать потоковую обработку');
    console.error('  --batch-size=N      Размер пакета для потоковой обработки (по умолчанию: 1000)');
    console.error('');
    console.error('Примеры:');
    console.error('  node index.js data.json result.xlsx');
    console.error('  node index.js --stream large-file.json output.xlsx');
    console.error('  node index.js --batch-size=500 data.json result.xlsx');
    console.error('');
    console.error('Автоматическая обработка больших файлов включается для файлов >50MB');
    process.exit(showHelp ? 0 : 1);
  }
  
  const input = path.resolve(filteredArgs[0]);
  const output = path.resolve(filteredArgs[1] || 'out.xlsx');
  
  // Проверяем существование входного файла
  if (!fs.existsSync(input)) {
    console.error(`Ошибка: файл ${input} не найден`);
    process.exit(1);
  }
  
  try {
    const startTime = Date.now();
    await convert(input, output, { forceStream, batchSize: customBatchSize });
    const endTime = Date.now();
    console.log(`Обработка завершена за ${(endTime - startTime) / 1000} секунд`);
  } catch (error) {
    console.error('Ошибка при конвертации:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
