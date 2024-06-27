const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const brain = require('brain.js');
const { createCanvas, loadImage } = require('canvas');
const { loadData } = require('./assets/js/dataHandler');
const trainingData = require('./assets/js/prepareTrainingData');

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(express.static('public'));

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

// Endpoint to save data
app.post('/save', (req, res) => {
    const data = req.body;
    const filePath = path.join(__dirname, 'data.json');
    
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error('Error writing to file', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).send('Annotations saved successfully');
        }
    });
});

// Endpoint to train the neural network
app.get('/train', (req, res) => {
    net.train(trainingData, {
        log: true,
        logPeriod: 100,
        errorThresh: 0.005,
        iterations: 20000
    });

    console.log('Training complete');
    res.status(200).json({ message: 'Neural network training complete' });
});

// Endpoint to generate and save binary image
app.post('/generate-binary', (req, res) => {
    const imagePath = path.join(__dirname, 'public/corn_test.jpeg'); // Replace with the path to the original image
    loadImage(imagePath).then((image) => {
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const binaryImageData = ctx.createImageData(canvas.width, canvas.height);

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
                const r = imageData.data[index];
                const g = imageData.data[index + 1];
                const b = imageData.data[index + 2];
                const input = { r: r / 255, g: g / 255, b: b / 255 };
                const output = net.run(input);
                const binaryValue = output[0] > 0.5 ? 255 : 0;

                binaryImageData.data[index] = binaryValue;
                binaryImageData.data[index + 1] = binaryValue;
                binaryImageData.data[index + 2] = binaryValue;
                binaryImageData.data[index + 3] = 255; // Fully opaque
            }
        }

        ctx.putImageData(binaryImageData, 0, 0);
        const outputFilePath = path.join(__dirname, 'binary_image.png');
        const out = fs.createWriteStream(outputFilePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        out.on('finish', () => {
            console.log('Binary image saved');
            res.status(200).json({ message: 'Binary image generation successful', path: outputFilePath });
        });
    }).catch((err) => {
        console.error('Error loading image:', err);
        res.status(500).send('Internal Server Error');
    });
});

// Example usage of the trained neural network
app.get('/predict', (req, res) => {
    const exampleRGB = { r: 0.5, g: 0.3, b: 0.8 }; // Example RGB values
    const prediction = net.run(exampleRGB);
    res.json(prediction);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
