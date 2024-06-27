const brain = require('brain.js');
const { loadData } = require('./dataHandler');  // Destructure loadData from the imported module

// Load JSON data
const data = loadData('./data.json');

// Function to prepare training data
function prepareTrainingData(data) {
    const trainingData = [];

    data.plantArray.forEach(rgb => {
        trainingData.push({
            input: { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 },
            output: [1] // Plant label
        });
    });

    data.nonPlantArray.forEach(rgb => {
        trainingData.push({
            input: { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 },
            output: [0] // Non-plant label
        });
    });

    return trainingData;
}

// Prepare training data
const trainingData = prepareTrainingData(data);

// Create a neural network
const net = new brain.NeuralNetwork({
    hiddenLayers: [3],
    activation: 'sigmoid',
    learningRate: 0.1
});

// Train the neural network
net.train(trainingData, {
    log: true,
    logPeriod: 100,
    errorThresh: 0.005,
    iterations: 20000
});

console.log('Training complete');

// Export the trained neural network
module.exports = net;
