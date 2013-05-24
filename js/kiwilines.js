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
function createSpraytex(dObj){
    var scanvas = document.createElement('canvas');
    scanvas.height = scanvas.width = dObj.width;
    var ctx = scanvas.getContext('2d');
    var w = dObj.width;
    var grd=ctx.createRadialGradient(w/2,w/2,0.0,w/2,w/2,w/2);
    grd.addColorStop(0,dObj.color);
    grd.addColorStop(1, "rgba(255,0,0,0)");
    //dObj.grd = grd;
    ctx.fillStyle = grd;
    var w = dObj.width;
    ctx.fillRect(0,0,w,w);
    dObj.scanvas = scanvas;
}

function drawSoftLine(ctx, x1, y1, x2, y2, lineWidth, r, g, b, a) {
   var lx = x2 - x1;
   var ly = y2 - y1;
   var lineLength = Math.sqrt(lx*lx + ly*ly);
   var wy = lx / lineLength * lineWidth;
   var wx = ly / lineLength * lineWidth;
   var gradient = ctx.createLinearGradient(x1-wx/2, y1+wy/2, x1+wx/2, y1-wy/2);
      // The gradient must be defined accross the line, 90° turned compared to the line direction.
   gradient.addColorStop(0,    "rgba("+r+","+g+","+b+",0)");
   gradient.addColorStop(0.5, "rgba("+r+","+g+","+b+","+a+")");
   gradient.addColorStop(0.5, "rgba("+r+","+g+","+b+","+a+")");
   gradient.addColorStop(1,    "rgba("+r+","+g+","+b+",0)");
   ctx.save();
	   ctx.beginPath();
	   ctx.lineWidth = lineWidth;
	   // ctx.lineCap = "round";
	   ctx.strokeStyle = gradient;
	   ctx.moveTo(x1, y1);
	   ctx.lineTo(x2, y2);
	   ctx.stroke();
   ctx.restore(); 
}

// Create a line
function startLine(dObj) {
    assignID(dObj);
    if(dObj.type == 'spray'){
        createSpraytex(dObj);
    }
    // create brush pattern
    if(dObj.type == 'graphite'){
        createPencilTex(dObj);
    }

    // Create a brush for this line
    createBrush(dObj, brushMode);

    // Draw the rotate/scale icons
    dObj.drawIcons = function(ctx) {
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

    }
    dObj.select = function(x,y) {

       var pt = transformPoint(x-this.mx, y-this.my,
           this.mx, this.my,
           1, 1,
           this.rotation);
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

