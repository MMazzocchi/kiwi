
var canvas;               // This will hold our canvas
var objectList = {};      // This is a hash that maps an object's id to the object itself
var layerList = [];       // This is the list of layers. Each element is an object id.
var actionList = [];      // This is the list of actions. Each element is an "event", which gets defined later on.
var idPtr = 0;            // This is the next available id.
var actionPtr = 0;        // This is the action stack pointer; anything below this is real, and anything above it has been undo'd.
var curTool = "draw";   // This is the current tool selected by the user
var brushMode = 'simple';
var shapeType = '';
var thickness = 25;     // Thickness of the line to be drawn
var alpha = 1;          // Opacity of the object to be drawn
var curColor = "#000000";
var isDragging = false;
var isZoom = true;
var zoomType = '';
var curStamp = '';
var zoomCount = 0;		// number of times user has zoomed in
var factor = 1.2;		// base multiplier for zoom value
var zoom = 1;			// cumulative zoom (factor^zoomCount)
var originx = 0;
var originy = 0;
var zoomposx = 0;
var zoomposy = 0;
var textMode;
var scratch;
var copiedObj;
var copyList = [];
var bindStamp = false;
var tx=0;
var ty=0;
var orientation = orienting() ? window.orientation : 0;
var curFillId = "";
var bgFill = false;
var background = undefined;


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

    //x = x/zoom;
    //y = y/zoom;
    return [x,y];
}

// Refresh the canvas; draw everything
function refreshCanvas() {

    if(curTool != 'select') {
        selectedId = -1;
    }

    var ctx = canvas.getContext('2d');
	ctx.save();
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
	
    //Redraw every object at the current zoom

	//console.log(x1+ " " + y1);
	//console.log(ctx.canvas.width);
	ctx.scale(zoom, zoom);
	ctx.translate(originx, originy);

    if(background) {
        background.draw(ctx);
    }
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
	ctx.restore();
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

//Copy the selected object
function copy(){
	var dObj = objectList[selectedId];
	if(selectedId != -1){
		copiedObj = jQuery.extend(true, {}, dObj);
	}
}

//Paste the copied object
function paste(dObj){
	copyList = [];
	var newObject = jQuery.extend(true, {}, dObj);
	if(newObject.type == "bind"){
		for(var i=0; i<newObject.bindList.length; i++){
			assignID(newObject.bindList[i]);
			layerList.splice(layerList.length-1,1);
			copyList[i] = newObject.bindList[i];
		}
		var newObject = {
			pts: dObj.pts,
			tPos: dObj.tPos,
			lCorner: dObj.lCorner,
			rCorner: dObj.rCorner,
			mx: dObj.mx, my: dObj.my,
			bindList: copyList,
			type: "bind",
			xScale: dObj.xScale,
			yScale: dObj.yScale,
			rotation: dObj.rotation,
			scaling: dObj.scaling,
		};
		startBind(newObject);
	}
	else{
		assignID(newObject);
	}
	newObject.move(40,40);
	var curSel = selectedId;
	
	var newAct = {
		undo: function() {
			// Take the top layer off of layerList. The object still exists in the objects hash, but
			// doesn't get drawn because ONLY the objects in layerList get drawn.
			if(newObject.type == "bind"){
				var layerIndex = $.inArray(newObject.id, layerList);
				// if box is still selected and an object, just remove the box
				if(layerIndex != -1){
					layerList.splice(layerList.length-1,1);
				}
				// if the box has been removed and its items are now on the layerlist, remove them from the layerlist
				else{
					layerList.splice(layerList.length-newObject.bindList.length, newObject.bindList.length);
				}
			}
			else{
				layerList.splice(layerList.length-1,1);
			}
			selectedId = -1;
		},
		redo: function() {
			// Put this object back in layerList.
			layerList[layerList.length] = newObject.id;
			selectedId = newObject.id;
		}
	};
	// Add the new action and redraw.
	
	addAction(newAct);
	selectedId = newObject.id;
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
			selectedId = -1;
        },
        redo: function() {
            layerList.splice(layerId,1);
        }
    };
    addAction(newAct);
}

//Set coordinates for the translations due to the zoom
function applyZoom(x, y, curZoom, prevZoom){
	var z1 = Math.pow(factor,prevZoom);
	var z2 = zoom = Math.pow(factor,curZoom);
	console.log(z1 + " " +z2);
	 var r = z2/z1;
	var px = x-zoomposx;
	var py = y-zoomposy;
	originx = (x/z2-x);
	originy = (y/z2-y);


	var newAct = {
		undo: function() {
			zoomposx = prevx;
			zoomposy = prevy;
			zoomCount = prevZoom;
		},
		redo: function() {
			zoomposx = x;
			zoomposy = y;
			zoomCount = curZoom;
		}
	};
	zoomposx = originx;
	zoomposy = originy;
	addAction(newAct);
	return false;
}

// allows you to move translate the canvas while zoomed in
function dragZoom(x, y){
	isZoom = false;
	zoomposx = x;
	zoomposy = y;
}

/*
function downloadImage(){
	var img = canvas.toDataURL("image/jpeg;base64;");
//	img = img.replace("image/jpeg","image/octet-stream"); // force download, user would have to give the file name.
// you can also use anchor tag with download attribute to force download the canvas with file name.
	window.open(img,"","width=700,height=700");
}
*/


// http://www.nihilogic.dk/labs/canvas2image/
function downloadImage() {
	var dcanvas = document.getElementById("drawing_canvas"); 
	Canvas2Image.saveAsPNG(dcanvas);	
}
// download canvas as JPEG
// from http://www.joeltrost.com/blog/2012/01/29/html5-canvas-save-a-jpeg-with-extension/
/*function downloadImage(){
	var cs = new CanvasSaver('http://joeltrost.com/php/functions/saveme.php');
	cs.saveJPEG(canvas, 'image');

	function CanvasSaver(url) {
	  this.url = url;
	  this.saveJPEG = function(cnvs, fname) {
	  if(!cnvs || !url) return;
		fname = fname || 'picture';

		var data = cnvs.toDataURL("image/jpeg");
		data = data.substr(data.indexOf(',') + 1).toString();
		var dataInput = document.createElement("input") ;
		dataInput.setAttribute("name", 'imgdata') ;
		dataInput.setAttribute("value", data);

		var nameInput = document.createElement("input") ;
		nameInput.setAttribute("name", 'name') ;
		nameInput.setAttribute("value", fname + '.jpg');

		var myForm = document.createElement("form");
		myForm.method = 'post';
		myForm.action = url;
		myForm.appendChild(dataInput);
		myForm.appendChild(nameInput);

		document.body.appendChild(myForm) ;
		myForm.submit() ;
		document.body.removeChild(myForm) ;
		
	  };
	}
}*/

function pointerDown(e) {
    var c = transformCoordinates(e);
    var ctx = canvas.getContext('2d');
    var x = c[0]; var y = c[1];
	if (curTool != "select"){
		ungroupSelection();
	} 
    if (e.which == 3){
        if (curTool == "zoom"){
			isDragging = true;
			zoomType = 'out';
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
				isDragging  = true;
                if((selectedId != -1) && objectList[selectedId].iconClicked(x, y)) {
                    dragMode = objectList[selectedId].iconClicked(x, y);
                    if(dragMode == 'scale') {
                        beginScale(selectedId, x, y);
                    }
					else if(dragMode == 'layerUp') {
						layerUp(selectedId);
					}
					else if(dragMode == 'layerDown') {
						layerDown(selectedId);
					}
                } else {
                    selectedId = getObjectID(x, y);
                    if(selectedId != -1) {
                        dragMode = 'translate';
                    }
					else{
						ungroupSelection();
						
						var dObj = {
							pts: [x, y],
							tPos: [x, y],
							lCorner: [x,y],
							rCorner: [x,y],
							mx: x, my: y,
							bindList: [],
							type: "bind",
							xScale: 1,
							yScale: 1,
							rotation: 0,
							scaling: [1,1],
						};
						startBind(dObj);
					}
                }
                break;

            case "erase":
                isDragging = true;
                var id = getObjectID(x,y);
                if(id != -1) { eraseObject(id); }
                break;

            case "shape":
                isDragging = true;
                var dObj = {
                    pts: [[x, y]],
                    lCorner: [x,y],
                    rCorner: [x,y],
                    mx: x, my: y,
                    width: thickness,
                    opacity: alpha,
                    color: curColor,
                    type: shapeType,
                    radius: 0,
                    xScale: 1,
                    yScale: 1,
                    rotation: 0
                };
                startShape(dObj);
                break;
            case "fill":
                var dObj = {
                    color: curColor,
                    opacity: alpha,
                    lCorner: -1,
                    rCorner: -1,
                    mx: -1, my: -1,
                    rotation: 0,
                    xScale: 1,
                    yScale: 1,
                    pts: [[x, y]]
                };
                if(curFillId != "") {
                    dObj.patternId = curFillId;
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
                    bound: [svgList[ curStamp ].bounds[2],svgList[ curStamp ].bounds[3]],
					pbound: [svgList[ curStamp ].bounds[2],svgList[ curStamp ].bounds[3]],
                    rotation: 0,
                    pts: [x, y],
					type: "stamp"
                };    

                createBMP(dObj);
                createStamp(dObj);
				
                break;
            case "textbox":
                var dObj = {
                    theText: [[new String()]],
                    fontSize: thickness,
                    opacity: alpha,
                    color: curColor,
                    type: textMode,
                    strpixel: 0,
                    xScale: 1, 
                    yScale: 1,
                    lCorner: [x,y],
                    rCorner: [x,y],
                    mx: x, my: y,
                    bound: [1,1],
                    rotation: 0,
                    pts: [x,y],
                    tPos: [x,y]
                };    
                isDragging = true;
                createTextBalloon(dObj);
                break;
            case "dropper":
                isDragging = true;
                var id = ctx.getImageData(x, y, 1, 1);
                var hsl = rgbToHsl( id.data[0], id.data[1], id.data[2] );
                myCP.setHSL( hsl[0]*360, hsl[1]*100, hsl[2]*100);
                opacSlider.updateValue(90);
                break;
            case "zoom":
					isDragging = true;
					zoomType = 'in';
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
			case "zoom":
				dragZoom(x,y);
				break;
			case "shape":
				contShape(x,y,e);
				break;
            case "select":
				if(selectedId != -1){
					applyTransform(selectedId, x, y, dragMode, e);
				}
				else{
					placeBindArea(x,y);
				}
                break;
            case "dropper":
                var id = ctx.getImageData(x, y, 1, 1);
                var hsl = rgbToHsl( id.data[0], id.data[1], id.data[2] );
                myCP.setHSL( hsl[0]*360, hsl[1]*100, hsl[2]*100);
                break;
        case "textbox":
            placeTextArea(x,y);
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
		if(obj.type != "spray"){
			obj.smoothLine();
		}
    }
	else if(curTool == 'zoom'){
		if(isZoom == true){
			if (zoomType == 'in'){
				if (zoomCount < 8){
					zoomCount += 1;
					applyZoom(x, y, zoomCount, zoomCount-1);
				}
			}
			else{
				if(zoomCount > 0){
					zoomCount -= 1;
					applyZoom(x, y, zoomCount, zoomCount+1);
				}
			}
		}
		isZoom = true;
	}
	
    if(isDragging && (curTool == 'select')) {
		if(selectedId != -1){
			endTransform(selectedId, x, y, dragMode);
		}
		else{
			groupSelection();
		}
    }
    
    isDragging = false;
}
// moves selected object up in the layerList
function layerUp (selectedId) {
	if (selectedId != -1){
		var currentId = objectList[selectedId].id;
		$.each(layerList, function(i, id) {
			if (id == currentId && i < layerList.length-1){
				layerList[i] = layerList[i+1];
				layerList[i+1] = currentId;
				var newAct = {
					undo: function() {
						layerList[i+1] = layerList[i];
						layerList[i] = currentId;
					},
					redo: function() {
						layerList[i] = layerList[i+1];
						layerList[i+1] = currentId;
					}
				};

				addAction(newAct);
				return false;
			}
		});
	}
	return false;
}
// moves the selected object down in the layerList	
function layerDown(selectedId) {
	if (selectedId != -1){
		var currentId = objectList[selectedId].id;
		$.each(layerList, function(i, id) {
			if (id == currentId && i > 0){
				layerList[i] = layerList[i-1];
				layerList[i-1] = currentId;
				var newAct = {
					undo: function() {
						layerList[i-1] = layerList[i];
						layerList[i] = currentId;
					},
					redo: function() {
						layerList[i] = layerList[i-1];
						layerList[i-1] = currentId;
					}
				};

				addAction(newAct);
				return false;
			}
		});
	}
	return false;
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
		case 'calligraphy':
            curTool = 'draw';
            brushMode = 'calligraphy';
            break;
        case 'fill':
            curTool = 'fill';
            break;
        case 'stamp':
            document.body.style.cursor="url(img/stamper.png)14 28, default";
            curTool = toolName;
            break;
        case 'circle':
            curTool = 'shape';
            shapeType = 'circle';
            break;
        case 'square':
            curTool = 'shape';
            shapeType = 'square';
            break;
        case 'line':
            curTool = 'shape';
            shapeType = 'line';
            break;
        case 'triangle':
            curTool = 'shape';
            shapeType = 'triangle';
            break;
        default:
            curTool = toolName;
            break;
    }
}

function clearAll() {
    objectList = {};
    layerList = [];
    actionList = [];
    idPtr = 0;
    actionPtr = 0;
    selectedId = -1;
    background = undefined;
}

function showKeyboard() {
    console.log("Keyboard requested.");
    document.getElementById('t').focus();
}

// The '$().ready(' means that this function will be called as soon as the page is loaded.
$().ready( function() {
    document.onselectstart = function () { return false; };
    document.body.style.cursor="url(img/paintbrush.png) 0 28, default"; // sets the default cursor to the paintbrush
    //Create Color picker
    myCP = new ColorPicker();
    myCP.setHSL(0,90,50);
    //Create Opacity Slider
	opacSlider = new OpacitySlider();
	opacSlider.init("opacity");
	opacSlider.updateValue(90);
	//Create Thickness Slider
	thickSlider = new OpacitySlider();
	thickSlider.init("thickness");
	thickSlider.updateValue(thickness);
    //Refresh on orientation changes
    window.addEventListener( 'resize', refreshCanvas );
    window.addEventListener( 'orientationchange', refreshCanvas );

    // Get our canvas.
    canvas = document.getElementById('drawing_canvas');

    toolbar = document.getElementById('toolbar');
	
    canvas.addEventListener( 'touchstart', function(e) {
//e.preventDefault(); 
}, false);
    canvas.addEventListener( 'touchmove', function(e) { e.preventDefault();}, false);
    canvas.addEventListener( 'touchend', function(e) { e.preventDefault();}, false);
    
    // Bind an action.
    $('#drawing_canvas').contextmenu(function() {    // takes right-clicks
        if (curTool == 'zoom'){
            return false;
        }
    });

    $('#drawing_canvas').mousedown( function(event){
        event.preventDefault();
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

    $('#save').click( function() {
        createSaveFile();
    });

    document.getElementById('upload').addEventListener( 'change', handleUploadEvent );

    $('#open').click( function() {
        $('#upload').click();
    });

    $('#download').click( function() {
        //downloadImage();
        window.open(canvas.toDataURL(), "Drawing", canvas.width, canvas.height);
    });
	
    $('#brush').click( function() {
        document.body.style.cursor="url(img/paintbrush.png)0 28, default";
        SelectTool('draw');
    });

    $('#line').click( function() {
        document.body.style.cursor="url(img/paintbrush.png)0 28, default";
        SelectTool('line');
    });

    $('#calligraphy').click( function() {
        document.body.style.cursor="url(img/calligraphy.png)0 28, default";
        SelectTool('calligraphy');
    });
	
    $('#circle').click( function() {
        document.body.style.cursor="url(img/paintbrush.png)0 28, default";
        SelectTool('circle');
    });
	
    $('#square').click( function() {
        document.body.style.cursor="url(img/paintbrush.png)0 28, default";
        SelectTool('square');
    });
	
    $('#triangle').click( function() {
        document.body.style.cursor="url(img/paintbrush.png)0 28, default";
        SelectTool('triangle');
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
        document.body.style.cursor="url(img/paintbucket.png)4 28, default";
        curFillId = "";
        bgFill = false;
        SelectTool('fill');
    });

    $('#stonefill').click( function() {
        document.body.style.cursor="url(img/paintbucket.png)4 28, default";
        curFillId = 'stone';
        bgFill = false;
        SelectTool('fill');
    });

    $('#bgfill').click( function() {
        document.body.style.cursor="url(img/paintbucket.png)4 28, default";
        curFillId = '';
        SelectTool('fill');
        bgFill = true;
    });

	
    $('#balloon').click( function() {
        document.body.style.cursor="default";
        SelectTool('textbox');
        textMode = "balloon";
    });
	
    $('#textbox').click( function() {
        document.body.style.cursor="default";
        SelectTool('textbox');
        textMode = "box";
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

    $('#copy').click( function() {
        copy();
    });

    $('#paste').click( function() {
        if(copiedObj){
            paste(copiedObj);
        }
    });
	
    $('#clear').click( function() {
        clearAll();
    });
	
	function jsKeyToChar(key,e){
		if(key >=65 && key <= 90){ //alphanumeric
			if(e.shiftKey)
				return String.fromCharCode(key);
			else{
				return String.fromCharCode(key+32);
			}
		}
		else if((key >=48 && key <= 57) || (key >=96 && key <= 105)){
			return String.fromCharCode(key);
		}
		else if(key >= 189 && key <= 191){
			return String.fromCharCode(key - 144);
		}
		else
			return false;
	}
	function  findMaxLine(id){
		var num_lines = objectList[id].theText.length;
		var num_words = objectList[id].theText[num_lines-1].length;
		var max = objectList[id].strpixel;
		for(var i=0; objectList[id].theText && i< num_lines; i++){
			var t = 0;
			for(var j=0; objectList[id].theText[i][j] && j<num_words ; j++){
				t += objectList[id].theText[i][j].length;
			}
			if(t > max){
				objectList[id].strpixel = max = t;
				objectList[id].max = i;
			}
		}
	}
	
	function editText(key,e){
		var id = layerList[layerList.length-1];
		if(selectedId != -1 && objectList[selectedId].theText){ //short circuiting works in JS
			id = selectedId;
		}
		if(id != -1 && objectList[id].theText){
			var num_lines = objectList[id].theText.length;
			var num_words = objectList[id].theText[num_lines-1].length;
			
			if(key == 13){	//enter pressed
				objectList[id].theText.push([new String()]);
			}
			else if(key == 8 || key == 46){	//backspace or delete pressed
				var s = objectList[id].theText[num_lines-1][num_words-1];
				var l = objectList[id].theText[num_lines-1];

				if(s && s.length > 0)
					objectList[id].theText[num_lines-1][num_words-1] = s.substring(0,s.length-1);
				else if(l.length > 0)
					objectList[id].theText[num_lines-1].pop();
				else if(l.length == 0 && objectList[id].theText.length > 1)
					objectList[id].theText.pop();
			}
			else if(key == 32){	//space pressed
				objectList[id].theText[num_lines-1][num_words-1] += String.fromCharCode(key);
				objectList[id].theText[num_lines-1].push(new String());
			}
			var keychar = jsKeyToChar(key,e);
			if(keychar)
				objectList[id].theText[num_lines-1][num_words-1] += keychar;
		    findMaxLine(id);
			return;
		}
	}
    
    $(document).keydown(function(e) {
        e.preventDefault();

        var key = e.which;
        editText(key,e);
		
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
    });

  $('#resize_icon').load(function() {});
  $('#rotate_icon').load(function() {});
  $('#arrow_up').load(function() {});
  $('#arrow_down').load(function() {});

    // Redraw.
    setInterval(refreshCanvas, 10);
});
