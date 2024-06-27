const fs = require('fs');

function loadData(filePath) {
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData);
}

module.exports = { loadData };
