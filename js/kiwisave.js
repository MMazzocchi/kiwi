// Process a file upload
function handleUploadEvent(e) {
    var file = e.target.files[0];
    var reader = new FileReader();

    //Whe nthe file is done reading, pass the result to loadSaveFile
    reader.onload = function(e) {
        loadSaveFile(e.target.result);
    };
    reader.readAsText(file);
}

//Generate a JSON save file
function createSaveFile() {
    var creation = {};

    //Save background
    if(background) {
        creation.background = background.compress();
    }

    //Save ONLY visible layers
    creation.layerList = [];

    for(var i=0; i<layerList.length; i++) {
        var oldId = layerList[i];
        var obj = objectList[oldId];
        creation.layerList.push(obj.compress());
    }
    var output = JSON.stringify(creation);
    return output;
}

//Recreate the drawing from this JSON string
function loadSaveFile(input) {
    clearAll();
    var creation = JSON.parse(input);
    console.log(creation);
    if(creation.background) {
        background = creation.background;
    }

    //For each layer, recreate the object
    for(var i=0; i<creation.layerList.length; i++) {
        var obj = creation.layerList[i];
        switch(obj.objType) {
            case 'line':
                startLine(obj);
                break;
            case 'shape':
                startShape(obj);
                break;
            case 'fill':
                createFill(obj);
                break;
            case 'stamp':
                createBMP(obj);
                createStamp(obj);
                break;
            case 'textbox':
                createTextBalloon(obj);
                break;
        }
    }    
}
