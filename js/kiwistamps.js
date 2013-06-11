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
			selectedId = -1;
        },
        redo: function() {
            layerList[layerList.length] = dObj.id;
        }
    };

    addAction(newAct);
}
function drawBalloon2(ctx, x, y, w, h, radius,lw){
	var r = x + w;
	var b = y + h
	ctx.save();
		ctx.beginPath();
		ctx.strokeStyle="#000000";
		ctx.lineWidth=lw;
		ctx.moveTo(x+radius, y);
		ctx.lineTo(r-radius, y);
		ctx.quadraticCurveTo(r, y, r, y+radius);
		ctx.lineTo(r, b-radius);
		ctx.quadraticCurveTo(r, b, r-radius, b);
		ctx.lineTo(x+radius, b);
		ctx.quadraticCurveTo(x, b, x, b-radius);
		ctx.lineTo(x, y+radius);
		ctx.quadraticCurveTo(x, y, x+radius, y);
		ctx.stroke();
		ctx.fill();
		
		var cx = x+w/2;
		var cy = y+h/2;
		ctx.beginPath();
		ctx.moveTo(cx + radius, cy);
		ctx.lineTo(0,0);
		ctx.lineTo(cx - radius, cy);
		ctx.stroke();
		ctx.fill();
	ctx.restore();
}

function placeTextArea(x,y){
	var dObj = objectList[layerList[layerList.length-1]];
	dObj.tPos = [x,y];

	dObj.lCorner[0] = dObj.pts[0] < dObj.tPos[0] ? dObj.pts[0] : dObj.tPos[0];
	dObj.lCorner[1] = dObj.pts[1] < dObj.tPos[1] ? dObj.pts[1] : dObj.tPos[1];
	dObj.rCorner[0] = dObj.pts[0] > dObj.tPos[0] ? dObj.pts[0] : dObj.tPos[0];
	dObj.rCorner[1] = dObj.pts[1] > dObj.tPos[1] ? dObj.pts[1] : dObj.tPos[1];
	
	dObj.mx = (dObj.lCorner[0] + dObj.rCorner[0])/2;
	dObj.my = (dObj.lCorner[1] + dObj.rCorner[1])/2;
}

function createTextBalloon(dObj) {
    assignID(dObj);
	
	dObj.findBounds = function(ctx){
		var max_length = 30;
		var tx = this.tx = this.tPos[0]-this.pts[0] ;
		var ty = this.ty = this.tPos[1]-this.pts[1] ;
		for(var i=0; this.theText[this.max] && i< this.theText[this.max].length; i++){
			var metrics = ctx.measureText(this.theText[this.max][i]);
			max_length += metrics.width;
		}
		this.width = max_length;
		this.height = this.fontSize*this.theText.length+10;
		//drawBalloon(ctx,tx,ty, 0,0,this.width, this.height, 15);
		var bw = this.bw = max_length;
		var bh = this.bh = this.fontSize*this.theText.length+10;
		var w = this.width = this.tPos[0]-this.pts[0];
		if(this.tPos[0]<this.pts[0] && this.tPos[0]+bw > this.pts[0]){
			this.width = bw;
			this.rCorner[0] = this.tPos[0]+bw;
		}
		else if(this.tPos[0]>this.pts[0]){
			this.width = w+bw;
			this.rCorner[0] = this.pts[0]+this.width;
		}
		else if(this.tPos[0]<this.pts[0]){
			this.width = w;
			this.rCorner[0] = this.pts[0];
		}
		var h = this.height =this.tPos[1]- this.pts[1];
		if(this.tPos[1]<this.pts[1] && this.tPos[1]+bh > this.pts[1]){
			this.height = bh;
			this.rCorner[1] = this.tPos[1]+bh;
		}
		else if(this.tPos[1]>this.pts[1]){
			this.height = h+bh;
			this.rCorner[1] = this.pts[1]+this.height;
		}
		else if(this.tPos[1]<this.pts[1]){
			this.height = h;
			this.rCorner[1] = this.pts[1];
		}
		
		this.mx = this.lCorner[0]+(this.lCorner[0]-this.rCorner[0])/2;
		this.my = this.lCorner[1]+(this.lCorner[1]-this.rCorner[1])/2;
	}
	
	dObj.drawBalloonText = function(ctx){
		ctx.fillStyle = this.color;
		for(var i=0; i<this.theText.length; i++){
			for(var j=0; j<this.theText[i].length; j++){
				var line_length = 0;
				for(k=0; k<j; k++){
					var met = ctx.measureText(this.theText[i][k]);
					line_length += met.width;
				}
				ctx.fillText(this.theText[i][j],this.tx+15 + line_length,this.ty+(i+1)*this.fontSize+2);
			
				//ctx.fillText(this.theText[i][j],-this.width/2+10 + line_length,-this.height/2+(i+1)*this.fontSize+2);
			}
		}
	}
	
	dObj.drawBoxText = function(ctx){
		var wraps = 0;
		for(var i=0; i<this.theText.length; i++){
			var line_length = 0; 
			for(var j=0; j<this.theText[i].length; j++){
				
				var span = 0;
				var nl = 0;
				
				if(j > 0){
					var met = ctx.measureText(this.theText[i][j-1]);
					line_length += met.width;
				}
				
				var last = ctx.measureText(this.theText[i][j]);
				span = last.width+line_length;
					
				if(span > this.width && this.theText[i].length > j){
					nl= j;
					wraps++;
					line_length = 0;
				}
				ctx.fillText(this.theText[i][j],-this.width/2 + 10 + line_length,-this.height/2 + (i+wraps+1)*this.fontSize+2);
			}
		}
	}

    // Draw the stamp
    dObj.draw = function(ctx) {
        var xScale = this.xScale;
        var yScale = this.yScale;
        ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
			ctx.font="normal "+this.fontSize+"px Comic Sans MS";
			
			if(this.type == "balloon"){
				this.findBounds(ctx);
				ctx.translate(this.pts[0], this.pts[1]);
				ctx.rotate(this.rotation);
				ctx.scale(xScale,yScale);
				ctx.save();
					drawBalloon2(ctx,this.tx,this.ty,this.bw, this.bh, 15,8);
					ctx.globalCompositeOperation = "lighter";
					drawBalloon2(ctx,this.tx,this.ty,this.bw, this.bh, 15,1);
				ctx.restore();
				this.drawBalloonText(ctx);
			}
			else{
				this.width = Math.abs(this.rCorner[0]-this.lCorner[0]);
				this.height = Math.abs(this.rCorner[1]-this.lCorner[1]);
				ctx.translate(this.mx, this.my);
				ctx.rotate(this.rotation);
				ctx.scale(xScale,yScale);
				ctx.fillStyle = this.color;				
				if(layerList[layerList.length-1] == this.id || selectedId == this.id)
					ctx.strokeRect(-this.width/2,-this.height/2,this.width,this.height);//
				this.drawBoxText(ctx);
			}
        ctx.restore();
    };

    dObj.select = function(x,y) {
		if(this.type == "balloon"){
			var bw = this.bw*this.xScale;
			var bh = this.bh*this.yScale;
			var pts = this.pts;
			var t = this.tPos;
			var d = [pts[0]+(t[0]-pts[0])*this.xScale,pts[1]+(t[1]-pts[1])*this.yScale];
			var s = [this.xScale,this.yScale];
			return x >= d[0] && y >= d[1] && x < d[0]+bw && y < d[1]+bh;
		}
		else{
			return (x >= dObj.lCorner[0] && x <= dObj.rCorner[0] && y >= dObj.lCorner[1] && y <= dObj.rCorner[1]);
		}
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
			selectedId = -1;
        },
        redo: function() {
            layerList[layerList.length] = dObj.id;
        }
    };

    addAction(newAct);
}
function createTextBox(dObj){

}

