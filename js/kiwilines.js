//Create a pencil texture for this object
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
    dc.globalAlpha = 1;
}

// Create a spray can texture for this object
function createSprayTex(dObj){
    var scanvas = document.createElement('canvas');
    scanvas.height = scanvas.width = dObj.width;
    var ctx = scanvas.getContext('2d');
    var w = dObj.width;
    var grd=ctx.createRadialGradient(w/2,w/2,0.0,w/2,w/2,w/2);
    grd.addColorStop(0,dObj.color);
	var color = hslToRgb(myCP.curH, myCP.curS/100, myCP.curL/100);
	var r = color[0];
	var g = color[1];
	var b = color[2];
	grd.addColorStop(1,"rgba("+Math.round(r)+","+Math.round(g)+","+Math.round(b)+",0)");
	
	
    //dObj.grd = grd;
    ctx.fillStyle = grd;
    var w = dObj.width;
    ctx.fillRect(0,0,w,w);
    dObj.scanvas = scanvas;
}
function createTextureBrush(dObj){
	var scanvas = document.createElement('canvas');
    scanvas.height = scanvas.width = dObj.width;
    var ctx = scanvas.getContext('2d');
    var w = dObj.width;
	ctx.save();
	ctx.beginPath();
	ctx.strokeStyle=dObj.color;
	ctx.fillStyle = dObj.color;
	ctx.moveTo(0, 0);
	ctx.quadraticCurveTo(3*w/4, w/4, w, w);
	ctx.quadraticCurveTo(w/4, 3*w/4, 0, 0);
	ctx.stroke();
	ctx.fill();
	ctx.restore();
    dObj.scanvas = scanvas;

}


// Create a line
function startLine(dObj) {
    assignID(dObj);
    if(dObj.type == 'spray'){
        createSprayTex(dObj);
    }
    // create brush pattern
    else if(dObj.type == 'graphite'){
        createPencilTex(dObj);
    }
	else if(dObj.type == 'calligraphy'){
		createTextureBrush(dObj);
	}

    // Create a brush for this line
    createBrush(dObj, brushMode);

    // Draw the rotate/scale icons
    dObj.drawIcons = function(ctx) {
        var mobileX = (orienting() ? 32 : 0);
        var mobileY = mobileX;

        var leftCorner = transformPoint(
            this.lCorner[0]-this.mx, this.lCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

            var scaleIcon = document.getElementById('resize_icon');
            ctx.drawImage(scaleIcon, leftCorner[0]-32, leftCorner[1]-32);

        var rightCorner = transformPoint(
            this.rCorner[0]-this.mx, this.lCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

            var rotateIcon = document.getElementById('rotate_icon');
            ctx.drawImage(rotateIcon, rightCorner[0]-32, rightCorner[1]-32);
			
		var leftBottom = transformPoint(
            this.lCorner[0]-this.mx, this.rCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

            var downIcon = document.getElementById('arrow_down');
            ctx.drawImage(downIcon, leftBottom[0], leftBottom[1]-32);

        var rightBottom = transformPoint(
            this.rCorner[0]-this.mx, this.rCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

            var upIcon = document.getElementById('arrow_up');
            ctx.drawImage(upIcon, rightBottom[0]-32, rightBottom[1]-32);

    }
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
	dObj.smoothLine = function(){
		for(var i=0; i<this.pts.length; i+=3) {
			if(this.pts.length > i+4 && i>0) {
				var x1 = this.pts[i-1][0];
				var y1 = this.pts[i-1][1];
				
				var x2 = this.pts[i][0];
				var y2 = this.pts[i][1];
				
				var x3 = this.pts[i+1][0];
				var y3 = this.pts[i+1][1];
				
				var x4 = this.pts[i+2][0];
				var y4 = this.pts[i+2][1];
				//https://en.wikipedia.org/wiki/Line-line_intersection
				//forms continuous bezier curves
				var den = ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
				var intersectx = ((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))
				/den;
				var intersecty =((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))
				/den;
			
				if(Math.abs(den) >= 20){
					//console.log(intersectx + " " +intersecty);
					this.pts[i+1][0] = intersectx;
					this.pts[i+1][1] = intersecty;
				}
			}	
        }
	};
	
    dObj.rotate = function(dr) {
        this.rotation += dr;
    };
    dObj.scale = function(dx, dy) {
        if((this.rCorner[0] == this.lCorner[0])) { this.xScale -= dx/this.width; }
        else { this.xScale -= (dx/((this.rCorner[0]-this.lCorner[0])/2)); }
        if((this.rCorner[1] == this.lCorner[1])) { this.yScale -= dy/this.width; }
        else { this.yScale -= (dy/((this.rCorner[1]-this.lCorner[1])/2)); }
    };
    dObj.iconClicked = function(x,y) {
        var leftCorner = transformPoint(
            this.lCorner[0]-this.mx, this.lCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );
        var rightCorner = transformPoint(
            this.rCorner[0]-this.mx, this.lCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );
		var leftBottom = transformPoint(
            this.lCorner[0]-this.mx, this.rCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );
        var rightBottom = transformPoint(
            this.rCorner[0]-this.mx, this.rCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );
			
        if(distance([x,y],[leftCorner[0], leftCorner[1]]) < 32) { return 'scale'; }
        else if(distance([x,y],[rightCorner[0], rightCorner[1]]) < 32) { return 'rotate'; }
		else if(distance([x,y],[rightBottom[0], rightBottom[1]]) < 32) { return 'layerUp'; }
		else if(distance([x,y],[leftBottom[0], leftBottom[1]]) < 32) { return 'layerDown'; } 
        else { return false; }
    }
    dObj.midX = function() { return this.mx; }
    dObj.midY = function() { return this.my; }

    var newAct = {
        undo: function() {
            // Take the top layer off of layerList. The object still exists in the objects hash, but
            // doesn't get drawn because ONLY the objects in layerList get drawn.
            layerList.splice(layerList.length-1,1);
			selectedId = -1;
        },
        redo: function() {
            // Put this object back in layerList.
            layerList[layerList.length] = dObj.id;
        }
    };
    // Add the new action and redraw.
    addAction(newAct);
}

//Add a new point to the current line
function continueLine(x,y) {
    var dObj = objectList[layerList[layerList.length-1]];
    dObj.pts.push([x, y]);

    if(x < dObj.lCorner[0]) { dObj.lCorner[0] = x; }
    if(x > dObj.rCorner[0]) { dObj.rCorner[0] = x; }
    if(y < dObj.lCorner[1]) { dObj.lCorner[1] = y; }
    if(y > dObj.rCorner[1]) { dObj.rCorner[1] = y; }
    dObj.mx = (dObj.lCorner[0]+dObj.rCorner[0])/2;
    dObj.my = (dObj.lCorner[1]+dObj.rCorner[1])/2;

}

