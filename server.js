const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(express.static('public'));

// Endpoint to save data
app.post('/save', (req, res) => {
    const data = req.body;
    const filePath = path.join(__dirname, 'data.json');
    
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error('Error writing to file', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).send('Data saved successfully');
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});