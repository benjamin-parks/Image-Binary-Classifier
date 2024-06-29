const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const brain = require('brain.js');
const { createCanvas, loadImage } = require('canvas');
const { loadData } = require('./assets/js/dataHandler');

const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'public/uploads') });
const outputDir = path.join(__dirname, 'public/exports');
const fsPromises = fs.promises;

const app = express();
const port = 3001;

app.use(bodyParser.json({ limit: '40mb' }));
app.use(bodyParser.urlencoded({ limit: '40mb', extended: true }));
app.use(express.static('public'));

// Load JSON data
let data;
try {
    data = loadData('./data.json');
} catch (err) {
    console.error('Error loading data:', err);
    data = { plantArray: [], nonPlantArray: [] }; // Default empty data
}

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true }); // recursive true to create parent directories if not exist
}

// Function to prepare training data
function prepareTrainingData(data) {
    const trainingData = [];

    if (data.plantArray && Array.isArray(data.plantArray)) {
        data.plantArray.forEach(rgb => {
            trainingData.push({
                input: { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 },
                output: [1] // Plant label
            });
        });
    }

    if (data.nonPlantArray && Array.isArray(data.nonPlantArray)) {
        data.nonPlantArray.forEach(rgb => {
            trainingData.push({
                input: { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 },
                output: [0] // Non-plant label
            });
        });
    }

    return trainingData;
}

// Create a neural network
const net = new brain.NeuralNetwork({
    hiddenLayers: [3],
    activation: 'sigmoid',
    learningRate: 0.1
});

app.post('/clear', (req, res) => {
    const data = {
        plantArray: [],
        nonPlantArray: []
    };
    const filePath = path.join(__dirname, 'data.json');

    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error('Error clearing the file', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).send('Annotations cleared successfully');
        }
    });
});


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
    const trainingData = prepareTrainingData(data); // Ensure data is correctly fetched and formatted

    if (!Array.isArray(trainingData) || trainingData.length === 0) {
        res.status(400).json({ message: 'No training data available' });
        return;
    }

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
    const { imageFileName } = req.body;
    const imagePath = path.join(__dirname, 'public', imageFileName);

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
                
                // Adjusted logic for binary image generation
                const binaryValue = output[0] > 0.5 ? 255 : 0;

                binaryImageData.data[index] = binaryValue;
                binaryImageData.data[index + 1] = binaryValue;
                binaryImageData.data[index + 2] = binaryValue;
                binaryImageData.data[index + 3] = 255; // Fully opaque
            }
        }

        ctx.putImageData(binaryImageData, 0, 0);
        const outputFilePath = path.join(__dirname, 'public', 'exports', `${path.parse(imageFileName).name}_binary_image.png`);
        const out = fs.createWriteStream(outputFilePath);
        const stream = canvas.createPNGStream();
        
        // Handle stream errors
        stream.on('error', (err) => {
            console.error('Error in PNG stream:', err);
            res.status(500).send('Internal Server Error');
        });

        // Pipe the PNG stream to the output file
        stream.pipe(out);

        // Handle finish event
        out.on('finish', () => {
            console.log('Binary image saved to exports folder');
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

// Endpoint to save uploaded image
app.post('/save-image', (req, res) => {
    const imageData = req.body.imageData; // Base64 encoded image data
    const imageFileName = req.body.imageFileName; // Original filename of the image

    if (!imageData || !imageFileName) {
        res.status(400).json({ message: 'Missing image data or filename' });
        return;
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate a unique filename for the saved image in the uploads directory
    const parsedFileName = path.parse(imageFileName);
    const fileName = `${parsedFileName.name}${parsedFileName.ext}`;
    const filePath = path.join(uploadsDir, fileName);

    // Decode imageData and save to the uploads directory
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) {
            console.error('Error saving image:', err);
            res.status(500).send('Internal Server Error');
        } else {
            const publicPath = `/uploads/${fileName}`; // Path relative to 'public'
            res.status(200).json({ message: 'Image saved successfully', path: publicPath });
        }
    });
});



app.post('/batch-inference', upload.array('images'), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).send('No files uploaded.');
        }

        const results = [];
        for (const file of files) {
            const imagePath = path.join(__dirname, 'public/uploads', file.filename);
            const imageName = path.basename(file.originalname, path.extname(file.originalname));
            const outputDir = path.join(__dirname, 'public/exports');
            const outputFilePath = path.join(outputDir, `${imageName}_binary_image.png`);

            // Ensure the output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true }); // Create the directory if it doesn't exist
            }

            // Load the image and process for binary generation
            await loadImage(imagePath).then((image) => {
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

                        // Adjusted logic for binary image generation
                        const binaryValue = output[0] > 0.5 ? 255 : 0;

                        binaryImageData.data[index] = binaryValue;
                        binaryImageData.data[index + 1] = binaryValue;
                        binaryImageData.data[index + 2] = binaryValue;
                        binaryImageData.data[index + 3] = 255; // Fully opaque
                    }
                }

                ctx.putImageData(binaryImageData, 0, 0);
                const out = fs.createWriteStream(outputFilePath);
                const stream = canvas.createPNGStream();
                stream.pipe(out);
                results.push(outputFilePath);

                // Cleanup the uploaded file
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error('Failed to delete uploaded file', err);
                    }
                });
            });
        }

        res.status(200).json({ message: 'Batch inference completed successfully', paths: results });
    } catch (err) {
        console.error('Error during batch inference:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
