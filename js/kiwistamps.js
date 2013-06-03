var svgList = {
    'mickey':{
        svg:null,
        cx:156, cy:145,
        bounds:[0,0,313,290],
        url:'svg/mickey.svg' },
	'butterfly':{
        svg:null,
        cx:205, cy:143,
        bounds:[0,0,410,286],
        url:'svg/butterfly.svg' },
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

// Create a bitmap from this object
function createBMP(dObj){
    var scanvas = document.createElement('canvas');
    scanvas.width = dObj.bound[2]*dObj.xScale;
    scanvas.height = dObj.bound[3]*dObj.yScale;
    var sctx = scanvas.getContext('2d');
	canvg(scanvas,dObj.url);
 //   sctx.drawSvg(dObj.url, 0, 0, 0, 0);
    dObj.scanvas = scanvas;
}

// Create a stamp from this object
function createStamp(dObj) {
    assignID(dObj);

    // Draw the stamp
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
            ctx.drawImage(dObj.scanvas,-dObj.cx,-dObj.cy);
        ctx.restore();
    };

    //Return true of false if x and y are within this stamp
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

    // Move this stamp by dx, dy
    dObj.move = function(dx,dy) {
        this.pts[0]+=dx;
        this.pts[1]+=dy;
    };

    // Draw the rotate/scale icons in the top corners of this stamp.
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
			
		var leftBottom = transformPoint(
            -(this.bound[2]/2), (this.bound[3]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );

            var downIcon = document.getElementById('arrow_down');
            ctx.drawImage(downIcon, leftBottom[0], leftBottom[1]-32);

        var rightBottom = transformPoint(
            (this.bound[2]/2), (this.bound[3]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );

            var upIcon = document.getElementById('arrow_up');
            ctx.drawImage(upIcon, rightBottom[0]-32, rightBottom[1]-32);

    }

    // Rotate this stamp by dr radians.
    dObj.rotate = function(dr) {
        this.rotation += dr;
    }

    // Scale this object based on a a change of dx and dy in the scale icon's position
    dObj.scale = function(dx, dy) {
        this.xScale -= (dx/(this.bound[2]/2));
        this.yScale -= (dy/(this.bound[3]/2));
    }
	
    // Return if x and y were inside of an icon and which icon
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
		var leftBottom = transformPoint(
            -(this.bound[2]/2), (this.bound[3]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );
        var rightBottom = transformPoint(
            (this.bound[2]/2), (this.bound[3]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );
		
        if(distance([x,y],[leftCorner[0], leftCorner[1]]) < 32) { return 'scale'; }
        else if(distance([x,y],[rightCorner[0], rightCorner[1]]) < 32) { return 'rotate'; }
		else if(distance([x,y],[rightBottom[0], rightBottom[1]]) < 32) { return 'layerUp'; }
		else if(distance([x,y],[leftBottom[0], leftBottom[1]]) < 32) { return 'layerDown'; } 
        else { return false; }
    }

    // Return the midpoint of this stamp
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

    addAction(newAct);
}

function drawBalloon(ctx, x, y, w, h, radius)
{
	var r = x + w;
	var b = y + h;
	ctx.beginPath();
	ctx.strokeStyle="#000000";
	ctx.lineWidth="4";
	ctx.moveTo(x+radius, y);
	ctx.lineTo(x+radius/2, y-10);
	ctx.lineTo(x+radius * 2, y);
	ctx.lineTo(r-radius, y);
	ctx.quadraticCurveTo(r, y, r, y+radius);
	ctx.lineTo(r, y+h-radius);
	ctx.quadraticCurveTo(r, b, r-radius, b);
	ctx.lineTo(x+radius, b);
	ctx.quadraticCurveTo(x, b, x, b-radius);
	ctx.lineTo(x, y+radius);
	ctx.quadraticCurveTo(x, y, x+radius, y);
	ctx.stroke();
	ctx.fill();
}

function placeTextArea(x,y){
	var dObj = objectList[layerList[layerList.length-1]];
	dObj.tPos = [x,y];
}

function createTextBalloon(dObj) {
    assignID(dObj);

    // Draw the stamp
    dObj.draw = function(ctx) {
        var xScale = this.xScale;
        var yScale = this.yScale;
        ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
			ctx.font="normal "+this.fontSize+"px Comic Sans MS";
			
			if(this.type == "balloon"){
				var max_length = 20;
				for(var i=0; this.theText[this.max] && i< this.theText[this.max].length; i++){
					var metrics = ctx.measureText(this.theText[this.max][i]);
					max_length += metrics.width;
				}
				this.width = max_length;
				this.height = this.fontSize*this.theText.length+10;
				this.mx = this.pts[0] + this.width/2;
				this.my = this.pts[1] + this.height/2;
				ctx.translate(this.mx, this.my);
				ctx.rotate(this.rotation);
				ctx.scale(xScale,yScale);
				this.rCorner[0] = this.pts[0] + this.width;
				this.rCorner[1] = this.pts[1] + this.height;
				drawBalloon(ctx, -this.width/2,-this.height/2,this.width, this.height, 15);
				ctx.fillStyle = curColor;
				for(var i=0; i<this.theText.length; i++){
					for(var j=0; j<this.theText[i].length; j++){
						var line_length = 0;
						for(k=0; k<j; k++){
							var met = ctx.measureText(this.theText[i][k]);
							line_length += met.width;
						}
					
						ctx.fillText(this.theText[i][j],-this.width/2+10 + line_length,-this.height/2+(i+1)*this.fontSize+2);
					}
				}
			}
			else{
				this.width = Math.abs(this.tPos[0]-this.pts[0]);
				this.height = Math.abs(this.tPos[1]-this.pts[1]);
				ctx.translate(this.pts[0]+this.width/2, this.pts[1]+this.height/2);
				ctx.rotate(this.rotation);
				ctx.scale(xScale,yScale);
				ctx.fillStyle = curColor;				
				this.rCorner[0] = this.pts[0] + this.width;
				this.rCorner[1] = this.pts[1] + this.height;
				this.mx = this.pts[0] + this.width/2;
				this.my = this.pts[1] + this.height/2;
				if(layerList[layerList.length-1] == this.id || selectedId == this.id)
					ctx.strokeRect(-this.width/2,-this.height/2,this.tPos[0]-this.pts[0],this.tPos[1]-this.pts[1]);//
				if(this.tPos[1] < this.pts[1])
					ctx.translate(0,this.tPos[1]-this.pts[1]);
				if(this.tPos[0] < this.pts[0])
					ctx.translate(this.tPos[0]-this.pts[0],0);
				var wraps = 0;
				for(var i=0; i<this.theText.length; i++){
					for(var j=0; j<this.theText[i].length; j++){
						var line_length = 0;
						var span = 0;
						for(var k=0; k<j; k++){
							var met = ctx.measureText(this.theText[i][k]);
							line_length += met.width;
						}
						for(var k=0; k<=j; k++){
							var last = ctx.measureText(this.theText[i][k]);
							span += last.width;
						}
						if(span > this.width && this.theText[i].length > 1){
							wraps++;
							line_length = 0;
						}
						ctx.fillText(this.theText[i][j],-this.width/2 + 10 + line_length,-this.height/2 + (i+wraps+1)*this.fontSize+2);
					}
				}
			}
        ctx.restore();
    };

    dObj.select = function(x,y) {
		var pts = this.pts;
		var w = this.width*this.xScale;
		var h = this.height*this.yScale;
        return x >= pts[0] && y >= pts[1] && x < pts[0]+w && y < pts[1]+h;

    };

    // Move this stamp by dx, dy
    dObj.move = function(dx,dy) {
        this.pts[0]+=dx;
        this.pts[1]+=dy;
		this.tPos[0]+=dx;
		this.tPos[1]+=dy;
			
        this.mx+=dx;
        this.my+=dy;

        this.lCorner[0]+=dx;
        this.rCorner[0]+=dx;
        this.lCorner[1]+=dy;
        this.rCorner[1]+=dy;
    };

    // Draw the rotate/scale icons in the top corners of this stamp.
    dObj.drawIcons = function(ctx) {
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

    // Rotate this stamp by dr radians.
    dObj.rotate = function(dr) {
        this.rotation += dr;
    }

    // Scale this object based on a a change of dx and dy in the scale icon's position
    dObj.scale = function(dx, dy) {
        if((this.rCorner[0] == this.lCorner[0])) { this.xScale -= dx/this.width; }
        else { this.xScale -= (dx/((this.rCorner[0]-this.lCorner[0])/2)); }
        if((this.rCorner[1] == this.lCorner[1])) { this.yScale -= dy/this.width; }
        else { this.yScale -= (dy/((this.rCorner[1]-this.lCorner[1])/2)); }
    }

    // Return if x and y were inside of an icon and which icon
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

    // Return the midpoint of this stamp
    dObj.midX = function() { return this.mx; }
    dObj.midY = function() { return this.my; }

    var newAct = {
        undo: function() {
            layerList.splice(layerList.length-1,1);
        },
        redo: function() {
            layerList[layerList.length] = dObj.id;
        }
    };

    addAction(newAct);
}

