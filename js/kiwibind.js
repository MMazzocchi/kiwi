function placeBindArea(x,y){
	var dObj = objectList[layerList[layerList.length-1]];
	if(dObj.type == 'bind'){
		dObj.tPos = [x,y];

		dObj.lCorner[0] = dObj.pts[0] < dObj.tPos[0] ? dObj.pts[0] : dObj.tPos[0];
		dObj.lCorner[1] = dObj.pts[1] < dObj.tPos[1] ? dObj.pts[1] : dObj.tPos[1];
		dObj.rCorner[0] = dObj.pts[0] > dObj.tPos[0] ? dObj.pts[0] : dObj.tPos[0];
		dObj.rCorner[1] = dObj.pts[1] > dObj.tPos[1] ? dObj.pts[1] : dObj.tPos[1];
		
		dObj.mx = (dObj.lCorner[0] + dObj.rCorner[0])/2;
		dObj.my = (dObj.lCorner[1] + dObj.rCorner[1])/2;
	}
}

function groupSelection(){
	var curObj = objectList[layerList[layerList.length-1]];
	var selectList = [];
	
	$.each(layerList, function(i, id) {
        var dObj = objectList[id];
		var layerId = i;
		
		if(dObj.midX() > curObj.lCorner[0] && dObj.midY() > curObj.lCorner[1] && dObj.midX() < curObj.rCorner[0] && dObj.midY() < curObj.rCorner[1] && dObj.type != "bind") {
			curObj.bindList.push(dObj);
			selectList.push(layerId);
		}
    });
	for(var i=selectList.length-1; i>=0; i--){
		layerList.splice(selectList[i], 1);
	}
	if(curObj.bindList.length > 0){
		selectedId = curObj.id;
		bindStamp = true;
	}
	else{
		ungroupSelection();
	}
}

function ungroupSelection(){
	$.each(layerList, function(i, id) {
		var dObj = objectList[id];
		if(dObj.type == "bind") {
			for(var j=0; j<dObj.bindList.length; j++){
				dObj.bindList[j].bindMid = [];
				layerList[layerList.length] = dObj.bindList[j].id;
				var curObj = objectList[dObj.bindList[j].id];
				// Rotating the object to match what it was when binded
				curObj.rotate(dObj.rotation);
				var d = distance([curObj.midX(), curObj.midY()], [dObj.mx, dObj.my]);
				var theta = Math.atan2((curObj.midY() - dObj.my), (curObj.midX() - dObj.mx));
				var dx = d*(Math.cos(theta)-Math.cos(theta+dObj.rotation));
				var dy = d*(Math.sin(theta)-Math.sin(theta+dObj.rotation));
				curObj.move(-dx,-dy);
		
				// Scaling the object to match what it was when binded
				curObj.xScale *= dObj.scaling[0];
				curObj.yScale *= dObj.scaling[1];
				dx = curObj.midX() - dObj.mx;
				dy = curObj.midY() - dObj.my;
	
	
				curObj.move((dx*dObj.scaling[0] - dx), (dy*dObj.scaling[0] - dy));
			}
			var layerId = -1;
			for(var i=0; i<layerList.length; i++) {
				if(layerList[i] == dObj.id) {
					layerId = i;
					break;
				}
			}
			//Take out the layer
			layerList.splice(layerId, 1);
		}
	});
	bindStamp = false;
	selectedId = -1;
}

function startBind(dObj){
	assignID(dObj);
	
	createBind(dObj);
	
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
		var pt = transformPoint(x-this.mx,y-this.my,this.mx,this.my,1/this.xScale,1/this.yScale,-this.rotation);
		x=pt[0]; y=pt[1];
	
        if(x >= dObj.lCorner[0] && x <= dObj.rCorner[0] && y >= dObj.lCorner[1] && y <= dObj.rCorner[1]){
			return true;
		}
		return false;
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
		for(var i=0; i<dObj.bindList.length; i++){
			dObj.bindList[i].move(dx, dy);
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
		
		this.scaling = [this.xScale, this.yScale];
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
            ungroupSelection();
        },
        redo: function() {
            // Put this object back in layerList.
			dObj.bindList = [];
            layerList[layerList.length] = dObj.id;
			groupSelection();
        }
    };
    // Add the new action and redraw.
    addAction(newAct);

}

function createBind(dObj){
	dObj.draw = function(ctx) {
		var xScale = this.xScale;
        var yScale = this.yScale;
		
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
		this.width = Math.abs(this.rCorner[0]-this.lCorner[0]);
		this.height = Math.abs(this.rCorner[1]-this.lCorner[1]);
		ctx.translate(this.mx, this.my);
		ctx.rotate(this.rotation);
		ctx.scale(xScale,yScale);				
		if(layerList[layerList.length-1] == this.id || selectedId == this.id){
			ctx.strokeRect(-this.width/2,-this.height/2,this.width,this.height);
		}

		ctx.translate(-this.mx,-this.my);

		for(var i=0; i<dObj.bindList.length; i++){
			dObj.bindList[i].draw(ctx);
		}

		ctx.restore();
	}
}