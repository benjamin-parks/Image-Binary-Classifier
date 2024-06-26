document.getElementById('imageLoader').addEventListener('change', handleImage, false);
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
let img = new Image();
let drawing = false;
let rgbArray = [];
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
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Get the original pixel data from the stored image data
    const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
    const r = originalImageData.data[index];
    const g = originalImageData.data[index + 1];
    const b = originalImageData.data[index + 2];
    const rgb = { r, g, b };
    rgbArray.push(rgb);

    // Log the entire rgbArray for clarity
    console.log(JSON.stringify(rgbArray, null, 2));

    // Draw the red line
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#FF0000';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}
