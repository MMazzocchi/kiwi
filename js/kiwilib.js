
var canvas;           	// This will hold our canvas
var objectList = {};  	// This is a hash that maps an object's id to the object itself
var layerList = [];   	// This is the list of layers. Each element is an object id.
var actionList = [];  	// This is the list of actions. Each element is an "event", which gets defined later on.
var idPtr = 0;        	// This is the next available id.
var actionPtr = 0;    	// This is the action stack pointer; anything below this is real, and anything above it has been undo'd.
var curTool = "draw";   // This is the current tool selected by the user
var brushMode = 'simple';
var thickness = 10;     // Thickness of the line to be drawn
var alpha = 1;          // Opacity of the object to be drawn
var isDragging = false;
var curStamp = '';

var selectedID = -1;

var tx=0;
var ty=0;
var orientation = orienting() ? window.orientation : 0;

var svgList = {
    'butterfly':{
        svg:null, 
        cx:205, cy:143, 
        bounds:[0,0,410,286], 
        url:'svg/butterfly.svg' },
	'mickey':{
		svg:null, 
		cx:156, cy:145,
		bounds:[0,0,313,290],
		url:'svg/mickey.svg' },
    'bnl':{
        svg:null,
        cx:197, cy:154,
        bounds:[0,0,378,302],
        url:'svg/BnL.svg' }
		
};

function orienting() {
    return (typeof window.orientation != "undefined");
}

// Refresh the canvas; draw everything
function refreshCanvas() {

    var ctx = canvas.getContext('2d');

    ctx.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    if(orienting()) {
        orientation = window.orientation;

        ctx.rotate(-orientation*Math.PI/180);

        ctx.fillStyle="#FFFFFF";

        switch(orientation) {
            case 0:
                ctx.fillRect(0,0,window.innerWidth,window.innerHeight);
                tx=0; ty=0; 
                break;
            case -90:
                tx=0; ty=-window.innerWidth;
                ctx.translate(0,-window.innerWidth);
                ctx.fillRect(0,0,window.innerHeight,window.innerWidth);
                break;
            case 90:
                tx=-window.innerHeight; ty=0;
                ctx.translate(-window.innerHeight,0);
                ctx.fillRect(0,0,window.innerHeight,window.innerWidth);
                break;
            case 180:
                tx=-window.innerWidth; ty=-window.innerHeight;
                ctx.translate(-window.innerWidth,-window.innerHeight);
                ctx.fillRect(0,0,window.innerWidth,window.innerHeight);
                break;
        }
    } else {
        ctx.fillStyle="#FFFFFF";
        ctx.fillRect(0,0,window.innerWidth,window.innerHeight);
    }

    // For each id in layerList, call this function:
    $.each(layerList, function(i, id) {
        // Get the object for this layer
        var dObj = objectList[id];

        // Draw the object
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

//Return the id of the topmost object at coordinates x,y
function getObjectID(x, y) {
    var id = -1;
    for(var i=layerList.length-1; i>=0; i--) {
        if(objectList[layerList[i]].select(x,y)) {
            id = objectList[layerList[i]].id;
            break;
        }
    }
    console.log("Selected "+id);
    return id;
}

//Erase object with given id
function eraseObject(id) {

    //Find the layer that needs to be erased
    var layerId = -1;
    for(var i=0; i<layerList.length; i++) {
        if(layerList[i] == id) {
            layerId = i;
            break;
        }
    }
    //Take out the layer
    layerList.splice(layerId, 1);
    //Add an action to the action stack
    var newAct = {
        undo: function() {
            layerList.splice(layerId, 0, id);
        },
        redo: function() {
            layerList.splice(layerId,1);
        }
    };

    addAction(newAct);
    refreshCanvas();
}

function pointerDown(e) {
    var ofst = $(this).offset();

    if('touches' in e) {
        e = e.touches[0];
    }

    var x = e.pageX - ofst.left;
    var y = e.pageY - ofst.top;

    if(orienting()) {
        switch(orientation) {
            case 90:
                var t=x;
                x=-y-tx;
                y=t;
                break;
            case -90:
                var t=-x-ty;
                x=y;
                y=t;
                break;
            case 180:
                x=-x-tx;
                y=-y-ty;
                break;
        }
    }

    switch(curTool) {			
        case "draw":
            isDragging = true;
            var dObj = {
	        pts: [[x, y]],
	        width: thickness,
	        opacity: alpha,
	        bezier: true
            };
            startLine(dObj);
        break;	

        case "select":
            selectedID = getObjectID(x, y);
            break;

        case "erase":
            isDragging = true;
            var id = getObjectID(x,y);
            if(id != -1) {
                eraseObject(id);
            }
            break;

        case "fill":
            break;

        case "stamp":
			var dObj = {
				svg: svgList[ curStamp ].url,
				cx: svgList[ curStamp ].cx,
				cy: svgList[ curStamp ].cy,
				scale: 0.5, 
				bound: svgList[ curStamp ].bounds,
				rotation: Math.random()*2*Math.PI, //eventually user specified
				pts: [x, y],
			};	
            createStamp(dObj);
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

    if(orienting()) {
        switch(orientation) {
            case 90:
                var t=x;
                x=-y-tx;
                y=t;
                break;
            case -90:
                var t=-x-ty;
                x=y;
                y=t;
                break;
            case 180:
                x=-x-tx;
                y=-y-ty;
                break;
        }
    }

    if (isDragging){
        switch(curTool) {
            case "draw":
                continueLine(x,y);
                break;
        }
    }
}

function pointerEnd(e) {
    isDragging = false;
}

function createStamp(dObj) {
    assignID(dObj);

    dObj.draw = function(ctx) {
        var scale = this.scale;
        var bound = [this.bound[2],this.bound[3]];

        ctx.save();
        ctx.beginPath();
        ctx.translate(this.pts[0],this.pts[1]);
        ctx.scale(scale,scale);
        ctx.rotate(this.rotation);
        ctx.drawSvg(this.svg, -this.cx, -this.cy, 0, 0);
        ctx.globalAlpha = this.opacity;
        ctx.restore();
    };
    dObj.select = function(x,y) {
        //"Scratch canvas" method
        var scanvas = document.createElement('canvas');
        scanvas.width = window.innerWidth;
        scanvas.height = window.innerHeight;
        var ctx = scanvas.getContext('2d');
        this.draw(ctx);
        var imageData = ctx.getImageData(x, y, 1, 1);
        return (imageData.data[3] > 0 || imageData.data[0] > 0);
    }

    var newAct = {
        undo: function() {
            layerList.splice(layerList.length-1,1);
        },
        redo: function() {
            layerList[layerList.length] = dObj.id;
        }
    };

    // Add the new action and redraw.
    addAction(newAct);
    refreshCanvas();
}

function distance(p1, p2) {
    return Math.sqrt(((p1[0]-p2[0])*(p1[0]-p2[0]))+
                     ((p1[1]-p2[1])*(p1[1]-p2[1])));
}

function startLine(dObj) {
    assignID(dObj);

    dObj.draw = function(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.pts[0][0], this.pts[0][1]);
        var last = this.pts[0];
		
        if(this.pts.length == 1) {
            ctx.fillStyle = '#000000';
            ctx.lineTo(this.pts[0][0], this.pts[0][1]);
                        ctx.lineJoin = 'round';
                        ctx.lineCap = 'round';
                        ctx.lineWidth = this.width;
                        ctx.globalAlpha = this.opacity;
        } else if(!this.bezier) {

            // Draw the line without beziers
            for(var i=1; i<this.pts.length; i++) {
                ctx.lineTo(this.pts[i][0], this.pts[i][1]);
                        ctx.lineJoin = 'round';
                        ctx.lineCap = 'round';
                        ctx.lineWidth = this.width;
                        ctx.globalAlpha = this.opacity;
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
			ctx.globalAlpha = this.opacity;
            };
        }
        ctx.stroke();
    };
    dObj.select = function(x,y) {

       for(var i=0; i<this.pts.length-1; i++) {

           //Check to see if we're within the left end cap of this segment
           if(distance([x,y],this.pts[i]) < (this.width/2)) {
               return true;
           } else {

                //Create the first vector between pts[0] and pts[1].
                var v1 = [this.pts[i][0]-this.pts[i+1][0],
                          this.pts[i][1]-this.pts[i+1][1]];
                //Create the second vector between pts[0] and (x,y).
                var v2 = [this.pts[i][0]-x,
                          this.pts[i][1]-y];
                //Calculate the z-magnitude of the resulting cross product
                //(The x and y magnitudes will always be zero)
                var z = Math.abs(v1[0]*v2[1]-v2[0]*v1[1]);

                //Now take the dot product
                var d = (v1[0]*v2[0]) + (v1[1]+v2[1]);

                var dist = distance(this.pts[i], this.pts[i+1]);

                //Now MATH
                if(((z/dist) < (this.width/2))  && (d >= 0) && (d <= (dist*dist))) {
                    return true;
                }
            }
        }
        //Finally, check the right end cap of the entire line
        return (distance([x,y],this.pts[this.pts.length-1]) < (this.width/2));
    };

    var newAct = {
        undo: function() {
            // Take the top layer off of layerList. The object still exists in the objects hash, but
            // doesn't get drawn because ONLY the objects in layerList get drawn.
            layerList.splice(layerList.length-1,1);
        },
        redo: function() {
            // Put this object back in layerList.
            layerList[layerList.length] = dObj.id;
        }
    };

    // Add the new action and redraw.
    addAction(newAct);
    refreshCanvas();
}


function continueLine(x,y) {
    var dObj = objectList[layerList[layerList.length-1]];
    dObj.pts.push([x, y]);
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

function updateThick(slideAmount) {
	thickness = slideAmount;
}
function updateOpac(slideAmount) {
	alpha = slideAmount/100;
}

function SetDrawThick(t)	// sets the thickness
{
    thickness = t;
//  $( "#linethickSlider" ).slider( "value", gVars.curDrawThick);
}

function SetDrawAlpha(t)	// sets the opacity
{
    alpha = t;
//  $( "#alphaSlider" ).slider( "value", gVars.curDrawAlpha*100);
}

function SelectTool(toolName) // selects proper tool based off of what user has clicked
{
    switch (toolName) {
        case 'draw':
            curTool = 'draw';
            brushMode = 'simple';
            SetDrawThick(thickness > 8? 8 : thickness);
            SetDrawAlpha(1);
            break;
        case 'spraycan':
            curTool = 'draw';
            brushMode = 'round';
            SetDrawThick(50);
            SetDrawAlpha(0.10);
            break;
        case 'select':
            curTool = 'select';
            SetDrawAlpha(1);
            break;
        case 'pencil':
            curTool = 'draw';
            brushMode = 'graphite';
            SetDrawAlpha(1);
            break;
        default:
            curTool = toolName;
            SetDrawAlpha(1);
            break;
    }
    refreshCanvas();
}

// The '$().ready(' means that this function will be called as soon as the page is loaded.
$().ready( function() {

    // Prevent default actions for touch events
    document.addEventListener( 'touchstart', function(e) { e.preventDefault();}, false);
    document.addEventListener( 'touchmove', function(e) { e.preventDefault();}, false);
    document.addEventListener( 'touchend', function(e) { e.preventDefault();}, false);

    window.addEventListener( 'resize', refreshCanvas );
    window.addEventListener( 'orientationchange', refreshCanvas );

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
	
	
    /////////////////////////////////////////////////////////////////////////////////////
    // ADDED BUTTONS
    //.attr etc is to address a firefox bug that caches the disabled state of the redo button
    // http://stackoverflow.com/questions/2719044/jquery-ui-button-gets-disabled-on-refresh
    $('#undo_button').attr('disabled', true);
    $('#redo_button').attr('disabled', true);
    $('button').button().attr("autocomplete", "off");

    $('#brush').click( function() {
        SelectTool('draw');
    });

    $('#spraycan').click( function() {
        SelectTool('spraycan');
    });

    $('#hand').click( function() {
        SelectTool('select');
    });

    $('#pencil').click( function() {
        SelectTool('pencil');
    });
	
    $('#erase').click( function() {
        SelectTool('erase');
    });
	
	$('#butterfly').click( function() {
		SelectTool('stamp');
		curStamp = 'butterfly'
	});
	$('#mickey_button').click( function() {
		SelectTool('stamp');
		curStamp = 'mickey'
	});
	$('#bnl').click( function() {
		SelectTool('stamp');
		curStamp = 'bnl'
	});
    $('#stamp').click( function() {
        SelectTool('stamp');
    });
    //////////////////////////////////////////////////////////////////////////////////////
	
    $('#clear').click( function() {
        objectList = {};
        layerList = [];
        actionList = [];
        idPtr = 0;
        actionPtr = 0;
        refreshCanvas();
    });
	
    $(document).keypress(function(e) {
        var key = e.which;

        // Ctrl-Z or CMD-Z for Undo   Shift-* for Redo
        if ((e.ctrlKey) && ((key == 122 || key == 90))) {  // CTRL-Z
            if (key == 122 || key == 90){			// UNDO and REDO
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
            return false;
        }
    });
	
    // Redraw.
    refreshCanvas();
});
