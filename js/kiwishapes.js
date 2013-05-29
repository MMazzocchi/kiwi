//Create different shapes
function startShape(dObj){
	assignID(dObj);
	
	createShape(dObj);
	
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
}

function contSquare(dObj, x, y){
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
	if (dObj.pts.length > 1){
		dObj.pts.pop();
		dObj.pts.pop();
		dObj.pts.push([dObj.pts[0][0] - ((dObj.pts[0][1] - y)/2), y]);
		dObj.pts.push([dObj.pts[0][0] + ((dObj.pts[0][1] - y)/2), y]);
	}
	else{
		dObj.pts.push([dObj.pts[0][0] - ((dObj.pts[0][1] - y)/2), y]);
		dObj.pts.push([dObj.pts[0][0] + ((dObj.pts[0][1] - y)/2), y]);
	}
}