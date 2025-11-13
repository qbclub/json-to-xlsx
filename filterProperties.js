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
        // Если указан ключ для распаковки, извлекаем вложенный объект
        let target = item;
        if (unwrapKey && item[unwrapKey]) {
          target = item[unwrapKey];
        }
        return filterProperties(target, allowedProps);
      });
    } 
    // Если это один объект, фильтруем его
    else if (typeof data === 'object' && data !== null) {
      let target = data;
      if (unwrapKey && data[unwrapKey]) {
        target = data[unwrapKey];
      }
      filtered = filterProperties(target, allowedProps);
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
// Извлекаем объект 'user' и оставляем только свойства id, name, email
// filterJsonFile('./Users0.json', './Users0-filtered.json', ['id', 'name', 'email'], 'user');
