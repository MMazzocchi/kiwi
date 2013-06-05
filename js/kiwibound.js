function groupSelection(){
	var curObj = objectList[layerList[layerList.length-1]];
	
	$.each(layerList, function(i, id) {
        var dObj = objectList[id];

        if(dObj.pts.length > 1) {
			for(var j = 0; j < dObj.pts.length; j++){
				if(dObj.pts[j][0] > curObj.lCorner[0] && dObj.pts[j][0] < curObj.rCorner[0] && dObj.pts[j][1] > curObj.lCorner[1] && dObj.pts[j][1] < curObj.rCorner[1]){
					selectList.push(dObj);
					break;
				}
			}
        }
		else{
			if(dObj.pts[0] > curObj.lCorner[0] && dObj.pts[0] < curObj.rCorner[0] && dObj.pts[1] > curObj.lCorner[1] && dObj.pts[1] < curObj.rCorner[1]){
				selectList.push(dObj);
			}
		}
    });
	curObj.boundList = selectList;
	selectedId = curObj.id;
}

function startBound(dObj){
	assignID(dObj);
	
	createBound(dObj);
	
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
    dObj.select = function(x,y) {
        //"Scratch canvas" method
        if(x >= dObj.lCorner[0] && x <= dObj.rCorner[0] && y >= dObj.lCorner[1] && y <= dObj.rCorner[1]){
			return true;
		}
		return false;

/*		var pts = this.pts;
		var w = this.width*this.xScale;
		var h = this.height*this.yScale;
        return x >= pts[0] && y >= pts[1] && x < pts[0]+w && y < pts[1]+h; */
    };

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
		for(var i=0; i<dObj.boundList.length; i++){
			dObj.boundList[i].move(dx, dy);
		}
    };
    dObj.rotate = function(dr) {
        this.rotation += dr;
		for(var i=0; i<dObj.boundList.length; i++){
			dObj.boundList[i].rotate(dr);
		}
    };
    dObj.scale = function(dx, dy) {
        if((this.rCorner[0] == this.lCorner[0])) { this.xScale -= dx/this.width; }
        else { this.xScale -= (dx/((this.rCorner[0]-this.lCorner[0])/2)); }
        if((this.rCorner[1] == this.lCorner[1])) { this.yScale -= dy/this.width; }
        else { this.yScale -= (dy/((this.rCorner[1]-this.lCorner[1])/2)); }
		for(var i=0; i<dObj.boundList.length; i++){
			dObj.boundList[i].scale(dx, dy);
		}
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

function createBound(dObj){
	dObj.draw = function(ctx) {
		var xScale = this.xScale;
        var yScale = this.yScale;
        ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
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
		ctx.restore();
		for(var i=0; i<dObj.boundList.length; i++){
			dObj.boundList[i].draw(ctx);
		}
	}
}