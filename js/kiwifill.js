function hslToRgb(h, s, l) {
    var c = (1 - Math.abs((2*l)-1))*s;
    var h2 = h/60;
    var x = c*(1-Math.abs((h2%2)-1));
    var rgb1 = [0,0,0];
    if(h2 < 1) {
        rgb1 = [c,x,0];
    } else if(h2 < 2) {
        rgb1 = [x,c,0];
    } else if(h2 < 3) {
        rgb1 = [0,c,x];
    } else if(h2 < 4) {
        rgb1 = [0,x,c];
    } else if(h2 < 5) {
        rgb1 = [x,0,c];
    } else if(h2 < 6) {
        rgb1 = [c,0,x];
    }
    var m = l-(c/2);
    var rgb = [rgb1[0]+m, rgb1[1]+m, rgb1[2]+m];
    if(rgb[0] < 0) { rgb[0] = 0; }
    if(rgb[1] < 0) { rgb[1] = 0; }
    if(rgb[2] < 0) { rgb[2] = 0; }
    rgb[0] *= 255;
    rgb[1] *= 255;
    rgb[2] *= 255;
    return rgb;
}

function matchColor(c1, c2) {
   var r = c1[0]/c2[0];

   for(var i=0; i<3; i++) {
       if(Math.abs(c1[i] - c2[i]) > 100) { return false }
//         if((Math.abs((c2[i]/c1[i]) - r)/r) > .8) { return false; }
   }
   return true;
}

function validPoint(x,y, color, checked, ctx, cData, width, height) {
    if((x < 0) || (x > width) ||
       (y < 0) || (y > height)) {
        return false;
    }
    if(checked[""+x+","+y] == 1) {
        return false;
    }
    return matchColor(color, getData(x,y,cData,width));
}

function getData(x, y, cData, width) {
    var index = (x+(y*(width)))*4;
    var data = [
        cData[index+0],
        cData[index+1],
        cData[index+2],
        cData[index+3]
    ];
    return data;
}

function findSegments(dObj, x,y, segments, width, height, ctx) {
    console.log("Initial point: ("+x+","+y+")");
    x = Math.round(x); y = Math.round(y);
    var ptr = 0;
    var color = ctx.getImageData(x,y,1,1).data;
    var checked = {};
    var queue = [[x,y]];

    var cData = ctx.getImageData(0,0,width,height).data;

    var segmentN = false;
    var segmentS = false;

    while(ptr < queue.length) {
        var pt = queue[ptr];
        segmentN = false;
        segmentS = false;

        var sx1 = pt[0];

        while(validPoint(sx1,pt[1],color,checked,ctx,cData,width,height)) {
            checked[""+sx1+","+pt[1]] = 1;
            if(validPoint(sx1,pt[1]+1,color,checked,ctx,cData,width,height)) {
                if(!segmentN) {
                    queue.push([sx1, pt[1]+1]);
                    segmentN = true;
                }
            } else {
                if(segmentN) {
                    segmentN = false;
                }
            }

            if(validPoint(sx1,pt[1]-1,color,checked,ctx,cData,width,height)) {
                if(!segmentS) {
                    queue.push([sx1, pt[1]-1]);
                    segmentS = true;
                }
            } else {
                if(segmentS) {
                    segmentS = false;
                }
            }
            sx1--;
        }

        pt = [queue[ptr][0]+1, queue[ptr][1]];
        var sx2 = pt[0];

        segmentN = false;
        segmentS = false;

        while(validPoint(sx2,pt[1],color,checked,ctx,cData,width,height)) {
            checked[""+sx2+","+pt[1]] = 1;
            if(validPoint(sx2,pt[1]+1,color,checked,ctx,cData,width,height)) {
                if(!segmentN) {
                    queue.push([sx2, pt[1]+1]);
                    segmentN = true;
                }
            } else {
                if(segmentN) {
                    segmentN = false;
                }
            }
            if(validPoint(sx2,pt[1]-1,color,checked,ctx,cData,width,height)) {
                if(!segmentS) {
                    queue.push([sx2, pt[1]-1]);
                    segmentS = true;
                }
            } else {
                if(segmentS) {
                    segmentS = false;
                }
            }
            sx2++;
        }

        segments.push([[sx1,pt[1]],[sx2,pt[1]]]);

        if(dObj.lCorner == -1) {
            dObj.lCorner = [sx1, pt[1]];
            dObj.rCorner = [sx2, pt[1]];
        } else {
            if(sx1 < dObj.lCorner[0]) { dObj.lCorner[0] = sx1; }
            if(sx2 > dObj.rCorner[0]) { dObj.rCorner[0] = sx2; }
            if(pt[1] < dObj.lCorner[1]) { dObj.lCorner[1] = pt[1]; }
            if(pt[1] > dObj.rCorner[1]) { dObj.rCorner[1] = pt[1]; }
        }

        dObj.mx = (dObj.lCorner[0]+dObj.rCorner[0])/2;
        dObj.my = (dObj.lCorner[1]+dObj.rCorner[1])/2;

        ptr++;
    }

}

function createFill(dObj){
    assignID(dObj);

    var height = canvas.height;
    var width = canvas.width;
    var x = dObj.pts[0][0];
    var y = dObj.pts[0][1];
    dObj.segments = [];
    findSegments(dObj, x,y,dObj.segments, width, height, canvas.getContext('2d'));

    dObj.draw = function(ctx) {
        ctx.save();
        ctx.translate(this.mx, this.my); 
        ctx.rotate(this.rotation);
        ctx.scale(this.xScale, this.yScale);

        ctx.lineWidth = 1;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        for(var i=0; i<this.segments.length; i++) {
            var seg = this.segments[i];
            ctx.moveTo(seg[0][0]-this.mx, seg[0][1]-this.my);
            ctx.lineTo(seg[1][0]-this.mx, seg[1][1]-this.my);
        }
        ctx.stroke(); 
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
        for(var i=0; i<this.segments.length; i++) {
            this.segments[i][0][0]+=dx;
            this.segments[i][1][0]+=dx;
            this.segments[i][0][1]+=dy;
            this.segments[i][1][1]+=dy;
        }
        this.lCorner[0]+=dx;
        this.rCorner[0]+=dx;
        this.lCorner[1]+=dy;
        this.rCorner[1]+=dy;

        this.mx += dx;
        this.my += dy;
    };
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
            layerList.splice(layerList.length-1,1);
        },
        redo: function() {
            layerList[layerList.length] = dObj.id;
        }
    };

    // Add the new action and redraw.
    addAction(newAct);
}
