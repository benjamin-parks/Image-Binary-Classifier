const { loadData } = require('./dataHandler');
const fs = require('fs');

// Load JSON data
const rawData = fs.readFileSync('./data.json');
const data = JSON.parse(rawData);

function prepareTrainingData(data) {
    const trainingData = [];

    data.plantArray.forEach(rgb => {
        trainingData.push({
            input: { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 },
            output: [1]
        });
    });

    data.nonPlantArray.forEach(rgb => {
        trainingData.push({
            input: { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 },
            output: [0]
        });
    });

    return trainingData;
}

const trainingData = prepareTrainingData(data);

module.exports = trainingData;
