function getByPath(obj, path) {
    return path.split('.').reduce((acc, k) => {
        if (acc == null) return undefined;
        return acc[k];
    }, obj);
}

function filterByPaths(data, paths, keyMode = 'full') {
    return data.map(item => {
        const out = {};
        paths.forEach(p => {
            let key = keyMode === 'last' ? p.split('.').pop() : p;
            if (keyMode === 'last' && Object.prototype.hasOwnProperty.call(out, key)) {
                key = p;
            }
            out[key] = getByPath(item, p);
        });
        return out;
    });
}

// МАССИВ ТРЕБУЕМЫХ СВОЙСТВ (пример; измените при необходимости)
const REQUIRED_PATHS = [

    // Для Users
    // "user.id",
    // "user.name",
    // "user.email",
    // "user.created_at",
    // "user.customer_id",
    // "user.job_title",
    // "user.phone",
    // "user.mobile",
    // "user.time_zone",
    // "user.language",
    // "user.address",
    // "user.helpdesk_agent",
    // "user.company_id",

    // Для компаний
    // "company.id",
    // "company.name",
    // "company.created_at",
    // "company.sla_policy_id",
    // "company.domains",
    // "company.custom_field.cf_rand942431",
    // "company.custom_field.cf_rand938686",
    // "company.custom_field.cf_rand43658",
    // "company.custom_field.cf_2",


    // Для Tickets
    
    "helpdesk_ticket.id",
    "helpdesk_ticket.description",
    "helpdesk_ticket.requester_id",
    "helpdesk_ticket.responder_id",
    "helpdesk_ticket.created_at",
    "helpdesk_ticket.updated_at",
    "helpdesk_ticket.subject",
    "helpdesk_ticket.display_id",
    "helpdesk_ticket.owner_id",
    "helpdesk_ticket.priority",
    "helpdesk_ticket.cc_emails[0]",
    "helpdesk_ticket.ticket_type",
    "helpdesk_ticket.status_name",
    "helpdesk_ticket.requester_status_name",
    "helpdesk_ticket.priority_name",
    "helpdesk_ticket.notes",
];

if (process.argv[2]) {
    const [, , inputFile, outputFile] = process.argv;
    if (!inputFile || !outputFile) {
        console.error('Использование: node filterByPaths.js input.json output.json');
        process.exit(1);
    }
    const fs = require('fs');
    let data;
    try {
        data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    } catch (e) {
        console.error('Ошибка чтения:', e.message);
        process.exit(1);
    }
    const result = filterByPaths(data, REQUIRED_PATHS, 'full');
    try {
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
    } catch (e) {
        console.error('Ошибка записи:', e.message);
        process.exit(1);
    }
    console.log('OK:', outputFile);
}

// Пример прямого вызова в коде:
// const flattened = filterByPaths(dataArray, REQUIRED_PATHS);

