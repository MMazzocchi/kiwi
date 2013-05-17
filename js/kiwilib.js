var canvas;           // This will hold our canvas
var objectList = {};  // This is a hash that maps an object's id to the object itself
var layerList = [];   // This is the list of layers. Each element is an object id.
var actionList = [];  // This is the list of actions. Each element is an "event", which gets defined later on.
var idPtr = 0;        // This is the next available id.
var actionPtr = 0;    // This is the action stack pointer; anything below this is real, and anything above it has been undo'd.
var mode = "stamp";
var isDragging = false;
var svgList = {'butterfly':{ svg:null, cx:209, cy:164, bounds:[0,0,410,286], url:'svg/butterfly.svg' },
                 'bnl':{ svg:null, cx:197, cy:154, bounds:[0,0,378,302],url:'svg/BnL.svg' }
              };
var curStamp = 'bnl';
// Refresh the canvas; draw everything
function refreshCanvas() {

    var ctx = canvas.getContext('2d');

    ctx.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    // Set the fill color and fill the background
    ctx.fillStyle="#FFFFFF";
    ctx.fillRect(0,0,canvas.width,canvas.height);

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
    var ofst = $(this).offset();

    if('touches' in e) {
        e = e.touches[0];
    }

    var x = e.pageX - ofst.left;
    var y = e.pageY - ofst.top;
    isDragging = true;
    switch(mode) {
        case "line":
            startLine(x,y);
            break;
		case "stamp":
            createStamp(x,y);
			isDragging = false;
            break;
    }
}

function pointerMove(e) {
    var ofst = $(this).offset();

    if('touches' in e) {
        e = e.touches[0];
    }

    var x = e.pageX - ofst.left;
    var y = e.pageY - ofst.top;
    if (isDragging){
        switch(mode) {
            case "line":
                continueLine(x,y);
                break;
        }
    }
}

function pointerEnd(e) {
    isDragging = false;
}

function createStamp(x1,y1) {

    // Initialize a 'dot'; a dot is a hash with two parts: an (x,y) coordinate, and a draw function.
    var stamp = {
		svg: svgList[ curStamp ].url,
        x:x1,
        y:y1
    };
	
	
		
    // Set the dot's draw function.

    // This is actually really important; every object that gets drawn MUST have a draw function.
    // This is because RefreshCanvas() loops through all the objects, and calls all of their
    // draw functions. If it doesn't have a draw function, the script breaks.

    // The draw function is NOT called here, it's just defined. It will get called later.
    stamp.draw = function(ctx) {
        // Begin a 'path'. A path tells the canvas where to draw or fill.
        ctx.beginPath();
		//ctx.fillStyle="#000000";
		//ctx.fillRect(this.x,this.y,20,20);
		console.log(this.svg);
		ctx.drawSvg(this.svg, this.x, this.y, 197, 154);
        // Make an arc centered at x and y with radius 4 that goes from angle 0 to angle 2*PI
        //ctx.arc(this.x-2, this.y-2, 4, 0, 2*Math.PI);
		//console.log(this.x +" "+ this.y);
        // Draw the arc.
        ctx.stroke();
    };

    // Give this dot an ID.
    assignID(stamp);

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
            layerList[layerList.length] = stamp.id;
        }
    };

    // Add the new action and redraw.
    addAction(newAct);
    refreshCanvas();
}


function startLine(x,y) {
    var line = {
        pts: [[x, y]],
        width: 10,
        bezier: true
    };
    line.draw = function(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.pts[0][0], this.pts[0][1]);
        var last = this.pts[0];
        if(!this.bezier) {

            // Draw the line without beziers
            for(var i=1; i<this.pts.length; i++) {
                ctx.lineTo(this.pts[i][0], this.pts[i][1]);
                        ctx.lineJoin = 'round';
                        ctx.lineCap = 'round';
                        ctx.lineWidth = this.width;
            };
        } else {

            // Draw the line with beziers
            for(var i=0; i<this.pts.length; i+=3) {
                if(this.pts.length <= i+4) {
                    for(var j=i; j<this.pts.length; j++) {
                        ctx.lineTo(this.pts[j][0],this.pts[j][1]);
                    }
                } else {
                    ctx.bezierCurveTo(this.pts[i+1][0], this.pts[i+1][1],
                        this.pts[i+2][0], this.pts[i+2][1],
                        this.pts[i+3][0], this.pts[i+3][1]);
                }
	        ctx.lineJoin = 'round';
	        ctx.lineCap = 'round';
	        ctx.lineWidth = this.width;
            };
        }
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
            layerList[layerList.length] = line.id;
        }
    };

    // Add the new action and redraw.
    addAction(newAct);
    refreshCanvas();
}

function continueLine(x,y) {
    var line = objectList[layerList[layerList.length-1]];
    line.pts.push([x, y]);
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

   // Prevent default actions for touch events
   document.addEventListener( 'touchstart', function(e) { e.preventDefault();}, false);
   document.addEventListener( 'touchmove', function(e) { e.preventDefault();}, false);
   document.addEventListener( 'touchend', function(e) { e.preventDefault();}, false);

    // Get our canvas.
    canvas = document.getElementById('drawing_canvas');

    // Bind an action.
    $('#drawing_canvas').mousedown( pointerDown );
    $('#drawing_canvas').mousemove( pointerMove );
    $(document).mouseup( pointerEnd );

    canvas.addEventListener('touchmove', pointerMove );
    canvas.addEventListener('touchstart', pointerDown );
    canvas.addEventListener('touchend', pointerEnd );

    // Bind the undo function to the undo button.
    $('#undo').click( undo );

    // Bind the redo function to the redo button.
    $('#redo').click( redo );
	
	$(document).keypress(function(e) {
		var key = e.which;

		// Ctrl-Z or CMD-Z for Undo   Shift-* for Redo
		if ((e.ctrlKey) && ((key == 122 || key == 90))) {  // CTRL-Z
		  if (key == 122 || key == 90){			// UNDO and REDO
			  if (e.shiftKey) {
				redo();
			  }
			  else {
				undo();
			  }
		  }
		  return false;
		}
	});
	
    // Redraw.
    refreshCanvas();
});
