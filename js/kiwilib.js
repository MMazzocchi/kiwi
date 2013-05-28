
var canvas;               // This will hold our canvas
var objectList = {};      // This is a hash that maps an object's id to the object itself
var layerList = [];       // This is the list of layers. Each element is an object id.
var actionList = [];      // This is the list of actions. Each element is an "event", which gets defined later on.
var idPtr = 0;            // This is the next available id.
var actionPtr = 0;        // This is the action stack pointer; anything below this is real, and anything above it has been undo'd.
var curTool = "draw";   // This is the current tool selected by the user
var brushMode = 'simple';
var thickness = 25;     // Thickness of the line to be drawn
var alpha = 1;          // Opacity of the object to be drawn
var curColor = "#000000";
var isDragging = false;
var curStamp = '';
var curZoom = 1;
var mousex = 0;
var mousey = 0;
var originx = $("#toolbar").width();
var originy = 0;
var scratch;
var tx=0;
var ty=0;
var orientation = orienting() ? window.orientation : 0;

function orienting() {
    return (typeof window.orientation != "undefined");
}

function transformCoordinates(e) {
    var ofst = $('#drawing_canvas').offset()

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

    x = x/curZoom;
    y = y/curZoom;
    return [x,y];
}

// Refresh the canvas; draw everything
function refreshCanvas() {

    if(curTool != 'select') {
        selectedId = -1;
    }

    var ctx = canvas.getContext('2d');
    var heightoffset = $("#toolbar").height();
    var widthoffset = $("#toolbar").width();
    
    if (window.innerWidth < window.innerHeight) { // portrait
        ctx.canvas.width  = window.innerWidth;
        ctx.canvas.height = window.innerHeight - heightoffset;
    }
    else { // landscape
        ctx.canvas.width  = window.innerWidth - widthoffset;
        ctx.canvas.height = window.innerHeight;
    }

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
        if (window.innerWidth < window.innerHeight) // portrait
            ctx.fillRect(0,0,window.innerWidth,window.innerHeight-heightoffset);
        else // landscape
            ctx.fillRect(0,0,window.innerWidth-widthoffset,window.innerHeight);
    }
    //ctx.restore();
    // Redraw every object at the current zoom
	ctx.translate(-originx, -originy);
    ctx.scale(curZoom, curZoom);
//	ctx.translate(originx, originy);
    // For each id in layerList, call this function:
    $.each(layerList, function(i, id) {
        // Get the object for this layer
        var dObj = objectList[id];

        //if(scratch){
        //    ctx.putImageData(scratch,0,0);
        //}
        //dObj.draw(ctx);
        //scratch = ctx.getImageData(0,0,canvas.width,canvas.height);
        


        if((!isDragging) || (id != selectedId)) {
            // Draw the object
            dObj.draw(ctx);
        }
    });

    // Draw the selected layer on top of the rest
    if(selectedId != -1) {
        if(isDragging) {
            objectList[selectedId].draw(ctx);
        }
        objectList[selectedId].drawIcons(ctx);
    }
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
}

function pointerDown(e) {
    var c = transformCoordinates(e);
    var ctx = canvas.getContext('2d');
    var x = c[0]; var y = c[1];
    if (e.which == 3){
        if (curTool == "zoom"){
            curZoom = curZoom/1.5;
        }
    }
    else{
        switch(curTool) {            
            case "draw":
                isDragging = true;
                var dObj = {
                    pts: [[x, y]],
                    lCorner: [x,y],
                    rCorner: [x,y],
                    mx: x, my: y,
                    width: thickness,
                    opacity: alpha,
                    color: curColor,
                    bezier: true,
                    type: brushMode,
                    xScale: 1,
                    yScale: 1,
                    rotation: 0
                };
                startLine(dObj);
                break;    

            case "select":
                xOld = x;
                yOld = y;
                xFirst = x;
                yFirst = y;
                if((selectedId != -1) && objectList[selectedId].iconClicked(x, y)) {
                    dragMode = objectList[selectedId].iconClicked(x, y);
                    isDragging = true;
                    if(dragMode == 'scale') {
                        beginScale(selectedId, x, y);
                    }
                } else {
                    selectedId = getObjectID(x, y);
                    if(selectedId != -1) {
                        isDragging = true;
                        dragMode = 'translate';
                    }
                }
                break;

            case "erase":
                isDragging = true;
                var id = getObjectID(x,y);
                if(id != -1) { eraseObject(id); }
                break;

            case "fill":
                var dObj = {
                    color: curColor,
                    pts: [x, y]
                }
                createFill(dObj);
                break;

            case "stamp":
                var dObj = {
                    url: svgList[ curStamp ].url,
                    cx: svgList[ curStamp ].cx,
                    cy: svgList[ curStamp ].cy,
                    opacity: alpha,
                    xScale: 1, 
                    yScale: 1,
                    bound: svgList[ curStamp ].bounds,
                    rotation: 0,
                    pts: [x, y],
                };    
 /*               $.get(dObj.url, function(xmlData) {
                    console.log("Got svg: " + dObj.url + " for " + curStamp);
                    dObj.svg = xmlData;
                });
*/
                createBMP(dObj);
                createStamp(dObj);
                break;
            case "dropper":
                isDragging = true;
                var id = ctx.getImageData(x, y, 1, 1);
                var hsl = rgbToHsl( id.data[0], id.data[1], id.data[2] );
                myCP.setHSL( hsl[0]*360, hsl[1]*100, hsl[2]*100);
                $( "#tintSlider" ).slider( "value", hsl[2]*100);
                break;
            case "zoom":
                curZoom = curZoom*1.5;
				var points = transformCoordinates(e);
				mousex = points[0];
				mousey = points[1];
				var diffx = (mousex - originx)/curZoom;
				var diffy = (mousey - originy)/curZoom;
				originx = mousex - diffx;
				originy = mousey - diffy;
                break;
        }
    }
}

function pointerMove(e) {
    var c = transformCoordinates(e);
    var ctx = canvas.getContext('2d');
    var x = c[0]; var y = c[1];

    if (isDragging){
        switch(curTool) {
            case "draw":
                continueLine(x,y);
                break;
            case "spray":
                continueSpray(x,y);
                break;
            case "erase":
                var id = getObjectID(x,y);
                if(id != -1) {
                    eraseObject(id);
                }
                break;
            case "select":
                applyTransform(selectedId, x, y, dragMode, e);
                break;
            case "dropper":
                var id = ctx.getImageData(x, y, 1, 1);
                var hsl = rgbToHsl( id.data[0], id.data[1], id.data[2] );
                myCP.setHSL( hsl[0]*360, hsl[1]*100, hsl[2]*100);
                $( "#tintSlider" ).slider( "value", hsl[2]*100);
                break;
        }
    }
}

function pointerEnd(e) {
    var c = transformCoordinates(e);
    var x = c[0]; var y = c[1];

    if(curTool == 'draw') {
        var obj = objectList[layerList[layerList.length-1]];
        obj.lCorner[0] -= 32;
        obj.lCorner[1] -= 32;
        obj.rCorner[0] += 32;
        obj.rCorner[1] += 32;
    }

    if(isDragging && (curTool == 'select')) {
        endTransform(selectedId, x, y, dragMode);
    }
    
    isDragging = false;
}

function createFill(dObj){
    assignID(dObj);
    
    dObj.draw = function(ctx) {
        ctx.save();
            var height = canvas.height;
            var width = canvas.width;
            var img = ctx.getImageData(0,0,width,height);
            var x = dObj.pts[0];
            var y = dObj.pts[1];
            var cx = (y*width+x)
            var fillColor = curColor;
            
            console.log(curColor);
            
            ctx.putImageData(img,0,0);
        ctx.restore();
    };

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
}

function transformPoint(x,y,dx,dy,sx,sy,theta) {
        var tx = x*sx;
        var ty = -1*y*sy;
        var r = distance([0,0],[tx,ty]);
        var phi=0;
        phi = Math.atan2(tx,ty);
        tx = (r*Math.sin(phi-theta));
        ty = (r*Math.cos(phi-theta));
        tx = dx+tx;
        ty = dy-ty;
        return [tx,ty];
}

function distance(p1, p2) {
    return Math.sqrt(((p1[0]-p2[0])*(p1[0]-p2[0]))+
                     ((p1[1]-p2[1])*(p1[1]-p2[1])));
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
    }
}

// Redoes an action
function redo() {
    if(actionPtr < actionList.length) {
        var next = actionList[actionPtr];
        next.redo();
        actionPtr++;
    }
}

function updateThick(slideAmount) {        // gets thickness from slider and sets the global thickness
    thickness = slideAmount;
    myCP.Refresh();
}
function updateOpac(slideAmount) {        // gets opacity from slider and sets the global opacity
    alpha = slideAmount/100;
    myCP.Refresh();
}

function updateTint(slideAmount) {        // gets tint from slider and sets the light setting in the color picker
    myCP.curL = slideAmount;
    myCP.updateColor();
}

function SelectTool(toolName) // selects proper tool based off of what user has clicked
{
    switch (toolName) {
        case 'draw':
            curTool = 'draw';
            brushMode = 'simple';
            break;
        case 'spraycan':
            curTool = 'draw';
            brushMode = 'spray';
            break;
        case 'select':
            curTool = 'select';
            break;
        case 'pencil':
            curTool = 'draw';
            brushMode = 'graphite';
            break;
        case 'fill':
            curTool = 'fill';
            break;
        default:
            curTool = toolName;
            break;
    }
}

// The '$().ready(' means that this function will be called as soon as the page is loaded.
$().ready( function() {
    document.body.style.cursor="url(img/paintbrush.png) 0 28, default"; // sets the default cursor to the paintbrush
    //Ceate Color picker
    myCP = new ColorPicker();
    myCP.setHSL(0,90,50);

    // Prevent default actions for touch events
    document.addEventListener( 'touchstart', function(e) { e.preventDefault();}, false);
    document.addEventListener( 'touchmove', function(e) { e.preventDefault();}, false);
    document.addEventListener( 'touchend', function(e) { e.preventDefault();}, false);

    //Refresh on orientation changes
    window.addEventListener( 'resize', refreshCanvas );
    window.addEventListener( 'orientationchange', refreshCanvas );

    // Get our canvas.
    canvas = document.getElementById('drawing_canvas');
	toolbar = document.getElementById('toolbar');
    

    // Bind an action.
    $('#drawing_canvas').contextmenu(function() {    // takes right-clicks
        if (curTool == 'zoom'){
            return false;
        }
    });

    $('#drawing_canvas').mousedown( function(event){
        pointerDown(event);
    });
    $('#drawing_canvas').mousemove( pointerMove );
    $('#drawing_canvas').mouseup( pointerEnd );
    
    canvas.addEventListener('touchmove', pointerMove );
    canvas.addEventListener('touchstart', pointerDown );
    canvas.addEventListener('touchend', pointerEnd );
	

    // Bind the undo function to the undo button.
    $('#undo').click( undo );
	$('#undo').on('tap', undo);

    // Bind the redo function to the redo button.
    $('#redo').click( redo );
    
    //.attr etc is to address a firefox bug that caches the disabled state of the redo button
    // http://stackoverflow.com/questions/2719044/jquery-ui-button-gets-disabled-on-refresh
    $('#undo_button').attr('disabled', true);
    $('#redo_button').attr('disabled', true);
    $('button').button().attr("autocomplete", "off");

    $('#brush').click( function() {
        document.body.style.cursor="url(img/paintbrush.png)0 28, default";
        SelectTool('draw');
    });

    $('#spraycan').click( function() {
        document.body.style.cursor="url(img/spraycan.png)0 5, default";
        SelectTool('spraycan');
    });

    $('#hand').click( function() {
        document.body.style.cursor="url(img/hand-tool.png)14 6, default";
        SelectTool('select');
    });

    $('#pencil').click( function() {
        document.body.style.cursor="url(img/pencil.png)0 28, default";
        SelectTool('pencil');
    });
	$('#pencil').on('tap', function() {
        document.body.style.cursor="url(img/pencil.png)0 28, default";
        SelectTool('pencil');
    });
    
    $('#fill').click( function() {
        SelectTool('fill');
    });
    
    $('#erase').click( function() {
        document.body.style.cursor="url(img/eraser.png)0 28, default";
        SelectTool('erase');
    });
    
    $('#zoom').click( function() {
        document.body.style.cursor="url(img/search.png)8 6, default";
        SelectTool('zoom');
    });
    
    $('#dropper').click( function() {
        document.body.style.cursor="url(img/dropper.png)0 28, default";
        SelectTool('dropper');
    });
    
    $('#fill').click( function() {
        document.body.style.cursor="url(img/paintbucket.png), default";
        SelectTool('fill');
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

    $('#clear').click( function() {
        objectList = {};
        layerList = [];
        actionList = [];
        idPtr = 0;
        actionPtr = 0;
        selectedId = -1;
    });
    
    $( '#tintSlider' ).slider({
        orientation: "horizontal",
        range: "min",
        min: 0,
        max: 100,
        value: myCP.curL,
        slide: function( event, ui ) {
            updateTint( ui.value );
        },
        change: function( event, ui ) {
            updateTint( ui.value );
        }
    });
    
    $( "#opacitySlider" ).slider({
        orientation: "horizontal",
        range: "min",
        min: 0,
        max: 100,
        value: 100,
        slide: function( event, ui ) {
            updateOpac( ui.value );
        },
        change: function( event, ui ) {
            updateOpac( ui.value );
        }
    });
    
    $( "#thicknessSlider" ).slider({
        orientation: "horizontal",
        range: "min",
        min: 4,
        max: 80,
        value: 25,
        slide: function( event, ui ) {
            updateThick( ui.value );
        },
        change: function( event, ui ) {
            updateThick( ui.value );
        }
    });
    
    $(document).keypress(function(e) {
        var key = e.which;

        // Ctrl-Z or CMD-Z for Undo   Shift-* for Redo
        if ((e.ctrlKey) && ((key == 122 || key == 90))) {  // CTRL-Z
            if (key == 122 || key == 90){            // UNDO and REDO
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
            return false;
        }
        
        switch (key) {
			case 97:  // A = AIRBRUSH
			  document.body.style.cursor="url(img/spraycan.png)0 5, default";
			  SelectTool('spraycan');
              break;
            case 100: // D=DRAW
              document.body.style.cursor="url(img/paintbrush.png)0 28, default";
              SelectTool('draw');
              break;
            case 101: // E=ERASE
              document.body.style.cursor="url(img/eraser.png)0 28, default";
              SelectTool('erase');
              break;
            case 102: // F=FILL
              document.body.style.cursor="url(img/paintbucket.png), default";
              SelectTool('fill');
              break;
			case 112: // P=PENCIL
              document.body.style.cursor="url(img/pencil.png)0 28, default";
			  SelectTool('pencil');
              break;
            case 115: // S=SELECT
              document.body.style.cursor="url(img/hand-tool.png)14 6, default";
              SelectTool('select');
              break;
            case 103:  // G=DROPPER
              document.body.style.cursor="url(img/dropper.png)0 28, default";
              SelectTool('dropper');
              break;
        }
        
    });

  $('#resize_icon').load(function() {});
  $('#rotate_icon').load(function() {});

    // Redraw.
    setInterval(refreshCanvas, 10);
});
