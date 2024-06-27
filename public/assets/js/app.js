document.getElementById('imageLoader').addEventListener('change', handleImage, false);
document.getElementById('plantButton').addEventListener('click', () => setDrawingMode('plant'));
document.getElementById('nonPlantButton').addEventListener('click', () => setDrawingMode('non-plant'));
document.getElementById('saveButton').addEventListener('click', saveData);

const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let drawing = false;
let drawingMode = 'plant';
let plantArray = [];
let nonPlantArray = [];
let originalImageData;

function handleImage(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            // Store the original image data
            originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
}

function setDrawingMode(mode) {
    drawingMode = mode;
}

canvas.addEventListener('mousedown', function(e) {
    drawing = true;
    draw(e);  // Start drawing immediately
});

canvas.addEventListener('mouseup', function(e) {
    drawing = false;
    ctx.beginPath(); // Reset the path to prevent connecting lines
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

    // Get the original pixel data from the stored image data
    const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
    const r = originalImageData.data[index];
    const g = originalImageData.data[index + 1];
    const b = originalImageData.data[index + 2];
    const rgb = { r, g, b };

    // Store the RGB values in the appropriate array based on the drawing mode
    if (drawingMode === 'plant') {
        plantArray.push(rgb);
        ctx.strokeStyle = '#FFFFFF';  // White for plant
    } else {
        nonPlantArray.push(rgb);
        ctx.strokeStyle = '#FF0000';  // Red for non-plant
    }

    // Draw the line
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function saveData() {
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
            alert('Data saved successfully!');
        } else {
            alert('Error saving data.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving data.');
    });
}
