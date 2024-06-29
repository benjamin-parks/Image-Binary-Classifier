# Image-Binary-Classifier
Tool that will allow users to create arrays of RGB values that train a Brain.js model to return binaries of the image over a confidence threshold. 


## Install Requirements
Node/Bun/Yarn
patience and hope


## Install Steps
in a terminal at the root of the project, type npm i, bun i, or yarn install


## Install troubleshooting
If you run into errors with the packages installing, try this command: 
`cd node_modules/gl && node-gyp rebuild`
If successful, retry the dependency install step you used in the section above. This solved my node-gyp issues and I hope it helps. 


## How to use
- npm start
- navigate to http://localhost:3001/
- For consistency's sake, always click the Clear Annotations before starting. This will force clear the data.json used in the neural network.
- Click Choose File and select an image you'd like to train on.
- Draw on areas of interest with the white marker (activated by default on launch OR by swapping to it by pressing 1 or the big green "Want" button at the top).
- Draw on areas you want to exclude with red marker (activate by hitting the "Don't Want" button or by pressing 2 on your keyboard).
- When you're happy, click save annotations.
- At this point you can load another image OR train your neural network if you're happy with what you've got by clicking the "Train" button.
- If you want to inference just the image you annotated, you can click the "Generate Binary" button.
- If you want to batch inference with the trained network, you can click the "choose files" button to upload a folder of JPG, JPEG, or PNG photos. After that you click the "Batch Inference" button and you are good to go!
