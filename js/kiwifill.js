var colorRates = {};
var alias = false;

//Given an hsl value, convert it to rgb
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

//Return whether these two colors are close enough to match for a fill
function matchColor(c1, c2) {
   var r = c2[0]/c1[0];

   for(var i=0; i<3; i++) {
       if(c1[i] != c2[i]) { return false; }
   } 
   return true;
}

//Return if this point is a valid "fillable" point
function validPoint(x,y, color, checked, cData, width, height) {
    if((x < 0) || (x > width) ||
       (y < 0) || (y > height)) {
        return false;
    }
    if(checked[""+x+","+y] == 1) {
        return false;
    }
    return matchColor(color, getData(x,y,cData,width));
}

function changeRate(c1, c2) {
    var avg = 0;
    for(var i=0; i<4; i++) {
        if(c2[i] != c1[i]) { // Prevents 0/0 errors
            avg += (Math.abs(c2[i] - c1[i])/c2[i]);
        }
    }
    avg /= 4;
    return avg;
}

function validAlias(x,y,color,checked,cData,width,height,dx,dy) {
    if((x < 0) || (x > width) ||
       (y < 0) || (y > height)) {
        return false;
    }
    if(checked[""+x+","+y] == 1) {
        return false;
    }
    var rate = 0;
    if(colorRates[y] === undefined) {
        colorRates[y] = {};
    } else {
        rate = changeRate(
            getData(x,y,cData,width),
            getData(x-dx,y-dy,cData,width));
    }
    colorRates[y][x]=rate;
    if(alias && (rate == 0)) {
        return false;
    } else {
        if((!alias) && (rate != 0)) {
            alias = true;
        }
        return true;
    }
}

//Return the pixel data for this point
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

//Search the segment that contains pt and return data
function searchSegment(pt, color, checked, ctx, cData, width, height, direc) {
    var segmentN = false;
    var segmentS = false;

    var nQueue = [];
    var sQueue = [];

    alias = false;
    colorRates[pt[1]] = undefined;

    //ex is East x; it'll be the farthest point east we can go in the current segment
    var ex = pt[0];

    while(validPoint(ex,pt[1],color,checked,cData,width,height)) {
//    while(validAlias(ex,pt[1],color,checked,cData,width,height,-1,0)) {
        checked[""+ex+","+pt[1]] = 1;
        if(validPoint(ex,pt[1]+1,color,checked,cData,width,height)) {
            if(!segmentN) {
                nQueue.push([ex, pt[1]+1]);
                segmentN = true;
            }
        } else {
            if(segmentN) {
                segmentN = false;
            }
        }
        if(validPoint(ex,pt[1]-1,color,checked,cData,width,height)) {
            if(!segmentS) {
                sQueue.push([ex, pt[1]-1]);
                segmentS = true;
            }
        } else {
            if(segmentS) {
                segmentS = false;
            }
        }
        ex--;
    }
    nQueue = nQueue.reverse();
    sQueue = sQueue.reverse();

    alias = false;

    //Reset the point so we can start looking west
    var wx = pt[0]+1;

    //Eliminate duplicate segments
    segmentN = validPoint(wx-1,pt[1]+1,color,checked,cData,width,height);
    segmentS = validPoint(wx-1,pt[1]-1,color,checked,cData,width,height);

    //Start going west
    while(validPoint(wx,pt[1],color,checked,cData,width,height)) {
//    while(validAlias(wx,pt[1],color,checked,cData,width,height,1,0)) {
        checked[""+wx+","+pt[1]] = 1;
        if(validPoint(wx,pt[1]+1,color,checked,cData,width,height)) {
            if(!segmentN) {
                nQueue.push([wx, pt[1]+1]);
                segmentN = true;
            }
        } else {
            if(segmentN) {
                segmentN = false;
            }
        }

        if(validPoint(wx,pt[1]-1,color,checked,cData,width,height)) {
            if(!segmentS) {
                sQueue.push([wx, pt[1]-1]);
                segmentS = true;
            }
        } else {
            if(segmentS) {
                segmentS = false;
            }
        }
        wx++;
    }

    var data = {
        ex: ex,
        wx: wx,
        nQueue: nQueue,
        sQueue: sQueue,
    };
    return data;
} 

function slope(pt1, pt2) {
    var m = (pt2[1]-pt1[1])/(pt2[0]-pt1[0]);
    return m;
}

function smoothEnds(pts) {
    if(pts.length > 3) {
        //Slope check
        if(slope(pts[pts.length-1], pts[pts.length-2]) ==
            slope(pts[pts.length-2], pts[pts.length-3])) {
            pts[pts.length-2] = pts.pop();
        }
    }
}

function findSectors(dObj, x, y, sectors, width, height, ctx) {
    console.log("Initial point: ("+x+","+y+")");
    x = Math.round(x); y = Math.round(y);

    var ptr = 0;
    var color = ctx.getImageData(x,y,1,1).data;
    var checked = {};
    var queue = [[x,y]];
    var cData = ctx.getImageData(0,0,width,height).data;

    while(ptr < queue.length) {

        //queue holds "sector seeds"; the initial point we use to find the sector
        var pt = queue[ptr];

        //lPts/rPts will hold the points bounding the left and right sides of this sector
        var lPts = [];
        var rPts = [];

        var data = searchSegment(pt, color, checked, ctx, cData, width, height, 'both');

        //ex and wx now coorespond to the endpoints of this segment. nQueue and sQueue hold the seeds for the segments to the North and South of us
        lPts.push([data.ex,pt[1]]);
        rPts.push([data.wx,pt[1]]);

        //If there are 2+ or no segments above us, the segment seeds of the nQueue become sector seeds
        if(data.nQueue.length != 1) {
            queue = queue.concat(data.nQueue);
        } else {
            var nQueue = data.nQueue;
            while(nQueue.length == 1) {
                pt = nQueue[0];
                var nData = searchSegment(pt, color, checked, ctx, cData, width, height, 'north');
                //Account for joints between sectors
                if(nData.sQueue.length > 0) {
                    for(var i=0; i<nData.sQueue.length; i++) {
                        var sPt = nData.sQueue[i];
                        if(sPt[0] < pt[0]) {
                            lPts.push([sPt[0], pt[1]-1]);
                        } else {
                            rPts.splice(0,0,[sPt[0], pt[1]-1]);
                        }
                    }
                    lPts.push([nData.ex,pt[1]-1]);
                    rPts.splice(0,0,[nData.wx,pt[1]-1]);
                } else {
                    lPts.push([nData.ex,pt[1]]);
                    rPts.splice(0,0,[nData.wx,pt[1]]);
                }
                nQueue = nData.nQueue;
                queue = queue.concat(nData.sQueue);

                smoothEnds(lPts);
                smoothEnds(rPts);
            }
            if(nQueue.length > 0) {
                lPts[lPts.length-1][1] += 1;
                rPts[0][1] += 1;
            }
            queue = queue.concat(nQueue);
        }

        //If there are 2+ or no segments below us, the segment seeds of sQueue become sector seeds
        if(data.sQueue.length != 1) {
            queue = queue.concat(data.sQueue);
        } else {
            var sQueue = data.sQueue;
            while(sQueue.length == 1) {
                pt = sQueue[0];
                var sData = searchSegment(pt, color, checked, ctx, cData, width, height, 'south');
                if(sData.nQueue.length > 0) {
                    for(var i=0; i<sData.nQueue.length; i++) {
                        var nPt = sData.nQueue[i];
                        if(nPt[0] > pt[0]) {
                            rPts.push([nPt[0], pt[1]+1]);
                        } else {
                            lPts.splice(0,0,[nPt[0], pt[1]+1]);
                        }
                    }
                    lPts.splice(0,0,[sData.ex,pt[1]+1]);
                    rPts.push([sData.wx,pt[1]+1]);
                } else {
                    lPts.splice(0,0,[sData.ex,pt[1]]);
                    rPts.push([sData.wx,pt[1]]);
                }
                sQueue = sData.sQueue;
                queue = queue.concat(sData.nQueue);

                smoothEnds(lPts);
                smoothEnds(rPts);
            }
            if(sQueue.length > 0) {
                lPts[0][1] -= 1;
                rPts[rPts.length-1][1] -= 1;
            }
            queue = queue.concat(sQueue);
        }

        lPts[0][1] -= 1;
        rPts[rPts.length-1][1] -= 1;
        lPts[lPts.length-1][1] += 1;
        rPts[0][1] += 1;

        //Close up this sector
        var sector = lPts.concat(rPts);
//        sector[0][1] -= 1;
//        sector[sector.length-1][1] -= 1;
        sectors.push(sector);

        if(dObj.lCorner == -1) { 
            dObj.lCorner = [sector[0][0], sector[0][1]];
            dObj.rCorner = [sector[0][0], sector[0][1]];
        }
        for(var i=0; i<sector.length; i++) {
            var sPt = sector[i];
            if(sPt[0] < dObj.lCorner[0]) { dObj.lCorner[0] = sPt[0]; }
            if(sPt[0] > dObj.rCorner[0]) { dObj.rCorner[0] = sPt[0]; }
            if(sPt[1] < dObj.lCorner[1]) { dObj.lCorner[1] = sPt[1]; }
            if(sPt[1] > dObj.rCorner[1]) { dObj.rCorner[1] = sPt[1]; }
        }
        ptr++;
    }
    dObj.mx = Math.round((dObj.lCorner[0]+dObj.rCorner[0])/2);
    dObj.my = Math.round((dObj.lCorner[1]+dObj.rCorner[1])/2);
}

function makePattern(url) {
    //var pic = document.getElementById(id);

    var tCanvas = document.createElement('canvas');
    tCanvas.width  = canvas.width;
    tCanvas.height = canvas.height;
    var tCtx = tCanvas.getContext('2d');
	//canvg(tCanvas, url)
    tCtx.drawSvg(url, 0, 0,tCanvas.width,tCanvas.height);
	background.svg = tCanvas;
	//tCtx.fillRect(url, 0, 0,50,50);
    var pattern = tCtx.createPattern(tCanvas, "repeat");
    return pattern;
}

function createFill(dObj){
    var ctx;
    var oldBg

    if(bgFill) {
        //Background fill
        if(background) { oldBg = background; }
        background = dObj;
        var c = document.createElement('canvas');
        c.width = canvas.width;
        c.height = canvas.height;
        ctx = c.getContext('2d');
    } else {
        //Regular Fill
        ctx = canvas.getContext('2d');
        assignID(dObj);
    }

    var height = canvas.height;
    var width = canvas.width;
    var x = dObj.pts[0][0];
    var y = dObj.pts[0][1];
    if(!dObj.sectors) {
        if(bgFill) {
            dObj.sectors = [[[0,0], [width,0],
                             [width,height], [0,height]]];
        } else {
            dObj.sectors = [];
            findSectors(dObj,x,y,dObj.sectors,width,height,ctx);
        }
    }

    if(dObj.patternId) {
        dObj.pattern = makePattern(dObj.patternId);
    }

    dObj.draw = function(ctx) {
        ctx.save();
        if(this.pattern) {
            ctx.fillStyle = this.pattern;
        } else {
            ctx.fillStyle = this.color;
        }
		if(this.svg){
			ctx.drawImage(background.svg,0,0);
			return;
		}
        ctx.globalAlpha = this.opacity;

        ctx.translate(Math.round(this.mx), Math.round(this.my));
        ctx.rotate(this.rotation);
        ctx.scale(this.xScale, this.yScale);

        ctx.beginPath();

        for(var i=0; i<this.sectors.length; i++) {
            var sector = this.sectors[i];
            ctx.moveTo(sector[0][0]-this.mx, sector[0][1]-this.my);
            if(sector.length == 2) {
                ctx.lineTo(sector[0][0]-this.mx, sector[0][1]-this.my-1);
                ctx.lineTo(sector[1][0]-this.mx, sector[0][1]-this.my-1);
                ctx.lineTo(sector[1][0]-this.mx, sector[1][1]-this.my+1);
                ctx.lineTo(sector[0][0]-this.mx, sector[1][1]-this.my+1);
            } else {
                for(var j=1; j<sector.length; j++) {
                    ctx.lineTo(sector[j][0]-this.mx, sector[j][1]-this.my);
                }
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };
    dObj.select = function(x,y) {
        //"Scratch canvas" method
        var scanvas = document.createElement('canvas');
        scanvas.width = canvas.width;
        scanvas.height = canvas.height;
        var ctx = scanvas.getContext('2d');
        this.draw(ctx);
        var imageData = ctx.getImageData(x, y, 1, 1);
        return (imageData.data[3] > 0 || imageData.data[0] > 0);
    };
    dObj.move = function(dx,dy) {

        for(var i=0; i<this.sectors.length; i++) {
            for(var j=0; j<this.sectors[i].length; j++) {
                this.sectors[i][j][0]+=dx;
                this.sectors[i][j][1]+=dy;
            }
        }
        this.lCorner[0]+=dx;
        this.rCorner[0]+=dx;
        this.lCorner[1]+=dy;
        this.rCorner[1]+=dy;

        this.mx += dx;
        this.my += dy;
    };
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

        var leftBottom = transformPoint(
            this.lCorner[0]-this.mx, this.rCorner[1]-this.my,
            this.mx, this.my,
            this.xScale, this.yScale,
            -this.rotation );

        var downIcon = document.getElementById('arrow_down');
        ctx.drawImage(downIcon, leftBottom[0]-32, leftBottom[1]-32);

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
    dObj.compress = function() {
        var obj = {
            objType: 'fill',
            color: this.color,
            opacity: this.opacity,
            lCorner: this.lCorner,
            rCorner: this.rCorner,
            mx: this.mx,
            my: this.my,
            rotation: this.rotation,
            xScale: this.xScale,
            yScale: this.yScale,
            pts: this.pts,
            sectors: this.sectors 
        };
        if(this.patternId) {
            obj.patternId = this.patternId;
        }
        return obj;
    }
    if(bgFill) {
        newAct = {
            undo: function() {
                background = oldBg;
            },
            redo: function() {
                backround = dObj;
            }
        }
    } else {
        newAct = {
            undo: function() {
                layerList.splice(layerList.length-1,1);
	    	selectedId = -1;
            },
            redo: function() {
                layerList[layerList.length] = dObj.id;
            }
        };
    }

    // Add the new action and redraw.
    addAction(newAct);
}
