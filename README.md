# json-to-xlsx

Простой CLI для конвертации JSON в Excel (xlsx) с поддержкой больших файлов.

## Установка

```bash
npm install
```

## Использование

### Базовое использование

```bash
# конвертирует sample.json -> out.xlsx
node index.js sample.json out.xlsx

# или, если указать только входной файл — создаст out.xlsx
node index.js data.json
```

### Поиск проблемных записей

```bash
# найти записи с превышением лимита Excel (32767 символов)
node find-problems.js tickets_filter.json
```

### Дополнительные опции

```bash
# Показать справку
node index.js --help

# Принудительно использовать потоковую обработку
node index.js --stream large-file.json output.xlsx

# Установить размер пакета для потоковой обработки
node index.js --batch-size=500 data.json result.xlsx

# Найти записи с полем notes, превышающим лимит Excel (32767 символов)
node find-problems.js tickets_filter.json

# Показать справку по скрипту поиска
node find-problems.js --help
```

### Удаление свойств из JSON файлов

```bash
# Удалить указанные свойства из JSON файла (по умолчанию body_html)
node removeProperties.js tickets0_filter.json

# Или указать другой файл
node removeProperties.js users_filter.json
```

Скрипт `removeProperties.js` удаляет проблемные свойства из JSON файлов перед конвертацией в Excel. По умолчанию удаляет свойство `body_html`, которое часто содержит HTML-разметку и превышает лимиты Excel.

## Обработка больших файлов

Программа автоматически определяет большие файлы (>50MB) и переключается на потоковую обработку для экономии памяти. Для больших файлов:

- ✅ Используется минимальное количество оперативной памяти
- ✅ Показывается прогресс обработки
- ✅ Поддерживаются файлы любого размера
- ✅ Настраиваемый размер пакета обработки

## Поддержка форматов JSON

- **Массив объектов** → одна таблица (flatten вложенных объектов, ключи через точку)
- **Объект с массивами** → каждая пара ключ/массив станет отдельным листом
- **Одиночный объект** → одна строка с заголовками (flatten)

## Примечания

- Имена листов обрезаются до 31 символа (ограничение XLSX)
- Пустые поля заполняются пустой строкой
- Большие файлы обрабатываются пакетами по 1000 записей (настраивается)

## Примеры

```bash
# Обычная конвертация
node index.js sample.json out.xlsx

# Большой файл с потоковой обработкой
node index.js --stream huge-data.json result.xlsx

# Настройка размера пакета для оптимизации производительности
node index.js --batch-size=2000 data.json output.xlsx

# Найти проблемные записи перед конвертацией
node find-problems.js tickets_filter.json

# Удалить проблемные свойства из файла
node removeProperties.js tickets_filter.json

# Полный workflow: найти проблемы -> удалить свойства -> конвертировать
node find-problems.js tickets_filter.json && node removeProperties.js tickets_filter.json && node index.js tickets_filter.json output.xlsx
```

