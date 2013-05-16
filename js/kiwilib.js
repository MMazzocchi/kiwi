var canvas;           // This will hold our canvas
var objectList = {};  // This is a hash that maps an object's id to the object itself
var layerList = [];   // This is the list of layers. Each element is an object id.
var actionList = [];  // This is the list of actions. Each element is an "event", which gets defined later on.
var idPtr = 0;        // This is the next available id.
var actionPtr = 0;    // This is the action stack pointer; anything below this is real, and anything above it has been undo'd.
var mode = "line";
var isDragging = false;

// Refresh the canvas; draw everything
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
        // Get the dot for this layer
        var dObj = objectList[id];

        // Draw the dot
        dObj.draw(ctx);
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

function pointerDown(e) {
	isDragging = true;
    switch(mode) {
        case "dot":
            createDot(e);
            break;
        case "line":
            startLine(e);
            break;
    }
}

function pointerMove(e) {
  if (isDragging){
    switch(mode) {
        case "dot":
            createDot(e);
            break;
        case "line":
            continueLine(e);
            break;
    }
  }
}

function pointerEnd(e) {
    isDragging = false;
}

function startLine(e) {
    var line = {
        pts: [[e.pageX, e.pageY]]
    };
    line.draw = function(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.pts[0][0], this.pts[0][1]);
        var last = this.pts[0];
        for(var i=1; i<this.pts.length; i++) {
            ctx.lineTo(this.pts[i][0], this.pts[i][1]);
			ctx.lineJoin = 'round';
			ctx.lineCap = 'round';
			ctx.lineWidth = 10;
        };
        ctx.stroke();
    };
    assignID(line);
	var newAct = {
        undo: function() {
            // Take the top layer off of layerList. The object still exists in the objects hash, but
            // doesn't get drawn because ONLY the objects in layerList get drawn.
            layerList.splice(layerList.length-1,1);
        },
        redo: function() {
            // Put this object back in layerList.
            layerList[layerList.length] = dot.id;
        }
    };

    // Add the new action and redraw.
    addAction(newAct);
    refreshCanvas();
}

function continueLine(e) {
    var line = objectList[layerList[layerList.length-1]];
    line.pts.push([e.pageX, e.pageY]);
    refreshCanvas();
}

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

// The '$().ready(' means that this function will be called as soon as the page is loaded.
$().ready( function() {

    // Get our canvas.
    canvas = document.getElementById('drawing_canvas');

    // Bind an action.

    // Here, we get the drawing canvas using JQuery (that's what the $ means). Then we "bind" a 
    // function to the mousedown; this means that whenever the canvas is clicked, "createDot"
    // will be called.
    $('#drawing_canvas').mousedown( pointerDown );
    $('#drawing_canvas').mousemove( pointerMove );
	$(document).mouseup( pointerEnd );

    // Bind the undo function to the undo button.
    $('#undo').click( undo );

    // Bind the redo function to the redo button.
    $('#redo').click( redo );

    // Redraw.
    refreshCanvas();
});
