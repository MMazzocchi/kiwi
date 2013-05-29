//Create different shapes
function startShape(dObj){
	assignID(dObj);
	
	createShape(dObj);
	
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
            ctx.drawImage(scaleIcon, leftCorner[0]-64, leftCorner[1]-64);

        var rightCorner = transformPoint(
            this.rCorner[0]-this.mx, this.lCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

            var rotateIcon = document.getElementById('rotate_icon');
            ctx.drawImage(rotateIcon, rightCorner[0], rightCorner[1]-64);
			
		var leftBottom = transformPoint(
            this.lCorner[0]-this.mx, this.rCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

            var downIcon = document.getElementById('arrow_down');
            ctx.drawImage(downIcon, leftBottom[0]-48, leftBottom[1]);

        var rightBottom = transformPoint(
            this.rCorner[0]-this.mx, this.rCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

            var upIcon = document.getElementById('arrow_up');
            ctx.drawImage(upIcon, rightBottom[0]+16, rightBottom[1]);

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
			
        if(distance([x,y],[leftCorner[0]-32, leftCorner[1]-32]) < 32) { return 'scale'; }
        else if(distance([x,y],[rightCorner[0]+32, rightCorner[1]-32]) < 32) { return 'rotate'; }
		else if(distance([x,y],[rightBottom[0]+16, rightBottom[1]]) < 32) { return 'layerUp'; }
		else if(distance([x,y],[leftBottom[0]-16, leftBottom[1]+16]) < 32) { return 'layerDown'; } 
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

function createShape(dObj) {
	if (dObj.type == 'circle'){
		dObj.draw = function(ctx) {
		console.log("Drawing circle");
			//Rotate and scale the canvas
			ctx.save();
			ctx.translate(this.mx,this.my);
			ctx.rotate(this.rotation);
			ctx.scale(this.xScale, this.yScale);
			
			//Begin at the first point
			ctx.beginPath();
			ctx.arc(this.pts[0][0]-this.mx,
				this.pts[0][1]-this.my,
                this.radius,
                0, 2*Math.PI);
			//Set strokestyle and other parameters
			ctx.strokeStyle = this.color;
			ctx.lineWidth = this.width;
			ctx.globalAlpha = this.opacity;
			ctx.stroke();
			ctx.restore();
		}
	}
	else{
		dObj.draw = function(ctx) {
			//Rotate and scale the canvas
			ctx.save();
			ctx.translate(this.mx,this.my);
			ctx.rotate(this.rotation);
			ctx.scale(this.xScale, this.yScale);

			//Begin at the first point
			ctx.beginPath();
			ctx.moveTo(this.pts[0][0]-this.mx, this.pts[0][1]-this.my);
			//Set strokestyle and other parameters
			ctx.strokeStyle = this.color;
			ctx.fillStyle = this.color;
			if(this.type == 'square' || this.type == 'triangle'){
				ctx.lineJoin = 'square';
				ctx.lineCap = 'square';
			}
			else{
				ctx.lineJoin = 'round';
				ctx.lineCap = 'round';
			}
			ctx.lineWidth = this.width;
			ctx.globalAlpha = this.opacity;
			for(var i=1; i<this.pts.length; i++) {
				ctx.lineTo(this.pts[i][0]-this.mx, this.pts[i][1]-this.my);
			};
			ctx.closePath();
			ctx.stroke();
			ctx.restore();
		}
	}
}

function contShape(x,y){
	var dObj = objectList[layerList[layerList.length-1]];
	if (dObj.type == 'circle'){
		contCircle(dObj, x, y);
	}
	else if (dObj.type == 'square'){
		contSquare(dObj, x, y);
	}
	else if (dObj.type == 'line'){
		contLine(dObj, x, y);
	}
	else if (dObj.type == 'triangle'){
		contTriangle(dObj, x, y);
	}
	return false;
}

function contCircle(dObj, x, y){
	if (dObj.pts.length > 1){
		dObj.pts.pop();
		dObj.pts.push([(dObj.pts[0][0]+x)/2, (dObj.pts[0][1]+y)/2]);
	}
	else{
		dObj.pts.push([(dObj.pts[0][0]+x)/2, (dObj.pts[0][1]+y)/2]);
	}
	dObj.radius = Math.sqrt(Math.pow(x-dObj.pts[0][0], 2) + Math.pow(y-dObj.pts[0][1], 2));
	dObj.lCorner[0] = dObj.pts[0][0]-dObj.radius;
	dObj.lCorner[1] = dObj.pts[0][1]-dObj.radius;
	dObj.rCorner[0] = dObj.pts[0][0]+dObj.radius;
	dObj.rCorner[1] = dObj.pts[0][1]+dObj.radius;
	dObj.mx = (dObj.lCorner[0] + dObj.rCorner[0])/2;
	dObj.my = (dObj.lCorner[1] + dObj.rCorner[1])/2;
}

function contSquare(dObj, x, y){
	dObj.rCorner[0] = x;
	dObj.rCorner[1] = y;
	dObj.mx = (dObj.lCorner[0] + dObj.rCorner[0])/2;
	dObj.my = (dObj.lCorner[1] + dObj.rCorner[1])/2;
	if (dObj.pts.length > 1){
		dObj.pts.pop();
		dObj.pts.pop();
		dObj.pts.pop();
		dObj.pts.push([dObj.pts[0][0], y]);
		dObj.pts.push([x, y]);
		dObj.pts.push([x, dObj.pts[0][1]]);
	}
	else{
		dObj.pts.push([dObj.pts[0][0], y]);
		dObj.pts.push([x, y]);
		dObj.pts.push([x, dObj.pts[0][1]]);
	}
}

function contLine(dObj, x, y){
	dObj.rCorner[0] = x;
	dObj.rCorner[1] = y;
	dObj.mx = (lCorner[0] + rCorner[0])/2;
	dObj.my = (lCorner[1] + rCorner[1])/2;
	if (dObj.pts.length > 1){
		dObj.pts.pop();
		dObj.pts.push([x, y]);
	}
	else{
		dObj.pts.push([x, y]);
	}
}

function contTriangle(dObj, x, y){
	console.log("triangle");
	dObj.lCorner[0] = dObj.pts[0][0] - ((y - dObj.pts[0][1])/2);
	dObj.rCorner[0] = dObj.pts[0][0] + ((y - dObj.pts[0][1])/2);
	dObj.rCorner[1] = y;
	dObj.mx = (dObj.lCorner[0] + dObj.rCorner[0])/2;
	dObj.my = (dObj.lCorner[1] + dObj.rCorner[1])/2;
	if (dObj.pts.length > 1){
		dObj.pts.pop();
		dObj.pts.pop();
		dObj.pts.push([dObj.pts[0][0] - ((y - dObj.pts[0][1])/2), y]);
		dObj.pts.push([dObj.pts[0][0] + ((y - dObj.pts[0][1])/2), y]);
	}
	else{
		dObj.pts.push([dObj.pts[0][0] - ((dObj.pts[0][1] - y)/2), y]);
		dObj.pts.push([dObj.pts[0][0] + ((dObj.pts[0][1] - y)/2), y]);
	}
}