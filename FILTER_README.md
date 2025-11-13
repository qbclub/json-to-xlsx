# Фильтрация свойств JSON файлов

Модуль для фильтрации свойств первого уровня в JSON объектах и файлах.

## Установка

Модуль использует только встроенные модули Node.js (`fs`, `path`), дополнительная установка не требуется.

## API

### filterProperties(obj, allowedProps)

Фильтрует свойства первого уровня объекта, оставляя только указанные.

**Параметры:**
- `obj` (Object) - Исходный объект для фильтрации
- `allowedProps` (Array<string>) - Массив имен свойств, которые нужно оставить

**Возвращает:** Object - Новый объект только с указанными свойствами

**Пример:**
```javascript
const { filterProperties } = require('./filterProperties');

const user = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret123',
  role: 'admin'
};

const filtered = filterProperties(user, ['id', 'name', 'email']);
console.log(filtered);
// Результат: { id: 1, name: 'John', email: 'john@example.com' }
```

### filterJsonFile(inputPath, outputPath, allowedProps)

Читает JSON файл, фильтрует свойства объектов и сохраняет результат в новый файл.

**Параметры:**
- `inputPath` (string) - Путь к входному JSON файлу
- `outputPath` (string) - Путь к выходному JSON файлу
- `allowedProps` (Array<string>) - Массив имен свойств, которые нужно оставить

**Возвращает:** void (выбрасывает исключение в случае ошибки)

**Пример для массива объектов:**
```javascript
const { filterJsonFile } = require('./filterProperties');

// Входной файл users.json:
// [
//   { id: 1, name: 'John', email: 'john@example.com', password: 'secret' },
//   { id: 2, name: 'Jane', email: 'jane@example.com', password: 'secret2' }
// ]

filterJsonFile(
  './users.json',
  './users-filtered.json',
  ['id', 'name', 'email']
);

// Выходной файл users-filtered.json:
// [
//   { id: 1, name: 'John', email: 'john@example.com' },
//   { id: 2, name: 'Jane', email: 'jane@example.com' }
// ]
```

**Пример для одного объекта:**
```javascript
const { filterJsonFile } = require('./filterProperties');

// Входной файл config.json:
// {
//   id: 1,
//   name: 'App Config',
//   apiKey: 'secret-key',
//   database: 'mongodb://...',
//   port: 3000
// }

filterJsonFile(
  './config.json',
  './config-public.json',
  ['id', 'name', 'port']
);

// Выходной файл config-public.json:
// {
//   id: 1,
//   name: 'App Config',
//   port: 3000
// }
```

## Использование из командной строки

Создайте скрипт для фильтрации:

```javascript
// filter.js
const { filterJsonFile } = require('./filterProperties');

const inputFile = process.argv[2];
const outputFile = process.argv[3];
const props = process.argv.slice(4);

if (!inputFile || !outputFile || props.length === 0) {
  console.error('Использование: node filter.js <input.json> <output.json> <prop1> <prop2> ...');
  process.exit(1);
}

filterJsonFile(inputFile, outputFile, props);
```

Запуск:
```bash
node filter.js users.json users-filtered.json id name email
```

## Особенности

- Фильтруются только свойства **первого уровня** объектов
- Вложенные объекты и массивы сохраняются полностью, если их родительское свойство указано в `allowedProps`
- Если свойство отсутствует в объекте, оно просто не будет добавлено в результат
- Метод работает как с массивами объектов, так и с одиночными объектами
- Выходной JSON файл форматируется с отступами (2 пробела) для удобства чтения

## Обработка ошибок

Метод `filterJsonFile` выбрасывает исключения в следующих случаях:
- Входной файл не найден или не может быть прочитан
- Некорректный JSON формат
- JSON содержит примитивное значение (не объект и не массив)

```javascript
try {
  filterJsonFile('./data.json', './filtered.json', ['id', 'name']);
} catch (error) {
  console.error('Ошибка:', error.message);
}
```
