const fs = require('fs');
const path = require('path');

// Получаем имя файла из аргументов командной строки
const fileName = process.argv[2] || 'tickets0_filter.json';
const filePath = path.join(__dirname, fileName);

// Свойства для удаления
const propsToDelete = ["body_html"];

try {
    console.log(`Обработка файла: ${fileName}`);
    
    // Читаем файл
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Парсим JSON
    let data = JSON.parse(fileContent);
    
    // Функция для удаления свойств из объекта (рекурсивная)
    function deleteProps(obj, props) {
        if (Array.isArray(obj)) {
            // Если это массив, проходим по каждому элементу
            obj.forEach(item => deleteProps(item, props));
        } else if (obj !== null && typeof obj === 'object') {
            // Если это объект, удаляем нужные свойства
            props.forEach(prop => {
                delete obj[prop];
            });
            
            // Рекурсивно обходим вложенные объекты
            Object.keys(obj).forEach(key => {
                deleteProps(obj[key], props);
            });
        }
    }
    
    // Удаляем свойства
    deleteProps(data, propsToDelete);
    
    // Записываем обратно в файл
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log('✓ Файл успешно обработан и перезаписан');
    console.log(`✓ Удалены свойства: ${propsToDelete.join(', ')}`);
    
} catch (error) {
    console.error('✗ Ошибка при обработке файла:', error.message);
    process.exit(1);
}
