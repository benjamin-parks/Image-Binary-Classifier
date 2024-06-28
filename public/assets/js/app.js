document.getElementById('imageLoader').addEventListener('change', handleImage, false);
document.getElementById('plantButton').addEventListener('click', () => setDrawingMode('plant'));
document.getElementById('nonPlantButton').addEventListener('click', () => setDrawingMode('non-plant'));
document.getElementById('saveButton').addEventListener('click', saveAnnotations);
document.getElementById('trainButton').addEventListener('click', trainNeuralNetwork);
document.getElementById('saveBinaryButton').addEventListener('click', saveBinaryImage);

const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let drawing = false;
let drawingMode = 'plant';
let plantArray = [];
let nonPlantArray = [];
let originalImageData;
let imageFileName = '';

function handleImage(e) {
    const reader = new FileReader();
    const file = e.target.files[0];

    reader.onload = function(event) {
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Set imageFileName to the uploaded file name
            imageFileName = file.name;

            // Convert canvas image to base64 data
            const imageData = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');

            // Send imageData and imageFileName to the server to save
            fetch('/save-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ imageData, imageFileName })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to save image');
                }
            })
            .then(data => {
                // Update image source in UI with public URL
                const imagePath = data.path; // This should be the public URL returned by the server
                img.src = imagePath;
                alert('Image saved and loaded successfully from public folder!');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to save or load image.');
            });
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
}



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

function trainNeuralNetwork() {
    fetch('/train')
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

function saveBinaryImage() {
    fetch('/generate-binary', {
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
