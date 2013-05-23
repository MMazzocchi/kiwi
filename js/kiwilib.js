
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
var curColor = "#000000";
var isDragging = false;
var curStamp = '';
var scratch;

var selectedId = -1;
var xOld;
var yOld;
var xFirst;
var yFirst;
var dragMode = '';

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
		cx:383, cy:495,
		bounds:[0,0,765,990],
		url:'svg/mickey.svg' },
    'bnl':{
        svg:null,
        cx:197, cy:154,
        bounds:[0,0,378,302],
        url:'svg/BnL.svg' },
	'troll':{ 
		svg:null, 
		cx:301, cy:226,
		bounds:[0,0,603,453],
		url:'svg/troll_face.svg' }
		
};

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
        ctx.fillRect(0,0,window.innerWidth,window.innerHeight);
    }
	//ctx.restore();
    // For each id in layerList, call this function:
    $.each(layerList, function(i, id) {
        // Get the object for this layer
        var dObj = objectList[id];

		//if(scratch){
		//	ctx.putImageData(scratch,0,0);
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
            if(id != -1) {
                eraseObject(id);
            }
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
			$.get(dObj.url, function(xmlData) {
				//console.log("Got svg: " + dObj.url + " for " + curStamp);
				dObj.svg = xmlData;
				//console.log(dObj.svg);
			});
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
	}
}
function createBMP(dObj){
	var scanvas = document.createElement('canvas');
	scanvas.width = dObj.bound[2]*dObj.xScale;
	scanvas.height = dObj.bound[3]*dObj.yScale;
	var sctx = scanvas.getContext('2d');
	sctx.drawSvg(dObj.url, 0, 0, 0, 0);
	dObj.scanvas = scanvas;
}

function translate(id, x, y) {
    var dx = x-xOld;
    var dy = y-yOld;
    objectList[id].move(dx,dy);
    xOld = x;
    yOld = y;
}

function rotate(id, x, y) {
    var obj = objectList[id];
    var theta = Math.atan2(y-obj.midY(), x-obj.midX());
    var pTheta = Math.atan2(yOld-obj.midY(), xOld-obj.midX());
    obj.rotate(theta-pTheta);
    xOld = x;
    yOld = y;
}

function scale(id, x, y) {
    var dx = x-xOld;
    var dy = y-yOld;
    objectList[id].scale(dx,dy);
    xOld = x;
    yOld = y;

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
            case "erase":
                var id = getObjectID(x,y);
                if(id != -1) {
                    eraseObject(id);
                }
                break;
            case "select":
                switch(dragMode) {
                    case 'translate':
                        translate(selectedId, x, y);
                        break;
                    case 'rotate':
                        rotate(selectedId, x, y);
                        break;
                    case 'scale':
                        scale(selectedId, x, y);
                        break;
                }
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

    if(isDragging && (curTool == 'select')) {
        //These seem like pointless variables, but if the're not defined, the  undo function will use global values
        var id = selectedId;

        switch(dragMode) {
            case 'translate':
                var dx = x-xFirst;
                var dy = y-yFirst;

                var newAct = {
                    undo: function() {
                        objectList[id].move(-dx, -dy);
                    },
                    redo: function() {
                        objectList[id].move(dx, dy);
                    }
                };

                addAction(newAct);
                break;
            case 'rotate':
                var obj = objectList[id];
                var dTheta  = Math.atan2(y-obj.midY(), x-obj.midX()) - Math.atan2(yFirst-obj.midY(), xFirst-obj.midX());

                var newAct = {
                    undo: function() {
                        objectList[id].rotate(-dTheta);
                    },
                    redo: function() {
                        objectList[id].rotate(dTheta);
                    }
                };

                addAction(newAct);
                break;
            case 'scale':
                var obj = objectList[id];
                var dx = x-xFirst;
                var dy = y-yFirst;

                var newAct = {
                    undo: function() {
                        objectList[id].scale(-dx, -dy);
                    },
                    redo: function() {
                        objectList[id].scale(dx, dy);
                    }
                };

                addAction(newAct);
                break;
        }
    }
	if(curTool == "fill"){ // this is for the fill function
	
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

function createStamp(dObj) {
    assignID(dObj);

    dObj.draw = function(ctx) {
        var xScale = this.xScale;
        var yScale = this.yScale;

        var bound = [this.bound[2],this.bound[3]];

        ctx.save();
			ctx.globalAlpha = this.opacity;
			ctx.beginPath();
			ctx.translate(this.pts[0],this.pts[1]);
            ctx.rotate(this.rotation);
			ctx.scale(xScale,yScale);
			//ctx.drawSvg(this.svg, -this.cx, -this.cy, 0, 0);
			//ctx.putImageData(this.bmp, this.pts[0]-this.cx, this.pts[1]-this.cy);
			ctx.drawImage(dObj.scanvas,-dObj.cx,-dObj.cy);
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
    };
    dObj.move = function(dx,dy) {
        this.pts[0]+=dx;
        this.pts[1]+=dy;
    };
    dObj.drawIcons = function(ctx) {
        var leftCorner = transformPoint(
            -(this.bound[2]/2), -(this.bound[3]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );

            var scaleIcon = document.getElementById('resize_icon');
            ctx.drawImage(scaleIcon, leftCorner[0]-32, leftCorner[1]-32);

        var rightCorner = transformPoint(
            (this.bound[2]/2), -(this.bound[3]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );

            var rotateIcon = document.getElementById('rotate_icon');
            ctx.drawImage(rotateIcon, rightCorner[0]-32, rightCorner[1]-32);
    }
    dObj.rotate = function(dr) {
        this.rotation += dr;
    }
    dObj.scale = function(dx, dy) {
        this.xScale -= (dx/(this.bound[2]/2));
        this.yScale -= (dy/(this.bound[3]/2));
    }
    dObj.iconClicked = function(x,y) {
        var leftCorner = transformPoint(
            -this.bound[2]/2, -this.bound[3]/2,
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );
        var rightCorner = transformPoint(
            this.bound[2]/2, -this.bound[3]/2,
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );
        if(distance([x,y],[leftCorner[0], leftCorner[1]]) < 32) { return 'scale'; }
        else if(distance([x,y],[rightCorner[0], rightCorner[1]]) < 32) { return 'rotate'; }
        else { return false; }
    }
    dObj.midX = function() { return this.pts[0]; }
    dObj.midY = function() { return this.pts[1]; }

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

function distance(p1, p2) {
    return Math.sqrt(((p1[0]-p2[0])*(p1[0]-p2[0]))+
                     ((p1[1]-p2[1])*(p1[1]-p2[1])));
}

function createPencilTex(dObj){
	
	var patW = dObj.width;
	var texcanvas = document.createElement('canvas');
	texcanvas.width = patW;
	texcanvas.height = patW;
	var dc = texcanvas.getContext('2d');
	dc.globalAlpha = .33;
	dc.fillStyle = dObj.color;
	var nbrDots = patW*patW;
	if(dObj.type == 'graphite'){
		for (var i = 0; i < nbrDots; ++i) {
			var px = Math.floor(Math.random()*patW);     	
			var py = Math.floor(Math.random()*patW);
			dc.fillRect(px,py,1,1);
		}
		dObj.pattern =  dc.createPattern(texcanvas, "repeat");
	}
	else{
		var w = dObj.width;
		var grd=dc.createRadialGradient(dObj.pts[dObj.pts.length-1][0],dObj.pts[dObj.pts.length-1][1],w/8.0,dObj.pts[dObj.pts.length-1][0],dObj.pts[dObj.pts.length-1][1],w/2.0);
		grd.addColorStop(0,dObj.color);
		grd.addColorStop(1, "blue");
//		dc.arc(w/2.0,w/2.0,w/2.0,0,2*Math.PI);
//		dc.fillStyle = grd;
//		dc.fill();
		dObj.pattern =  grd;
	}
	dc.globalAlpha = 1;

}

function spraycanLine(dObj){	/////////////////testing spraycan
	var texcanvas = document.createElement('canvas');
	var dc = texcanvas.getContext('2d');
	var w = dObj.width;
	var grd=dc.createRadialGradient(dObj.pts[dObj.pts.length-1][0],dObj.pts[dObj.pts.length-1][1],w/8.0,dObj.pts[dObj.pts.length-1][0],dObj.pts[dObj.pts.length-1][1],w/2.0);
	grd.addColorStop(0,dObj.color);
	grd.addColorStop(1, "rgba(255,255,255,0)");
//		dc.arc(w/2.0,w/2.0,w/2.0,0,2*Math.PI);
//		dc.fillStyle = grd;
//		dc.fill();
	dObj.pattern =  grd;
}

function startLine(dObj) {
    assignID(dObj);

	// create brush pattern
	if(dObj.type == 'graphite'){
		createPencilTex(dObj);
	}
	if(dObj.type == 'spray'){//////////// testing spraycan
		spraycanLine(dObj);
	}
	
    dObj.draw = function(ctx) {
        ctx.save();
        ctx.translate(this.mx,this.my);
        ctx.scale(this.xScale, this.yScale);
        ctx.rotate(-this.rotation);

        ctx.beginPath();
        ctx.moveTo(this.pts[0][0]-this.mx, this.pts[0][1]-this.my);

	ctx.strokeStyle = this.color;
	if(this.type == 'graphite' || this.type == 'spray'){
	    ctx.strokeStyle = this.pattern;
	}
		
        ctx.fillStyle = this.color;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = this.width;
        ctx.globalAlpha = this.opacity;

        if(this.pts.length == 1) {
            ctx.fillStyle = this.color;
            if(this.type == 'graphite' || this.type == 'spray') {
                ctx.fillStyle = this.pattern;
            }
            ctx.lineWidth = 0;
            ctx.arc(this.pts[0][0]-this.mx, this.pts[0][1]-this.my, this.width/2, 0, 2*Math.PI);
            ctx.fill();
        } else if(!this.bezier) {

            // Draw the line without beziers
            for(var i=1; i<this.pts.length; i++) {

                ctx.lineTo(this.pts[i][0]-this.mx, this.pts[i][1]-this.my);
            };
            ctx.stroke();
        } else {

            // Draw the line with beziers
            for(var i=0; i<this.pts.length; i+=3) {
                if(this.pts.length <= i+4) {
                    for(var j=i; j<this.pts.length; j++) {
                        ctx.lineTo(this.pts[j][0]-this.mx,this.pts[j][1]-this.my);
                    }
                } else {
                    ctx.bezierCurveTo(this.pts[i+1][0]-this.mx, this.pts[i+1][1]-this.my,
                        this.pts[i+2][0]-this.mx, this.pts[i+2][1]-this.my,
                        this.pts[i+3][0]-this.mx, this.pts[i+3][1]-this.my);
                }
            };
            ctx.stroke();
        }
        ctx.restore();
    };
    dObj.drawIcons = function(ctx) {
        var leftCorner = transformPoint(
            this.lCorner[0]-this.mx-32, this.lCorner[1]-this.my-32,
            this.mx, this.my,
            this.xScale, this.yScale,
            this.rotation );

            var scaleIcon = document.getElementById('resize_icon');
            ctx.drawImage(scaleIcon, leftCorner[0]-32, leftCorner[1]-32);

        var rightCorner = transformPoint(
            this.rCorner[0]-this.mx+32, this.lCorner[1]-this.my-32,
            this.mx, this.my,
            this.xScale, this.yScale,
            this.rotation );

            var rotateIcon = document.getElementById('rotate_icon');
            ctx.drawImage(rotateIcon, rightCorner[0]-32, rightCorner[1]-32);

    }
    dObj.select = function(x,y) {

       var pt = transformPoint(x-this.mx, y-this.my,
           this.mx, this.my,
           1, 1,
           -this.rotation);
       if(this.xScale ==0 || this.yScale==0) {
            return false;
       } else {
           pt = transformPoint(pt[0]-this.mx, pt[1]-this.my,
               this.mx, this.my,
               1/this.xScale, 1/this.yScale,
               0);
       }
       x = pt[0]; y = pt[1];


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
    dObj.move = function(dx,dy) {
        for(var i=0; i<this.pts.length; i++) {
            this.pts[i][0]+=dx;
            this.pts[i][1]+=dy;
        }
        this.mx+=dx;
        this.my+=dy;

        this.lCorner[0]+=dx;
        this.rCorner[0]+=dx;
        this.lCorner[1]+=dy;
        this.rCorner[1]+=dy;
    };
    dObj.rotate = function(dr) {
        this.rotation -= dr;
    };
    dObj.scale = function(dx, dy) {
/*        for(var i=0; i<this.pts.length; i++) {
            this.pts[i] = transformPoint(this.pts[i][0]-this.mx, this.pts[i][1]-this.my,
                this.mx, this.my,
                1, 1,
                0 );
        }
*/        this.xScale -= (dx/((this.rCorner[0]-this.lCorner[0])/2));
        this.yScale -= (dy/((this.rCorner[1]-this.lCorner[1])/2));
    };
    dObj.iconClicked = function(x,y) {
        var leftCorner = transformPoint(
            this.lCorner[0]-this.mx-32, this.lCorner[1]-this.my-32,
            this.mx, this.my,
            this.xScale, this.yScale,
            this.rotation );
        var rightCorner = transformPoint(
            this.rCorner[0]-this.mx+32, this.lCorner[1]-this.my-32,
            this.mx, this.my,
            this.xScale, this.yScale,
            this.rotation );
        if(distance([x,y],[leftCorner[0], leftCorner[1]]) < 32) { return 'scale'; }
        else if(distance([x,y],[rightCorner[0], rightCorner[1]]) < 32) { return 'rotate'; }
        else { return false; }
    }
    dObj.midX = function() { return this.mx; }
    dObj.midY = function() { return this.my; }

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
}


function continueLine(x,y) {
    var dObj = objectList[layerList[layerList.length-1]];
    dObj.pts.push([x, y]);

    if(x < dObj.lCorner[0]) { dObj.lCorner[0] = x; }
    if(x > dObj.rCorner[0]) { dObj.rCorner[0] = x; }
    if(y < dObj.lCorner[1]) { dObj.lCorner[1] = y; }
    if(y > dObj.rCorner[1]) { dObj.rCorner[1] = y; }
    dObj.mx = (dObj.lCorner[0]+dObj.rCorner[0])/2;
    dObj.my = (dObj.lCorner[1]+dObj.rCorner[1])/2;

	if (dObj.type == 'spray'){/////////////////////// testing spraycan
		spraycanLine(dObj);
	}

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

function updateThick(slideAmount) {		// gets thickness from slider and sets the global thickness
	thickness = slideAmount;
    myCP.Refresh();
}
function updateOpac(slideAmount) {		// gets opacity from slider and sets the global opacity
	alpha = slideAmount/100;
    myCP.Refresh();
}

function updateTint(slideAmount) {		// gets tint from slider and sets the light setting in the color picker
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

    // Bind an action.
    $('#drawing_canvas').mousedown( pointerDown );
    $('#drawing_canvas').mousemove( pointerMove );
    $('#drawing_canvas').mouseup( pointerEnd );

    canvas.addEventListener('touchmove', pointerMove );
    canvas.addEventListener('touchstart', pointerDown );
    canvas.addEventListener('touchend', pointerEnd );

    // Bind the undo function to the undo button.
    $('#undo').click( undo );

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
	
	$('#fill').click( function() {
        SelectTool('fill');
    });
	
    $('#erase').click( function() {
		document.body.style.cursor="url(img/eraser.png)0 28, default";
        SelectTool('erase');
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
        value: 10,
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
            if (key == 122 || key == 90){			// UNDO and REDO
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
            return false;
        }
		
		switch (key) {
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
			case 115: // S=SELECT
			  document.body.style.cursor="url(img/hand-tool.png)14 6, default";
			  SelectTool('select');
			  break;
			case 103:  // G=dropper
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
