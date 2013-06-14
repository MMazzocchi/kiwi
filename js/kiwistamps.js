var svgList = {
	'butterfly':	{svg:null,default_scale: 1.0,cx:205, cy:143, bounds:[0,0,410,286], url:'svg/butterfly.svg'  },
	'ironman1':		{svg:null,default_scale: 0.25,cx:396, cy:612,bounds:[0,0,792,1224],url:'svg/ironman1.svg' },
	'ironman2':		{svg:null,default_scale: 0.25,cx:396, cy:612,bounds:[0,0,792,1224],url:'svg/ironman2.svg' },
	'thor1':		{svg:null,default_scale: 0.25,cx:396, cy:612,bounds:[0,0,792,1224],url:'svg/ironman1.svg' },
	'thor2':		{svg:null,default_scale: 0.25,cx:396, cy:612,bounds:[0,0,792,1224],url:'svg/ironman2.svg' },
	'captain1':		{svg:null,default_scale: 0.25,cx:396, cy:612,bounds:[0,0,792,1224],url:'svg/captain1.svg' },
	'captain2':		{svg:null,default_scale: 0.25,cx:396, cy:612,bounds:[0,0,792,1224],url:'svg/captain2.svg' },
	'hulk1':		{svg:null,default_scale: 0.25,cx:396, cy:612,bounds:[0,0,792,1224],url:'svg/hulk1.svg' },
	'hulk2':		{svg:null,default_scale: 0.25,cx:396, cy:612,bounds:[0,0,792,1224],url:'svg/hulk2.svg' },
	'fury':			{svg:null,default_scale: 0.25,cx:396, cy:612,bounds:[0,0,792,1224],url:'svg/fury.svg' },
	'blackwidow':	{svg:null,default_scale: 0.25,cx:396, cy:612,bounds:[0,0,792,1224],url:'svg/blackwidow.svg' },
	'hawkeye':		{svg:null,default_scale: 0.25,cx:396, cy:612,bounds:[0,0,792,1224],url:'svg/hawkeye.svg' }	
};

// Create a bitmap from this object
function createBMP(dObj){
    var scanvas = document.createElement('canvas');
	dObj.cx = dObj.cx*dObj.default_scale;
	dObj.cy = dObj.cy*dObj.default_scale;
	dObj.bound[0] = dObj.bound[0]*dObj.default_scale;
	dObj.bound[1] = dObj.bound[1]*dObj.default_scale;
    scanvas.width = dObj.bound[0];
    scanvas.height = dObj.bound[1];
    var sctx = scanvas.getContext('2d');
	//sctx.scale(dObj.default_scale,dObj.default_scale);
	//canvg(scanvas,dObj.url);
    sctx.drawSvg(dObj.url, 0, 0, dObj.bound[0], dObj.bound[1]);
    dObj.scanvas = scanvas;
}

// Create a stamp from this object
function createStamp(dObj) {
    assignID(dObj);
	
	dObj.rerenderSvg = function(){
		var scanvas = document.createElement('canvas');
		var axScale = Math.abs(this.xScale);
		var ayScale = Math.abs(this.yScale);
		var bx = this.bound[0]/this.pbound[0];
		var by = this.bound[1]/this.pbound[1];
		scanvas.width = this.bound[0] = this.bound[0]*axScale;
		scanvas.height = this.bound[1] = this.bound[1]*ayScale;
		var sctx = scanvas.getContext('2d');
		sctx.scale(bx*axScale,by*ayScale);
		//canvg(scanvas,this.url);
		sctx.drawSvg(this.url, 0, 0);
		this.scanvas = scanvas;
		this.cx = this.cx*axScale;
		this.cy = this.cy*ayScale;
		this.yScale = this.yScale/Math.abs(this.yScale);
		this.xScale = this.xScale/Math.abs(this.xScale);
		
	}
    // Draw the stamp
    dObj.draw = function(ctx) {
        var xScale = this.xScale;
        var yScale = this.yScale;
        var bound = [this.bound[0],this.bound[1]];

        ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.translate(this.pts[0],this.pts[1]);
            ctx.rotate(this.rotation);
			ctx.scale(xScale,yScale);
            ctx.drawImage(this.scanvas,-dObj.cx,-dObj.cy);
			//ctx.drawSvg(this.url, 0, 0, dObj.bound[0], dObj.bound[1]);
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
            -(this.bound[0]/2), -(this.bound[1]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );

            var scaleIcon = document.getElementById('resize_icon');
            ctx.drawImage(scaleIcon, leftCorner[0]-32, leftCorner[1]-32);

        var rightCorner = transformPoint(
            (this.bound[0]/2), -(this.bound[1]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );

            var rotateIcon = document.getElementById('rotate_icon');
            ctx.drawImage(rotateIcon, rightCorner[0]-32, rightCorner[1]-32);
			
		var leftBottom = transformPoint(
            -(this.bound[0]/2), (this.bound[1]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );

            var downIcon = document.getElementById('arrow_down');
            ctx.drawImage(downIcon, leftBottom[0]-32, leftBottom[1]-32);

        var rightBottom = transformPoint(
            (this.bound[0]/2), (this.bound[1]/2),
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
        this.xScale -= (dx/(this.bound[0]/2));
        this.yScale -= (dy/(this.bound[1]/2));
    }
	
    // Return if x and y were inside of an icon and which icon
    dObj.iconClicked = function(x,y) {
        var leftCorner = transformPoint(
            -this.bound[0]/2, -this.bound[1]/2,
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );
        var rightCorner = transformPoint(
            this.bound[0]/2, -this.bound[1]/2,
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );
		var leftBottom = transformPoint(
            -(this.bound[0]/2), (this.bound[1]/2),
            this.pts[0], this.pts[1],
            this.xScale, this.yScale,
            -this.rotation );
        var rightBottom = transformPoint(
            (this.bound[0]/2), (this.bound[1]/2),
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
    dObj.compress = function() {
        var obj = {
            objType: 'stamp',
            url: this.url,
            cx: this.cx,
            cy: this.cy,
            opacity: this.opacity,
            xScale: this.xScale,
            yScale: this.yScale,
            bound: this.bound,
            rotation: this.rotation,
            pts: this.pts
        };
        return obj;
    }

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
