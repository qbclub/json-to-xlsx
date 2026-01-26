const fs = require('fs');
const path = require('path');


function filterProperties(obj, allowedProps) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  if (!Array.isArray(allowedProps) || allowedProps.length === 0) {
    return obj;
  }

  const filtered = {};
  allowedProps.forEach(prop => {
    if (prop in obj) {
      filtered[prop] = obj[prop];
    }
  });

  return filtered;
}

function filterJsonFile(inputPath, outputPath, allowedProps, unwrapKey = null) {
  try {
    // Читаем входной файл
    const raw = fs.readFileSync(inputPath, 'utf8');
    const data = JSON.parse(raw);

    let filtered;

    // Если это массив объектов, фильтруем каждый объект
    if (Array.isArray(data)) {
      filtered = data.map(item => {
        // Если явно указан ключ для распаковки и он присутствует у элемента — извлекаем вложенный объект
        if (
          typeof unwrapKey === 'string' &&
          unwrapKey.length > 0 &&
          item && typeof item === 'object' &&
          unwrapKey in item
        ) {
          return filterProperties(item[unwrapKey], allowedProps);
        }

        // Если ключ распаковки не указан или пустой, сохраняем обёртку,
        // но фильтруем вложенный объект, если элемент — обёртка вокруг одного объекта
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const keys = Object.keys(item);
          if (
            keys.length === 1 &&
            item[keys[0]] && typeof item[keys[0]] === 'object' && !Array.isArray(item[keys[0]])
          ) {
            const k = keys[0];
            return { [k]: filterProperties(item[k], allowedProps) };
          }
        }

        // Иначе фильтруем сам элемент верхнего уровня
        return filterProperties(item, allowedProps);
      });
    }
    // Если это один объект, фильтруем его
    else if (typeof data === 'object' && data !== null) {
      if (
        typeof unwrapKey === 'string' &&
        unwrapKey.length > 0 &&
        unwrapKey in data
      ) {
        filtered = filterProperties(data[unwrapKey], allowedProps);
      } else {
        // Пытаемся сохранить обёртку, если это объект-обёртка с единственным ключом
        const keys = Object.keys(data);
        if (
          keys.length === 1 &&
          data[keys[0]] && typeof data[keys[0]] === 'object' && !Array.isArray(data[keys[0]])
        ) {
          const k = keys[0];
          filtered = { [k]: filterProperties(data[k], allowedProps) };
        } else {
          filtered = filterProperties(data, allowedProps);
        }
      }
    }
    else {
      throw new Error('JSON должен содержать объект или массив объектов');
    }

    // Сохраняем результат в новый файл
    fs.writeFileSync(outputPath, JSON.stringify(filtered, null, 2), 'utf8');
    console.log(`Файл успешно создан: ${outputPath}`);
    console.log(`Оставлены свойства: ${allowedProps.join(', ')}`);

  } catch (error) {
    console.error('Ошибка при обработке файла:', error.message);
    throw error;
  }
}

// Пример использования:
// При пустом unwrapKey объект не извлекается из свойства (например, 'user'),
// сохраняется обёртка и фильтруется вложенный объект по указанным полям
filterJsonFile('./Companies0.json', './companies0-filtered.json', ["company.id",
  "company.name",
  "company.created_at",
  "company.sla_policy_id",
  "company.domains",
  "company.custom_field.cf_rand942431",
  "company.custom_field.cf_rand938686",
  "company.custom_field.cf_rand43658",
  "company.custom_field.cf_2"], '');


