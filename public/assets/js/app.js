document.getElementById('imageLoader').addEventListener('change', handleImage, false);
document.getElementById('plantButton').addEventListener('click', () => setDrawingMode('plant'));
document.getElementById('nonPlantButton').addEventListener('click', () => setDrawingMode('non-plant'));

document.getElementById('clearButton').addEventListener('click', clearData);
document.getElementById('saveButton').addEventListener('click', saveAnnotations);
document.getElementById('trainButton').addEventListener('click', trainNeuralNetwork);
document.getElementById('saveBinaryButton').addEventListener('click', saveBinaryImage);
document.getElementById('batchInferenceButton').addEventListener('click', handleBatchInference);

const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let drawing = false;
let drawingMode = 'plant';
let plantArray = [];
let nonPlantArray = [];
let originalImageData;
let imageFileName = '';




async function handleImage(e) {
    const file = e.target.files[0];
    
    // Create a promise to handle FileReader
    const readFile = file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };
    
    try {
        const fileContent = await readFile(file);
        img.src = fileContent;
        
        img.onload = async function() {
            // Remove the onload event listener once it's triggered
            img.onload = null;
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Set imageFileName to the uploaded file name
            imageFileName = file.name; // Update global variable

            // Convert canvas image to base64 data
            const imageData = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
            
            try {
                const response = await fetch('/save-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ imageData, imageFileName })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to save image');
                }
                
                const data = await response.json();
                // Update image source in UI with public URL
                const imagePath = data.path; // This should be the public URL returned by the server
                img.src = imagePath;

                // Show alert only once after image is successfully saved and loaded
                window.alert('Image Loaded!');
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to save or load image.');
            }
        };
    } catch (error) {
        console.error('Error reading file:', error);
        alert('Failed to read the file.');
    }
}



async function handleBatchInference() {
    const files = document.getElementById('batchImageLoader').files;
    if (files.length === 0) {
        alert('Please select a folder of images.');
        return;
    }

    const formData = new FormData();
    for (const file of files) {
        formData.append('images', file);
    }

    try {
        const response = await fetch('/batch-inference', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Batch inference failed');
        }

        const data = await response.json();
        console.log(data.message);
        alert('Batch inference complete!');
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to perform batch inference. Have you trained the model?');
    }
}


document.addEventListener('keyup', function(event) {
    if (event.key === '1') {
        setDrawingMode('plant');
    } else if (event.key === '2') {
        setDrawingMode('non-plant');
    } else if (event.key === 's' || event.key === 'S') {
        saveAnnotations();
    } else if (event.key === 't' || event.key === "T") {
        trainNeuralNetwork();
    } else if (event.key === 'g' || event.key === 'G') {
        saveBinaryImage();
    } else if (event.key === 'i' || event.key === "I") {
        handleBatchInference();
    } else if (event.key === 'n') {
        clearData();
    }
});

function setDrawingMode(mode) {
    drawingMode = mode;
}


canvas.addEventListener('mousedown', function(e) {
    drawing = true;
    draw(e);
});

canvas.addEventListener('mouseup', function(e) {
    drawing = false;
    ctx.beginPath();
});

canvas.addEventListener('mousemove', draw);

function draw(e) {
    if (!drawing) {
        console.clear();
        console.log('Plant Array:', JSON.stringify(plantArray, null, 2));
        console.log('Non-Plant Array:', JSON.stringify(nonPlantArray, null, 2));
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
    const r = originalImageData.data[index];
    const g = originalImageData.data[index + 1];
    const b = originalImageData.data[index + 2];
    const rgb = { r, g, b };

    if (drawingMode === 'plant') {
        plantArray.push(rgb);
        ctx.strokeStyle = '#FFFFFF';
    } else {
        nonPlantArray.push(rgb);
        ctx.strokeStyle = '#FF0000';
    }

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function saveAnnotations() {
    const data = {
        plantArray,
        nonPlantArray
    };

    fetch('/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            alert('Annotations saved successfully!');
        } else {
            alert('Error saving annotations.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving annotations.');
    });
}

async function trainNeuralNetwork() {
    await fetch('/train')
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to train neural network');
        }
    })
    .then(data => {
        console.log(data.message);
        alert('Neural network training complete!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to train neural network');
    });
}

async function saveBinaryImage() {
    await fetch('/generate-binary', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageFileName }) // Send the file name to the server
    })
    .then(response => {
        if (response.ok) {
            alert('Binary image generated and saved successfully!');
        } else {
            alert('Error generating or saving binary image.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error generating or saving binary image.');
    });
}


function clearData() {
    plantArray = [];
    nonPlantArray = [];

    const data = {
        plantArray,
        nonPlantArray
    };

    fetch('/clear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            alert('Annotation data cleared!');
        } else {
            alert('Error clearing annotations.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error clearing annotations.');
    });
}