#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Скрипт для поиска проблемных записей в JSON файлах
 * Находит записи, где поле helpdesk_ticket.notes превышает лимит Excel (32767 символов)
 */

function findProblematicRecords(filePath) {
  console.log(`Анализ файла: ${filePath}`);
  console.log('=' .repeat(50));

  try {
    // Читаем и парсим JSON файл
    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    if (!Array.isArray(data)) {
      console.error('Ошибка: файл должен содержать массив объектов');
      process.exit(1);
    }

    console.log(`Всего записей: ${data.length}`);
    console.log('');

    const problematicRecords = [];
    let totalProblems = 0;

    // Проходим по всем записям
    data.forEach((item, index) => {
      const recordNumber = index + 1;
      const ticketId = item['helpdesk_ticket.id'];

      // Проверяем поля, которые могут превысить лимит
      const FIELDS_TO_CHECK = [
        'helpdesk_ticket.notes',
        'helpdesk_ticket.description'
      ];

      FIELDS_TO_CHECK.forEach(field => {
        const val = item[field];
        if (val != null) {
          const length = typeof val === 'string'
            ? val.length
            : JSON.stringify(val).length;
          if (length > 32767) {
            problematicRecords.push({
              recordNumber,
              ticketId,
              field,
              length,
              excess: length - 32767
            });
            totalProblems++;
          }
        }
      });
    });

    if (problematicRecords.length === 0) {
      console.log('✅ Проблемных записей не найдено!');
      return;
    }

    console.log(`❌ Найдено проблемных записей: ${totalProblems}`);
    console.log('');
    console.log('Проблемные записи (notes > 32767 символов):');
    console.log('');

    problematicRecords.forEach(record => {
      console.log(`Строка ${record.recordNumber}:`);
      console.log(`  ID: ${record.ticketId}`);
      console.log(`  Поле: ${record.field}`);
      console.log(`  Длина: ${record.length.toLocaleString()} символов`);
      console.log(`  Превышение: ${record.excess.toLocaleString()} символов`);
      console.log('');
    });

    // Выводим сводку
    console.log('=' .repeat(50));
    console.log('Сводка:');
    console.log(`- Всего записей: ${data.length}`);
    console.log(`- Проблемных записей: ${totalProblems}`);
    console.log(`- Процент проблемных: ${((totalProblems / data.length) * 100).toFixed(2)}%`);

    if (totalProblems > 0) {
      console.log('');
      console.log('Рекомендации:');
      console.log('- Удалите или сократите содержимое поля helpdesk_ticket.notes');
      console.log('- Или разделите данные на несколько файлов');
      console.log('- Или используйте другой формат экспорта');
    }

  } catch (error) {
    console.error('Ошибка при обработке файла:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log('Поиск проблемных записей в JSON файлах');
  console.log('');
  console.log('Использование:');
  console.log('  node find-problems.js <путь_к_json_файлу>');
  console.log('');
  console.log('Примеры:');
  console.log('  node find-problems.js tickets0_filter.json');
  console.log('  node find-problems.js data/tickets.json');
  console.log('');
  console.log('Описание:');
  console.log('  Ищет записи, где поле helpdesk_ticket.notes превышает');
  console.log('  лимит Excel в 32767 символов на ячейку');
}

// Основная функция
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const filePath = path.resolve(args[0]);

  // Проверяем существование файла
  if (!fs.existsSync(filePath)) {
    console.error(`Ошибка: файл ${filePath} не найден`);
    process.exit(1);
  }

  findProblematicRecords(filePath);
}

if (require.main === module) {
  main();
}