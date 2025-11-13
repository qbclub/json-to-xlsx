const { filterJsonFile } = require('./filterProperties');

// Пример использования:
// Читаем Tickets0.json и оставляем только нужные свойства
filterJsonFile(
  './Tickets0.json',           // входной файл
  './Tickets0-filtered.json',  // выходной файл
  ['id', 'title', 'status']    // массив нужных свойств
);
