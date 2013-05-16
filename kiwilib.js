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
        var dot = objectList[id];

        // Draw the dot
        dot.draw(ctx);
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
			ctx.lineWidth = 10;
        };
        ctx.stroke();
    };
    assignID(line);
    refreshCanvas();
}

function continueLine(e) {
    var line = objectList[layerList[layerList.length-1]];
    line.pts.push([e.pageX, e.pageY]);
    refreshCanvas();
}

// Create a new dot using the event e
function createDot(e) {

    // Initialize a 'dot'; a dot is a hash with two parts: an (x,y) coordinate, and a draw function.
    var dot = {
        x:e.pageX,
        y:e.pageY
    };

    // Set the dot's draw function.

    // This is actually really important; every object that gets drawn MUST have a draw function.
    // This is because RefreshCanvas() loops through all the objects, and calls all of their
    // draw functions. If it doesn't have a draw function, the script breaks.

    // The draw function is NOT called here, it's just defined. It will get called later.
    dot.draw = function(ctx) {
        // Begin a 'path'. A path tells the canvas where to draw or fill.
        ctx.beginPath();

        // Make an arc centered at x and y with radius 4 that goes from angle 0 to angle 2*PI
        ctx.arc(this.x-2, this.y-2, 4, 0, 2*Math.PI);

        // Draw the arc.
        ctx.stroke();
    };

    // Give this dot an ID.
    assignID(dot);

    // We just made a dot, so let's make an action for it so we can undo it later.

    // An 'action' is a hash which MUST contain two functions: undo and redo. These will get called later.
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