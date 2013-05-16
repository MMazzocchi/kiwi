var canvas;
var objectList = {};
var layerList = []; 
var actionList = [];
var idPtr = 0;
var actionPtr = 0;  

function refreshCanvas() {

    //Set up the canvas so that it fills the screen
    var ctx = canvas.getContext('2d');
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    // Set the fill color and fill the background
    ctx.fillStyle="#FFFFFF";
    ctx.fillRect(0,0,500,500);

    // For each id in layerList, call this function:
    $.each(layerList, function(i, id) {
        // Get the object for this layer
        var dot = objectList[id];

        // Draw the object
        obj.draw(ctx);
    });
}

// Assign a new ID to this object
function assignID(obj) {
    objectList[idPtr] = obj;
    obj.id = idPtr;
    layerList[layerList.length] = idPtr;
    idPtr++;
}

// Add this action to the action stack
function addAction(act) {
    actionList.splice(actionPtr, actionList.length - actionPtr);
    actionList[actionPtr] = act;
    actionPtr++;
}

// Not written yet; these wil be called when the mouse is clicked, moved, and released.
function pointerDown(e) {}
function pointerMove(e) {}
function pointerUp(e) {}

// Undos an action.
function undo() {

    // Make sure we have actions to undo.
    if(actionPtr > 0) {

        // The last action will be the one directly below actionPtr. There may be some above, but we 
        // don't care about those.
        var last = actionList[actionPtr-1];

        // Call the undo function for the last action.
        last.undo();

        // Take actionPtr down one (since we just undid an action) and redraw.
        actionPtr--;
        refreshCanvas();
    }
}

// Redoes an action
function redo() {
    if(actionPtr < actionList.length) {
        var next = actionList[actionPtr];
        next.redo();
        actionPtr++;
        refreshCanvas();
    }
}

// Initialization
$().ready( function() {

    // Get our canvas.
    canvas = document.getElementById('drawing_canvas');

    // Bind the mousedown, mousemove actions.
    $('#drawing_canvas').mousedown( pointerDown );
    $('#drawing_canvas').mousemove( pointerMove );
    $('#drawing_canvas').mouseup( pointerUp );

    // Bind the undo function to the undo button.
    $('#undo').click( undo );

    // Bind the redo function to the redo button.
    $('#redo').click( redo );

    // Redraw.
    refreshCanvas();
});

